"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  Music,
  Wrench,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  User,
  Mail,
  Phone,
  Building,
  CheckCircle2,
  Share2,
  ShieldCheck,
  Send,
  Flag,
  Loader2,
} from "lucide-react";
import { RequirementDocument } from "@elysia/shared";
import { formatCurrency, formatDate } from "@/lib/utils";
import { reportRequirement, ReportReason } from "@/lib/api";
import { useSession } from "@/components/auth/SessionProvider";
import { toast } from "sonner";

interface RequirementDetailModalProps {
  requirement: RequirementDocument | null;
  onClose: () => void;
}

const REASONS: Array<{ value: ReportReason; label: string }> = [
  { value: "fake", label: "Fake or misleading post" },
  { value: "scam", label: "Scam or fraud" },
  { value: "spam", label: "Spam / repeated posting" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "other", label: "Something else" },
];

export function RequirementDetailModal({ requirement, onClose }: RequirementDetailModalProps) {
  const { user } = useSession();
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState<ReportReason>("fake");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!requirement) return null;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Listing link copied to clipboard!");
  };

  const handleApply = () => {
    toast.success("Application packet submitted to host!", {
      description: `Notification sent to ${requirement.contact.email}.`,
    });
  };

  // Report button: anyone except the post's owner (guests included — the
  // API dedupes them with an anonymous report cookie). Guest posts stay
  // reportable — removal applies even with no poster account to ban.
  const canReport = !user || user.id !== requirement.postedBy;

  const submitReport = async () => {
    setSubmitting(true);
    try {
      const result = await reportRequirement(
        requirement._id,
        reason,
        details.trim() || undefined
      );
      if (result.postRemoved) {
        toast.success("Report filed — the post has been removed.", {
          description:
            "It exceeded the community report threshold. Thanks for keeping PulseStage clean.",
        });
        onClose(); // the listing no longer exists
      } else {
        toast.success(
          `Report received (${result.reportCount}/${result.threshold}) — thanks!`
        );
        setReporting(false);
        setDetails("");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to file report.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-2xl bg-slate-900 border border-white/15 rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-100 relative overflow-hidden my-8"
        >
          {/* Accent Header Line */}
          <div
            className={`absolute top-0 left-0 right-0 h-1.5 ${
              requirement.category === "Planner"
                ? "bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500"
                : requirement.category === "Performer"
                ? "bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500"
                : "bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500"
            }`}
          />

          {/* Close & Share Buttons */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                  requirement.category === "Planner"
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                    : requirement.category === "Performer"
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                }`}
              >
                {requirement.category === "Planner" && <Sparkles className="w-3.5 h-3.5" />}
                {requirement.category === "Performer" && <Music className="w-3.5 h-3.5" />}
                {requirement.category === "Crew" && <Wrench className="w-3.5 h-3.5" />}
                <span>{requirement.category} Requirement</span>
              </span>

              {requirement.urgency === "urgent" && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                  🚨 Urgent
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                title="Share"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Title & Description */}
          <div className="mt-4 space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
              {requirement.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {requirement.description}
            </p>
          </div>

          {/* Role-Specific Discriminator Deep Dive */}
          <div className="mt-6 p-4 rounded-2xl bg-slate-950/70 border border-white/5 space-y-3">
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Technical & Production Specifications</span>
            </h3>

            {requirement.category === "Planner" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>Event Type: <strong className="text-white">{requirement.details.eventType}</strong></div>
                <div>Guest Count: <strong className="text-white">{requirement.details.guestCount} attendees</strong></div>
                <div>Venue Environment: <strong className="text-white">{requirement.details.venueType}</strong></div>
                <div>Catering Coordination: <strong className="text-white">{requirement.details.cateringNeeded ? "Required" : "Not Required"}</strong></div>
                <div className="col-span-full">Theme & Vibe: <strong className="text-indigo-300">{requirement.details.themeOrVibe}</strong></div>
                <div className="col-span-full">
                  <span className="text-slate-400">Scopes Required:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {requirement.details.plannerScope?.map((scope, idx) => (
                      <span key={idx} className="px-2 py-1 rounded bg-indigo-950/60 text-indigo-200 border border-indigo-800/40 text-[11px]">
                        ✓ {scope}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {requirement.category === "Performer" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>Act Profile: <strong className="text-white">{requirement.details.performanceCategory}</strong></div>
                <div>Performance Duration: <strong className="text-white">{requirement.details.performanceDurationMinutes} Minutes</strong></div>
                <div>Stage Dimensions: <strong className="text-white">{requirement.details.stageSizeRequirement}</strong></div>
                <div>House Sound Supplied: <strong className="text-white">{requirement.details.soundSystemProvided ? "Yes" : "No"}</strong></div>
                <div className="col-span-full">Set Breakdown: <strong className="text-purple-300">{requirement.details.setBreakdown}</strong></div>
                {requirement.details.techRiderSpecs && (
                  <div className="col-span-full p-2.5 rounded-lg bg-slate-900 border border-white/5">
                    <span className="text-slate-400 font-mono text-[10px] uppercase">Rider & Audio Specs:</span>
                    <p className="text-slate-300 text-xs mt-1">{requirement.details.techRiderSpecs}</p>
                  </div>
                )}
                {requirement.details.genres?.length > 0 && (
                  <div className="col-span-full flex flex-wrap gap-1.5 mt-1">
                    {requirement.details.genres.map((g, idx) => (
                      <span key={idx} className="px-2 py-1 rounded bg-purple-950/60 text-purple-200 border border-purple-800/40 text-[11px]">
                        🎵 {g}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {requirement.category === "Crew" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>Role: <strong className="text-white">{requirement.details.roleSpecialization}</strong></div>
                <div>Shift Duration: <strong className="text-white">{requirement.details.shiftDurationHours} Hours</strong></div>
                <div>Experience Level: <strong className="text-white">{requirement.details.experienceLevel}</strong></div>
                <div>Call Time: <strong className="text-white">{requirement.details.callTime}</strong></div>
                <div className="col-span-full">Physical Demands: <strong className="text-cyan-300">{requirement.details.physicalDemands}</strong></div>
                {requirement.details.equipmentBroughtByCrew && (
                  <div className="col-span-full p-2.5 rounded-lg bg-slate-900 border border-white/5">
                    <span className="text-slate-400 font-mono text-[10px] uppercase">Crew Gear Checklist:</span>
                    <p className="text-slate-300 text-xs mt-1">{requirement.details.equipmentBroughtByCrew}</p>
                  </div>
                )}
                {requirement.details.certificationsRequired?.length > 0 && (
                  <div className="col-span-full flex flex-wrap gap-1.5 mt-1">
                    {requirement.details.certificationsRequired.map((cert, idx) => (
                      <span key={idx} className="px-2 py-1 rounded bg-cyan-950/60 text-cyan-200 border border-cyan-800/40 text-[11px]">
                        🛡️ {cert}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Logistics & Compensation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 text-xs">
              <span className="text-slate-500 font-medium">Location</span>
              <div className="font-semibold text-slate-200 mt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">{requirement.location?.city}</span>
              </div>
              <div className="text-[11px] text-slate-400 truncate">{requirement.location?.venue}</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 text-xs">
              <span className="text-slate-500 font-medium">Dates & Timeline</span>
              <div className="font-semibold text-slate-200 mt-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>{formatDate(requirement.dates?.startDate)}</span>
              </div>
              <div className="text-[11px] text-slate-400">Deadline: {formatDate(requirement.dates?.applicationDeadline)}</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 text-xs">
              <span className="text-slate-500 font-medium">Compensation</span>
              <div className="font-semibold text-emerald-400 mt-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {formatCurrency(requirement.budget?.min || 0)} - {formatCurrency(requirement.budget?.max || 0)}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">Model: {requirement.budget?.payType}</div>
            </div>
          </div>

          {/* Host Contact Box */}
          <div className="mt-4 p-4 rounded-2xl bg-slate-950/90 border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400">Host Contact:</span>
              <div className="font-bold text-sm text-white">{requirement.contact.name}</div>
              <div className="text-xs text-slate-400">{requirement.contact.company || "Direct Production Team"} • {requirement.contact.email}</div>
            </div>

            <button
              onClick={handleApply}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Apply for Requirement</span>
            </button>
          </div>

          {/* ── Report (anyone but the owner) ── */}
          {canReport && (
            <div className="mt-4 p-4 rounded-2xl bg-slate-950/70 border border-rose-500/20 space-y-3">
              {!reporting ? (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Fake or suspicious post? Reports past the threshold remove
                    it and suspend the poster.
                  </p>
                  <button
                    type="button"
                    onClick={() => setReporting(true)}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-transparent hover:bg-rose-500/15 text-rose-300 hover:text-rose-200 border border-rose-500/40 text-[11px] font-bold transition-colors"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    Report post
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                    <Flag className="w-3 h-3" /> Report this post
                  </span>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value as ReportReason)}
                    aria-label="Report reason"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs font-semibold text-slate-200 focus:outline-none focus:border-rose-500/60"
                  >
                    {REASONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    rows={2}
                    maxLength={500}
                    placeholder="Add details (optional) — what looks wrong?"
                    aria-label="Report details"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-rose-500/60 resize-y"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setReporting(false);
                        setDetails("");
                      }}
                      disabled={submitting}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={submitReport}
                      disabled={submitting}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-black uppercase tracking-wider transition-colors disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Sending…
                        </>
                      ) : (
                        "Submit report"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
