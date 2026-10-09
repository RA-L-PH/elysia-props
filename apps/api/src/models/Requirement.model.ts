import mongoose, { Schema, Document, Model } from "mongoose";
import { RequirementCategory, RequirementStatus, UrgencyLevel, PayType, PreferredContactMethod } from "@elysia/shared";

export interface IBaseRequirementDocument extends Document {
  title: string;
  description: string;
  category: RequirementCategory;
  status: RequirementStatus;
  urgency: UrgencyLevel;
  tags: string[];
  location: {
    city: string;
    venue: string;
    address?: string;
    isRemote: boolean;
  };
  dates: {
    startDate: string;
    endDate?: string;
    applicationDeadline: string;
    timeWindow?: string;
  };
  budget: {
    min: number;
    max: number;
    currency: string;
    payType: PayType;
    isNegotiable: boolean;
  };
  contact: {
    name: string;
    email: string;
    phone: string;
    company?: string;
    preferredMethod: PreferredContactMethod;
  };
  /** Public id (HMAC of the poster's email) of the account that created this. */
  postedBy?: string | null;
  /** Auto-delete moment: 23:59 on the event's end date (null = never). */
  expiresAt?: Date | null;
  /** Owner paused application intake — no new applications while true. */
  applicationsPaused?: boolean;
  /** SHA-256 of the one-time Post ID secret (the plaintext is shown once). */
  deleteKeyHash?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A post lives until 23:59 on the day the event ends (fallback: start date),
 * in the server's local timezone. A MongoDB TTL index removes the document
 * shortly after this instant; queries also filter on it for instant results.
 */
export const computeExpiresAt = (dates?: {
  endDate?: string | null;
  startDate?: string | null;
}): Date | null => {
  const day = dates?.endDate || dates?.startDate;
  if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const at = new Date(`${day}T23:59:59`);
  return Number.isNaN(at.getTime()) ? null : at;
};

const BaseRequirementSchema = new Schema<IBaseRequirementDocument>(
  {
    title: { type: String, required: true, trim: true, index: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ["Planner", "Performer", "Crew"],
      index: true,
    },
    status: {
      type: String,
      enum: ["draft", "published", "in_review", "closed"],
      default: "published",
      index: true,
    },
    urgency: {
      type: String,
      enum: ["standard", "high", "urgent"],
      default: "standard",
      index: true,
    },
    tags: [{ type: String, trim: true }],
    location: {
      city: { type: String, required: true, trim: true },
      venue: { type: String, required: true, trim: true },
      address: { type: String, default: "" },
      isRemote: { type: Boolean, default: false },
    },
    dates: {
      startDate: { type: String, required: true },
      endDate: { type: String, default: "" },
      applicationDeadline: { type: String, required: true },
      timeWindow: { type: String, default: "" },
    },
    budget: {
      min: { type: Number, required: true, min: 0 },
      max: { type: Number, required: true, min: 0 },
      currency: { type: String, default: "USD" },
      payType: {
        type: String,
        enum: ["fixed", "hourly", "daily", "negotiable"],
        default: "fixed",
      },
      isNegotiable: { type: Boolean, default: false },
    },
    contact: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
      phone: { type: String, required: true, trim: true },
      company: { type: String, default: "" },
      preferredMethod: {
        type: String,
        enum: ["email", "phone", "whatsapp"],
        default: "email",
      },
    },
    postedBy: { type: String, default: null, index: true },
    expiresAt: { type: Date, default: null },
    applicationsPaused: { type: Boolean, default: false },
    deleteKeyHash: { type: String, default: null },
  },
  {
    discriminatorKey: "category",
    collection: "requirements",
    timestamps: true,
  }
);

// Compound indexes for high performance querying
BaseRequirementSchema.index({ category: 1, status: 1, createdAt: -1 });
BaseRequirementSchema.index({ "location.city": 1, category: 1 });
BaseRequirementSchema.index({ title: "text", description: "text" });
// TTL: MongoDB deletes each doc 0s after `expiresAt` (23:59 on event end date).
BaseRequirementSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// One live Post ID per post; plaintext never stored. Partial (not sparse):
// every doc stores `deleteKeyHash: null` by default, and sparse indexes still
// count explicit nulls — a partial index only sees the real string hashes.
BaseRequirementSchema.index(
  { deleteKeyHash: 1 },
  { unique: true, partialFilterExpression: { deleteKeyHash: { $type: "string" } } }
);

// Keep expiresAt in sync whenever the event dates change (covers .save() and
// .create(); the findByIdAndUpdate path recomputes it in the controller).
BaseRequirementSchema.pre("save", function (next) {
  const datesChanged =
    this.isModified("dates.endDate") || this.isModified("dates.startDate");
  if (datesChanged || !this.expiresAt) {
    const computed = computeExpiresAt(this.dates);
    if (computed) this.expiresAt = computed;
  }
  next();
});

export const RequirementModel: Model<IBaseRequirementDocument> =
  mongoose.models.Requirement || mongoose.model<IBaseRequirementDocument>("Requirement", BaseRequirementSchema);
