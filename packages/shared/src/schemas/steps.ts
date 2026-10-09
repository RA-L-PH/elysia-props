import { z } from "zod";
import { RequirementCategoryEnum, LocationSchema, BudgetSchema, EventDateSchema, ContactInfoSchema, UrgencyLevelEnum } from "./common.js";
import { PlannerDetailsSchema } from "./planner.js";
import { PerformerDetailsSchema } from "./performer.js";
import { CrewDetailsSchema } from "./crew.js";

export const Step1Schema = z.object({
  category: RequirementCategoryEnum,
});

export const Step2PlannerSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title is too long"),
  description: z.string().min(20, "Provide a descriptive summary (min 20 characters)"),
  tags: z.array(z.string()).default([]),
  details: PlannerDetailsSchema,
});

export const Step2PerformerSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title is too long"),
  description: z.string().min(20, "Provide a descriptive summary (min 20 characters)"),
  tags: z.array(z.string()).default([]),
  details: PerformerDetailsSchema,
});

export const Step2CrewSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title is too long"),
  description: z.string().min(20, "Provide a descriptive summary (min 20 characters)"),
  tags: z.array(z.string()).default([]),
  details: CrewDetailsSchema,
});

export const Step3LogisticsSchema = z.object({
  location: LocationSchema,
  dates: EventDateSchema,
  budget: BudgetSchema,
  urgency: UrgencyLevelEnum.default("standard"),
});

export const Step4ContactSchema = z.object({
  contact: ContactInfoSchema,
});

export type Step1Data = z.infer<typeof Step1Schema>;
export type Step3Data = z.infer<typeof Step3LogisticsSchema>;
export type Step4Data = z.infer<typeof Step4ContactSchema>;
