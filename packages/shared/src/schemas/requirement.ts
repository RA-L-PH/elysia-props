import { z } from "zod";
import {
  RequirementCategoryEnum,
  RequirementStatusEnum,
  UrgencyLevelEnum,
  LocationSchema,
  BudgetSchema,
  EventDateSchema,
  ContactInfoSchema,
} from "./common.js";
import { PlannerDetailsSchema } from "./planner.js";
import { PerformerDetailsSchema } from "./performer.js";
import { CrewDetailsSchema } from "./crew.js";

const BaseRequirementFields = {
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title cannot exceed 100 characters"),
  description: z.string().min(20, "Please provide a detailed description (minimum 20 characters)"),
  status: RequirementStatusEnum.default("published"),
  urgency: UrgencyLevelEnum.default("standard"),
  tags: z.array(z.string()).default([]),
  location: LocationSchema,
  dates: EventDateSchema,
  budget: BudgetSchema,
  contact: ContactInfoSchema,
};

export const PlannerRequirementSchema = z.object({
  ...BaseRequirementFields,
  category: z.literal("Planner"),
  details: PlannerDetailsSchema,
});

export const PerformerRequirementSchema = z.object({
  ...BaseRequirementFields,
  category: z.literal("Performer"),
  details: PerformerDetailsSchema,
});

export const CrewRequirementSchema = z.object({
  ...BaseRequirementFields,
  category: z.literal("Crew"),
  details: CrewDetailsSchema,
});

export const CreateRequirementSchema = z.discriminatedUnion("category", [
  PlannerRequirementSchema,
  PerformerRequirementSchema,
  CrewRequirementSchema,
]);

/** Work links: "most notable work" — at least 3, at most 10. */
export const MIN_WORK_LINKS = 3;
export const MAX_WORK_LINKS = 10;

/**
 * An application to a posted requirement: who's applying, how to reach them,
 * a short pitch, and links to their most notable work (3–10). Guests may
 * apply — no account required.
 */
export const ApplySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Your name is required")
    .max(120, "Name cannot exceed 120 characters"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address")
    .max(254, "Email cannot exceed 254 characters"),
  // Optional: digits and phone punctuation only (same rule as signup).
  phone: z
    .string()
    .trim()
    .max(30, "Phone number cannot exceed 30 characters")
    .regex(/^[0-9+()\-\s]*$/, "Phone number can only contain digits and + - ( ) characters")
    .optional(),
  message: z
    .string()
    .trim()
    .min(10, "Tell them why you're a good fit (at least 10 characters)")
    .max(2000, "Your pitch cannot exceed 2000 characters"),
  /** "Most notable work" — links to a reel, portfolio, credits, videos. */
  workLinks: z
    .array(
      z
        .string()
        .trim()
        .max(500, "A work link cannot exceed 500 characters")
        .url("Enter a valid link (https://…)")
    )
    .min(MIN_WORK_LINKS, `Add at least ${MIN_WORK_LINKS} work links`)
    .max(MAX_WORK_LINKS, `You can add up to ${MAX_WORK_LINKS} work links`),
});

/** Fields only present on stored documents (server-attached, never client-sent). */
const DocumentMetaFields = {
  _id: z.string(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  /** Owning account (HMAC of email) — null for guest posts. */
  postedBy: z.string().nullable().optional(),
  /** Auto-expiry instant: 23:59 on the event's end date. */
  expiresAt: z.string().or(z.date()).nullable().optional(),
  /** Owner paused intake — the API refuses new applications while true. */
  applicationsPaused: z.boolean().optional(),
};

/** Owner toggle for application intake: POST/PUT body `{ paused: boolean }`. */
export const PauseApplicationsSchema = z.object({
  paused: z.boolean(),
});

/**
 * DELETE body: guests prove authorship with the one-time Post ID; signed-in
 * owners send an empty body and are authorised by their session. Kept
 * deliberately lenient on postKey (type + length only) — an empty or bogus
 * key must still reach the controller so the session fallback can resolve.
 */
export const DeleteRequirementSchema = z
  .object({
    postKey: z
      .string()
      .max(120, "Post ID looks malformed")
      .optional(),
  })
  .nullish();

/**
 * GET /api/requirements filters. Types, lengths, and numeric shapes are
 * enforced (repeated params arrive as arrays and are rejected), while the
 * values stay permissive — the browse page builds free-form search text and
 * plain-number budgets, and the controller clamps page/limit itself.
 */
export const ListRequirementsQuerySchema = z.object({
  category: z.string().trim().max(60).optional(),
  search: z.string().trim().max(200).optional(),
  urgency: z.string().trim().max(30).optional(),
  status: z.string().trim().max(30).optional(),
  city: z.string().trim().max(100).optional(),
  minBudget: z.string().max(24).optional(),
  maxBudget: z.string().max(24).optional(),
  payType: z.string().trim().max(30).optional(),
  mine: z.string().max(10).optional(),
  page: z.string().regex(/^\d{1,6}$/, "Page must be a positive integer").optional(),
  limit: z.string().regex(/^\d{1,3}$/, "Limit must be a positive integer").optional(),
});

export const RequirementDocumentSchema = z.discriminatedUnion("category", [
  PlannerRequirementSchema.extend(DocumentMetaFields),
  PerformerRequirementSchema.extend(DocumentMetaFields),
  CrewRequirementSchema.extend(DocumentMetaFields),
]);

export type PlannerRequirement = z.infer<typeof PlannerRequirementSchema>;
export type PerformerRequirement = z.infer<typeof PerformerRequirementSchema>;
export type CrewRequirement = z.infer<typeof CrewRequirementSchema>;
export type CreateRequirementInput = z.infer<typeof CreateRequirementSchema>;
export type ApplyInput = z.infer<typeof ApplySchema>;
export type RequirementDocument = z.infer<typeof RequirementDocumentSchema>;
