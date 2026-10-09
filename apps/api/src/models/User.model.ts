import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISessionEntry {
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface IUser extends Document<string> {
  _id: string; // HMAC(email) — the public, non-reversible identity
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string; // optional at signup — "" when not provided
  role: "user" | "admin";
  verified: boolean; // "Verified Poster" badge (Airbnb-Superhost style)
  verifiedAt?: Date | null;
  /**
   * Moderation ban: while `bannedUntil` is in the future the account can't
   * sign in or use its session (403 ACCOUNT_BANNED). Set manually by an
   * admin or automatically when a post exceeds the report threshold.
   */
  bannedUntil?: Date | null;
  banReason?: string;
  /**
   * Email-address proof from the signup OTP flow. `false` = created but not
   * yet activated (login refuses). Legacy docs predate the field — the
   * absence of `false` counts as verified, so nobody is locked out.
   */
  emailVerified?: boolean;
  newsletter: boolean; // opted into the mailing list at signup (or later)
  sessions: ISessionEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    _id: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    firstName: { type: String, trim: true, default: "" },
    lastName: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    verified: { type: Boolean, default: false },
    verifiedAt: { type: Date, default: null },
    bannedUntil: { type: Date, default: null },
    banReason: { type: String, trim: true, default: "" },
    // Deliberately no default: legacy docs stay "absent = verified".
    emailVerified: { type: Boolean },
    newsletter: { type: Boolean, default: false },
    sessions: {
      type: [
        new Schema<ISessionEntry>(
          {
            tokenHash: { type: String, required: true },
            createdAt: { type: Date, default: Date.now },
            expiresAt: { type: Date, required: true },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
  },
  { timestamps: true }
);

UserSchema.index({ "sessions.tokenHash": 1 });

export const UserModel: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ||
  mongoose.model<IUser>("User", UserSchema);
