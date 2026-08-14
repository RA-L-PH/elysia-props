"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type ThemeMode = "morning" | "dusk" | "night";

interface ThemeContextType {
  theme: ThemeMode;
  isAuto: boolean;
  setThemeManual: (mode: ThemeMode) => void;
  resetToAuto: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>("night");
  const [isAuto, setIsAuto] = useState<boolean>(true);

  const getAutoTheme = (): ThemeMode => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 17) {
      return "morning";
    } else if (hour >= 17 && hour < 19) {
      return "dusk";
    } else {
      return "night";
    }
  };

  useEffect(() => {
    if (!isAuto) return;

    setTheme(getAutoTheme());

    const interval = setInterval(() => {
      setTheme(getAutoTheme());
    }, 60000);

    return () => clearInterval(interval);
  }, [isAuto]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-morning", "theme-dusk", "theme-night");
    root.classList.add(`theme-${theme}`);
    root.setAttribute("data-theme", theme);
  }, [theme]);

  const setThemeManual = (mode: ThemeMode) => {
    setIsAuto(false);
    setTheme(mode);
  };

  const resetToAuto = () => {
    setIsAuto(true);
    setTheme(getAutoTheme());
  };

  return (
    <ThemeContext.Provider value={{ theme, isAuto, setThemeManual, resetToAuto }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
