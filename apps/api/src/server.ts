import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { connectDatabase } from "./config/db.js";
import requirementRoutes from "./routes/requirement.routes.js";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import newsletterRoutes from "./routes/newsletter.routes.js";
import supportRoutes from "./routes/support.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import {
  apiRateLimiter,
  failedAttemptLimiter,
  writeLimiter,
  globalWriteCeiling,
} from "./middlewares/rateLimiter.js";
import { verifySignature, clientGuard, sanitizeInput } from "./middlewares/security.js";

// Loads apps/api/.env into process.env ONCE at boot — restart the dev
// server after editing it (APPS_SCRIPT_URL / APPS_SCRIPT_TOKEN, secrets).
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Traffic arrives from the Next.js proxy on the loopback socket, so trust
// exactly one loopback hop and take the real client IP from X-Forwarded-For.
// Direct LAN connections aren't loopback, so their XFF is ignored (not spoofable).
app.set("trust proxy", "loopback");
app.disable("x-powered-by");

const ALLOWED_ORIGINS = Array.from(
  new Set(
    [
      process.env.CORS_ORIGIN,
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://192.168.0.110:3000",
      "http://192.168.0.110",
    ].filter(Boolean) as string[]
  )
);

// ── Global middleware ─────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-PulseStage-Client",
      "X-Ps-Timestamp",
      "X-Ps-Signature",
    ],
    credentials: false, // no cookies in this app — don't allow credentialed CORS
    maxAge: 600,
  })
);
app.use(morgan("dev"));

// Rate limits + CSRF header guard run *before* body parsing so even
// malformed payloads are counted against the sender's budget.
app.use(
  "/api",
  apiRateLimiter,
  failedAttemptLimiter,
  globalWriteCeiling,
  writeLimiter,
  clientGuard
);

// JSON-only body parsing. `verify` captures the raw bytes so the HMAC
// signature can be checked against exactly what was transmitted.
app.use(
  express.json({
    limit: "2mb",
    verify: (req, _res, buf) => {
      (req as unknown as { rawBody?: Buffer }).rawBody = buf;
    },
  })
);

// ── Keep-alive endpoint for cron jobs (deliberately unsigned) ─────
app.get("/alive", (_req, res) => {
  res.status(200).json({
    status: "alive",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ── Signed API pipeline: injection sanitising → HMAC verification ─
app.use("/api", sanitizeInput, verifySignature);

// ── API Routes ────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/requirements", requirementRoutes);

// Base route for quick status inspection
app.get("/", (_req, res) => {
  res.json({
    name: "PulseStage Requirement Engine API",
    version: "1.0.0",
    docs: "/api/requirements",
    health: "/api/health",
    keepAlive: "/alive",
  });
});

// JSON 404 instead of Express' default HTML page
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Not found" });
});

// Centralized error handling
app.use(errorHandler);

// Start server
const startServer = async () => {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 PulseStage API running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🫀 Keep-alive:    http://localhost:${PORT}/alive`);
    console.log(`📋 Requirements:  http://localhost:${PORT}/api/requirements`);
    if (!process.env.API_SIGNING_SECRET) {
      console.log(`⚠️  API_SIGNING_SECRET is missing — /api will refuse all traffic!`);
    }
    console.log(`=========================================`);
  });
};

startServer().catch((err) => {
  console.error("Failed to start PulseStage API server:", err);
  process.exit(1);
});

export default app;
