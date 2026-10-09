import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * One report against one post. `reporterKey` is the dedupe identity:
 *
 * - signed-in reporter → `u:<email>` (one report per account per post)
 * - guest reporter     → `g:<anonymous cookie id>` (one report per browser;
 *   the global per-IP write limiter caps flooding)
 *
 * The unique (requirementId, reporterKey) index makes repeats no-ops —
 * a single reporter can only move the counter once, regardless of path.
 *
 * Reports exist only while the post does: when the threshold is crossed the
 * post, its applications, and its reports are all deleted together.
 */
export interface IReport extends Document {
  requirementId: string; // ObjectId of the reported post
  reporterKey: string; // u:<email> | g:<anonymous id>
  reporterEmail: string; // "" for guests (audit convenience)
  reporterIp: string; // best-effort (may be the BFF's address)
  reason: "fake" | "scam" | "inappropriate" | "spam" | "other";
  details?: string;
  createdAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    requirementId: { type: String, required: true, index: true },
    reporterKey: { type: String, required: true },
    reporterEmail: { type: String, default: "", lowercase: true, trim: true },
    reporterIp: { type: String, default: "" },
    reason: {
      type: String,
      enum: ["fake", "scam", "inappropriate", "spam", "other"],
      required: true,
    },
    details: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

// One report per reporter per post — the dedupe core of the counter.
ReportSchema.index({ requirementId: 1, reporterKey: 1 }, { unique: true });

export const ReportModel: Model<IReport> =
  (mongoose.models.Report as Model<IReport>) ||
  mongoose.model<IReport>("Report", ReportSchema);
