"use client";

import React from "react";
import { useTheme, ThemeMode } from "@/context/ThemeContext";
import { Sun, Sunset, Moon, RefreshCw } from "lucide-react";

export default function ThemeSwitcher() {
  const { theme, isAuto, setThemeManual, resetToAuto } = useTheme();

  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-2 pointer-events-auto">
      {/* Indicator Pill */}
      <div className="glass-panel px-4 py-2 rounded-lg text-[10px] font-plus-jakarta tracking-widest text-text-primary/90 flex items-center space-x-2">
        <span className="relative flex h-2 w-2">
          {isAuto ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </>
          ) : (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          )}
        </span>
        <span>
          AMBIANCE: <span className="font-semibold text-accent uppercase">{theme}</span>{" "}
          {isAuto ? "(AUTO)" : "(PREVIEW)"}
        </span>
      </div>

      {/* Button Dock */}
      <div className="glass-panel p-1.5 rounded-lg flex items-center space-x-1 shadow-2xl">
        <button
          onClick={() => setThemeManual("morning")}
          title="Morning Mode"
          className={`p-2 rounded transition-all duration-300 ${
            theme === "morning" && !isAuto
              ? "bg-accent text-canvas"
              : "text-text-primary/75 hover:bg-accent/10 hover:text-accent"
          }`}
        >
          <Sun className="w-4 h-4" />
        </button>

        <button
          onClick={() => setThemeManual("dusk")}
          title="Golden Dusk Mode"
          className={`p-2 rounded transition-all duration-300 ${
            theme === "dusk" && !isAuto
              ? "bg-accent text-canvas"
              : "text-text-primary/75 hover:bg-accent/10 hover:text-accent"
          }`}
        >
          <Sunset className="w-4 h-4" />
        </button>

        <button
          onClick={() => setThemeManual("night")}
          title="Royal Night Mode"
          className={`p-2 rounded transition-all duration-300 ${
            theme === "night" && !isAuto
              ? "bg-accent text-canvas"
              : "text-text-primary/75 hover:bg-accent/10 hover:text-accent"
          }`}
        >
          <Moon className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-6 bg-accent/20 mx-1" />

        <button
          onClick={resetToAuto}
          title="Reset to Clock Auto-detect"
          className={`p-2 rounded transition-all duration-300 ${
            isAuto
              ? "bg-accent/10 text-accent font-semibold"
              : "text-text-primary/75 hover:bg-accent/10 hover:text-accent"
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${isAuto ? "animate-spin-slow" : ""}`} />
        </button>
      </div>
    </div>
  );
}
