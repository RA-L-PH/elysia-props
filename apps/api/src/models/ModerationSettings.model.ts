import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * The admin-tunable moderation numbers, stored as a single fixed document:
 *
 * - reportThreshold — a post is removed when its report count EXCEEDS this
 *   (default 10 → the 11th report triggers removal + poster ban).
 * - banDays — how long the auto-ban lasts (default 14; the brief calls for
 *   10–15 days, both freely editable from the dashboard at any time).
 * - reportQuotaUser / reportQuotaGuest — monthly report allowance per
 *   reporter identity (defaults 10 signed-in, 6 guest; reset on the 1st).
 * - autoRemovedPosts — lifetime counter of posts swept by the rule.
 */
export interface IModerationSettings extends Document<string> {
  _id: "moderation";
  reportThreshold: number;
  banDays: number;
  reportQuotaUser: number;
  reportQuotaGuest: number;
  autoRemovedPosts: number;
}

const ModerationSettingsSchema = new Schema<IModerationSettings>(
  {
    reportThreshold: { type: Number, default: 10, min: 1, max: 100 },
    banDays: { type: Number, default: 14, min: 1, max: 365 },
    reportQuotaUser: { type: Number, default: 10, min: 1, max: 100 },
    reportQuotaGuest: { type: Number, default: 6, min: 1, max: 100 },
    autoRemovedPosts: { type: Number, default: 0 },
  },
  { timestamps: true, _id: false }
);
// Singleton row: the id IS the setting group name.
ModerationSettingsSchema.add({
  _id: { type: String, required: true, default: "moderation" },
});

export const ModerationSettingsModel: Model<IModerationSettings> =
  (mongoose.models.ModerationSettings as Model<IModerationSettings>) ||
  mongoose.model<IModerationSettings>(
    "ModerationSettings",
    ModerationSettingsSchema
  );

/** Fetch the singleton, creating the defaults on first use. */
export const getModerationSettings = async (): Promise<IModerationSettings> => {
  let doc = await ModerationSettingsModel.findOneAndUpdate(
    { _id: "moderation" },
    {
      $setOnInsert: {
        _id: "moderation",
        reportThreshold: 10,
        banDays: 14,
        reportQuotaUser: 10,
        reportQuotaGuest: 6,
        autoRemovedPosts: 0,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  // The singleton may predate the allowance fields — persist the defaults
  // once so the dashboard edits start from stored values.
  if (doc && (!doc.reportQuotaUser || !doc.reportQuotaGuest)) {
    doc =
      (await ModerationSettingsModel.findOneAndUpdate(
        { _id: "moderation" },
        { $set: { reportQuotaUser: 10, reportQuotaGuest: 6 } },
        { new: true }
      )) ?? doc;
  }
  return doc as IModerationSettings;
};
