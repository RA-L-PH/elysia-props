import { RequirementDocument, CreateRequirementInput } from "@elysia/shared";

let inMemoryRequirements: Array<RequirementDocument & { _id: string; createdAt: string; updatedAt: string }> = [
  {
    _id: "req_seed_planner_001",
    title: "Lead Event Architect for Tech Summit 2026",
    description: "Seeking a senior event producer and architectural coordinator for a 3-day enterprise AI conference expecting 2,500 attendees with simultaneous tracks, keynote stages, and VIP investor dinners.",
    category: "Planner",
    status: "published",
    urgency: "high",
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
      payType: "fixed",
      isNegotiable: true,
    },
    contact: {
      name: "Elysia Global Events",
      email: "productions@elysiaglobal.io",
      phone: "+1 (415) 890-3321",
      company: "Elysia Horizon Media",
      preferredMethod: "email",
    },
    details: {
      eventType: "Conference",
      guestCount: 2500,
      venueType: "Hybrid / Multi-Space",
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
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    _id: "req_seed_performer_002",
    title: "Headline Synthwave / Neo-Electronic Live Act for Gala",
    description: "Looking for an energetic live electronic act or hybrid DJ/instrumentalist duo to headline our evening gala finale. Must provide a high-octane 90-minute live performance synchronized with LED visuals.",
    category: "Performer",
    status: "published",
    urgency: "urgent",
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
      payType: "fixed",
      isNegotiable: false,
    },
    contact: {
      name: "Marcus Vance",
      email: "marcus@vancetalent.com",
      phone: "+1 (212) 555-0199",
      company: "Vance Entertainment Group",
      preferredMethod: "phone",
    },
    details: {
      performanceCategory: "Live Band / Musician",
      performanceDurationMinutes: 90,
      setBreakdown: "1 x 90-minute uninterrupted headlining set with encore option",
      genres: ["Synthwave", "Cyber-Electro", "Neo-Disco", "Live Synthesizer"],
      soundSystemProvided: true,
      stageSizeRequirement: "Large (6x8m+)",
      techRiderSpecs: "Stereo XLR out from master mixer, 2x wireless IEM packs, 4x direct boxes, 3x isolated AC 120V drops on stage.",
      rehearsalRequired: true,
      instrumentationList: ["Analog Synthesizers", "Electric Guitar / FX", "Live Electronic Drums / SPD-SX"],
    },
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    _id: "req_seed_crew_003",
    title: "FOH Audio Engineer & System Tuning Specialist",
    description: "Seeking a seasoned Front-of-House (FOH) Sound Engineer experienced with d&b audiotechnik line arrays and Yamaha Rivage PM / CL5 digital consoles for an outdoor festival mainstage.",
    category: "Crew",
    status: "published",
    urgency: "standard",
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
      payType: "daily",
      isNegotiable: true,
    },
    contact: {
      name: "Elena Rostova",
      email: "elena@atxsoundworks.net",
      phone: "+1 (512) 440-9281",
      company: "ATX Soundworks & Rigging",
      preferredMethod: "whatsapp",
    },
    details: {
      roleSpecialization: "Sound Engineer / FOH Mixer",
      shiftDurationHours: 12,
      experienceLevel: "Senior Lead (5-8 yrs)",
      physicalDemands: "Standard (Light movement, desk operation)",
      equipmentBroughtByCrew: "Reference headphones, measurement microphone (SMAART), Dante virtual soundcard laptop, standard audio toolkit.",
      certificationsRequired: ["Dante Level 2/3 Certified", "Electrical Safety"],
      callTime: "09:30 AM",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const inMemoryStore = {
  getAll: (filters?: {
    category?: string;
    search?: string;
    urgency?: string;
    status?: string;
    city?: string;
    minBudget?: number;
    maxBudget?: number;
    payType?: string;
    postedBy?: string;
  }) => {
    let result = [...inMemoryRequirements];

    if (filters?.category && filters.category !== "All") {
      result = result.filter((r) => r.category.toLowerCase() === filters.category?.toLowerCase());
    }

    if (filters?.urgency && filters.urgency !== "All") {
      result = result.filter((r) => r.urgency.toLowerCase() === filters.urgency?.toLowerCase());
    }

    if (filters?.status && filters.status !== "All") {
      result = result.filter((r) => r.status.toLowerCase() === filters.status?.toLowerCase());
    }

    if (filters?.payType && filters.payType !== "All") {
      result = result.filter((r) => r.budget?.payType === filters.payType);
    }

    // Location: substring match on city, venue, or address (like the search box).
    if (filters?.city) {
      const q = filters.city.toLowerCase();
      result = result.filter(
        (r) =>
          r.location.city.toLowerCase().includes(q) ||
          r.location.venue.toLowerCase().includes(q) ||
          (r.location.address || "").toLowerCase().includes(q)
      );
    }

    // Budget overlap: post range intersects [minBudget, maxBudget].
    if (typeof filters?.minBudget === "number") {
      result = result.filter((r) => (r.budget?.max ?? 0) >= filters.minBudget!);
    }
    if (typeof filters?.maxBudget === "number") {
      result = result.filter((r) => (r.budget?.min ?? 0) <= filters.maxBudget!);
    }

    if (filters?.postedBy) {
      const uid = filters.postedBy;
      result = result.filter((r) => r.postedBy === uid);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.location.city.toLowerCase().includes(q) ||
          r.location.venue.toLowerCase().includes(q) ||
          r.tags?.some((t: string) => t.toLowerCase().includes(q))
      );
    }

    // Sort newest first
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getById: (id: string) => {
    return inMemoryRequirements.find((r) => r._id === id || r._id.toString() === id.toString()) || null;
  },

  create: (data: CreateRequirementInput) => {
    const newDoc = {
      ...data,
      _id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as RequirementDocument & { _id: string; createdAt: string; updatedAt: string };

    inMemoryRequirements.unshift(newDoc);
    return newDoc;
  },

  update: (id: string, updates: Partial<CreateRequirementInput>) => {
    const index = inMemoryRequirements.findIndex((r) => r._id === id);
    if (index === -1) return null;

    const existing = inMemoryRequirements[index];
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    } as RequirementDocument & { _id: string; createdAt: string; updatedAt: string };

    inMemoryRequirements[index] = updated;
    return updated;
  },

  delete: (id: string) => {
    const index = inMemoryRequirements.findIndex((r) => r._id === id);
    if (index === -1) return false;
    inMemoryRequirements.splice(index, 1);
    return true;
  },

  getStats: () => {
    const total = inMemoryRequirements.length;
    const planner = inMemoryRequirements.filter((r) => r.category === "Planner").length;
    const performer = inMemoryRequirements.filter((r) => r.category === "Performer").length;
    const crew = inMemoryRequirements.filter((r) => r.category === "Crew").length;
    const urgentCount = inMemoryRequirements.filter((r) => r.urgency === "urgent").length;
    const totalEstimatedBudget = inMemoryRequirements.reduce((sum, r) => sum + (r.budget?.max || 0), 0);

    return {
      total,
      byCategory: { planner, performer, crew },
      totalEstimatedBudget,
      urgentCount,
    };
  },
};
