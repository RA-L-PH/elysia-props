"use client";

import { useEffect, useState } from "react";
import { History, Sparkles, X, RotateCcw, ArrowRight } from "lucide-react";
import { useWizardStore } from "@/store/wizardStore";

export function DraftRecoveryModal() {
  const { hasUnsavedDraft, clearDraft, category, formData } = useWizardStore();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Only prompt if there is actual progress typed in
    if (hasUnsavedDraft && (formData.title || formData.description)) {
      setIsOpen(true);
    }
  }, [hasUnsavedDraft]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[#FFFDF8] border-[3.5px] border-black shadow-[8px_8px_0px_#000] rounded-3xl p-6 space-y-5 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-2xl bg-[#FFDE59] border-[3px] border-black shadow-[2px_2px_0px_#000] flex items-center justify-center">
            <History className="w-6 h-6 text-black" />
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-xl bg-white border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center hover:bg-neutral-100 transition-all"
          >
            <X className="w-4 h-4 text-black" />
          </button>
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] font-mono font-black uppercase tracking-wider bg-[#00F0FF] px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_#000]">
            Draft Recovery Safeguard
          </span>
          <h3 className="text-xl font-black text-black">
            Unsaved Draft Found!
          </h3>
          <p className="text-xs font-bold text-neutral-700 leading-relaxed">
            We discovered an in-progress <strong>{category}</strong> listing in your browser storage:
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#FFF9E6] border-[2.5px] border-black space-y-1 text-xs">
          <div className="font-black text-black truncate">
            {formData.title || "Untitled Requirement Draft"}
          </div>
          <div className="text-neutral-600 font-bold truncate">
            {formData.description || "Draft saved without description"}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => {
              clearDraft();
              setIsOpen(false);
            }}
            className="flex-1 px-4 py-3 rounded-xl bg-white hover:bg-neutral-100 text-black font-black text-xs uppercase border-[2.5px] border-black shadow-[3px_3px_0px_#000] flex items-center justify-center gap-1.5 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Discard</span>
          </button>

          <button
            onClick={() => setIsOpen(false)}
            className="flex-1 px-4 py-3 rounded-xl bg-[#7ED957] hover:bg-[#6ec947] text-black font-black text-xs uppercase border-[2.5px] border-black shadow-[3px_3px_0px_#000] flex items-center justify-center gap-1.5 transition-all"
          >
            <span>Resume Work</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
