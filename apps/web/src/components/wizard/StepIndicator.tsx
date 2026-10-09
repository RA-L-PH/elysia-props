"use client";

import { Check, Sparkles, Sliders, CalendarClock, Send } from "lucide-react";
import { useWizardStore } from "@/store/wizardStore";

const steps = [
  { id: 1, title: "Category", subtitle: "Select Persona", icon: Sparkles },
  { id: 2, title: "Specifications", subtitle: "Role Details", icon: Sliders },
  { id: 3, title: "Logistics", subtitle: "Dates & Budget", icon: CalendarClock },
  { id: 4, title: "Review", subtitle: "Contact & Submit", icon: Send },
];

export function StepIndicator() {
  const { currentStep, setStep, category } = useWizardStore();

  return (
    <div className="w-full py-4">
      {/* Step items in Neubrutalism */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative">
        {steps.map((step) => {
          const Icon = step.icon;
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;

          return (
            <button
              key={step.id}
              onClick={() => {
                if (step.id <= currentStep) {
                  setStep(step.id);
                }
              }}
              disabled={step.id > currentStep}
              className={`text-left p-3.5 rounded-2xl border-[3px] border-black transition-all flex flex-col justify-between ${
                isActive
                  ? "bg-[#FFDE59] shadow-[4px_4px_0px_#000] translate-x-[-1px] translate-y-[-1px]"
                  : isCompleted
                  ? "bg-[#7ED957] shadow-[3px_3px_0px_#000] cursor-pointer hover:bg-[#6ec947]"
                  : "bg-white shadow-[2px_2px_0px_#000] opacity-60 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-8 h-8 rounded-xl border-2 border-black flex items-center justify-center text-xs font-black ${
                    isCompleted
                      ? "bg-black text-white"
                      : isActive
                      ? "bg-white text-black shadow-[2px_2px_0px_#000]"
                      : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : step.id}
                </div>

                <Icon className="w-5 h-5 text-black" />
              </div>

              <div>
                <div className="text-xs font-black text-black">
                  {step.id === 2 ? `${category} Specs` : step.title}
                </div>
                <div className="text-[11px] font-bold text-neutral-700 truncate">{step.subtitle}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Progress Bar with Neubrutalist thick border */}
      <div className="w-full bg-white h-3.5 rounded-full mt-4 border-2 border-black overflow-hidden shadow-[2px_2px_0px_#000]">
        <div
          className="bg-[#FF5757] h-full transition-all duration-300 ease-out border-r-2 border-black"
          style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
        />
      </div>
    </div>
  );
}
