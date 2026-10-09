"use client";

import { motion } from "framer-motion";
import {
  Sparkles,
  Music,
  Wrench,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  ArrowRight,
  ShieldCheck,
  Tag,
  Building,
} from "lucide-react";
import { RequirementDocument } from "@elysia/shared";
import { formatCurrency, formatDate } from "@/lib/utils";

interface RequirementCardProps {
  requirement: RequirementDocument;
  onSelect: (req: RequirementDocument) => void;
}

export function RequirementCard({ requirement, onSelect }: RequirementCardProps) {
  const isUrgent = requirement.urgency === "urgent";
  const isHigh = requirement.urgency === "high";

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="p-6 rounded-2xl bg-slate-900/70 border border-white/10 hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/5 transition-all flex flex-col justify-between group relative overflow-hidden backdrop-blur-md"
    >
      {/* Top ambient color strip based on category */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${
          requirement.category === "Planner"
            ? "bg-gradient-to-r from-indigo-500 to-blue-500"
            : requirement.category === "Performer"
            ? "bg-gradient-to-r from-purple-500 to-pink-500"
            : "bg-gradient-to-r from-cyan-500 to-teal-500"
        }`}
      />

      <div>
        {/* Top Badges & Urgency */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
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
              <span>{requirement.category}</span>
            </span>

            {/* Sub-role or event type badge */}
            <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-white/5">
              {requirement.category === "Planner" && requirement.details.eventType}
              {requirement.category === "Performer" && requirement.details.performanceCategory}
              {requirement.category === "Crew" && requirement.details.roleSpecialization}
            </span>
          </div>

          {/* Urgency Badge */}
          {isUrgent && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
              🚨 Urgent Call
            </span>
          )}
          {isHigh && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
              High Priority
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1 mb-2">
          {requirement.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
          {requirement.description}
        </p>

        {/* Polymorphic Specifics Box */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1.5 text-xs text-slate-300 mb-4">
          {requirement.category === "Planner" && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>👥 <strong>{requirement.details.guestCount}</strong> Guests</span>
              <span>🏛️ {requirement.details.venueType}</span>
              {requirement.details.cateringNeeded && <span>🍽️ Catering Included</span>}
            </div>
          )}

          {requirement.category === "Performer" && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>⏱️ <strong>{requirement.details.performanceDurationMinutes}</strong> min set</span>
              <span>🎭 Stage: {requirement.details.stageSizeRequirement}</span>
              {requirement.details.genres?.length > 0 && (
                <span className="text-purple-300">🎵 {requirement.details.genres.slice(0, 2).join(", ")}</span>
              )}
            </div>
          )}

          {requirement.category === "Crew" && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>🕒 <strong>{requirement.details.shiftDurationHours}h</strong> shift</span>
              <span>⭐ {requirement.details.experienceLevel}</span>
              <span>⏰ Call: {requirement.details.callTime}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {requirement.tags && requirement.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {requirement.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-slate-800/60 text-[10px] text-slate-400 border border-white/5"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Meta & Action */}
      <div className="pt-3 border-t border-white/10 space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">{requirement.location?.city || "Remote"}</span>
          </div>

          <div className="flex items-center gap-1.5 justify-end">
            <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>{formatDate(requirement.dates?.startDate)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-baseline gap-1">
            <span className="text-xs text-slate-500">Budget:</span>
            <span className="text-sm font-bold text-emerald-400">
              {formatCurrency(requirement.budget?.min || 0)} - {formatCurrency(requirement.budget?.max || 0)}
            </span>
            <span className="text-[10px] text-slate-400">/{requirement.budget?.payType}</span>
          </div>

          <button
            onClick={() => onSelect(requirement)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <span>View Specs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
