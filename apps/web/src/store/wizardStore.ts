import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  RequirementCategory,
  CreateRequirementInput,
  RequirementDocument,
  PlannerDetails,
  PerformerDetails,
  CrewDetails,
} from "@elysia/shared";

export interface WizardStoreState {
  currentStep: number;
  category: RequirementCategory;
  formData: {
    title: string;
    description: string;
    status: "published" | "draft";
    urgency: "standard" | "high" | "urgent";
    tags: string[];
    location: {
      city: string;
      venue: string;
      address: string;
      isRemote: boolean;
    };
    dates: {
      startDate: string;
      endDate: string;
      applicationDeadline: string;
      timeWindow: string;
    };
    budget: {
      min: number;
      max: number;
      currency: string;
      payType: "fixed" | "hourly" | "daily" | "negotiable";
      isNegotiable: boolean;
    };
    contact: {
      name: string;
      email: string;
      phone: string;
      company: string;
      preferredMethod: "email" | "phone" | "whatsapp";
    };
    plannerDetails: PlannerDetails;
    performerDetails: PerformerDetails;
    crewDetails: CrewDetails;
  };
  hasUnsavedDraft: boolean;
  /** True while the after-creation (Post ID) success screen should stay up. */
  publishDone: boolean;
  isInspectorOpen: boolean;

  // Actions
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setCategory: (category: RequirementCategory) => void;
  updateFormData: (updates: Partial<WizardStoreState["formData"]>) => void;
  updatePlannerDetails: (updates: Partial<PlannerDetails>) => void;
  updatePerformerDetails: (updates: Partial<PerformerDetails>) => void;
  updateCrewDetails: (updates: Partial<CrewDetails>) => void;
  clearDraft: () => void;
  markDraftSaved: () => void;
  setPublishDone: (done: boolean) => void;
  toggleInspector: () => void;
  setInspectorOpen: (open: boolean) => void;
  loadSampleTemplate: (category: RequirementCategory) => void;
  /** Prefill the wizard from an existing post (edit mode: /post?edit=<id>). */
  hydrateForEdit: (doc: RequirementDocument) => void;
  getPayload: () => CreateRequirementInput;
}

const initialFormData = {
  title: "",
  description: "",
  status: "published" as const,
  urgency: "standard" as const,
  tags: [] as string[],
  location: {
    city: "San Francisco, CA",
    venue: "Moscone Convention Center",
    address: "747 Howard St",
    isRemote: false,
  },
  dates: {
    startDate: new Date(Date.now() + 86400000 * 14).toISOString().split("T")[0],
    endDate: new Date(Date.now() + 86400000 * 16).toISOString().split("T")[0],
    applicationDeadline: new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0],
    timeWindow: "08:00 AM - 06:00 PM",
  },
  budget: {
    min: 5000,
    max: 12000,
    currency: "USD",
    payType: "fixed" as const,
    isNegotiable: true,
  },
  contact: {
    name: "Alex Morgan",
    email: "alex.morgan@elysiaproductions.com",
    phone: "+1 (555) 392-8812",
    company: "Elysia Entertainment",
    preferredMethod: "email" as const,
  },
  plannerDetails: {
    eventType: "Corporate" as const,
    guestCount: 350,
    venueType: "Indoor Ballroom / Hall" as const,
    cateringNeeded: true,
    themeOrVibe: "Modern Technological Elegance & High-Impact Minimalist Staging",
    plannerScope: ["Full Planning & End-to-End Execution", "Vendor Sourcing & Contract Negotiation"],
    estimatedOverallBudget: 150000,
  },
  performerDetails: {
    performanceCategory: "Live Band / Musician" as const,
    performanceDurationMinutes: 75,
    setBreakdown: "2 x 35 min live performance sets with 15 min interlude",
    genres: ["Electronic / Indie Synth", "Modern Pop", "Ambient Beats"],
    soundSystemProvided: true,
    stageSizeRequirement: "Medium (up to 6x4m)" as const,
    techRiderSpecs: "Dual XLR stereo outs, 2 IEM channels, isolated 120V AC backline power.",
    rehearsalRequired: true,
    instrumentationList: ["Analog Synth", "Live Drums", "Vocal Processor"],
  },
  crewDetails: {
    roleSpecialization: "Sound Engineer / FOH Mixer" as const,
    shiftDurationHours: 10,
    experienceLevel: "Senior Lead (5-8 yrs)" as const,
    physicalDemands: "Standard (Light movement, desk operation)" as const,
    equipmentBroughtByCrew: "Reference monitors, Dante audio interface, professional cabling toolkit.",
    certificationsRequired: ["Dante Level 2 Certified", "Electrical Safety"],
    callTime: "08:00 AM",
  },
};

