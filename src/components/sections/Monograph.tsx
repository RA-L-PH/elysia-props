"use client";
import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Award, TrendingUp } from "lucide-react";
import { useParallax } from "@/hooks/useParallax";
import StatCounter from "@/components/ui/StatCounter";

interface Props {
  mousePos: { x: number; y: number };
}

export default function Monograph({ mousePos }: Props) {
  const monographRef = useRef<HTMLDivElement>(null);

  // ─── 4 DISTINCT SCROLL SPEEDS FOR LAYERED 3D DEPTH WITH BOUNDARIES ───
  const img1Offset = useParallax(monographRef, -0.06, 25);   // Clamps at [-25px, 25px]
  const badge1Offset = useParallax(monographRef, -0.10, 40);  // Clamps at [-40px, 40px]
  const img2Offset = useParallax(monographRef, -0.14, 55);   // Clamps at [-55px, 55px]
  const badge2Offset = useParallax(monographRef, -0.18, 70);  // Clamps at [-70px, 70px]

  return (
    <section ref={monographRef} className="relative z-[1] py-20 md:py-36 px-6 md:px-12 w-full overflow-visible">
      <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
        
        {/* LEFT COLUMN: Editorial Brand Philosophy */}
        <div className="space-y-8 reveal-on-scroll w-full">
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-[0.35em] text-accent font-plus-jakarta font-semibold">
              Est. 2009 · Dubai
            </span>
            <div className="gold-rule my-4">
              <span className="text-[9px] uppercase tracking-[0.3em] text-text-primary/40 font-plus-jakarta whitespace-nowrap">
                The Monograph
              </span>
            </div>
          </div>

          <h2 className="font-cormorant text-text-primary leading-[1.05]" style={{ fontSize: "clamp(2.25rem, 5vw + 1rem, 4.5rem)" }}>
            Curating Legacies in{" "}
            <em className="font-persian text-accent not-italic block" style={{ fontSize: "1.15em", lineHeight: 0.9 }}>
              Concrete, Glass
            </em>
            <span className="block mt-1">{"&"} Gold.</span>
          </h2>

          <div className="pl-6 border-l-2 border-accent/30 space-y-4">
            <p className="font-plus-jakarta leading-relaxed text-text-primary/80 font-light dropcap" style={{ fontSize: "clamp(0.85rem, 1vw + 0.5rem, 1rem)" }}>
              At Elysia, we reject the ordinary. Every project is an editorial statement, sculpted from the world's rarest materials and framed by Dubai's iconic horizons. We curate environments that interact with natural light—changing mood from golden morning sands to midnight onyx.
            </p>
            <p className="font-plus-jakarta text-sm leading-relaxed text-text-primary/60 font-light">
              Sixteen years of private acquisitions, off-market exclusives, and bespoke architectural commissions have established Elysia as the definitive name in ultra-luxury Dubai real estate.
            </p>
          </div>

          {/* Stats Bar */}
          <div className="pt-4 grid grid-cols-3 gap-4 border-t border-accent/15">
            <StatCounter target={4.8} suffix="B+" label="AED Asset Volume" />
            <StatCounter target={100} suffix="%" label="Private Ownership" />
            <StatCounter target={14} suffix="+" label="Prime Enclaves" />
          </div>

          <Link href="/properties" className="inline-flex items-center space-x-3 text-[11px] uppercase tracking-[0.25em] font-plus-jakarta font-semibold text-accent border border-accent/30 px-6 py-3 rounded hover:bg-accent/10 transition-all duration-300 group">
            <span>Explore The Collection</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
          </Link>
        </div>

        {/* RIGHT COLUMN: Asymmetric, Independently Floating Parallax Containers */}
        <div className="relative w-full h-[550px] md:h-[680px] flex items-center justify-center lg:block overflow-visible mt-10 lg:mt-0">
          
          {/* IMAGE CONTAINER 1: Main Large Facade (Deepest Background) */}
          <div
            className="absolute left-0 top-0 w-[70%] md:w-[75%] h-[75%] rounded-2xl overflow-hidden border border-accent/20 shadow-2xl transition-transform duration-200 ease-out"
            style={{
              transform: `translate3d(0, ${img1Offset}px, 0)`,
              willChange: "transform",
              zIndex: 1,
            }}
          >
            <div className="absolute inset-0">
              <Image src="/images/prop7.jpg" alt="Dubai luxury villa facade" fill sizes="50vw" className="object-cover" unoptimized />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-canvas/50 via-transparent to-transparent" />
          </div>

          {/* PILL-SHAPED COMPONENT 1: Forbes Luxury Badge (Mid-Background) */}
          <div
            className="absolute top-10 right-4 glass-panel px-4 py-3 rounded-full border border-accent/25 shadow-xl transition-transform duration-200 ease-out"
            style={{
              transform: `translate3d(0, ${badge1Offset}px, 0)`,
              willChange: "transform",
              zIndex: 10,
            }}
          >
            <div className="flex items-center space-x-2.5">
              <Award className="w-4 h-4 text-accent" />
              <div>
                <div className="text-[8px] uppercase tracking-widest text-accent font-plus-jakarta font-bold">Forbes Luxury</div>
                <div className="text-[9px] text-text-primary/90 font-plus-jakarta font-light whitespace-nowrap">#1 Dubai Brokerage</div>
              </div>
            </div>
          </div>

          {/* IMAGE CONTAINER 2: Overlapping Floating Detail (Mid-Foreground) */}
          <div
            className="absolute bottom-4 right-0 w-[50%] md:w-[48%] h-[40%] md:h-[45%] rounded-xl overflow-hidden border-2 border-accent/40 shadow-xl transition-transform duration-200 ease-out"
            style={{
              transform: `translate3d(0, ${img2Offset}px, 0)`,
              willChange: "transform",
              zIndex: 20,
            }}
          >
            <div className="absolute inset-0">
              <Image src="/images/seahorse2.jpg" alt="Floating Seahorse Villa detail" fill sizes="256px" className="object-cover" unoptimized />
            </div>
            <div className="absolute inset-0 bg-gradient-to-tl from-accent/10 via-transparent to-transparent" />
            <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-accent opacity-60" />
            <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-accent opacity-60" />
          </div>

          {/* PILL-SHAPED COMPONENT 2: Portfolio Growth Badge (Foremost) */}
          <div
            className="absolute bottom-[20%] left-4 glass-panel px-4 py-3 rounded-full border border-accent/25 shadow-xl transition-transform duration-200 ease-out"
            style={{
              transform: `translate3d(0, ${badge2Offset}px, 0)`,
              willChange: "transform",
              zIndex: 30,
            }}
          >
            <div className="flex items-center space-x-2.5">
              <TrendingUp className="w-4 h-4 text-accent" />
              <div>
                <div className="text-[8px] uppercase tracking-widest text-accent font-plus-jakarta font-bold">Portfolio Growth</div>
                <div className="text-[9px] text-text-primary/90 font-plus-jakarta font-light whitespace-nowrap">+34% YoY · 2024</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
