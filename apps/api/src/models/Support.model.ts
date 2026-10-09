import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * `support` collection — messages written through the public contact page
 * (/contact), linked from the footer and the profile. Admins read them back
 * on the admin dashboard; the writer needs no account.
 */
export interface ISupportMessage extends Document<string> {
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "new" | "read";
  createdAt: Date;
  updatedAt: Date;
}

const SupportSchema = new Schema<ISupportMessage>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    subject: { type: String, trim: true, default: "", maxlength: 150 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    status: { type: String, enum: ["new", "read"], default: "new" },
  },
  { timestamps: true }
);

SupportSchema.index({ createdAt: -1 });

export const SupportModel: Model<ISupportMessage> =
  (mongoose.models.Support as Model<ISupportMessage>) ||
  mongoose.model<ISupportMessage>("Support", SupportSchema);
