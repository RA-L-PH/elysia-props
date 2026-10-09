import mongoose, { Schema } from "mongoose";
import { RequirementModel, IBaseRequirementDocument } from "./Requirement.model.js";
import { PerformerDetails } from "@elysia/shared";

export interface IPerformerRequirementDocument extends IBaseRequirementDocument {
  category: "Performer";
  details: PerformerDetails;
}

const PerformerDetailsSubSchema = new Schema(
  {
    performanceCategory: {
      type: String,
      required: true,
      enum: [
        "Live Band / Musician",
        "DJ / Producer",
        "Solo Vocalist / Instrumentalist",
        "Magician / Illusionist",
        "Dancer / Choreography Troupe",
        "Stand-up Comedian",
        "Circus / Acrobat / Fire Artist",
        "MC / Event Host",
        "Other",
      ],
      default: "Live Band / Musician",
    },
    performanceDurationMinutes: { type: Number, required: true, min: 15 },
    setBreakdown: { type: String, required: true, trim: true },
    genres: [{ type: String, required: true, trim: true }],
    soundSystemProvided: { type: Boolean, default: true },
    stageSizeRequirement: {
      type: String,
      enum: [
        "Small (up to 3x3m)",
        "Medium (up to 6x4m)",
        "Large (6x8m+)",
        "Roaming / No Stage Needed",
      ],
      default: "Medium (up to 6x4m)",
    },
    techRiderSpecs: { type: String, default: "" },
    rehearsalRequired: { type: Boolean, default: false },
    instrumentationList: [{ type: String }],
  },
  { _id: false }
);

export const PerformerRequirementModel =
  (RequirementModel.discriminators && RequirementModel.discriminators["Performer"]) ||
  RequirementModel.discriminator<IPerformerRequirementDocument>(
    "Performer",
    new Schema({ details: { type: PerformerDetailsSubSchema, required: true } })
  );
