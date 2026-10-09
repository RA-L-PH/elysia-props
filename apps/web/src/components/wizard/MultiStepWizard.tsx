"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { StepIndicator } from "./StepIndicator";
import { Step1Category } from "./Step1Category";
import { Step2RoleDetails } from "./Step2RoleDetails";
import { Step3LogisticsBudget } from "./Step3LogisticsBudget";
import { Step4ReviewSubmit } from "./Step4ReviewSubmit";
import { useWizardStore, applyUserContact } from "@/store/wizardStore";
import { fetchRequirementById } from "@/lib/api";
import { useSession } from "@/components/auth/SessionProvider";
import { RotateCcw, Loader2, AlertTriangle } from "lucide-react";

interface MultiStepWizardProps {
  /** Edit mode: /post?edit=<id> — the existing post prefills the wizard. */
  editId?: string;
}

type EditState = "idle" | "loading" | "ready" | "error";

export function MultiStepWizard({ editId }: MultiStepWizardProps) {
  const { currentStep, clearDraft, hydrateForEdit, publishDone, setPublishDone } =
    useWizardStore();
  const { user, loading: sessionLoading } = useSession();
  const [editState, setEditState] = useState<EditState>(editId ? "loading" : "idle");
  const [editError, setEditError] = useState("");
  const hydratingRef = useRef(false);
  const contactPrefilledRef = useRef(false);

  // Signed-in creators get the contact stage prefilled from their account —
  // once per session, never in edit mode (the post's own contact wins there).
  useEffect(() => {
    if (editId || sessionLoading || !user || contactPrefilledRef.current) return;
    contactPrefilledRef.current = true;
    applyUserContact(user);
  }, [editId, sessionLoading, user]);

  // A success screen from a previous visit must never survive a remount:
  // publishDone is session-only state (never persisted), so clear it once
  // on mount — the current visit starts from the real wizard step.
  const didMountRef = useRef(false);
  useEffect(() => {
    if (didMountRef.current) return;
    didMountRef.current = true;
    if (publishDone) setPublishDone(false);
  }, [publishDone, setPublishDone]);

  useEffect(() => {
    if (!editId || hydratingRef.current) return;
    hydratingRef.current = true;
    (async () => {
      try {
        const doc = await fetchRequirementById(editId);
        hydrateForEdit(doc);
        setEditState("ready");
      } catch (err) {
        setEditError(
          err instanceof Error ? err.message : "Could not load that post for editing."
        );
        setEditState("error");
      }
    })();
  }, [editId, hydrateForEdit]);

  if (editState === "loading") {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-[#FFFDF8] border-[3.5px] border-black shadow-[8px_8px_0px_#000] rounded-3xl p-8 flex items-center justify-center gap-3 text-black">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-black">Loading your post…</span>
        </div>
      </div>
    );
  }

  if (editState === "error") {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-[#FFFDF8] border-[3.5px] border-black shadow-[8px_8px_0px_#000] rounded-3xl p-8 space-y-4 text-center text-black">
          <div className="w-14 h-14 rounded-2xl bg-[#FF5757] border-[3px] border-black shadow-[3px_3px_0px_#000] flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-black">Couldn&apos;t open that post</h2>
          <p className="text-xs font-bold text-neutral-600 max-w-md mx-auto">
            {editError} It may have expired (posts auto-remove at 23:59 on their
            event&apos;s end date) or been deleted.
          </p>
          <Link
            href="/requirements"
            className="inline-block px-6 py-3 rounded-2xl bg-[#00F0FF] text-black font-black text-xs uppercase border-[3px] border-black shadow-[4px_4px_0px_#000] transition-all"
          >
            Back to feed
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Wizard Master Container */}
      <div className="bg-[#FFFDF8] border-[3.5px] border-black shadow-[8px_8px_0px_#000] rounded-3xl p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top Wizard Control */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b-2 border-black/10">
          <div className="text-[10px] sm:text-xs font-mono font-black uppercase text-black">
            {editId
              ? "PULSESTAGE • EDIT REQUIREMENT"
              : "PULSESTAGE • REQUIREMENT WIZARD"}
          </div>
          <button
            onClick={() => {
              if (confirm("Reset wizard and clear current draft?")) {
                clearDraft();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-white hover:bg-neutral-100 border-2 border-black shadow-[2px_2px_0px_#000] transition-all text-neutral-800"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Draft</span>
          </button>
        </div>

        {/* Step Indicator */}
        <StepIndicator />

        {/* Animated Step Panels */}
        <div className="relative overflow-hidden p-2 min-h-[460px]">
          <AnimatePresence mode="wait">
            {!publishDone && currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Step1Category />
              </motion.div>
            )}

            {!publishDone && currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Step2RoleDetails />
              </motion.div>
            )}

            {!publishDone && currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Step3LogisticsBudget />
              </motion.div>
            )}

            {(publishDone || currentStep === 4) && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Step4ReviewSubmit editId={editId} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
