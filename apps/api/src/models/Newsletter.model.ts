import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Newsletter subscribers: footer joins (name + email) and signup opt-ins
 * (full name from the account). Kept separate from User so guests can
 * subscribe without an account (and so a marketing list is never joined
 * against auth data by accident). Name is stored so sends can greet
 * subscribers personally.
 */
export interface INewsletterSubscriber extends Document<string> {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  source: "footer" | "signup";
  subscribedAt: Date;
}

const NewsletterSchema = new Schema<INewsletterSubscriber>(
  {
    _id: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    firstName: { type: String, trim: true, default: "" },
    lastName: { type: String, trim: true, default: "" },
    source: { type: String, enum: ["footer", "signup"], default: "footer" },
    subscribedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const NewsletterModel: Model<INewsletterSubscriber> =
  (mongoose.models.Newsletter as Model<INewsletterSubscriber>) ||
  mongoose.model<INewsletterSubscriber>("Newsletter", NewsletterSchema);

/**
 * In-memory mirror used when MongoDB is unavailable (the API's documented
 * fallback mode). Email presence checks consult this first so the behaviour
 * matches whichever store is live.
 */
export interface INewsletterEntry {
  email: string;
  firstName: string;
  lastName: string;
  source: "footer" | "signup";
  subscribedAt: Date;
}

const memoryList = new Map<string, INewsletterEntry>();

export const newsletterMemory = {
  has: (email: string) => memoryList.has(email),
  add: (email: string, firstName: string, lastName: string, source: "footer" | "signup") => {
    if (!memoryList.has(email)) {
      memoryList.set(email, { email, firstName, lastName, source, subscribedAt: new Date() });
      return true;
    }
    return false;
  },
  remove: (email: string) => memoryList.delete(email),
  all: (): INewsletterEntry[] => [...memoryList.values()],
  size: () => memoryList.size,
};
