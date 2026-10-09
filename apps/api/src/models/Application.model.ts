import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * An application to a posted requirement: the applicant's contact details,
 * their pitch ("why I'm suited"), and links to their most notable work.
 * Stored in its own collection so requirement documents stay lean and
 * applications survive edits. Only the post's owner can read them back.
 */
export interface IApplication extends Document<string> {
  _id: string;
  requirementId: string;
  name: string;
  email: string;
  phone: string;
  /** Digits-only form of `phone` — powers the one-application-per-number rule. */
  phoneNorm?: string;
  message: string;
  /** "Most notable work" — 3 to 10 links (schema-enforced at the edge). */
  workLinks: string[];
  /** Filled in when a signed-in account applies (never trusted from input). */
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Strip everything but digits so "555 019-2834", "(555) 019 2834" and
 * "5550192834" all compare equal. Short inputs (< 7 digits) aren't treated
 * as phone identities at all.
 */
export const normalizePhone = (phone?: string): string =>
  (phone || "").replace(/[^0-9]/g, "");

const ApplicationSchema = new Schema<IApplication>(
  {
    requirementId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    phone: { type: String, trim: true, default: "", maxlength: 30 },
    phoneNorm: { type: String, trim: true, default: "", maxlength: 20 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    workLinks: { type: [String], default: [], maxlength: 500 },
    userId: { type: String, default: null },
  },
  { timestamps: true }
);

// One application per email per post (hard backstop against races — the
// controller refuses duplicates up front with a friendlier 409).
ApplicationSchema.index({ requirementId: 1, email: 1 }, { unique: true });
// Speeds up the phone-duplicate check; empty phoneNorm stays out of it.
ApplicationSchema.index(
  { requirementId: 1, phoneNorm: 1 },
  { partialFilterExpression: { phoneNorm: { $gt: "" } } }
);

export const ApplicationModel: Model<IApplication> =
  (mongoose.models.Application as Model<IApplication>) ||
  mongoose.model<IApplication>("Application", ApplicationSchema);

/**
 * In-memory mirror used when MongoDB is unavailable (the API's documented
 * fallback mode). Same one-per-email-per-post rule as the unique index.
 */
export interface IApplicationEntry {
  _id: string;
  requirementId: string;
  name: string;
  email: string;
  phone: string;
  phoneNorm?: string;
  message: string;
  workLinks: string[];
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const memoryStore = new Map<string, IApplicationEntry>(); // key: `${requirementId}::${email}`

const memoryKey = (requirementId: string, email: string) => `${requirementId}::${email}`;

export const applicationMemory = {
  upsert: (
    entry: Omit<IApplicationEntry, "_id" | "createdAt" | "updatedAt">
  ): IApplicationEntry => {
    const key = memoryKey(entry.requirementId, entry.email);
    const existing = memoryStore.get(key);
    const now = new Date();
    const record: IApplicationEntry = {
      ...entry,
      _id: existing?._id ?? `${entry.requirementId}-${now.getTime()}`,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    memoryStore.set(key, record);
    return record;
  },
  listByRequirement: (requirementId: string): IApplicationEntry[] =>
    [...memoryStore.values()]
      .filter((a) => a.requirementId === requirementId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
  countByRequirement: (requirementId: string): number =>
    [...memoryStore.values()].filter((a) => a.requirementId === requirementId).length,
  removeByRequirement: (requirementId: string): void => {
    for (const [key, entry] of memoryStore) {
      if (entry.requirementId === requirementId) memoryStore.delete(key);
    }
  },
};
