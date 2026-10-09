import mongoose from "mongoose";
import dotenv from "dotenv";
import { RequirementModel } from "../models/Requirement.model.js";
import { PlannerRequirementModel } from "../models/PlannerRequirement.model.js";
import { PerformerRequirementModel } from "../models/PerformerRequirement.model.js";
import { CrewRequirementModel } from "../models/CrewRequirement.model.js";

dotenv.config();

const sampleRequirements = [
  {
    title: "Lead Event Architect for Tech Summit 2026",
    description: "Seeking a senior event producer and architectural coordinator for a 3-day enterprise AI conference expecting 2,500 attendees with simultaneous tracks, keynote stages, and VIP investor dinners.",
    category: "Planner" as const,
    status: "published" as const,
    urgency: "high" as const,
    tags: ["Tech Summit", "Enterprise", "VIP Hospitality", "Full Production"],
    location: {
      city: "San Francisco, CA",
      venue: "Moscone Center West & Metreon Rooftop",
      address: "747 Howard St, San Francisco, CA 94103",
      isRemote: false,
    },
    dates: {
      startDate: "2026-11-12",
      endDate: "2026-11-15",
      applicationDeadline: "2026-10-25",
      timeWindow: "07:00 AM - 10:00 PM Daily",
    },
    budget: {
      min: 18000,
      max: 28000,
      currency: "USD",
      payType: "fixed" as const,
      isNegotiable: true,
    },
    contact: {
      name: "Elysia Global Events",
      email: "productions@elysiaglobal.io",
      phone: "+1 (415) 890-3321",
      company: "Elysia Horizon Media",
      preferredMethod: "email" as const,
    },
    details: {
      eventType: "Conference" as const,
      guestCount: 2500,
      venueType: "Hybrid / Multi-Space" as const,
      cateringNeeded: true,
      themeOrVibe: "Futuristic Cyber Minimalist & Ultra-Clean Executive Luxe",
      plannerScope: [
        "Full Planning & End-to-End Execution",
        "Vendor Sourcing & Contract Negotiation",
        "Visual Decor, Floral & Staging Design",
        "Guest Experience & Hospitality",
      ],
      estimatedOverallBudget: 450000,
    },
  },
  {
    title: "Headline Synthwave / Neo-Electronic Live Act for Gala",
    description: "Looking for an energetic live electronic act or hybrid DJ/instrumentalist duo to headline our evening gala finale. Must provide a high-octane 90-minute live performance synchronized with LED visuals.",
    category: "Performer" as const,
    status: "published" as const,
    urgency: "urgent" as const,
    tags: ["Live Electronic", "Synthwave", "Headline Act", "High Energy"],
    location: {
      city: "New York, NY",
      venue: "The Glasshouse Chelsea",
      address: "660 12th Ave, New York, NY 10019",
      isRemote: false,
    },
    dates: {
      startDate: "2026-10-30",
      endDate: "2026-10-30",
      applicationDeadline: "2026-10-20",
      timeWindow: "08:30 PM - 11:30 PM",
    },
    budget: {
      min: 6500,
      max: 11000,
      currency: "USD",
      payType: "fixed" as const,
      isNegotiable: false,
    },
    contact: {
      name: "Marcus Vance",
      email: "marcus@vancetalent.com",
      phone: "+1 (212) 555-0199",
      company: "Vance Entertainment Group",
      preferredMethod: "phone" as const,
    },
    details: {
      performanceCategory: "Live Band / Musician" as const,
      performanceDurationMinutes: 90,
      setBreakdown: "1 x 90-minute uninterrupted headlining set with encore option",
      genres: ["Synthwave", "Cyber-Electro", "Neo-Disco", "Live Synthesizer"],
      soundSystemProvided: true,
      stageSizeRequirement: "Large (6x8m+)" as const,
      techRiderSpecs: "Stereo XLR out from master mixer, 2x wireless IEM packs, 4x direct boxes, 3x isolated AC 120V drops on stage.",
      rehearsalRequired: true,
      instrumentationList: ["Analog Synthesizers", "Electric Guitar / FX", "Live Electronic Drums / SPD-SX"],
    },
  },
  {
    title: "FOH Audio Engineer & System Tuning Specialist",
    description: "Seeking a seasoned Front-of-House (FOH) Sound Engineer experienced with d&b audiotechnik line arrays and Yamaha Rivage PM / CL5 digital consoles for an outdoor festival mainstage.",
    category: "Crew" as const,
    status: "published" as const,
    urgency: "standard" as const,
    tags: ["FOH Engineer", "Yamaha CL5", "d&b Array", "Live Concert"],
    location: {
      city: "Austin, TX",
      venue: "Zilker Park Mainstage Pavilion",
      address: "2100 Barton Springs Rd, Austin, TX 78704",
      isRemote: false,
    },
    dates: {
      startDate: "2026-11-05",
      endDate: "2026-11-07",
      applicationDeadline: "2026-10-28",
      timeWindow: "10:00 AM - 11:30 PM",
    },
    budget: {
      min: 750,
      max: 1200,
      currency: "USD",
      payType: "daily" as const,
      isNegotiable: true,
    },
    contact: {
      name: "Elena Rostova",
      email: "elena@atxsoundworks.net",
      phone: "+1 (512) 440-9281",
      company: "ATX Soundworks & Rigging",
      preferredMethod: "whatsapp" as const,
    },
    details: {
      roleSpecialization: "Sound Engineer / FOH Mixer" as const,
      shiftDurationHours: 12,
      experienceLevel: "Senior Lead (5-8 yrs)" as const,
      physicalDemands: "Standard (Light movement, desk operation)" as const,
      equipmentBroughtByCrew: "Reference headphones, measurement microphone (SMAART), Dante virtual soundcard laptop, standard audio toolkit.",
      certificationsRequired: ["Dante Level 2/3 Certified", "Electrical Safety"],
      callTime: "09:30 AM",
    },
  },
];

async function seed() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/elysia-requirements";

  try {
    console.log(`[Seed] Connecting to ${uri.replace(/\/\/.*@/, "//***@")}...`);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });

    console.log("[Seed] Clearing existing requirements...");
    await RequirementModel.deleteMany({});

    console.log("[Seed] Inserting polymorphic sample data...");
    for (const item of sampleRequirements) {
      if (item.category === "Planner") {
        const doc = new PlannerRequirementModel(item);
        await doc.save();
      } else if (item.category === "Performer") {
        const doc = new PerformerRequirementModel(item);
        await doc.save();
      } else if (item.category === "Crew") {
        const doc = new CrewRequirementModel(item);
        await doc.save();
      }
    }

    console.log(`[Seed] Successfully seeded ${sampleRequirements.length} requirements!`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.warn(`[Seed] MongoDB not available for seeding: ${(error as Error).message}`);
    console.log("[Seed] (In-memory store is already initialized with sample records automatically)");
    process.exit(0);
  }
}

seed();