/** The sample contact block a fresh wizard starts with (guest default). */
export const DEFAULT_CONTACT = initialFormData.contact;

export const useWizardStore = create<WizardStoreState>()(
  persist(
    (set, get) => ({
      currentStep: 1,
      category: "Planner",
      formData: initialFormData,
      hasUnsavedDraft: false,
      publishDone: false,
      isInspectorOpen: false,

      setStep: (step) => set({ currentStep: Math.min(Math.max(step, 1), 4) }),
      nextStep: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, 4) })),
      prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 1) })),

      setCategory: (category) =>
        set((s) => ({
          category,
          hasUnsavedDraft: true,
          formData: {
            ...s.formData,
            title: s.formData.title || `${category} Requirement for Upcoming Showcase`,
          },
        })),

      updateFormData: (updates) =>
        set((s) => ({
          hasUnsavedDraft: true,
          formData: { ...s.formData, ...updates },
        })),

      updatePlannerDetails: (updates) =>
        set((s) => ({
          hasUnsavedDraft: true,
          formData: {
            ...s.formData,
            plannerDetails: { ...s.formData.plannerDetails, ...updates },
          },
        })),

      updatePerformerDetails: (updates) =>
        set((s) => ({
          hasUnsavedDraft: true,
          formData: {
            ...s.formData,
            performerDetails: { ...s.formData.performerDetails, ...updates },
          },
        })),

      updateCrewDetails: (updates) =>
        set((s) => ({
          hasUnsavedDraft: true,
          formData: {
            ...s.formData,
            crewDetails: { ...s.formData.crewDetails, ...updates },
          },
        })),

      clearDraft: () =>
        set({
          currentStep: 1,
          category: "Planner",
          formData: initialFormData,
          hasUnsavedDraft: false,
        }),

      markDraftSaved: () => set({ hasUnsavedDraft: false }),

      setPublishDone: (done) => set({ publishDone: done }),

      toggleInspector: () => set((s) => ({ isInspectorOpen: !s.isInspectorOpen })),
      setInspectorOpen: (open) => set({ isInspectorOpen: open }),

      loadSampleTemplate: (category) => {
        if (category === "Planner") {
          set({
            category: "Planner",
            formData: {
              ...initialFormData,
              title: "Senior Event Producer for Global Design Summit",
              description: "Seeking a master planner to manage our 3-day annual design summit with 800 international guests, 12 workshop tracks, and high-profile keynote dinners.",
              tags: ["Design Summit", "Full Production", "VIP Hospitality"],
              plannerDetails: {
                eventType: "Conference",
                guestCount: 800,
                venueType: "Indoor Ballroom / Hall",
                cateringNeeded: true,
                themeOrVibe: "Nordic Minimalist & High-Tech Interactive Exhibition",
                plannerScope: [
                  "Full Planning & End-to-End Execution",
                  "Vendor Sourcing & Contract Negotiation",
                  "Visual Decor, Floral & Staging Design",
                ],
                estimatedOverallBudget: 280000,
              },
            },
            hasUnsavedDraft: true,
          });
        } else if (category === "Performer") {
          set({
            category: "Performer",
            formData: {
              ...initialFormData,
              title: "Futuristic Synth-Pop Live Trio for Evening Showcase",
              description: "Seeking a dynamic 3-piece live electro synth act with female lead vocals and live synthesizers for our twilight closing ceremony.",
              tags: ["Synth Pop", "Live Vocalist", "Headline Act"],
              budget: {
                min: 6000,
                max: 9500,
                currency: "USD",
                payType: "fixed",
                isNegotiable: true,
              },
              performerDetails: {
                performanceCategory: "Live Band / Musician",
                performanceDurationMinutes: 75,
                setBreakdown: "2 x 35 minute sets with 10 min interlude",
                genres: ["Synthwave", "Indie Electro", "Dream Pop"],
                soundSystemProvided: true,
                stageSizeRequirement: "Medium (up to 6x4m)",
                techRiderSpecs: "Stereo XLR out, 3x wireless IEM packs, 2 vocal mics (Shure Beta 58A), AC power drops.",
                rehearsalRequired: true,
                instrumentationList: ["Analog Synth", "Vocals", "Electronic Drum Pad"],
              },
            },
            hasUnsavedDraft: true,
          });
        } else {
          set({
            category: "Crew",
            formData: {
              ...initialFormData,
              title: "GrandMA3 Lighting Programmer & Visual Tech",
              description: "Seeking an experienced lighting console programmer and visual sync technician for our arena stage production.",
              tags: ["GrandMA3", "Lighting Designer", "Arena Show"],
              budget: {
                min: 800,
                max: 1400,
                currency: "USD",
                payType: "daily",
                isNegotiable: true,
              },
              crewDetails: {
                roleSpecialization: "Lighting Designer / Tech",
                shiftDurationHours: 12,
                experienceLevel: "Senior Lead (5-8 yrs)",
                physicalDemands: "Moderate (Lifting up to 15kg, standing long hours)",
                equipmentBroughtByCrew: "Command wing onPC backup, show file programming toolkit.",
                certificationsRequired: ["GrandMA3 Certified Programmer", "Electrical Safety"],
                callTime: "08:30 AM",
              },
            },
            hasUnsavedDraft: true,
          });
        }
      },

      hydrateForEdit: (doc) => {
        const details = doc.details;
        set({
          category: doc.category,
          currentStep: 4, // land on Review & Submit; earlier steps stay reachable
          hasUnsavedDraft: false,
          formData: {
            ...initialFormData,
            title: doc.title,
            description: doc.description,
            status: doc.status === "draft" ? "draft" : "published",
            urgency: doc.urgency,
            tags: doc.tags ?? [],
            location: {
              city: doc.location.city,
              venue: doc.location.venue,
              address: doc.location.address ?? "",
              isRemote: doc.location.isRemote ?? false,
            },
            dates: {
              startDate: doc.dates.startDate,
              endDate: doc.dates.endDate ?? "",
              applicationDeadline: doc.dates.applicationDeadline,
              timeWindow: doc.dates.timeWindow ?? "",
            },
            budget: {
              min: doc.budget.min,
              max: doc.budget.max,
              currency: doc.budget.currency ?? "USD",
              payType: doc.budget.payType,
              isNegotiable: doc.budget.isNegotiable ?? false,
            },
            contact: {
              name: doc.contact.name,
              email: doc.contact.email,
              phone: doc.contact.phone,
              company: doc.contact.company ?? "",
              preferredMethod: doc.contact.preferredMethod,
            },
            plannerDetails:
              doc.category === "Planner"
                ? (details as PlannerDetails)
                : initialFormData.plannerDetails,
            performerDetails:
              doc.category === "Performer"
                ? (details as PerformerDetails)
                : initialFormData.performerDetails,
            crewDetails:
              doc.category === "Crew"
                ? (details as CrewDetails)
                : initialFormData.crewDetails,
          },
        });
      },

      getPayload: (): CreateRequirementInput => {
        const { category, formData } = get();
        const base = {
          title: formData.title || `${category} Requirement`,
          description: formData.description || "Detailed requirement specifications and scope of work.",
          status: formData.status,
          urgency: formData.urgency,
          tags: formData.tags.length > 0 ? formData.tags : [category, "Live Event"],
          location: formData.location,
          dates: formData.dates,
          budget: formData.budget,
          contact: formData.contact,
        };

        if (category === "Planner") {
          return {
            ...base,
            category: "Planner",
            details: formData.plannerDetails,
          };
        } else if (category === "Performer") {
          return {
            ...base,
            category: "Performer",
            details: formData.performerDetails,
          };
        } else {
          return {
            ...base,
            category: "Crew",
            details: formData.crewDetails,
          };
        }
      },
    }),
    {
      name: "elysia_wizard_draft_storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentStep: state.currentStep,
        category: state.category,
        formData: state.formData,
        hasUnsavedDraft: state.hasUnsavedDraft,
      }),
    }
  )
);

/**
 * Prefill the contact stage from the signed-in account (name, email, phone).
 * Only runs while the contact block still holds untouched defaults/empties —
 * anything the visitor already typed is never overwritten. Called when the
 * wizard mounts with a session, and again after the draft resets to "fresh"
 * so the next post starts with their details ready.
 */
export const applyUserContact = (user: {
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
}): void => {
  const { formData, updateFormData, hasUnsavedDraft, markDraftSaved } = useWizardStore.getState();
  const contact = formData.contact;
  const untouched = !contact.email || contact.email === DEFAULT_CONTACT.email;
  if (!untouched) return;

  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  updateFormData({
    contact: {
      ...contact,
      name: fullName || contact.name,
      email: user.email,
      phone: user.phone || contact.phone,
    },
  });
  // Prefilling isn't user input — keep the draft's own "unsaved" flag as-is,
  // so a freshly wiped wizard stays fresh instead of re-flagging itself.
  if (!hasUnsavedDraft) markDraftSaved();
};
