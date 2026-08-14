"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { Compass, Menu, X, ArrowUpRight, Sun, Sunset, Moon, RefreshCw } from "lucide-react";

// Custom text scramble reveal effect component
function ScrambleText({ text }: { text: string }) {
  const [displayText, setDisplayText] = useState(text);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#$@&*%-+?";

  const handleMouseEnter = () => {
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplayText(
        text
          .split("")
          .map((char, index) => {
            if (char === " ") return " ";
            if (index < iteration) {
              return text[index];
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("")
      );

      if (iteration >= text.length) {
        clearInterval(interval);
        setDisplayText(text);
      }
      iteration += 1 / 2;
    }, 20);
  };

  return (
    <span onMouseEnter={handleMouseEnter}>
      {displayText}
    </span>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const [dubaiTime, setDubaiTime] = useState("");
  const pathname = usePathname();
  const { theme, isAuto, setThemeManual, resetToAuto } = useTheme();

  // Listen to scroll to update glass effect and smart hide/show header
  useEffect(() => {
    let lastScroll = 0;
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      if (currentScroll > lastScroll && currentScroll > 80) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      setScrolled(currentScroll > 20);
      lastScroll = currentScroll;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Update Dubai Clock (UTC+4)
  useEffect(() => {
    const updateTime = () => {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: "Asia/Dubai",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      };
      const formatter = new Intl.DateTimeFormat("en-US", options);
      setDubaiTime(formatter.format(new Date()));
    };

    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { label: "Collection", href: "/" },
    { label: "Properties", href: "/properties" },
    { label: "Private Desk", href: "/contact" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 transform ${
        visible ? "translate-y-0" : "-translate-y-full"
      } ${
        scrolled
          ? "py-3 bg-canvas/50 backdrop-blur-md border-b border-accent/10 shadow-lg"
          : "py-5 bg-canvas/25 backdrop-blur-sm border-b border-accent/5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between relative z-50">
        {/* Monogram Logo */}
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="w-10 h-10 rounded-full border border-accent flex items-center justify-center transition-all duration-500 group-hover:bg-accent/10">
            <span className="font-italiana text-lg text-accent font-semibold tracking-wider">E</span>
          </div>
          <div className="flex flex-col">
            <span className="font-cormorant text-md md:text-lg font-bold tracking-[0.2em] text-text-primary">
              ELYSIA
            </span>
            <span className="text-[9px] tracking-[0.3em] uppercase text-accent font-plus-jakarta font-light -mt-1">
              Properties Dubai
            </span>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex space-x-10">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative font-plus-jakarta text-xs uppercase tracking-[0.2em] transition-colors duration-300 py-1 ${
                  isActive ? "text-accent" : "text-text-primary/70 hover:text-text-primary"
                } group`}
              >
                <ScrambleText text={link.label} />
                <span
                  className={`absolute bottom-0 left-0 w-full h-[1px] bg-accent transition-transform duration-500 origin-left ${
                    isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        {/* Right Actions & Dubai Time Badges */}
        <div className="hidden md:flex items-center space-x-6">
          {/* Dubai Clock badge */}
          <div className="flex items-center px-4 py-1.5 rounded-full border border-accent/10 bg-canvas/40 backdrop-blur-sm text-[10px] font-plus-jakarta tracking-wider text-text-primary/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-2" />
            Dubai 24°C • {dubaiTime || "08:42 PM"}
          </div>

          {/* Compact Theme Selector Dock */}
          <div className="flex items-center space-x-1 border border-accent/10 bg-canvas/40 backdrop-blur-sm p-1 rounded">
            <button
              onClick={() => setThemeManual("morning")}
              title="Morning Mode"
              className={`p-1.5 rounded transition-all duration-300 ${
                theme === "morning" && !isAuto
                  ? "bg-accent text-canvas"
                  : "text-text-primary/75 hover:bg-accent/10 hover:text-accent"
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setThemeManual("dusk")}
              title="Golden Dusk Mode"
              className={`p-1.5 rounded transition-all duration-300 ${
                theme === "dusk" && !isAuto
                  ? "bg-accent text-canvas"
                  : "text-text-primary/75 hover:bg-accent/10 hover:text-accent"
              }`}
            >
              <Sunset className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setThemeManual("night")}
              title="Royal Night Mode"
              className={`p-1.5 rounded transition-all duration-300 ${
                theme === "night" && !isAuto
                  ? "bg-accent text-canvas"
                  : "text-text-primary/75 hover:bg-accent/10 hover:text-accent"
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
            </button>

            <div className="w-[1px] h-4 bg-accent/20 mx-0.5" />

            <button
              onClick={resetToAuto}
              title={isAuto ? "Auto Mode (Dubai Time)" : "Switch to Auto Mode"}
              className={`p-1.5 rounded transition-all duration-300 ${
                isAuto
                  ? "text-accent font-semibold bg-accent/10"
                  : "text-text-primary/75 hover:bg-accent/10 hover:text-accent"
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAuto ? "animate-spin-slow" : ""}`} />
            </button>
          </div>

          <Link
            href="/contact"
            className="relative px-5 py-2.5 rounded border border-accent text-[10px] font-plus-jakarta uppercase tracking-[0.2em] text-accent overflow-hidden group transition-colors duration-500 hover:text-canvas"
          >
            <span className="absolute inset-0 bg-accent transform translate-y-full transition-transform duration-500 ease-out group-hover:translate-y-0 z-0" />
            <span className="relative z-10 flex items-center">
              VIP Inquire <ArrowUpRight className="ml-1 w-3.5 h-3.5" />
            </span>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 text-accent"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-x-0 top-0 h-screen z-40 bg-canvas/98 backdrop-blur-lg flex flex-col items-center justify-start pt-32 space-y-8 transition-all duration-500 md:hidden ${
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10 pointer-events-none"
        }`}
      >
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setIsOpen(false)}
            className="font-cormorant text-2xl tracking-[0.15em] text-text-primary hover:text-accent transition-colors duration-300"
          >
            {link.label}
          </Link>
        ))}

        {/* Theme Selector Dock inside Mobile Drawer */}
        <div className="flex flex-col items-center space-y-4 pt-4">
          <span className="text-[9px] uppercase tracking-[0.25em] text-accent font-plus-jakarta">Select Atmosphere</span>
          <div className="flex items-center space-x-2 border border-accent/15 bg-canvas/40 backdrop-blur-sm p-1.5 rounded">
            <button
              onClick={() => setThemeManual("morning")}
              className={`p-2.5 rounded transition-all duration-300 ${
                theme === "morning" && !isAuto ? "bg-accent text-canvas" : "text-text-primary/75"
              }`}
            >
              <Sun className="w-4 h-4" />
            </button>
            <button
              onClick={() => setThemeManual("dusk")}
              className={`p-2.5 rounded transition-all duration-300 ${
                theme === "dusk" && !isAuto ? "bg-accent text-canvas" : "text-text-primary/75"
              }`}
            >
              <Sunset className="w-4 h-4" />
            </button>
            <button
              onClick={() => setThemeManual("night")}
              className={`p-2.5 rounded transition-all duration-300 ${
                theme === "night" && !isAuto ? "bg-accent text-canvas" : "text-text-primary/75"
              }`}
            >
              <Moon className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-5 bg-accent/20 mx-1" />
            <button
              onClick={resetToAuto}
              className={`p-2.5 rounded transition-all duration-300 ${
                isAuto ? "text-accent bg-accent/10" : "text-text-primary/75"
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isAuto ? "animate-spin-slow" : ""}`} />
            </button>
          </div>
        </div>

        {/* Live Dubai info in mobile drawer */}
        <div className="mt-4 flex flex-col items-center space-y-4">
          <div className="px-4 py-2 rounded-full border border-accent/25 bg-canvas text-[11px] font-plus-jakarta tracking-wider text-accent">
            Dubai 24°C • {dubaiTime}
          </div>
          <Link
            href="/contact"
            onClick={() => setIsOpen(false)}
            className="px-6 py-3 border border-accent bg-accent text-canvas text-xs uppercase tracking-[0.2em] font-plus-jakarta rounded"
          >
            VIP Inquire
          </Link>
        </div>
      </div>
    </header>
  );
}
