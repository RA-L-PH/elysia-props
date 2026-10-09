"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Palette,
  Sparkles,
  ExternalLink,
  Layers,
  ArrowRight,
  Check,
  Zap,
  Info,
  Sliders,
  Code2,
  SlidersHorizontal,
} from "lucide-react";
import { UI_STYLES, UIStyleDefinition, useUIStyleStore, UIStyleId } from "@/store/uiStyleStore";
import { toast } from "sonner";

export default function StylesGalleryPage() {
  const { currentStyleId, setStyle } = useUIStyleStore();
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = [
    "All",
    "Modern & Trending",
    "Retro & Nostalgia",
    "Futuristic & Tech",
    "Minimalist & Clean",
  ];

  const filteredStyles =
    activeCategory === "All"
      ? UI_STYLES
      : UI_STYLES.filter((s) => s.category === activeCategory);

  const handleApply = (id: UIStyleId, name: string) => {
    setStyle(id);
    toast.success(`Active theme switched to ${name}!`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300 text-xs font-semibold mb-2">
            <Palette className="w-3.5 h-3.5" />
            <span>Interactive Design System Catalog</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            UI Style Guide Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Live interactive preview of all 12 design aesthetics cataloged on{" "}
            <a
              href="https://www.uistyleguide.com/#styles"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:underline inline-flex items-center gap-1 font-semibold"
            >
              uistyleguide.com
              <ExternalLink className="w-3 h-3" />
            </a>
            . Switch styles dynamically across the entire PulseStage requirement wizard and feed!
          </p>
        </div>

        <Link
          href="/post"
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 flex items-center gap-2 hover:opacity-95 transition-all"
        >
          <span>Open Live Form Wizard</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeCategory === cat
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
                : "bg-slate-900/80 text-slate-400 hover:text-white border border-white/5"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Styles Grid Cards with Live Mini Form Components */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStyles.map((style) => {
          const isSelected = currentStyleId === style.id;

          return (
            <div
              key={style.id}
              className={`p-6 rounded-3xl border transition-all flex flex-col justify-between relative overflow-hidden ${
                isSelected
                  ? "border-indigo-500 shadow-2xl ring-2 ring-indigo-500/40 bg-slate-900/90"
                  : "border-white/10 bg-slate-950/60 hover:border-white/20"
              }`}
            >
              {isSelected && (
                <div className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-md">
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>Active Theme</span>
                </div>
              )}

              <div>
                {/* Header */}
                <div className="mb-4">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                    {style.era} • {style.category}
                  </span>
                  <h3 className="text-xl font-bold text-white mt-2">{style.name}</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {style.tagline}
                  </p>
                </div>

                {/* Color Swatches */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] font-mono text-slate-400">Palette:</span>
                  <div className="flex items-center gap-1.5">
                    {style.colorPalette.map((c, i) => (
                      <div
                        key={i}
                        className="w-5 h-5 rounded-full border border-black/30 shadow-xs"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>

                {/* Live Interactive Mini Form Sample in this EXACT Style */}
                <div className={`p-4 mb-5 transition-all ${style.cardClass}`}>
                  <div className="text-[11px] font-bold mb-2 flex items-center justify-between">
                    <span>Live Sample Component</span>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold ${style.badgeClass}`}>
                      Planner Form
                    </span>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="text"
                      readOnly
                      value="Lead Stage Architect"
                      className={`w-full px-3 py-1.5 text-xs ${style.inputClass}`}
                    />
                    <div className="flex gap-2">
                      <button className={`flex-1 py-1.5 text-xs ${style.buttonPrimaryClass}`}>
                        Submit Draft
                      </button>
                      <button className={`px-3 py-1.5 text-xs ${style.buttonSecondaryClass}`}>
                        Reset
                      </button>
                    </div>
                  </div>
                </div>

                {/* CSS Features Checklist */}
                <div className="space-y-1.5 mb-6 text-[11px] font-mono text-slate-400">
                  <span className="text-[10px] font-semibold uppercase text-slate-300">CSS Tokens:</span>
                  {style.cssFeatures.slice(0, 3).map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 truncate">
                      <span className="text-indigo-400">›</span>
                      <span className="truncate">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleApply(style.id, style.name)}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                    : "bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white"
                }`}
              >
                <span>{isSelected ? "Currently Active in Wizard" : `Apply ${style.name} UI`}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
