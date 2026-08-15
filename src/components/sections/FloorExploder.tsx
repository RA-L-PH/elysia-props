"use client";
import React, { useRef, useState } from "react";
import { Landmark, Award, Anchor } from "lucide-react";
import { useSectionProgress } from "@/hooks/useParallax";
import { FLOOR_LEVELS } from "@/lib/constants";

export default function FloorExploder() {
  const exploderRef = useRef<HTMLDivElement>(null);
  const [activeFloor, setActiveFloor] = useState<number | null>(null);

  // Scroll depth ratio for desktop 3D separation animation
  const progress = useSectionProgress(exploderRef);

  return (
    <section ref={exploderRef} className="py-24 flex flex-col items-center relative z-[1]">
      <div className="max-w-7xl mx-auto px-6 md:px-12 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* LEFT: Exploder description and accordion details */}
        <div className="space-y-6 reveal-on-scroll">
          <span className="text-xs uppercase tracking-[0.3em] text-accent font-plus-jakarta">Structure Analysis</span>
          <h2 className="font-cormorant text-text-primary" style={{ fontSize: "clamp(1.75rem, 3.5vw + 0.5rem, 3rem)" }}>
            Isometric Floor <span className="font-persian text-accent normal-case tracking-normal block mt-1" style={{ fontSize: "1.25em" }}>Deconstruction</span>
          </h2>
          <p className="font-plus-jakarta text-xs text-text-primary/70 leading-relaxed font-light">
            Deconstruct our premier architecture. Click on any floor tier or scroll through the section to separate architectural levels and explore specifications, suites, and waterfront features.
          </p>

          <div className="space-y-3 pt-4">
            {FLOOR_LEVELS.map(({ floor, label, desc, specs }) => (
              <div key={floor}>
                <button
                  onClick={() => setActiveFloor(activeFloor === floor ? null : floor)}
                  className={`w-full text-left p-4 rounded border transition-all duration-300 ${
                    activeFloor === floor ? "border-accent bg-accent/5" : "border-accent/10 bg-canvas/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-italiana text-sm text-accent font-semibold">{label}</span>
                    <span className="text-xs font-plus-jakarta tracking-wider text-text-primary">{desc}</span>
                  </div>
                </button>
                {activeFloor === floor && (
                  <div className="p-4 rounded border border-accent/20 bg-accent/5 backdrop-blur-md text-xs font-plus-jakarta text-text-primary/95 space-y-2 mt-1">
                    <span className="text-[10px] tracking-widest text-accent uppercase font-bold block">Specs & Highlights:</span>
                    <p className="leading-relaxed">{specs}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Exploded 3D Isometric View */}
        <div className="relative h-[480px] w-full hidden lg:flex items-center justify-center select-none" style={{ perspective: "1000px" }}>
          {[
            { floor: 3, icon: <Landmark className="w-5 h-5 mx-auto text-accent mb-1" />, desc: "Sky Lounge & Helipad",     w: "w-72", h: "h-36", zBase: 40,  zActive: 140, zProg:  1 },
            { floor: 2, icon: <Award    className="w-5 h-5 mx-auto text-accent mb-1" />, desc: "Master Suites & Pool",     w: "w-80", h: "h-40", zBase: 0,   zActive: 50,  zProg:  0 },
            { floor: 1, icon: <Anchor   className="w-5 h-5 mx-auto text-accent mb-1" />, desc: "Wellness & Yacht Docks",   w: "w-88", h: "h-44", zBase: -40, zActive: -120, zProg: -1 },
          ].map(({ floor, icon, desc, w, h, zBase, zActive, zProg }) => {
            const isSelected = activeFloor === floor;
            
            // Separation logic: separated by scrolling or floor button clicks
            const scrollSeparation = progress * 65 * zProg;
            const clickSeparation = isSelected ? zActive : zBase;
            const translateY = clickSeparation + scrollSeparation;

            return (
              <div
                key={floor}
                onClick={() => setActiveFloor(activeFloor === floor ? null : floor)}
                className={`absolute ${w} ${h} rounded-xl border border-accent/30 flex flex-col justify-center items-center cursor-pointer transition-all duration-700 select-none bg-canvas/40 backdrop-blur-md shadow-2xl hover:border-accent`}
                style={{
                  transform: `rotateX(55deg) rotateZ(-40deg) translate3d(0, 0, ${translateY}px)`,
                  transformStyle: "preserve-3d",
                  boxShadow: isSelected
                    ? "0 25px 50px -12px rgba(212,175,55,0.25)"
                    : "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
                  zIndex: floor * 10,
                }}
              >
                {/* 3D Content Layers */}
                <div style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }} className="text-center p-4">
                  {icon}
                  <h4 className="font-cormorant text-md text-text-primary font-bold mt-1">{desc}</h4>
                  <p className="text-[8px] font-plus-jakarta tracking-[0.2em] text-accent uppercase mt-0.5">
                    Tier {floor} Architectural Layer
                  </p>
                </div>

                {/* Wireframe grids */}
                <div className="absolute inset-2 border border-accent/10 rounded pointer-events-none" />
                <div className="absolute inset-4 border border-accent/5 rounded border-dashed pointer-events-none" />
                
                {/* Gold wireframe highlights */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-accent/40 rounded-tl" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-accent/40 rounded-br" />
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
