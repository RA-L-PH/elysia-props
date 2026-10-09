import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

/** Shared 400 responder: structured Zod issues, or a generic shape. */
const rejectInvalid = (res: Response, error: unknown): void => {
  if (error instanceof ZodError) {
    const issues = error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
      code: issue.code,
    }));

    res.status(400).json({
      success: false,
      error: "Validation Failed: Invalid payload structure",
      details: issues,
    });
    return;
  }

  res.status(400).json({
    success: false,
    error: "Malformed request payload",
  });
};

/** Body validation: the parsed (and stripped) value replaces req.body. */
export const validateBody = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync(req.body);
      req.body = parsed;
      next();
    } catch (error) {
      rejectInvalid(res, error);
    }
  };
};

/**
 * Query-string validation: rejects arrays/oversized/garbage params before a
 * controller reads them, and swaps in the parsed value. Express 4 exposes
 * `req.query` as a getter, so a plain assignment would throw in strict mode
 * — shadow it with an own (writable, configurable) data property instead.
 */
export const validateQuery = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync(req.query);
      Object.defineProperty(req, "query", {
        value: parsed,
        writable: true,
        enumerable: true,
        configurable: true,
      });
      next();
    } catch (error) {
      rejectInvalid(res, error);
    }
  };
};
