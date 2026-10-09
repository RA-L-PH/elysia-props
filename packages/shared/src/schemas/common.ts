import { z } from "zod";

export const RequirementCategoryEnum = z.enum(["Planner", "Performer", "Crew"]);
export type RequirementCategory = z.infer<typeof RequirementCategoryEnum>;

export const RequirementStatusEnum = z.enum(["draft", "published", "in_review", "closed"]);
export type RequirementStatus = z.infer<typeof RequirementStatusEnum>;

export const UrgencyLevelEnum = z.enum(["standard", "high", "urgent"]);
export type UrgencyLevel = z.infer<typeof UrgencyLevelEnum>;

export const PayTypeEnum = z.enum(["fixed", "hourly", "daily", "negotiable"]);
export type PayType = z.infer<typeof PayTypeEnum>;

export const PreferredContactMethodEnum = z.enum(["email", "phone", "whatsapp"]);
export type PreferredContactMethod = z.infer<typeof PreferredContactMethodEnum>;

export const LocationSchema = z.object({
  city: z.string().min(2, "City must be at least 2 characters"),
  venue: z.string().min(2, "Venue or area must be at least 2 characters"),
  address: z.string().optional().default(""),
  isRemote: z.boolean().default(false),
});

export const BudgetSchema = z.object({
  min: z.number().min(0, "Minimum budget must be 0 or more"),
  max: z.number().min(0, "Maximum budget must be 0 or more"),
  currency: z.string().default("USD"),
  payType: PayTypeEnum.default("fixed"),
  isNegotiable: z.boolean().default(false),
}).refine((data) => data.max >= data.min, {
  message: "Maximum budget must be greater than or equal to minimum budget",
  path: ["max"],
});

export const EventDateSchema = z.object({
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional().default(""),
  applicationDeadline: z.string().min(1, "Application deadline is required"),
  timeWindow: z.string().optional().default(""),
});

export const ContactInfoSchema = z.object({
  name: z.string().min(2, "Full name or organization name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(7, "Please enter a valid phone number"),
  company: z.string().optional().default(""),
  preferredMethod: PreferredContactMethodEnum.default("email"),
});
