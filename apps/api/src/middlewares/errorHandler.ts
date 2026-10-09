import { Request, Response, NextFunction } from "express";

/**
 * Centralised error handling.
 *
 * – 4xx messages are safe to show (validation, missing ids, …).
 * – 5xx responses never expose internal details (DB errors, file paths,
 *   stack traces) outside development — the full error is still logged
 *   server-side for operators.
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error("[API Error Handler]", err);

  const status = (err as { status?: number }).status || 500;
  const isDevelopment = process.env.NODE_ENV === "development";
  const expose = status < 500 || isDevelopment;

  res.status(status).json({
    success: false,
    error: expose ? err.message || "Internal Server Error" : "Internal Server Error",
    stack: isDevelopment ? err.stack : undefined,
  });
};
