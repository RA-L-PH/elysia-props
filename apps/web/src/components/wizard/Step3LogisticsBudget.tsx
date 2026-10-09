"use client";

import { Calendar, DollarSign, MapPin, ArrowLeft, ArrowRight } from "lucide-react";
import { useWizardStore } from "@/store/wizardStore";
import { UrgencyLevelEnum, PayTypeEnum } from "@elysia/shared";

export function Step3LogisticsBudget() {
  const { formData, updateFormData, prevStep, nextStep } = useWizardStore();

  return (
    <div className="space-y-6 text-black">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b-2 border-black">
        <div>
          <span className="text-[10px] sm:text-xs font-mono font-black uppercase tracking-wider bg-[#FFDE59] px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_#000] inline-block">
            Step 3 of 4 • Temporal & Financial Scope
          </span>
          <h2 className="text-xl sm:text-2xl font-black mt-1">
            Timeline, Location &amp; Compensation
          </h2>
        </div>
        <div className="shrink-0 px-3 py-1 text-xs font-black bg-[#7ED957] border-2 border-black shadow-[2px_2px_0px_#000] rounded-xl flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-black" />
          <span>Production Logistics</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dates Card */}
        <div className="space-y-4 p-5 rounded-3xl bg-white border-[3px] border-black shadow-[5px_5px_0px_#000]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FFDE59] border-2 border-black flex items-center justify-center">
              <Calendar className="w-4 h-4 text-black" />
            </div>
            <h3 className="text-base font-black">Production Dates</h3>
          </div>

          <div>
            <label className="block text-xs font-black mb-1.5 uppercase">
              Event / Start Date <span className="text-[#FF5757]">*</span>
            </label>
            <input
              type="date"
              value={formData.dates.startDate}
              onChange={(e) =>
                updateFormData({
                  dates: { ...formData.dates, startDate: e.target.value },
                })
              }
              className="w-full px-3.5 py-2.5 text-xs bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-black mb-1.5 uppercase">
              End Date (Optional)
            </label>
            <input
              type="date"
              value={formData.dates.endDate}
              onChange={(e) =>
                updateFormData({
                  dates: { ...formData.dates, endDate: e.target.value },
                })
              }
              className="w-full px-3.5 py-2.5 text-xs bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-black mb-1.5 uppercase">
              Application Deadline <span className="text-[#FF5757]">*</span>
            </label>
            <input
              type="date"
              value={formData.dates.applicationDeadline}
              onChange={(e) =>
                updateFormData({
                  dates: { ...formData.dates, applicationDeadline: e.target.value },
                })
              }
              className="w-full px-3.5 py-2.5 text-xs bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-black mb-1.5 uppercase">
              Daily Time Window
            </label>
            <input
              type="text"
              value={formData.dates.timeWindow}
              onChange={(e) =>
                updateFormData({
                  dates: { ...formData.dates, timeWindow: e.target.value },
                })
              }
              placeholder="e.g. 08:00 AM - 06:00 PM"
              className="w-full px-3.5 py-2.5 text-xs bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:outline-none"
            />
          </div>
        </div>

        {/* Location Card */}
        <div className="space-y-4 p-5 rounded-3xl bg-white border-[3px] border-black shadow-[5px_5px_0px_#000]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#00F0FF] border-2 border-black flex items-center justify-center">
              <MapPin className="w-4 h-4 text-black" />
            </div>
            <h3 className="text-base font-black">Location & Venue</h3>
          </div>

          <div>
            <label className="block text-xs font-black mb-1.5 uppercase">
              City <span className="text-[#FF5757]">*</span>
            </label>
            <input
              type="text"
              value={formData.location.city}
              onChange={(e) =>
                updateFormData({
                  location: { ...formData.location, city: e.target.value },
                })
              }
              placeholder="e.g. San Francisco, CA"
              className="w-full px-3.5 py-2.5 text-xs bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-black mb-1.5 uppercase">
              Venue / Area <span className="text-[#FF5757]">*</span>
            </label>
            <input
              type="text"
              value={formData.location.venue}
              onChange={(e) =>
                updateFormData({
                  location: { ...formData.location, venue: e.target.value },
                })
              }
              placeholder="e.g. Grand Palladium Ballroom / Pier 48"
              className="w-full px-3.5 py-2.5 text-xs bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-black mb-1.5 uppercase">
              Street Address
            </label>
            <input
              type="text"
              value={formData.location.address}
              onChange={(e) =>
                updateFormData({
                  location: { ...formData.location, address: e.target.value },
                })
              }
              placeholder="e.g. 747 Howard St"
              className="w-full px-3.5 py-2.5 text-xs bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#E0F7FA] border-[2px] border-black shadow-[2px_2px_0px_#000]">
            <input
              type="checkbox"
              id="isRemote"
              checked={formData.location.isRemote}
              onChange={(e) =>
                updateFormData({
                  location: { ...formData.location, isRemote: e.target.checked },
                })
              }
              className="w-5 h-5 rounded border-2 border-black accent-black cursor-pointer"
            />
            <label htmlFor="isRemote" className="text-xs font-black cursor-pointer">
              Remote / Virtual production (no physical venue)
            </label>
          </div>
        </div>

        {/* Budget & Urgency Card — spans both columns under the row above */}
        <div className="p-5 rounded-3xl bg-[#FFF9E6] border-[3px] border-black shadow-[5px_5px_0px_#000] space-y-4 md:col-span-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#7ED957] border-2 border-black flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-black" />
          </div>
          <h3 className="text-base font-black">Compensation & Urgency</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black mb-1.5 uppercase">
              Minimum Budget ($) <span className="text-[#FF5757]">*</span>
            </label>
            <input
              type="number"
              min={0}
              value={formData.budget.min || ""}
              onChange={(e) =>
                updateFormData({
                  budget: {
                    ...formData.budget,
                    min: Math.max(0, parseInt(e.target.value) || 0),
                  },
                })
              }
              placeholder="e.g. 2500"
              className="w-full px-3.5 py-2.5 text-xs bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-black mb-1.5 uppercase">
              Maximum Budget ($) <span className="text-[#FF5757]">*</span>
            </label>
            <input
              type="number"
              min={0}
              value={formData.budget.max || ""}
              onChange={(e) =>
                updateFormData({
                  budget: {
                    ...formData.budget,
                    max: Math.max(0, parseInt(e.target.value) || 0),
                  },
                })
              }
              placeholder="e.g. 6000"
              className="w-full px-3.5 py-2.5 text-xs bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-black mb-1.5 uppercase">
              Currency
            </label>
            <select
              value={formData.budget.currency}
              onChange={(e) =>
                updateFormData({
                  budget: { ...formData.budget, currency: e.target.value },
                })
              }
              className="w-full px-3.5 py-2.5 text-xs bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:outline-none"
            >
              {["USD", "EUR", "GBP", "AED", "CAD", "AUD"].map((cur) => (
                <option key={cur} value={cur}>
                  {cur}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black mb-1.5 uppercase">
              Pay Type
            </label>
            <select
              value={formData.budget.payType}
              onChange={(e) =>
                updateFormData({
                  budget: {
                    ...formData.budget,
                    payType: e.target.value as (typeof PayTypeEnum)["_type"],
                  },
                })
              }
              className="w-full px-3.5 py-2.5 text-xs bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:outline-none"
            >
              {PayTypeEnum.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black mb-1.5 uppercase">
              Urgency Level
            </label>
            <select
              value={formData.urgency}
              onChange={(e) =>
                updateFormData({
                  urgency: e.target.value as (typeof UrgencyLevelEnum)["_type"],
                })
              }
              className="w-full px-3.5 py-2.5 text-xs bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:outline-none"
            >
              {UrgencyLevelEnum.options.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border-[2px] border-black shadow-[2px_2px_0px_#000]">
          <input
            type="checkbox"
            id="isNegotiable"
            checked={formData.budget.isNegotiable}
            onChange={(e) =>
              updateFormData({
                budget: { ...formData.budget, isNegotiable: e.target.checked },
              })
            }
            className="w-5 h-5 rounded border-2 border-black accent-black cursor-pointer"
          />
          <label htmlFor="isNegotiable" className="text-xs font-black cursor-pointer">
            Budget is open to counter-offers based on specialized credentials
          </label>
        </div>
      </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 sm:justify-between p-4">
        <button
          type="button"
          onClick={prevStep}
          className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white hover:bg-neutral-100 text-black font-black text-xs uppercase border-[3px] border-black shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] flex items-center justify-center gap-2 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Specs</span>
        </button>

        <button
          type="button"
          onClick={nextStep}
          className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#FF5757] hover:bg-[#ff3b3b] text-white font-black text-xs uppercase tracking-wider border-[3px] border-black shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] flex items-center justify-center gap-2 transition-all"
        >
          <span>Continue to Final Review</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
