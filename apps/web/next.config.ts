import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Monorepo: keep the workspace root stable despite a parent-level lockfile
  outputFileTracingRoot: path.join(__dirname, "../.."),
  // Allow LAN devices to load dev assets without the cross-origin warning
  allowedDevOrigins: ["http://192.168.0.110:3000", "http://192.168.0.110"],
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ".jsx": [".tsx", ".jsx"],
    };
    return config;
  },
  // NOTE: /api/backend/* is intentionally NOT a rewrite — it is served by
  // app/api/backend/[...path]/route.ts, which HMAC-signs every request
  // server-side before proxying to Express (the secret never reaches browsers).
  async headers() {
    // ── Content-Security-Policy ───────────────────────────────────────
    // Everything the app loads is same-origin (BFF proxy; next/font self-
    // hosts Inter), so the policy is tight with two deliberate allowances:
    //  • script-src 'unsafe-inline' — Next.js emits inline bootstrap/RSC
    //    scripts; nonce-based CSP would need per-request middleware.
    //  • img-src https: — the newsletter preview iframe (srcDoc) renders
    //    arbitrary admin-authored HTML, which may reference remote images.
    // Development additionally needs 'unsafe-eval' (webpack HMR) and
    // ws:/wss: for the live-reload socket (incl. the LAN dev origin).
    // No upgrade-insecure-requests: LAN deployments serve plain http.
    const isProd = process.env.NODE_ENV === "production";
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      `connect-src 'self'${isProd ? "" : " ws: wss:"}`,
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
