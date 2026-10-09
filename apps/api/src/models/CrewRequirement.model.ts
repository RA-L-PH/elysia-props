import mongoose, { Schema } from "mongoose";
import { RequirementModel, IBaseRequirementDocument } from "./Requirement.model.js";
import { CrewDetails } from "@elysia/shared";

export interface ICrewRequirementDocument extends IBaseRequirementDocument {
  category: "Crew";
  details: CrewDetails;
}

const CrewDetailsSubSchema = new Schema(
  {
    roleSpecialization: {
      type: String,
      required: true,
      enum: [
        "Sound Engineer / FOH Mixer",
        "Lighting Designer / Tech",
        "Stage Manager / Deck Lead",
        "Rigging & Truss Technician",
        "Camera Operator / Broadcast Video",
        "LED Wall & Visual Operator",
        "Backline / Instrument Technician",
        "Production Assistant / Runner",
        "Safety / Pyrotechnics Specialist",
      ],
      default: "Sound Engineer / FOH Mixer",
    },
    shiftDurationHours: { type: Number, required: true, min: 1, max: 24 },
    experienceLevel: {
      type: String,
      enum: [
        "Junior / Assistant (1-2 yrs)",
        "Mid-Level Specialist (3-5 yrs)",
        "Senior Lead (5-8 yrs)",
        "Technical Director / Master (8+ yrs)",
      ],
      default: "Mid-Level Specialist (3-5 yrs)",
    },
    physicalDemands: {
      type: String,
      enum: [
        "Standard (Light movement, desk operation)",
        "Moderate (Lifting up to 15kg, standing long hours)",
        "Heavy Lifting (25kg+ flight cases & trussing)",
        "Working at Heights / Harness Required",
      ],
      default: "Moderate (Lifting up to 15kg, standing long hours)",
    },
    equipmentBroughtByCrew: { type: String, default: "" },
    certificationsRequired: [{ type: String }],
    callTime: { type: String, default: "08:00 AM" },
  },
  { _id: false }
);

export const CrewRequirementModel =
  (RequirementModel.discriminators && RequirementModel.discriminators["Crew"]) ||
  RequirementModel.discriminator<ICrewRequirementDocument>(
    "Crew",
    new Schema({ details: { type: CrewDetailsSubSchema, required: true } })
  );
