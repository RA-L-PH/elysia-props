import { Request, Response, NextFunction } from "express";
import { UserModel } from "../models/User.model.js";
import { sha256Hex, SESSION_COOKIE } from "../lib/identity.js";

export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: "user" | "admin";
  verified: boolean;
  createdAt?: string;
  /** ISO date while the account is suspended; undefined when not banned. */
  bannedUntil?: string;
  banReason?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

/** Read any cookie from the raw `Cookie` header (no cookie-parser in this API). */
export const readCookie = (req: Request, name: string): string | null => {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return null;
};

/** Read the session token from the httpOnly cookie (set by this API, relayed by the BFF). */
export const readSessionToken = (req: Request): string | null =>
  readCookie(req, SESSION_COOKIE);

/** True while a ban is still in force (expired bans behave as no bans). */
export const isBanned = (bannedUntil?: Date | string | null): boolean => {
  if (!bannedUntil) return false;
  const until = new Date(bannedUntil).getTime();
  return Number.isFinite(until) && until > Date.now();
};

/** Resolve a live session token to its user (expired tokens never match). */
const resolveSessionUser = async (token: string): Promise<SessionUser | null> => {
  const user = await UserModel.findOne({
    sessions: {
      $elemMatch: { tokenHash: sha256Hex(token), expiresAt: { $gt: new Date() } },
    },
  }).select(
    "email firstName lastName phone role verified createdAt bannedUntil banReason"
  );

  if (!user) return null;
  const banned = isBanned(user.bannedUntil);
  return {
    id: String(user._id),
    email: user.email,
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    phone: user.phone || "",
    role: user.role,
    verified: user.verified,
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : undefined,
    bannedUntil:
      banned && user.bannedUntil
        ? new Date(user.bannedUntil).toISOString()
        : undefined,
    banReason: banned ? user.banReason || undefined : undefined,
  };
};

/** 403 body for a suspended account — shared by login and requireAuth. */
export const bannedResponse = (res: Response, until: string, reason?: string): void => {
  res.status(403).json({
    success: false,
    error: `This account is suspended until ${new Date(until).toUTCString()}.${
      reason ? ` ${reason}.` : ""
    }`,
    code: "ACCOUNT_BANNED",
    bannedUntil: until,
  });
};

/** 401 unless a valid, unbanned session cookie is present; populates `req.user`. */
export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = readSessionToken(req);
    const user = token ? await resolveSessionUser(token) : null;
    if (!user) {
      res.status(401).json({ success: false, error: "Sign in required." });
      return;
    }
    if (user.bannedUntil) {
      bannedResponse(res, user.bannedUntil, user.banReason);
      return;
    }
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Populate `req.user` when a valid session cookie exists, but never reject —
 * used by routes that serve both guests and signed-in users (post creation,
 * post deletion via Post ID).
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = readSessionToken(req);
    if (token) {
      const user = await resolveSessionUser(token);
      if (user) req.user = user;
    }
    next();
  } catch (error) {
    next(error);
  }
};

/** 403 unless the authenticated user is an admin (use after requireAuth). */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.role !== "admin") {
    res.status(403).json({ success: false, error: "Admin access required." });
    return;
  }
  next();
};
