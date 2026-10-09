import crypto from "crypto";

/**
 * Identity primitives for PulseStage.
 *
 * – Public user id = HMAC-SHA256 of the normalised email. Deterministic
 *   (the same email always yields the same id) but NOT invertible without
 *   the server-side secret, so the raw email can't be rainbow-tabled from
 *   the id that appears publicly on job posts.
 * – Passwords use scrypt (memory-hard KDF) with a per-user random salt and
 *   timing-safe verification. No plaintext secrets are ever stored.
 * – Sessions are opaque random tokens; only their SHA-256 hash is persisted,
 *   so a leaked database still can't be replayed as a live session.
 */

const identitySecret = (): string =>
  process.env.IDENTITY_SECRET || process.env.API_SIGNING_SECRET || "";

export const SESSION_COOKIE = "pulsestage_session";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, keylen: 64 };

export const normalizeEmail = (email: string): string =>
  email.trim().toLowerCase();

/** Deterministic public user id derived from the email address. */
export const hashEmail = (email: string): string =>
  crypto
    .createHmac("sha256", identitySecret())
    .update(normalizeEmail(email))
    .digest("hex");

export const sha256Hex = (value: string): string =>
  crypto.createHash("sha256").update(value).digest("hex");

export const hashPassword = (password: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16);
    crypto.scrypt(password, salt, SCRYPT_PARAMS.keylen, SCRYPT_PARAMS, (err, key) => {
      if (err) reject(err);
      else resolve(`scrypt$${salt.toString("hex")}$${key.toString("hex")}`);
    });
  });

export const verifyPassword = (password: string, stored: string): Promise<boolean> =>
  new Promise((resolve) => {
    const parts = (stored || "").split("$");
    if (parts.length !== 3 || parts[0] !== "scrypt") {
      resolve(false);
      return;
    }
    const salt = Buffer.from(parts[1], "hex");
    const expected = Buffer.from(parts[2], "hex");
    if (salt.length === 0 || expected.length === 0) {
      resolve(false);
      return;
    }
    crypto.scrypt(password, salt, expected.length, SCRYPT_PARAMS, (err, key) => {
      if (err || !key) {
        resolve(false);
        return;
      }
      resolve(key.length === expected.length && crypto.timingSafeEqual(key, expected));
    });
  });

/**
 * Well-formed dummy hash: when an email doesn't exist we still run one
 * verification so unknown-account logins cost the same wall-clock time as
 * real ones (no user-enumeration timing oracle).
 */
export const DUMMY_PASSWORD_HASH = `scrypt$${"00".repeat(16)}$${"11".repeat(64)}`;

/** Create a fresh opaque session token (only the hash is stored). */
export const createSession = (): { token: string; tokenHash: string } => {
  const token = `ps_${crypto.randomBytes(32).toString("hex")}`;
  return { token, tokenHash: sha256Hex(token) };
};
