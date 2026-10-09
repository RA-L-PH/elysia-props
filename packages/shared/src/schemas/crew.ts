import { z } from "zod";

export const CrewRoleSpecializationEnum = z.enum([
  "Sound Engineer / FOH Mixer",
  "Lighting Designer / Tech",
  "Stage Manager / Deck Lead",
  "Rigging & Truss Technician",
  "Camera Operator / Broadcast Video",
  "LED Wall & Visual Operator",
  "Backline / Instrument Technician",
  "Production Assistant / Runner",
  "Safety / Pyrotechnics Specialist"
]);

export const ExperienceLevelEnum = z.enum([
  "Junior / Assistant (1-2 yrs)",
  "Mid-Level Specialist (3-5 yrs)",
  "Senior Lead (5-8 yrs)",
  "Technical Director / Master (8+ yrs)"
]);

export const PhysicalDemandsEnum = z.enum([
  "Standard (Light movement, desk operation)",
  "Moderate (Lifting up to 15kg, standing long hours)",
  "Heavy Lifting (25kg+ flight cases & trussing)",
  "Working at Heights / Harness Required"
]);

export const CrewDetailsSchema = z.object({
  roleSpecialization: CrewRoleSpecializationEnum.default("Sound Engineer / FOH Mixer"),
  shiftDurationHours: z.number().min(1, "Shift must be at least 1 hour").max(24, "Shift cannot exceed 24 hours"),
  experienceLevel: ExperienceLevelEnum.default("Mid-Level Specialist (3-5 yrs)"),
  physicalDemands: PhysicalDemandsEnum.default("Moderate (Lifting up to 15kg, standing long hours)"),
  equipmentBroughtByCrew: z.string().optional().default("Standard tool kit, flashlight, multi-tool, and comms headset."),
  certificationsRequired: z.array(z.string()).optional().default([]),
  callTime: z.string().optional().default("08:00 AM"),
});

export type CrewDetails = z.infer<typeof CrewDetailsSchema>;
