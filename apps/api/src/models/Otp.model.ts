import mongoose, { Schema, Document, Model } from "mongoose";
import crypto from "crypto";
import { sha256Hex } from "../lib/identity.js";

/**
 * One-time codes for the email workflows: signup verification, password
 * reset, and account deletion. Mongo-only — auth already is (UserModel has
 * no in-memory twin), so codes die with the database like sessions do.
 *
 * Safety properties:
 *   – only the SHA-256 of `code:purpose:email` is stored (leaked DB ≠ live codes)
 *   – 5-minute TTL from the moment the email is sent, enforced both by an
 *     index and on read
 *   – 5 wrong attempts invalidate the code (brute-forcing 6 digits is futile)
 *   – success consumes it (single use); resending replaces the old code
 */
export type OtpPurpose = "signup" | "password-reset" | "account-delete";

export interface IOtpCode extends Document<string> {
  email: string;
  purpose: OtpPurpose;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
}

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes from send
export const MAX_OTP_ATTEMPTS = 5;

const OtpSchema = new Schema<IOtpCode>(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    purpose: { type: String, enum: ["signup", "password-reset", "account-delete"], required: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// One live code per (email, purpose): issuing a new one replaces the old.
OtpSchema.index({ email: 1, purpose: 1 }, { unique: true });
// Mongo reaps expired codes on its own.
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpModel: Model<IOtpCode> =
  (mongoose.models.OtpCode as Model<IOtpCode>) || mongoose.model<IOtpCode>("OtpCode", OtpSchema);

/** Hash that gets persisted — bound to purpose + email so codes can't cross flows. */
const hashOtp = (code: string, purpose: OtpPurpose, email: string): string =>
  sha256Hex(`${code}:${purpose}:${email}`);

/** Issue (or replace) the code for this email+purpose. Returns the plaintext once. */
export const issueOtp = async (email: string, purpose: OtpPurpose): Promise<string> => {
  const code = crypto.randomInt(0, 1000000).toString().padStart(6, "0");
  const now = new Date();
  await OtpModel.updateOne(
    { email, purpose },
    {
      $set: {
        codeHash: hashOtp(code, purpose, email),
        expiresAt: new Date(now.getTime() + OTP_TTL_MS),
        attempts: 0,
      },
    },
    { upsert: true }
  ).exec();
  return code;
};

export type OtpCheck =
  | { ok: true }
  | { ok: false; reason: "invalid" | "expired" | "too_many_attempts" };

/** Validate a code. Wrong guesses burn attempts; the 5th wrong one kills it. */
export const verifyOtp = async (
  email: string,
  purpose: OtpPurpose,
  code: string
): Promise<OtpCheck> => {
  const doc = await OtpModel.findOne({ email, purpose });
  if (!doc) return { ok: false, reason: "invalid" };

  if (doc.expiresAt.getTime() <= Date.now()) {
    await doc.deleteOne().catch(() => {});
    return { ok: false, reason: "expired" };
  }
  if (doc.attempts >= MAX_OTP_ATTEMPTS) {
    await doc.deleteOne().catch(() => {});
    return { ok: false, reason: "too_many_attempts" };
  }
  if (doc.codeHash !== hashOtp(code, purpose, email)) {
    doc.attempts += 1;
    await doc.save();
    return { ok: false, reason: doc.attempts >= MAX_OTP_ATTEMPTS ? "too_many_attempts" : "invalid" };
  }

  await doc.deleteOne().catch(() => {}); // single use
  return { ok: true };
};

/** Drop every live code for an account (used after a successful reset). */
export const consumeOtpsFor = async (email: string): Promise<void> => {
  await OtpModel.deleteMany({ email }).exec();
};
