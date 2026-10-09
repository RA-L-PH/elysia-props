"use client";

import { motion } from "framer-motion";
import {
  Sparkles,
  Music,
  Wrench,
  Check,
  ArrowRight,
  Calendar,
  MapPin,
  Users,
  ClipboardList,
  Building2,
  Mic,
  Headphones,
  Disc3,
  Guitar,
  Star,
  Cable,
  Lightbulb,
  HardHat,
  MonitorSpeaker,
  Sliders,
} from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { useWizardStore } from "@/store/wizardStore";
import { RequirementCategory } from "@elysia/shared";

type IconDef = typeof Sparkles;

interface CategoryOption {
  id: RequirementCategory;
  title: string;
  badge: string;
  tagline: string;
  description: string;
  icon: IconDef;
  icons: IconDef[]; // icon pool for the scattered background watermark
  accentBorder: string; // colored border used only for the active state
  highlights: string[];
}

interface Watermark {
  key: string;
  Icon: IconDef;
  style: CSSProperties;
}

/**
 * True randomness: a fresh layout for every device and every reload.
 * - Uniform size, shade and grid-based spacing
 * - Random icon count (4–7), random icons (repeats allowed), random rotation
 * Generated client-side after mount so the server HTML never mismatches.
 */
function buildRandomWatermarks(pool: IconDef[]): Watermark[] {
  // Uniform size and shade for every watermark
  const SIZE = 54;
  const SHADE = 0.55;

  // Grid => even, uniform spacing that still feels organic once jittered
  const cols = [10, 40, 70]; // % from the left
  const rows = [8, 30, 52, 74]; // % from the top
  const cells = rows.flatMap((top) => cols.map((left) => ({ left, top })));

  // Fisher–Yates shuffle with Math.random => different every load
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }

  // Random icon count per card (4–7)
  const count = 4 + Math.floor(Math.random() * 4);

  return cells.slice(0, count).map((cell, i) => ({
    key: `w${i}`,
    // Random pick from the pool — the same icon may repeat
    Icon: pool[Math.floor(Math.random() * pool.length)],
    style: {
      left: `${cell.left + Math.round((Math.random() - 0.5) * 6)}%`,
      top: `${cell.top + Math.round((Math.random() - 0.5) * 6)}%`,
      width: SIZE,
      height: SIZE,
      // Random rotation per icon
      transform: `rotate(${Math.round((Math.random() - 0.5) * 90)}deg)`,
      // Uniform shade for every icon
      opacity: SHADE,
    },
  }));
}

function WatermarkField({ pool }: { pool: IconDef[] }) {
  const [items, setItems] = useState<Watermark[]>([]);

  useEffect(() => {
    setItems(buildRandomWatermarks(pool));
  }, [pool]);

  return (
    <>
      {items.map(({ key, Icon, style }) => (
        <Icon
          key={key}
          aria-hidden="true"
          strokeWidth={1.25}
          style={style}
          className="absolute text-neutral-200 pointer-events-none select-none"
        />
      ))}
    </>
  );
}

const categoryOptions: CategoryOption[] = [
  {
    id: "Planner",
    title: "Event Planner & Producer",
    badge: "Architect & Coordinator",
    tagline: "End-to-end event architects, wedding coordinators, and corporate summit directors.",
    description:
      "Design floor plans, orchestrate vendor contracts, manage production timelines, and coordinate day-of execution.",
    icon: Sparkles,
    icons: [Sparkles, Calendar, MapPin, Users, ClipboardList, Building2],
    accentBorder: "border-[#FFDE59]",
    highlights: [
      "Venue Sourcing & Floor Plans",
      "Vendor Contract Negotiation",
      "Guest Experience & Hospitality",
      "Budget Orchestration",
    ],
  },
  {
    id: "Performer",
    title: "Artist & Live Performer",
    badge: "Talent & Stage Acts",
    tagline: "Live bands, headline DJs, solo vocalists, illusionists, and dancers.",
    description:
      "Specify performance sets, audio rider specs, stage dimensions, musical genres, and entertainment requirements.",
    icon: Music,
    icons: [Music, Mic, Headphones, Disc3, Guitar, Star],
    accentBorder: "border-[#FF66C4]",
    highlights: [
      "Live Band / DJ / Vocalist Sets",
      "Tech Rider & Channel List",
      "Stage Dimensions & Lighting",
      "Rehearsal & Soundcheck Needs",
    ],
  },
  {
    id: "Crew",
    title: "Technical & Stage Crew",
    badge: "Operations & Tech",
    tagline: "FOH sound engineers, lighting techs, riggers, and camera directors.",
    description:
      "Define shift durations, certified equipment proficiencies, physical lifting demands, and call-time parameters.",
    icon: Wrench,
    icons: [Wrench, Cable, Lightbulb, HardHat, MonitorSpeaker, Sliders],
    accentBorder: "border-[#00F0FF]",
    highlights: [
      "FOH Sound & Dante Audio",
      "Lighting Console Programming",
      "Rigging & Truss Safety Certs",
      "Shift & Overtime Parameters",
    ],
  },
];

