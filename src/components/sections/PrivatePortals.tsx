"use client";
import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useParallax } from "@/hooks/useParallax";

export default function PrivatePortals() {
  const portalsRef = useRef<HTMLDivElement>(null);

  // Parallax rates: Left moves slower, Right moves faster
  const portalLeftOffset = useParallax(portalsRef, -0.06);
  const portalRightOffset = useParallax(portalsRef, -0.12);

  return (
    <section
      ref={portalsRef}
      className="relative z-[1] flex flex-col md:flex-row h-auto md:h-[70vh] min-h-[500px] overflow-hidden select-none reveal-on-scroll"
    >
      {/* ── Portfolio Portal ── */}
      <Link href="/properties" className="portal-panel w-full md:w-1/2 min-h-[350px] md:min-h-0 group relative overflow-hidden flex flex-col justify-end p-8 md:p-14">
        {/* Parallax Image */}
        <div
          className="portal-img absolute inset-[-10%]"
          style={{ transform: `translateY(${portalLeftOffset}px) scale(1)`, willChange: "transform" }}
        >
          <Image src="/images/prop4.jpg" alt="Portfolio" fill className="object-cover" unoptimized />
        </div>
        <div className="portal-overlay absolute inset-0 bg-canvas/60 z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-canvas/80 to-transparent z-20" />
        
        <div className="relative z-30">
          <span className="text-[10px] uppercase tracking-[0.35em] text-accent font-plus-jakarta font-semibold mb-3 block">
            01 / Portfolio
          </span>
          <h3 className="font-cormorant text-text-primary leading-tight mb-4" style={{ fontSize: "clamp(1.75rem, 3vw + 0.5rem, 2.75rem)" }}>
            The Complete<br />
            <em className="font-persian text-accent not-italic">Collection</em>
          </h3>
          <p className="font-plus-jakarta text-xs text-text-primary/70 max-w-xs leading-relaxed mb-6 font-light">
            Explore our full portfolio of ultra-prime Dubai properties across 14 elite enclaves.
          </p>
          <div className="flex items-center space-x-3">
            <span className="text-[11px] uppercase tracking-[0.25em] font-plus-jakarta font-semibold text-accent">
              Browse Properties
            </span>
            <div className="portal-arrow w-8 h-8 rounded-full border border-accent/40 flex items-center justify-center transition-all duration-300">
              <ArrowRight className="w-3.5 h-3.5 text-accent" />
            </div>
          </div>
        </div>
      </Link>

      {/* Middle gold dividing line */}
      <div className="hidden md:block absolute top-0 bottom-0 left-1/2 w-[1px] bg-accent/20 z-40 pointer-events-none" />

      {/* ── Private Advisory Desk Portal ── */}
      <Link href="/contact" className="portal-panel w-full md:w-1/2 min-h-[350px] md:min-h-0 group relative overflow-hidden flex flex-col justify-end p-8 md:p-14 items-end text-right">
        {/* Parallax Image */}
        <div
          className="portal-img absolute inset-[-10%]"
          style={{ transform: `translateY(${portalRightOffset}px) scale(1)`, willChange: "transform" }}
        >
          <Image src="/images/seahorse3.jpg" alt="Private Desk" fill className="object-cover" unoptimized />
        </div>
        <div className="portal-overlay absolute inset-0 bg-canvas/60 z-10" />
        <div className="absolute inset-0 bg-gradient-to-l from-canvas/80 to-transparent z-20" />
        
        <div className="relative z-30">
          <span className="text-[10px] uppercase tracking-[0.35em] text-accent font-plus-jakarta font-semibold mb-3 block">
            02 / Private Desk
          </span>
          <h3 className="font-cormorant text-text-primary leading-tight mb-4" style={{ fontSize: "clamp(1.75rem, 3vw + 0.5rem, 2.75rem)" }}>
            The Advisory<br />
            <em className="font-persian text-accent not-italic">Concierge</em>
          </h3>
          <p className="font-plus-jakarta text-xs text-text-primary/70 max-w-xs leading-relaxed mb-6 font-light text-right">
            Private NDA-secured consultations, off-market access, and bespoke acquisition services.
          </p>
          <div className="flex items-center space-x-3 justify-end">
            <div className="portal-arrow w-8 h-8 rounded-full border border-accent/40 flex items-center justify-center transition-all duration-300">
              <ArrowLeft className="w-3.5 h-3.5 text-accent" />
            </div>
            <span className="text-[11px] uppercase tracking-[0.25em] font-plus-jakarta font-semibold text-accent">
              Request Private Access
            </span>
          </div>
        </div>
      </Link>
    </section>
  );
}
