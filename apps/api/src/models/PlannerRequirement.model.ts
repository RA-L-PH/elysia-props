import mongoose, { Schema } from "mongoose";
import { RequirementModel, IBaseRequirementDocument } from "./Requirement.model.js";
import { PlannerDetails } from "@elysia/shared";

export interface IPlannerRequirementDocument extends IBaseRequirementDocument {
  category: "Planner";
  details: PlannerDetails;
}

const PlannerDetailsSubSchema = new Schema(
  {
    eventType: {
      type: String,
      required: true,
      enum: [
        "Wedding",
        "Corporate",
        "Festival",
        "Private Party",
        "Conference",
        "Exhibition",
        "Charity Gala",
        "Other",
      ],
      default: "Corporate",
    },
    guestCount: { type: Number, required: true, min: 1 },
    venueType: {
      type: String,
      required: true,
      enum: [
        "Indoor Ballroom / Hall",
        "Outdoor Open Air",
        "Rooftop / Skyline",
        "Beach / Waterfront",
        "Hybrid / Multi-Space",
        "Virtual / Studio",
      ],
      default: "Indoor Ballroom / Hall",
    },
    cateringNeeded: { type: Boolean, default: false },
    themeOrVibe: { type: String, required: true, trim: true },
    plannerScope: [{ type: String, required: true }],
    estimatedOverallBudget: { type: Number, default: 0 },
  },
  { _id: false }
);

export const PlannerRequirementModel =
  (RequirementModel.discriminators && RequirementModel.discriminators["Planner"]) ||
  RequirementModel.discriminator<IPlannerRequirementDocument>(
    "Planner",
    new Schema({ details: { type: PlannerDetailsSubSchema, required: true } })
  );
