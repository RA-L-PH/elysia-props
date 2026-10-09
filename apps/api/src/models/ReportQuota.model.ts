import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Monthly report allowance usage — one document per reporter identity per
 * calendar month (UTC):
 *
 *   reporterKey = `u:<email>`  signed-in account  → reportQuotaUser  (10/mo)
 *   reporterKey = `g:<cookie>` guest browser      → reportQuotaGuest (6/mo)
 *
 * The counter is keyed separately from the reports themselves so it
 * survives the report/post deletion that happens at the threshold: once a
 * reporter's month is spent, it stays spent until the 1st.
 */
export interface IReportQuota extends Document<string> {
  reporterKey: string;
  /** Calendar month as "YYYY-MM" (UTC). */
  month: string;
  /** Reports filed this month — capped at the settings allowance. */
  count: number;
}

const ReportQuotaSchema = new Schema<IReportQuota>(
  {
    reporterKey: { type: String, required: true },
    month: { type: String, required: true, match: /^\d{4}-\d{2}$/ },
    count: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// One row per identity per month — the unique index keeps concurrent
// reports from opening a second counter for the same identity.
ReportQuotaSchema.index({ reporterKey: 1, month: 1 }, { unique: true });

export const ReportQuotaModel: Model<IReportQuota> =
  (mongoose.models.ReportQuota as Model<IReportQuota>) ||
  mongoose.model<IReportQuota>("ReportQuota", ReportQuotaSchema);

/** Current calendar month as "YYYY-MM" — allowances reset on the 1st (UTC). */
export const currentMonth = (): string => new Date().toISOString().slice(0, 7);
