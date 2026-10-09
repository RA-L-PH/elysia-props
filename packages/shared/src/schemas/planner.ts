import { z } from "zod";

export const PlannerEventTypeEnum = z.enum([
  "Wedding",
  "Corporate",
  "Festival",
  "Private Party",
  "Conference",
  "Exhibition",
  "Charity Gala",
  "Other"
]);

export const VenueTypeEnum = z.enum([
  "Indoor Ballroom / Hall",
  "Outdoor Open Air",
  "Rooftop / Skyline",
  "Beach / Waterfront",
  "Hybrid / Multi-Space",
  "Virtual / Studio"
]);

export const PlannerScopeEnum = z.enum([
  "Full Planning & End-to-End Execution",
  "Day-of Coordination & Onsite Management",
  "Vendor Sourcing & Contract Negotiation",
  "Visual Decor, Floral & Staging Design",
  "Budget Strategy & Cost Management",
  "Guest Experience & Hospitality"
]);

export const PlannerDetailsSchema = z.object({
  eventType: PlannerEventTypeEnum.default("Corporate"),
  guestCount: z.number().int().min(1, "Guest count must be at least 1"),
  venueType: VenueTypeEnum.default("Indoor Ballroom / Hall"),
  cateringNeeded: z.boolean().default(false),
  themeOrVibe: z.string().min(2, "Theme or vibe description is required (e.g. Modern Minimalist, Luxury Black Tie)"),
  plannerScope: z.array(z.string()).min(1, "Select at least one planning scope item"),
  estimatedOverallBudget: z.number().optional().default(0),
});

export type PlannerDetails = z.infer<typeof PlannerDetailsSchema>;
