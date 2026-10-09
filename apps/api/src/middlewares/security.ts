import crypto from "crypto";
import { Request, Response, NextFunction } from "express";

/**
 * Security middleware layer for the PulseStage API.
 *
 * Threat model: the public internet can reach this API (LAN / dev / future
 * deployment). The only *trusted* caller is our own Next.js server, which
 * proxies browser traffic through `app/api/backend/[...path]/route.ts` and
 * signs every request with a shared secret that never ships to the browser.
 *
 * Layers:
 *  1. verifySignature  – HMAC-SHA256 over method + path + timestamp + body hash,
 *                        with a ±2 min replay window (timing-safe comparison).
 *  2. clientGuard      – requires our custom header on mutations so simple
 *                        cross-site form posts can never reach them (CSRF).
 *  3. sanitizeInput    – rejects NoSQL operator / prototype-pollution keys
 *                        (`$…`, `__proto__`, dotted paths) in body and query.
 */

const REPLAY_WINDOW_MS = 120_000; // signatures older than 2 minutes are rejected
const CLIENT_HEADER = "X-PulseStage-Client";
const CLIENT_VALUE = "pulsestage-web";
const MUTATING_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

/** Raw request bytes (captured by express.json's `verify` hook). */
type RequestWithRaw = Request & { rawBody?: Buffer };

const hmac = (secret: string, payload: string): string =>
  crypto.createHmac("sha256", secret).update(payload).digest("hex");

/**
 * Verifies the `x-ps-timestamp` / `x-ps-signature` headers produced by the
 * Next.js route handler. Fails closed if the server secret is missing.
 */
export function verifySignature(req: Request, res: Response, next: NextFunction): void {
  const secret = process.env.API_SIGNING_SECRET;

  if (!secret) {
    console.error(
      "[SECURITY] API_SIGNING_SECRET is not set – refusing all /api traffic (fail closed)."
    );
    res.status(503).json({
      success: false,
      error: "API signing is not configured on the server.",
    });
    return;
  }

  const timestamp = req.get("x-ps-timestamp");
  const signature = req.get("x-ps-signature");

  if (!timestamp || !signature) {
    res.status(401).json({
      success: false,
      error: "Unauthorized: missing request signature.",
    });
    return;
  }

  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > REPLAY_WINDOW_MS) {
    res.status(401).json({
      success: false,
      error: "Unauthorized: signature expired.",
    });
    return;
  }

  const rawBody = (req as RequestWithRaw).rawBody ?? Buffer.alloc(0);
  const bodyHash = crypto.createHash("sha256").update(rawBody).digest("hex");
  const expected = hmac(secret, `${ts}.${req.method}.${req.originalUrl}.${bodyHash}`);

  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    res.status(401).json({
      success: false,
      error: "Unauthorized: invalid request signature.",
    });
    return;
  }

  next();
}

/**
 * Mutations must carry our custom client header. Browsers cannot set custom
 * headers on simple cross-site form posts, so this blocks CSRF even if the
 * signature layer were ever bypassed.
 */
export function clientGuard(req: Request, res: Response, next: NextFunction): void {
  if (MUTATING_METHODS.includes(req.method) && req.get(CLIENT_HEADER) !== CLIENT_VALUE) {
    res.status(403).json({
      success: false,
      error: `Forbidden: ${CLIENT_HEADER} header required for mutations.`,
    });
    return;
  }
  next();
}

const DANGEROUS_KEY = /^\$|^__proto__$|^constructor$|^prototype$|\./;

/**
 * Recursively rejects objects that contain NoSQL operator keys (`$where`,
 * `$set`, …), dotted paths, or prototype-pollution vectors. Runs before
 * controllers ever see the payload.
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction): void {
  const seen = new WeakSet<object>();

  const scan = (value: unknown, path: string): string | null => {
    if (value === null || typeof value !== "object" || seen.has(value as object)) {
      return null;
    }
    seen.add(value as object);

    for (const key of Object.keys(value as Record<string, unknown>)) {
      if (DANGEROUS_KEY.test(key)) {
        return `Invalid parameter name: ${path ? `${path}.` : ""}${key}`;
      }
      const issue = scan((value as Record<string, unknown>)[key], path ? `${path}.${key}` : key);
      if (issue) return issue;
    }
    return null;
  };

  const bodyIssue = scan(req.body, "");
  if (bodyIssue) {
    res.status(400).json({ success: false, error: bodyIssue });
    return;
  }

  const queryIssue = scan(req.query, "");
  if (queryIssue) {
    res.status(400).json({ success: false, error: queryIssue });
    return;
  }

  next();
}
