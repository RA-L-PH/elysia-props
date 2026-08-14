"use client";
import React, { useState, useEffect } from "react";
import { useRevealObserver } from "@/hooks/useParallax";

// Section Components
import Hero from "@/components/sections/Hero";
import Monograph from "@/components/sections/Monograph";
import EditorialCuration from "@/components/sections/EditorialCuration";
import FlagshipShowcase from "@/components/sections/FlagshipShowcase";
import PrivatePortals from "@/components/sections/PrivatePortals";
import FloorExploder from "@/components/sections/FloorExploder";
import VIPConcierge from "@/components/sections/VIPConcierge";

export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Initialize global IntersectionObserver for element reveals
  useRevealObserver();

  // Scroll position sync
  useEffect(() => {
    const onScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Track mouse coordinates for tactile 2.5D mouse parallax
  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({
      x: e.clientX / window.innerWidth - 0.5,
      y: e.clientY / window.innerHeight - 0.5,
    });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="w-full relative"
      style={{ overflowX: "hidden" }}
    >
      {/* ══════════════════════════════════════════════
          GLOBAL AMBIENT GLOW SYSTEM
          Positioned absolutely across full page so glows
          bleed freely across all section boundaries.
      ══════════════════════════════════════════════ */}
      <div className="pointer-events-none absolute top-0 left-0 w-full h-full z-0" aria-hidden="true" style={{ minHeight: "600vh" }}>
        {/* Glow 1 — hero / monograph transition */}
        <div style={{ position: "absolute", top: "60vh", left: "20%", width: "900px", height: "900px", borderRadius: "50%", background: "radial-gradient(circle, rgba(212,175,55,0.13) 0%, transparent 65%)", filter: "blur(60px)", transform: `translateY(${scrollY * 0.04}px)`, willChange: "transform" }} />
        {/* Glow 2 — monograph / curation blend */}
        <div style={{ position: "absolute", top: "130vh", right: "-5%", width: "700px", height: "700px", borderRadius: "50%", background: "radial-gradient(circle, rgba(184,151,88,0.10) 0%, transparent 65%)", filter: "blur(80px)", transform: `translateY(${scrollY * 0.02}px)`, willChange: "transform" }} />
        {/* Glow 3 — flagship cards center bloom */}
        <div style={{ position: "absolute", top: "240vh", left: "50%", transform: `translateX(-50%) translateY(${scrollY * 0.03}px)`, width: "1000px", height: "600px", borderRadius: "50%", background: "radial-gradient(ellipse, rgba(212,175,55,0.12) 0%, transparent 65%)", filter: "blur(80px)", willChange: "transform" }} />
        {/* Glow 4 — portals / exploder section */}
        <div style={{ position: "absolute", top: "360vh", left: "30%", width: "800px", height: "800px", borderRadius: "50%", background: "radial-gradient(circle, rgba(212,175,55,0.09) 0%, transparent 65%)", filter: "blur(100px)", transform: `translateY(${scrollY * 0.025}px)`, willChange: "transform" }} />
        {/* Glow 5 — VIP / footer warm fade */}
        <div style={{ position: "absolute", top: "480vh", right: "25%", width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle, rgba(184,151,88,0.08) 0%, transparent 65%)", filter: "blur(80px)" }} />
      </div>

      {/* ── Section render tree ── */}
      <Hero scrollY={scrollY} mousePos={mousePos} />
      <Monograph mousePos={mousePos} />
      <EditorialCuration />
      <FlagshipShowcase />
      <PrivatePortals />
      <FloorExploder />
      <VIPConcierge />
    </div>
  );
}
