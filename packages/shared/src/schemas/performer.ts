import { z } from "zod";

export const PerformerCategoryEnum = z.enum([
  "Live Band / Musician",
  "DJ / Producer",
  "Solo Vocalist / Instrumentalist",
  "Magician / Illusionist",
  "Dancer / Choreography Troupe",
  "Stand-up Comedian",
  "Circus / Acrobat / Fire Artist",
  "MC / Event Host",
  "Other"
]);

export const StageSizeEnum = z.enum([
  "Small (up to 3x3m)",
  "Medium (up to 6x4m)",
  "Large (6x8m+)",
  "Roaming / No Stage Needed"
]);

export const PerformerDetailsSchema = z.object({
  performanceCategory: PerformerCategoryEnum.default("Live Band / Musician"),
  performanceDurationMinutes: z.number().min(15, "Performance duration must be at least 15 minutes"),
  setBreakdown: z.string().min(2, "Set breakdown is required (e.g. 2 x 45 min sets with 15 min break)"),
  genres: z.array(z.string()).min(1, "Specify at least one genre or artistic style"),
  soundSystemProvided: z.boolean().default(true),
  stageSizeRequirement: StageSizeEnum.default("Medium (up to 6x4m)"),
  techRiderSpecs: z.string().optional().default("Standard monitor mix and power drops required."),
  rehearsalRequired: z.boolean().default(false),
  instrumentationList: z.array(z.string()).optional().default([]),
});

export type PerformerDetails = z.infer<typeof PerformerDetailsSchema>;
