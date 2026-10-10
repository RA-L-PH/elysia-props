import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

/**
 * Signed BFF proxy: browser → Next (same-origin) → Express API.
 *
 * This replaces the old `next.config.ts` rewrite so that *every* request
 * reaching the API carries an HMAC-SHA256 signature computed here, on the
 * server, with a secret that never ships to the client bundle. A signature
 * covers method + path + timestamp + body hash, and Express rejects
 * anything older than 2 minutes (replay protection).
 *
 * It also enforces CSRF rules the browser can't cheat on:
 *  – mutations must send our custom `X-PulseStage-Client` header
 *    (plain cross-site form posts cannot set custom headers),
 *  – mutations must be `application/json`,
 *  – cross-origin `Origin` values are rejected outright.
 */

export const dynamic = "force-dynamic";

const API_ORIGIN = process.env.API_INTERNAL_ORIGIN || "http://127.0.0.1:5000";
const SECRET = process.env.API_SIGNING_SECRET;
const CLIENT_HEADER = "X-PulseStage-Client";
const CLIENT_VALUE = "pulsestage-web";
const MAX_BODY_BYTES = 2 * 1024 * 1024; // matches express.json's 2mb limit
const MUTATIONS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const ALLOWED_ORIGINS = new Set(
  (
    process.env.ALLOWED_ORIGINS ||
    "http://localhost:3000,http://127.0.0.1:3000,http://192.168.0.110:3000,http://localhost:3001,http://127.0.0.1:3001,http://192.168.0.110:3001,http://192.168.0.110"
  )
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean)
);

/** Response headers worth relaying back from the API. */
const RELAY_HEADERS = [
  "content-type",
  "cache-control",
  "retry-after",
  "etag",
  "ratelimit-limit",
  "ratelimit-remaining",
  "ratelimit-reset",
];

const jsonError = (status: number, error: string) =>
  NextResponse.json({ success: false, error }, { status });

async function proxy(req: NextRequest): Promise<Response> {
  const method = req.method;

  // ── CSRF guards (mutations only) ────────────────────────────────
  if (MUTATIONS.has(method)) {
    if (req.headers.get(CLIENT_HEADER) !== CLIENT_VALUE) {
      return jsonError(403, `Forbidden: ${CLIENT_HEADER} header required.`);
    }
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return jsonError(400, "Content-Type must be application/json.");
    }
    const origin = req.headers.get("origin");
    const allowedEnvOrigins = (process.env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);

    const isAllowed =
      !origin ||
      ALLOWED_ORIGINS.has(origin) ||
      allowedEnvOrigins.includes(origin) ||
      origin.endsWith(".vercel.app");

    if (!isAllowed) {
      return jsonError(403, `Forbidden: origin not allowed (${origin}).`);
    }
  }

  if (!SECRET) {
    console.error("[BFF] API_SIGNING_SECRET is not set – refusing to proxy /api/backend.");
    return jsonError(500, "API signing is not configured on the server.");
  }

  // ── Body (buffered so the HMAC covers the exact bytes) ──────────
  let body: Buffer = Buffer.alloc(0);
  if (method !== "GET" && method !== "HEAD") {
    body = Buffer.from(await req.arrayBuffer());
    if (body.length > MAX_BODY_BYTES) {
      return jsonError(413, "Request body too large.");
    }
  }

  // ── Sign method + path + query + timestamp + body hash ──────────
  const url = new URL(req.url);
  const apiPath = url.pathname.replace(/^\/api\/backend/, "/api") + url.search;
  const timestamp = Date.now().toString();
  const bodyHash = crypto.createHash("sha256").update(body).digest("hex");
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(`${timestamp}.${method}.${apiPath}.${bodyHash}`)
    .digest("hex");

  const forwardHeaders: Record<string, string> = {
    "content-type": req.headers.get("content-type") || "application/json",
    [CLIENT_HEADER]: req.headers.get(CLIENT_HEADER) || CLIENT_VALUE,
    "x-ps-timestamp": timestamp,
    "x-ps-signature": signature,
    "x-forwarded-host": url.host,
    "x-forwarded-proto": "http",
  };
  // Real client IP for rate limiting (set by Next at intake; see Express
  // `trust proxy = loopback`).
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) forwardHeaders["x-forwarded-for"] = forwardedFor;
  // Session cookie: browser → BFF → Express.
  const cookie = req.headers.get("cookie");
  if (cookie) forwardHeaders["cookie"] = cookie;

  // ── Forward to Express ──────────────────────────────────────────
  let upstream: globalThis.Response;
  try {
    upstream = await fetch(`${API_ORIGIN}${apiPath}`, {
      method,
      headers: forwardHeaders,
      body: body.length ? new Uint8Array(body) : undefined,
      redirect: "manual",
      cache: "no-store",
    });
  } catch (err) {
    console.error("[BFF] Upstream API request failed:", err);
    return jsonError(502, "Upstream API unavailable.");
  }

  const responseHeaders = new Headers();
  for (const header of RELAY_HEADERS) {
    const value = upstream.headers.get(header);
    if (value) responseHeaders.set(header, value);
  }
  // Session cookies (Set-Cookie) pass straight through to the browser.
  for (const setCookie of upstream.headers.getSetCookie?.() ?? []) {
    responseHeaders.append("set-cookie", setCookie);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
