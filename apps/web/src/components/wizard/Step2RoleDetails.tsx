"use client";

import { useState } from "react";
import { Sparkles, Music, Wrench, ArrowLeft, ArrowRight, Tag, Plus, X, AlertCircle } from "lucide-react";
import { useWizardStore } from "@/store/wizardStore";
import {
  PlannerEventTypeEnum,
  VenueTypeEnum,
  PlannerScopeEnum,
  PerformerCategoryEnum,
  StageSizeEnum,
  CrewRoleSpecializationEnum,
  ExperienceLevelEnum,
  PhysicalDemandsEnum,
} from "@elysia/shared";

export function Step2RoleDetails() {
  const {
    category,
    formData,
    updateFormData,
    updatePlannerDetails,
    updatePerformerDetails,
    updateCrewDetails,
    prevStep,
    nextStep,
  } = useWizardStore();

  const [tagInput, setTagInput] = useState("");
  const [genreInput, setGenreInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      updateFormData({ tags: [...formData.tags, tagInput.trim()] });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    updateFormData({ tags: formData.tags.filter((t) => t !== tag) });
  };

  const handleAddGenre = () => {
    if (genreInput.trim() && !formData.performerDetails.genres.includes(genreInput.trim())) {
      updatePerformerDetails({
        genres: [...formData.performerDetails.genres, genreInput.trim()],
      });
      setGenreInput("");
    }
  };

  const handleRemoveGenre = (genre: string) => {
    updatePerformerDetails({
      genres: formData.performerDetails.genres.filter((g) => g !== genre),
    });
  };

  const togglePlannerScope = (scope: string) => {
    const current = formData.plannerDetails.plannerScope || [];
    if (current.includes(scope)) {
      if (current.length > 1) {
        updatePlannerDetails({ plannerScope: current.filter((s) => s !== scope) });
      }
    } else {
      updatePlannerDetails({ plannerScope: [...current, scope] });
    }
  };

  const toggleCrewCert = (cert: string) => {
    const current = formData.crewDetails.certificationsRequired || [];
    if (current.includes(cert)) {
      updateCrewDetails({ certificationsRequired: current.filter((c) => c !== cert) });
    } else {
      updateCrewDetails({ certificationsRequired: [...current, cert] });
    }
  };

  const handleNext = () => {
    if (!formData.title || formData.title.length < 5) {
      setErrorMsg("Please enter a title of at least 5 characters");
      return;
    }
    if (!formData.description || formData.description.length < 20) {
      setErrorMsg("Please provide a description of at least 20 characters");
      return;
    }
    setErrorMsg("");
    nextStep();
  };

  return (
    <div className="space-y-6 text-black">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b-2 border-black">
        <div>
          <span className="text-[10px] sm:text-xs font-mono font-black uppercase tracking-wider bg-[#FFDE59] px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_#000] inline-block">
            Step 2 of 4 • Discriminator Payload
          </span>
          <h2 className="text-xl sm:text-2xl font-black mt-1">
            {category} Specifications &amp; Scope
          </h2>
        </div>
        <div className="shrink-0 px-3 py-1 text-xs font-black bg-[#00F0FF] border-2 border-black shadow-[2px_2px_0px_#000] rounded-xl flex items-center gap-1.5">
          {category === "Planner" && <Sparkles className="w-4 h-4 text-black" />}
          {category === "Performer" && <Music className="w-4 h-4 text-black" />}
          {category === "Crew" && <Wrench className="w-4 h-4 text-black" />}
          <span>{category} Schema</span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-[#FF5757] border-[2.5px] border-black text-white text-xs font-black flex items-center gap-2 shadow-[3px_3px_0px_#000]">
          <AlertCircle className="w-5 h-5 shrink-0 text-white" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Wide desktop: the core overview sits BESIDE the role schema card */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 xl:items-start">
      {/* Common Core Fields */}
      <div className="space-y-4 p-5 rounded-3xl bg-white border-[3px] border-black shadow-[5px_5px_0px_#000] xl:col-span-2">
        <h3 className="text-sm font-black flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#FF5757] border border-black" />
          Core Requirement Overview
        </h3>

        <div>
          <label className="block text-xs font-black mb-1.5 uppercase">
            Requirement Title <span className="text-[#FF5757]">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => updateFormData({ title: e.target.value })}
            placeholder={
              category === "Planner"
                ? "e.g. Lead Wedding Architect & On-Site Producer"
                : category === "Performer"
                ? "e.g. Headline Live Electro Synth Band for Gala"
                : "e.g. FOH Audio Engineer & System Tuner"
            }
            className="w-full px-4 py-2.5 text-sm bg-white border-[3px] border-black shadow-[3px_3px_0px_#000] rounded-xl font-bold focus:bg-[#FFF9E6] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-black mb-1.5 uppercase">
            Detailed Summary & Scope <span className="text-[#FF5757]">*</span>
          </label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => updateFormData({ description: e.target.value })}
            placeholder="Describe the production vision, key deliverables, audience profile, and essential expectations..."
            className="w-full px-4 py-2.5 text-sm bg-white border-[3px] border-black shadow-[3px_3px_0px_#000] rounded-xl font-medium focus:bg-[#FFF9E6] focus:outline-none resize-none"
          />
          <span className="text-[11px] font-bold text-neutral-600">
            {formData.description.length} / 20 characters minimum
          </span>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-black mb-1.5 uppercase">
            Requirement Tags & Keywords
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
              placeholder="Add keyword tag (e.g. VIP Hospitality, Yamaha CL5, Live Vocal)"
              className="flex-1 px-3.5 py-2 text-xs bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 text-xs font-black uppercase bg-[#7ED957] hover:bg-[#6ec947] border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl flex items-center gap-1 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {formData.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 text-xs font-black bg-[#FFDE59] border-2 border-black shadow-[2px_2px_0px_#000] rounded-lg flex items-center gap-1"
              >
                <span>#{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:scale-125 transition-transform"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Discriminator Form Sections */}
      {category === "Planner" && (
        <div className="space-y-5 p-5 rounded-3xl bg-[#FFF9E6] border-[3px] border-black shadow-[5px_5px_0px_#000] xl:col-span-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-black" />
            <h3 className="text-base font-black">Event Architecture & Logistics</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black mb-1.5 uppercase">
                Event Type
              </label>
              <select
                value={formData.plannerDetails.eventType}
                onChange={(e) =>
                  updatePlannerDetails({
                    eventType: e.target.value as (typeof PlannerEventTypeEnum)["_type"],
                  })
                }
                className="w-full px-3.5 py-2.5 text-xs bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:outline-none"
              >
                {PlannerEventTypeEnum.options.map((opt) => (
                  <option key={opt} value={opt} className="font-bold">
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black mb-1.5 uppercase">
                Expected Guest Count
              </label>
              <input
                type="number"
                min={1}
                value={formData.plannerDetails.guestCount || ""}
                onChange={(e) =>
                  updatePlannerDetails({ guestCount: Math.max(1, parseInt(e.target.value) || 1) })
                }
                className="w-full px-3.5 py-2.5 text-xs bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black mb-1.5 uppercase">
                Venue Environment
              </label>
              <select
                value={formData.plannerDetails.venueType}
                onChange={(e) =>
                  updatePlannerDetails({
                    venueType: e.target.value as (typeof VenueTypeEnum)["_type"],
                  })
                }
                className="w-full px-3.5 py-2.5 text-xs bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:outline-none"
              >
                {VenueTypeEnum.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black mb-1.5 uppercase">
                Total Production Budget ($)
              </label>
              <input
                type="number"
                min={0}
                value={formData.plannerDetails.estimatedOverallBudget || ""}
                onChange={(e) =>
                  updatePlannerDetails({
                    estimatedOverallBudget: Math.max(0, parseInt(e.target.value) || 0),
                  })
                }
                placeholder="e.g. 150000"
                className="w-full px-3.5 py-2.5 text-xs bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black mb-1.5 uppercase">
              Theme, Aesthetic & Atmospheric Vibe
            </label>
            <input
              type="text"
              value={formData.plannerDetails.themeOrVibe}
              onChange={(e) => updatePlannerDetails({ themeOrVibe: e.target.value })}
              placeholder="e.g. Modern Cyber-Minimalist, Mediterranean Twilight, High-Tech Gala"
              className="w-full px-3.5 py-2.5 text-xs bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000]">
            <input
              type="checkbox"
              id="cateringNeeded"
              checked={formData.plannerDetails.cateringNeeded}
              onChange={(e) => updatePlannerDetails({ cateringNeeded: e.target.checked })}
              className="w-5 h-5 rounded border-2 border-black accent-black cursor-pointer"
            />
            <label htmlFor="cateringNeeded" className="text-xs font-black cursor-pointer">
              Catering Coordination & Menu Tasting Management Required
            </label>
          </div>

          <div>
            <label className="block text-xs font-black mb-2 uppercase">
              Planner Scope of Responsibilities
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PlannerScopeEnum.options.map((scope) => {
                const isSelected = formData.plannerDetails.plannerScope?.includes(scope);
                return (
                  <button
                    key={scope}
                    type="button"
                    onClick={() => togglePlannerScope(scope)}
                    className={`p-3 rounded-2xl text-xs font-black text-left border-[2.5px] border-black transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-[#FF5757] text-white shadow-[3px_3px_0px_#000] translate-x-[-1px] translate-y-[-1px]"
                        : "bg-white text-black shadow-[2px_2px_0px_#000] hover:bg-neutral-50"
                    }`}
                  >
                    <span>{scope}</span>
                    <span>{isSelected ? "✓" : "+"}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {category === "Performer" && (
        <div className="space-y-5 p-5 rounded-3xl bg-[#FFE4E6] border-[3px] border-black shadow-[5px_5px_0px_#000] xl:col-span-3">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-black" />
            <h3 className="text-base font-black">Performance & Stage Rider Specifications</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black mb-1.5 uppercase">
                Performer Category
              </label>
              <select
                value={formData.performerDetails.performanceCategory}
                onChange={(e) =>
                  updatePerformerDetails({
                    performanceCategory: e.target.value as (typeof PerformerCategoryEnum)["_type"],
                  })
                }
                className="w-full px-3.5 py-2.5 text-xs bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:outline-none"
              >
                {PerformerCategoryEnum.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black mb-1.5 uppercase">
                Set Duration (Minutes)
              </label>
              <input
                type="number"
                min={15}
                value={formData.performerDetails.performanceDurationMinutes || ""}
                onChange={(e) =>
                  updatePerformerDetails({
                    performanceDurationMinutes: Math.max(15, parseInt(e.target.value) || 15),
                  })
                }
                className="w-full px-3.5 py-2.5 text-xs bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black mb-1.5 uppercase">
                Set Breakdown & Timing
              </label>
              <input
                type="text"
                value={formData.performerDetails.setBreakdown}
                onChange={(e) => updatePerformerDetails({ setBreakdown: e.target.value })}
                placeholder="e.g. 2 x 45 min sets with 15 min break"
                className="w-full px-3.5 py-2.5 text-xs bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-black mb-1.5 uppercase">
                Stage Dimensions Needed
              </label>
              <select
                value={formData.performerDetails.stageSizeRequirement}
                onChange={(e) =>
                  updatePerformerDetails({
                    stageSizeRequirement: e.target.value as (typeof StageSizeEnum)["_type"],
                  })
                }
                className="w-full px-3.5 py-2.5 text-xs bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:outline-none"
              >
                {StageSizeEnum.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Genres */}
          <div>
            <label className="block text-xs font-black mb-1.5 uppercase">
              Musical Genres & Stylistic Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={genreInput}
                onChange={(e) => setGenreInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddGenre())}
                placeholder="Add genre (e.g. Synthwave, Neo-Soul, Deep House)"
                className="flex-1 px-3.5 py-2 text-xs bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddGenre}
                className="px-4 py-2 text-xs font-black uppercase bg-[#00F0FF] border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl flex items-center gap-1 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {formData.performerDetails.genres.map((g) => (
                <span key={g} className="px-2.5 py-1 text-xs font-black bg-[#FF66C4] border-2 border-black shadow-[2px_2px_0px_#000] rounded-lg flex items-center gap-1">
                  <span>{g}</span>
                  <button type="button" onClick={() => handleRemoveGenre(g)}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black mb-1.5 uppercase">
              Technical Audio & Stage Rider Requirements
            </label>
            <textarea
              rows={2}
              value={formData.performerDetails.techRiderSpecs}
              onChange={(e) => updatePerformerDetails({ techRiderSpecs: e.target.value })}
              placeholder="Specify IEM channels, DI boxes, vocal mics, AC power drops..."
              className="w-full px-3.5 py-2.5 text-xs bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:outline-none resize-none"
            />
          </div>
        </div>
      )}

      {category === "Crew" && (
        <div className="space-y-5 p-5 rounded-3xl bg-[#E0F7FA] border-[3px] border-black shadow-[5px_5px_0px_#000] xl:col-span-3">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-black" />
            <h3 className="text-base font-black">Technical Specialization & Operations</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black mb-1.5 uppercase">
                Role Specialization
              </label>
              <select
                value={formData.crewDetails.roleSpecialization}
                onChange={(e) =>
                  updateCrewDetails({
                    roleSpecialization: e.target.value as (typeof CrewRoleSpecializationEnum)["_type"],
                  })
                }
                className="w-full px-3.5 py-2.5 text-xs bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:outline-none"
              >
                {CrewRoleSpecializationEnum.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black mb-1.5 uppercase">
                Shift Duration (Hours)
              </label>
              <input
                type="number"
                min={1}
                max={24}
                value={formData.crewDetails.shiftDurationHours || ""}
                onChange={(e) =>
                  updateCrewDetails({
                    shiftDurationHours: Math.min(24, Math.max(1, parseInt(e.target.value) || 1)),
                  })
                }
                className="w-full px-3.5 py-2.5 text-xs bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black mb-1.5 uppercase">
                Target Experience Level
              </label>
              <select
                value={formData.crewDetails.experienceLevel}
                onChange={(e) =>
                  updateCrewDetails({
                    experienceLevel: e.target.value as (typeof ExperienceLevelEnum)["_type"],
                  })
                }
                className="w-full px-3.5 py-2.5 text-xs bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:outline-none"
              >
                {ExperienceLevelEnum.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black mb-1.5 uppercase">
                Call Time
              </label>
              <input
                type="text"
                value={formData.crewDetails.callTime}
                onChange={(e) => updateCrewDetails({ callTime: e.target.value })}
                placeholder="e.g. 07:30 AM"
                className="w-full px-3.5 py-2.5 text-xs bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black mb-2 uppercase">
              Required Licenses & Certifications
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                "Dante Level 2/3 Certified",
                "GrandMA3 Certified Programmer",
                "Working at Heights / Harness",
                "Electrical Safety (OSHA)",
                "Forklift Certified",
              ].map((cert) => {
                const isSelected = formData.crewDetails.certificationsRequired?.includes(cert);
                return (
                  <button
                    key={cert}
                    type="button"
                    onClick={() => toggleCrewCert(cert)}
                    className={`px-3.5 py-1.5 text-xs font-black rounded-xl border-[2.5px] border-black transition-all ${
                      isSelected
                        ? "bg-[#00F0FF] shadow-[3px_3px_0px_#000] translate-x-[-1px] translate-y-[-1px]"
                        : "bg-white shadow-[2px_2px_0px_#000] hover:bg-neutral-50"
                    }`}
                  >
                    <span>{cert}</span>
                    <span>{isSelected ? " ✓" : " +"}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 sm:justify-between p-4">
        <button
          type="button"
          onClick={prevStep}
          className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white hover:bg-neutral-100 text-black font-black text-xs uppercase border-[3px] border-black shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] flex items-center justify-center gap-2 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Roles</span>
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#FF5757] hover:bg-[#ff3b3b] text-white font-black text-xs uppercase tracking-wider border-[3px] border-black shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] flex items-center justify-center gap-2 transition-all"
        >
          <span>Continue to Logistics</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
