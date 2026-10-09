import { z } from "zod";

/**
 * Post-report moderation contract. One account may report a post once; the
 * server removes the post and bans its poster once reports EXCEED the
 * admin-tunable threshold (default: >10). Every reporter identity also has
 * a monthly allowance — 10 reports/month for signed-in accounts, 6/month
 * for guests — and all four numbers live in the moderation settings doc,
 * editable any time from the dashboard.
 */
export const ReportReasons = [
  "fake",
  "scam",
  "inappropriate",
  "spam",
  "other",
] as const;

export const ReportSchema = z.object({
  reason: z.enum(ReportReasons, {
    errorMap: () => ({ message: "Pick one of the allowed report reasons." }),
  }),
  details: z
    .string()
    .trim()
    .max(500, "Report details cannot exceed 500 characters")
    .optional(),
});

/** Admin-editable moderation numbers (dashboard → Moderation tab). */
export const ModerationSettingsSchema = z.object({
  reportThreshold: z
    .number()
    .int("Report threshold must be a whole number")
    .min(1, "Report threshold must be at least 1")
    .max(100, "Report threshold cannot exceed 100"),
  banDays: z
    .number()
    .int("Ban length must be a whole number of days")
    .min(1, "A ban must last at least 1 day")
    .max(365, "A ban cannot exceed 365 days"),
  // Monthly report allowances — signed-in accounts (10) vs guests (6).
  // Optional so older PUT bodies (threshold + banDays only) still validate;
  // omitted fields are left untouched server-side.
  reportQuotaUser: z
    .number()
    .int("Signed-in report allowance must be a whole number")
    .min(1, "The signed-in allowance must be at least 1")
    .max(100, "The signed-in allowance cannot exceed 100")
    .optional(),
  reportQuotaGuest: z
    .number()
    .int("Guest report allowance must be a whole number")
    .min(1, "The guest allowance must be at least 1")
    .max(100, "The guest allowance cannot exceed 100")
    .optional(),
});

/** Manual ban placed by an admin on a user account. */
export const BanUserSchema = z.object({
  days: z
    .number()
    .int("Ban length must be a whole number of days")
    .min(1, "A ban must last at least 1 day")
    .max(365, "A ban cannot exceed 365 days")
    .optional(),
  reason: z
    .string()
    .trim()
    .max(200, "Ban reason cannot exceed 200 characters")
    .optional(),
});

export type ReportInput = z.infer<typeof ReportSchema>;
export type ModerationSettingsInput = z.infer<typeof ModerationSettingsSchema>;
export type BanUserInput = z.infer<typeof BanUserSchema>;
