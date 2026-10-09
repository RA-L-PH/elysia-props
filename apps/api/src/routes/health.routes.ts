import { Router, Request, Response } from "express";
import { getDatabaseStatus } from "../config/db.js";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  const db = getDatabaseStatus();

  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      connected: db.isConnected,
      fallbackMode: db.isInMemoryFallback,
      host: db.host,
    },
    version: "1.0.0",
  });
});

export default router;
