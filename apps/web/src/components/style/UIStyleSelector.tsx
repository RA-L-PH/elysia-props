"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Palette,
  Sparkles,
  Zap,
  Layers,
  ChevronDown,
  ChevronUp,
  Check,
  ExternalLink,
  Code2,
  Info,
} from "lucide-react";
import { useUIStyleStore, UI_STYLES, UIStyleId } from "@/store/uiStyleStore";
import { toast } from "sonner";

export function UIStyleSelector() {
  const { currentStyleId, setStyle, getStyle } = useUIStyleStore();
  const currentStyle = getStyle();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>("All");

  const categories = [
    "All",
    "Modern & Trending",
    "Retro & Nostalgia",
    "Futuristic & Tech",
    "Minimalist & Clean",
  ];

  const filteredStyles =
    selectedFilter === "All"
      ? UI_STYLES
      : UI_STYLES.filter((s) => s.category === selectedFilter);

  const handleSelectStyle = (id: UIStyleId, name: string) => {
    setStyle(id);
    toast.success(`UI Theme switched to ${name}!`, {
      description: "Form layout and interactive controls re-rendered instantly.",
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto mb-6">
      {/* Quick Top Bar Style Switcher */}
      <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 p-0.5 shadow-md">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Palette className="w-4 h-4 text-pink-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">
                Active UI Style:
              </span>
              <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {currentStyle.name}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Live renderer aligned with UI Style Guide (12 design aesthetics)
            </p>
          </div>
        </div>

        {/* Quick Style Chips Carousel & Toggle Drawer */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto justify-start sm:justify-end">
          {UI_STYLES.slice(0, 4).map((style) => (
            <button
              key={style.id}
              onClick={() => handleSelectStyle(style.id, style.name)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                currentStyleId === style.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                  : "bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700"
              }`}
            >
              {style.name.split(" ")[0]}
            </button>
          ))}

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="px-3 py-1 rounded-lg bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border border-indigo-500/40 text-indigo-200 hover:text-white text-[11px] font-semibold flex items-center gap-1 transition-all ml-1"
          >
            <span>All 12 Styles</span>
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable 12-Style Showcase Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-3 p-5 rounded-3xl bg-slate-950/95 border border-white/10 shadow-2xl backdrop-blur-2xl space-y-4">
              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
                <div className="flex flex-wrap items-center gap-1.5">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedFilter(cat)}
                      className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                        selectedFilter === cat
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-white/5"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <a
                  href="https://www.uistyleguide.com/#styles"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <span>Ref: uistyleguide.com</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Styles Grid Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[460px] overflow-y-auto pr-1">
                {filteredStyles.map((style) => {
                  const isSelected = currentStyleId === style.id;

                  return (
                    <div
                      key={style.id}
                      onClick={() => handleSelectStyle(style.id, style.name)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                        isSelected
                          ? "bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500"
                          : "bg-slate-900/50 border-white/10 hover:border-white/20 hover:bg-slate-900/80"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs font-bold text-white">
                            {style.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                            {style.era}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed mb-3">
                          {style.tagline}
                        </p>

                        {/* Color Swatch Dots */}
                        <div className="flex items-center gap-1.5 mb-3">
                          {style.colorPalette.map((color, idx) => (
                            <div
                              key={idx}
                              className="w-4 h-4 rounded-full border border-black/40 shadow-xs"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>

                      {/* CSS Features Chip */}
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span className="truncate">{style.cssFeatures[0]}</span>
                        <span
                          className={`font-semibold px-2 py-0.5 rounded ${
                            isSelected
                              ? "bg-indigo-500 text-white"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {isSelected ? "Active" : "Apply"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
