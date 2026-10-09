import rateLimit from "express-rate-limit";

const window15 = 15 * 60 * 1000; // 15 minutes
const window10 = 10 * 60 * 1000; // 10 minutes

const message = (text: string) => ({ success: false, error: text });

/**
 * General read/write budget per client IP. Keeps scrapers and runaway
 * clients from monopolising the API.
 */
export const apiRateLimiter = rateLimit({
  windowMs: window15,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: message(
    "Too many requests from this client, please try again after 15 minutes."
  ),
});

/**
 * Brute-force / enumeration defence: only *failed* requests (4xx/5xx) count
 * towards this budget, so hammering with bad ids, bad signatures, or invalid
 * payloads gets an IP throttled after a handful of mistakes — while normal
 * traffic is unaffected.
 */
export const failedAttemptLimiter = rateLimit({
  windowMs: window10,
  max: 15,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: message("Too many failed attempts from this client, please try again later."),
});

/**
 * Auth endpoints get their own, tighter failure budget: password guessing
 * against /api/auth/login is throttled after a few mistakes per IP.
 */
export const authRateLimiter = rateLimit({
  windowMs: window15,
  max: 15,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: message("Too many failed sign-in attempts, please wait a few minutes and try again."),
});

/**
 * Guest posting quota: without an account you may publish 2 posts per day
 * (per IP). Only *successful* posts count — a typo'd form submission rolls
 * the counter back, so honest guests never lose a slot to a validation error.
 * Signed-in users skip this limiter entirely; abuse is still bounded by the
 * per-IP and global write ceilings plus the failed-attempt limiter.
 */
export const anonPostLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 2,
  skip: (req) => Boolean((req as { user?: unknown }).user),
  skipFailedRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: message(
    "You've reached today's limit of 2 guest posts. Sign in to keep posting, or try again tomorrow."
  ),
});

const MUTATIONS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Per-IP budget for state-changing requests. The posting wizard only ever
 * sends one POST per submission, so a small ceiling is plenty for humans
 * and restrictive for script abuse.
 */
export const writeLimiter = rateLimit({
  windowMs: window15,
  max: 20,
  skip: (req) => !MUTATIONS.has(req.method),
  standardHeaders: true,
  legacyHeaders: false,
  message: message("Rate limit exceeded for write operations, please slow down."),
});

/**
 * Global ceiling across *all* clients: an attacker rotating fake
 * `X-Forwarded-For` values can dodge per-IP buckets, but never this one.
 */
export const globalWriteCeiling = rateLimit({
  windowMs: window15,
  max: 60,
  skip: (req) => !MUTATIONS.has(req.method),
  keyGenerator: () => "global-write",
  standardHeaders: true,
  legacyHeaders: false,
  message: message("The service is receiving too many write requests right now, try again shortly."),
});
