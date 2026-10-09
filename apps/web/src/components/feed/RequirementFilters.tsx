"use client";

import { Search, Filter, Sparkles, Music, Wrench, Layers } from "lucide-react";

interface RequirementFiltersProps {
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedUrgency: string;
  onUrgencyChange: (urgency: string) => void;
  counts: {
    all: number;
    planner: number;
    performer: number;
    crew: number;
  };
}

export function RequirementFilters({
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  selectedUrgency,
  onUrgencyChange,
  counts,
}: RequirementFiltersProps) {
  const categoryTabs = [
    { id: "All", label: "All Requirements", icon: Layers, count: counts.all },
    { id: "Planner", label: "Event Planners", icon: Sparkles, count: counts.planner },
    { id: "Performer", label: "Performers", icon: Music, count: counts.performer },
    { id: "Crew", label: "Stage & Tech Crew", icon: Wrench, count: counts.crew },
  ];

  return (
    <div className="space-y-4">
      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md">
        {categoryTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedCategory === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onCategoryChange(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                isActive
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                  isActive ? "bg-black/30 text-white" : "bg-slate-800 text-slate-400"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Bar & Secondary Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search input */}
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by title, keywords, city, tags (e.g. Yamaha, Malibu, FOH)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>

        {/* Urgency filter */}
        <div className="relative">
          <select
            value={selectedUrgency}
            onChange={(e) => onUrgencyChange(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs focus:border-indigo-500 outline-none transition-all"
          >
            <option value="All">All Priority Levels</option>
            <option value="urgent">🚨 Urgent Calls Only</option>
            <option value="high">High Priority</option>
            <option value="standard">Standard Priority</option>
          </select>
        </div>
      </div>
    </div>
  );
}
