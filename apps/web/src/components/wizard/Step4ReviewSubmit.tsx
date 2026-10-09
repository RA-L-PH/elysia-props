"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Send,
  AlertTriangle,
  Loader2,
  Check,
  Copy,
  Info,
  Lock,
  PlusCircle,
} from "lucide-react";
import { useWizardStore, applyUserContact } from "@/store/wizardStore";
import { createRequirement, updateRequirement } from "@/lib/api";
import { useSession } from "@/components/auth/SessionProvider";
import { copyToClipboard, rememberMyPost } from "@/lib/myPosts";
import { toast } from "sonner";

interface Step4Props {
  /** Present when editing an existing post (/post?edit=<id>) — auth required. */
  editId?: string;
}

interface SuccessInfo {
  postKey?: string;
  title: string;
  category: string;
  endDate?: string;
}

export function Step4ReviewSubmit({ editId }: Step4Props) {
  const { category, formData, updateFormData, prevStep, clearDraft, getPayload, setPublishDone } =
    useWizardStore();
  const { user, loading: sessionLoading } = useSession();
  const router = useRouter();

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState<SuccessInfo | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validatePayload = (): boolean => {
    const errors: string[] = [];
    if (!formData.title || formData.title.length < 5) {
      errors.push("Requirement Title must be at least 5 characters.");
    }
    if (!formData.description || formData.description.length < 20) {
      errors.push("Description must be at least 20 characters.");
    }
    if (!formData.contact.name || formData.contact.name.length < 2) {
      errors.push("Contact Name is required.");
    }
    if (!formData.contact.email || !formData.contact.email.includes("@")) {
      errors.push("A valid contact email is required.");
    }
    if (!formData.contact.phone || formData.contact.phone.length < 7) {
      errors.push("A contact phone number is required.");
    }
    if (!formData.dates.startDate) {
      errors.push("Event Start Date is required.");
    }
    if (!formData.dates.applicationDeadline) {
      errors.push("Application Deadline is required.");
    }
    if (!formData.location.city || formData.location.city.length < 2) {
      errors.push("Location City is required.");
    }
    if (!formData.location.venue || formData.location.venue.length < 2) {
      errors.push("Venue / Area is required.");
    }
    if (formData.budget.max < formData.budget.min) {
      errors.push("Maximum budget must be greater than or equal to minimum budget.");
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleCopyKey = async () => {
    if (!successInfo?.postKey) return;
    const ok = await copyToClipboard(successInfo.postKey);
    setKeyCopied(ok);
    if (ok) toast.success("Post ID copied to clipboard");
    else toast.error("Couldn't copy automatically — select the text and copy it.");
  };

  const handleSubmit = async () => {
    if (!validatePayload()) return;
    // Editing is owner-only: the server rejects anything without a session.
    if (editId && !user) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = getPayload();

      if (editId) {
        await updateRequirement(editId, payload);
        // Saved → drop the persisted draft, then go straight back to the
        // browse page (where the edit was started from). clearDraft() resets
        // the wizard to step 1, so we must navigate away — otherwise the
        // wizard snaps to the new-post start stage.
        clearDraft();
        toast.success("Changes saved!");
        router.push("/requirements");
        return;
      }

      // Guest-friendly create: no sign-in required (2/day, then a friendly 429).
      const created = await createRequirement(payload);
      const postKey = created.postKey;

      // Auto-save + auto-copy the one-time Post ID.
      if (postKey && created._id) {
        rememberMyPost({
          id: String(created._id),
          postKey,
          title: payload.title,
          category: payload.category,
          createdAt: new Date().toISOString(),
        });
        setKeyCopied(await copyToClipboard(postKey));
      }

      setSuccessInfo({
        postKey,
        title: payload.title,
        category: payload.category,
        endDate: payload.dates.endDate,
      });
      // clearDraft() rewinds the wizard to step 1 — flag the success screen
      // so it stays mounted and WAITING here (Post ID card + CTAs) until the
      // visitor picks one of the actions below.
      setPublishDone(true);
      // Published → clear the saved draft/history immediately: the next
      // post starts from a completely fresh wizard (no recovery prompt).
      clearDraft();
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : "Network error while publishing requirement"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Edit gate: editing requires the owning account ────────────────────────
  if (editId) {
    if (sessionLoading) {
      return (
        <div className="flex items-center gap-3 p-6 rounded-3xl bg-white border-[3px] border-black shadow-[4px_4px_0px_#000] text-black">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-black">Checking your session…</span>
        </div>
      );
    }
    if (!user) {
      return (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFF9E6] border-[3px] border-black shadow-[6px_6px_0px_#000] space-y-4 text-center text-black">
          <div className="w-14 h-14 rounded-2xl bg-[#FFDE59] border-[3px] border-black shadow-[3px_3px_0px_#000] flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7 text-black" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black">Sign in to edit this post</h2>
          <p className="text-xs sm:text-sm font-bold text-neutral-700 max-w-md mx-auto">
            Posts can only be edited by the account that created them. A Post ID
            alone can delete a post, but never edit one.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
            <Link
              href={`/signin?next=${encodeURIComponent(`/post?edit=${editId}`)}`}
              className="px-6 py-3 rounded-2xl bg-[#00F0FF] hover:bg-[#00d8e6] text-black font-black text-xs uppercase border-[3px] border-black shadow-[4px_4px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Sign in
            </Link>
            <Link
              href="/requirements"
              className="px-6 py-3 rounded-2xl bg-white hover:bg-neutral-100 text-black font-black text-xs uppercase border-[3px] border-black shadow-[4px_4px_0px_#000] transition-all"
            >
              Back to feed
            </Link>
          </div>
        </div>
      );
    }
  }

  // ── Success screen: Post ID card, auto-copied, WAITING for a CTA ─────────
  if (successInfo) {
    return (
      <div className="space-y-6 text-black">
        <div className="text-center space-y-3">
          <div className="w-20 h-20 bg-[#7ED957] border-[3.5px] border-black shadow-[6px_6px_0px_#000] rounded-3xl flex items-center justify-center mx-auto">
            <Check className="w-10 h-10 text-black stroke-[3]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">Your requirement is live!</h2>
          <p className="text-xs sm:text-sm font-bold text-neutral-700 max-w-md mx-auto">
            {user
              ? `Posted as ${successInfo.category} — it's already visible on the feed.`
              : "Posted without an account — no sign-in needed. It's already on the feed."}
          </p>
        </div>

        {/* One-time Post ID (create mode only) */}
        {successInfo.postKey && (
          <div className="p-5 rounded-3xl bg-white border-[3px] border-black shadow-[5px_5px_0px_#000] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] font-mono font-black uppercase tracking-wider bg-[#FFDE59] px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_#000] inline-block">
                Your Post ID
              </span>
              <button
                onClick={handleCopyKey}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-[#00F0FF] hover:bg-[#00d8e6] border-2 border-black shadow-[2px_2px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{keyCopied ? "Copied!" : "Copy"}</span>
              </button>
            </div>

            <div className="font-mono text-xs sm:text-sm font-black break-all bg-[#F8F5EE] border-2 border-black rounded-xl p-3 select-all">
              {successInfo.postKey}
            </div>

            <div className="flex items-start gap-2 p-3 rounded-2xl bg-[#E0F7FA] border-2 border-black text-[11px] sm:text-xs font-bold leading-relaxed">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong className="font-black">Save this Post ID</strong> — it&apos;s the
                only way to delete this post without an account. It can&apos;t be used
                to edit the post, and we can&apos;t recover it for you. We&apos;ve also
                saved it on this device so the feed can offer a quick delete.
              </span>
            </div>

            <p
              className={`text-[11px] font-black flex items-center gap-1.5 ${
                keyCopied ? "text-emerald-700" : "text-neutral-600"
              }`}
            >
              {keyCopied ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Auto-copied to your clipboard
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Press Copy to grab it before you leave
                </>
              )}
            </p>
          </div>
        )}

        {/* Auto-expiry notice */}
        {successInfo.endDate && (
          <div className="flex items-start gap-2 p-3.5 rounded-2xl bg-[#FFDE59] border-2 border-black text-[11px] sm:text-xs font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Time limit: this post automatically disappears from PulseStage at{" "}
              <strong className="font-black">23:59 on {successInfo.endDate}</strong>{" "}
              (the event&apos;s end date) — no manual removal needed.
            </span>
          </div>
        )}

        {/* Guest upsell */}
        {!user && (
          <p className="text-center text-xs font-bold text-neutral-600">
            Want to edit or manage this post later?{" "}
            <Link
              href="/signin"
              className="font-black text-black underline decoration-[#FF5757] decoration-2 underline-offset-2 hover:text-[#FF5757]"
            >
              Sign in
            </Link>{" "}
            — same email, full control.
          </p>
        )}

        {/* Actions — the page waits here until you choose */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          <Link
            href="/requirements"
            onClick={() => setPublishDone(false)}
            className="px-6 py-3.5 rounded-2xl bg-[#00F0FF] hover:bg-[#00d8e6] text-black font-black text-xs uppercase tracking-wider border-[3px] border-black shadow-[4px_4px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>View in feed</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              setPublishDone(false);
              clearDraft(); // reset the wizard for a fresh post
              if (user) applyUserContact(user); // signed-in details re-prefill
              setSuccessInfo(null);
              setKeyCopied(false);
              setValidationErrors([]);
            }}
            className="px-6 py-3.5 rounded-2xl bg-[#FFDE59] hover:bg-[#ffd633] text-black font-black text-xs uppercase tracking-wider border-[3px] border-black shadow-[4px_4px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post another</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-black">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b-2 border-black">
        <div>
          <span className="text-[10px] sm:text-xs font-mono font-black uppercase tracking-wider bg-[#FFDE59] px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_#000] inline-block">
            {editId ? `Editing • Step 4 of 4` : "Step 4 of 4 • Final Polish"}
          </span>
          <h2 className="text-xl sm:text-2xl font-black mt-1">
            {editId ? "Review Changes & Save" : "Review & Publisher Details"}
          </h2>
        </div>
        <div className="shrink-0 px-3 py-1 text-xs font-black bg-[#FF5757] text-white border-2 border-black shadow-[2px_2px_0px_#000] rounded-xl flex items-center gap-1.5">
          <Send className="w-4 h-4 text-white" />
          <span>{editId ? "Save Edits" : "Final Sign-off"}</span>
        </div>
      </div>

      {/* Validation Warning Box */}
      {validationErrors.length > 0 && (
        <div className="p-4 rounded-2xl bg-[#FF5757] border-[2.5px] border-black text-white space-y-1.5 shadow-[4px_4px_0px_#000]">
          <div className="flex items-center gap-2 font-black text-xs uppercase">
            <AlertTriangle className="w-4 h-4 text-white" />
            <span>
              Required Schema Fields Incomplete ({validationErrors.length})
            </span>
          </div>
          <ul className="text-xs font-bold list-disc list-inside space-y-0.5">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {submitError && (
        <div className="p-4 rounded-2xl bg-[#FF5757] border-[2.5px] border-black text-white text-xs font-black shadow-[4px_4px_0px_#000]">
          {submitError}
        </div>
      )}

      {/* Summary Recap Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Basic Scope */}
        <div className="p-5 rounded-3xl bg-white border-[3px] border-black shadow-[4px_4px_0px_#000] space-y-3">
          <span className="text-[10px] font-mono font-black uppercase tracking-wider bg-[#FFDE59] px-2 py-0.5 rounded border border-black">
            Scope Summary
          </span>
          <h3 className="text-base font-black text-black">
            {formData.title || "Untitled Requirement"}
          </h3>
          <p className="text-xs font-bold text-neutral-700 leading-relaxed">
            {formData.description || "No description specified."}
          </p>
          <div className="flex flex-wrap gap-1 pt-2">
            <span className="px-2 py-0.5 rounded-lg bg-[#00F0FF] border border-black text-[10px] font-black">
              {category}
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-[#7ED957] border border-black text-[10px] font-black">
              {formData.urgency.toUpperCase()} PRIORITY
            </span>
            {formData.tags.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 rounded-lg bg-neutral-100 border border-black text-[10px] font-bold"
              >
                #{t}
              </span>
            ))}
          </div>
        </div>

        {/* Schedule & Rate */}
        <div className="p-5 rounded-3xl bg-white border-[3px] border-black shadow-[4px_4px_0px_#000] space-y-3">
          <span className="text-[10px] font-mono font-black uppercase tracking-wider bg-[#00F0FF] px-2 py-0.5 rounded border border-black">
            Logistics &amp; Compensation
          </span>
          <div className="space-y-2 text-xs font-bold">
            <div className="flex justify-between border-b border-black/20 pb-1">
              <span className="text-neutral-600">Venue:</span>
              <span className="font-black text-right">
                {formData.location.venue || "TBD"}
              </span>
            </div>
            <div className="flex justify-between border-b border-black/20 pb-1">
              <span className="text-neutral-600">City:</span>
              <span className="font-black">
                {formData.location.city || "TBD"}
              </span>
            </div>
            <div className="flex justify-between border-b border-black/20 pb-1">
              <span className="text-neutral-600">Start Date:</span>
              <span className="font-black">{formData.dates.startDate || "TBD"}</span>
            </div>
            <div className="flex justify-between border-b border-black/20 pb-1">
              <span className="text-neutral-600">Deadline:</span>
              <span className="font-black">{formData.dates.applicationDeadline || "TBD"}</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-neutral-600">Budget Range:</span>
              <span className="font-black text-sm bg-[#7ED957] px-2 py-0.5 rounded border-2 border-black">
                ${formData.budget.min.toLocaleString()} – $
                {formData.budget.max.toLocaleString()} {formData.budget.currency}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Publisher Contact Form */}
      <div className="p-5 rounded-3xl bg-[#FFF9E6] border-[3px] border-black shadow-[5px_5px_0px_#000] space-y-4">
        <h3 className="text-sm font-black uppercase tracking-wider">
          Point of Contact &amp; Organization
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black mb-1.5 uppercase">
              Full Name <span className="text-[#FF5757]">*</span>
            </label>
            <input
              type="text"
              value={formData.contact.name}
              onChange={(e) =>
                updateFormData({
                  contact: { ...formData.contact, name: e.target.value },
                })
              }
              placeholder="e.g. Elena Rostova"
              className="w-full px-3.5 py-2.5 text-xs bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-black mb-1.5 uppercase">
              Email Address <span className="text-[#FF5757]">*</span>
            </label>
            <input
              type="email"
              value={formData.contact.email}
              onChange={(e) =>
                updateFormData({
                  contact: { ...formData.contact, email: e.target.value },
                })
              }
              placeholder="e.g. elena@production.io"
              className="w-full px-3.5 py-2.5 text-xs bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black mb-1.5 uppercase">
              Phone Number <span className="text-[#FF5757]">*</span>
            </label>
            <input
              type="tel"
              value={formData.contact.phone}
              onChange={(e) =>
                updateFormData({
                  contact: { ...formData.contact, phone: e.target.value },
                })
              }
              placeholder="e.g. +1 (555) 019-2834"
              className="w-full px-3.5 py-2.5 text-xs bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-black mb-1.5 uppercase">
              Company / Production Entity
            </label>
            <input
              type="text"
              value={formData.contact.company}
              onChange={(e) =>
                updateFormData({
                  contact: { ...formData.contact, company: e.target.value },
                })
              }
              placeholder="e.g. Apex Live Experiences"
              className="w-full px-3.5 py-2.5 text-xs bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Navigation & Submit Buttons */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 sm:justify-between pt-4">
        <button
          type="button"
          onClick={prevStep}
          disabled={isSubmitting}
          className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white hover:bg-neutral-100 text-black font-black text-xs uppercase border-[3px] border-black shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Logistics</span>
        </button>

        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          {!user && !editId && (
            <p className="text-[11px] font-bold text-neutral-600 text-center sm:text-right">
              No account needed — guests can post{" "}
              <strong className="font-black">2 per day</strong>. Sign in any time to
              edit &amp; manage everything.
            </p>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-9 py-4 rounded-2xl bg-[#FF5757] hover:bg-[#ff3b3b] text-white font-black text-sm uppercase tracking-wider border-[3px] border-black shadow-[5px_5px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{editId ? "Saving Changes..." : "Publishing Listing..."}</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>{editId ? "Save Changes" : "Publish Requirement Now"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