export function Step1Category() {
  const { category, setCategory, nextStep } = useWizardStore();

  return (
    <div className="space-y-6">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-black">
          Select Requirement Category
        </h2>
        <p className="text-xs sm:text-sm font-medium text-neutral-500">
          Choose the role profile for this listing. Each category unlocks tailored
          fields, specialized validation, and role-specific technical details.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 p-4">
        {categoryOptions.map((opt) => {
          const isSelected = category === opt.id;

          return (
            <motion.div
              key={opt.id}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setCategory(opt.id)}
              className={`p-7 sm:p-8 rounded-3xl bg-white flex flex-col transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? `border-[4px] ${opt.accentBorder} shadow-[6px_6px_0px_#000] -translate-x-[2px] -translate-y-[2px]`
                  : "border-[3px] border-black shadow-[4px_4px_0px_#000] hover:shadow-[6px_6px_0px_#000]"
              }`}
            >
              {/* Scattered watermark icons — random count/rotation per load,
                  uniform size/shade/spacing, generated after mount */}
              <WatermarkField pool={opt.icons} />

              {/* Single selection indicator (top-right corner) */}
              {isSelected && (
                <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-black text-white flex items-center justify-center z-10">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              )}

              {/* Content sits above the watermark icon */}
              <div className="relative flex flex-col flex-1">
                {/* Heading block */}
                <div className="mb-3 pr-8 pt-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    {opt.badge}
                  </span>
                  <h3 className="text-lg font-black text-black leading-snug">
                    {opt.title}
                  </h3>
                </div>

                <p className="text-xs font-semibold text-neutral-800 mb-2">
                  {opt.tagline}
                </p>
                <p className="text-xs font-medium text-neutral-500 leading-relaxed mb-5">
                  {opt.description}
                </p>

                {/* Scope Highlights */}
                <div className="space-y-2 pt-3 border-t border-neutral-200">
                  <span className="text-[11px] font-black uppercase tracking-wider text-neutral-700">
                    Included Capabilities
                  </span>
                  <ul className="space-y-1.5 text-xs font-medium text-neutral-600">
                    {opt.highlights.map((h, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-neutral-400 shrink-0" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA pinned to a consistent baseline on every card */}
                <div className="mt-auto pt-5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCategory(opt.id);
                    }}
                    className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border-2 border-black transition-all flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? "bg-white text-neutral-500 shadow-none"
                        : "bg-[#FFDE59] text-black shadow-[2px_2px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px]"
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Selected</span>
                      </>
                    ) : (
                      <span>Select</span>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Next Step Action */}
      <div className="flex justify-end p-4">
        <button
          onClick={nextStep}
          className="w-full sm:w-auto px-6 sm:px-8 py-3.5 rounded-2xl bg-[#FF5757] hover:bg-[#ff3b3b] text-white font-black text-xs sm:text-sm uppercase tracking-wider border-[3px] border-black shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none flex items-center justify-center gap-2 text-center transition-all"
        >
          <span>Continue to {category} Specifications</span>
          <ArrowRight className="w-5 h-5 shrink-0" />
        </button>
      </div>
    </div>
  );
}
