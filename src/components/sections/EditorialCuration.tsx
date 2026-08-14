"use client";
import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useParallax, useSectionProgress } from "@/hooks/useParallax";

export default function EditorialCuration() {
  const curationRef = useRef<HTMLDivElement>(null);
  
  // Parallax progress triggers
  const progress = useSectionProgress(curationRef);
  const imgOffset = useParallax(curationRef, -0.10);

  return (
    <section
      ref={curationRef}
      className="py-24 px-6 md:px-12 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-[1]"
    >
      <div className="space-y-6 reveal-on-scroll">
        <span className="text-xs uppercase tracking-[0.25em] text-accent font-plus-jakarta">
          The Philosophy of Living
        </span>
        <h2 className="font-cormorant text-text-primary leading-tight" style={{ fontSize: "clamp(2rem, 4.5vw + 0.75rem, 3.75rem)" }}>
          Architecture as <br />
          <span className="italic font-normal text-accent font-persian">Fine Art</span>
        </h2>
        <div className="pl-6 border-l border-accent/25">
          <p className="font-plus-jakarta text-sm leading-relaxed text-text-primary/80 font-light max-w-lg dropcap">
            At Elysia, we reject the ordinary. Every project represents an editorial statement, carved from the world's finest materials and framed by Dubai's iconic horizons. We curate environments that interact with natural light, changing mood from golden morning sands to midnight onyx.
          </p>
        </div>
        <div className="pt-4">
          <Link href="/properties" className="inline-flex items-center space-x-2 text-xs uppercase tracking-[0.2em] font-plus-jakarta text-accent hover:text-text-primary transition-colors group">
            <span>Explore The Collection</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Parallax Container scale reveal */}
      <div
        className="relative h-[450px] w-full rounded-lg overflow-hidden border border-accent/20 shadow-2xl reveal-on-scroll delay-200"
        style={{
          transform: `scale(${0.95 + progress * 0.08})`,
          transition: "transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "-15%",
            transform: `translateY(${imgOffset}px)`,
            willChange: "transform",
          }}
        >
          <Image src="/images/prop9.jpg" alt="Architectural details" fill sizes="50vw" className="object-cover contrast-125 saturate-50" unoptimized />
        </div>
        <div className="absolute inset-0 bg-gradient-to-tr from-canvas/90 via-transparent to-transparent" />
        
        {/* Floating caption card */}
        <div className="absolute bottom-6 left-6 right-6 p-6 glass-panel rounded">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] tracking-widest font-plus-jakarta uppercase text-accent">Signature Project</p>
              <h4 className="font-cormorant text-lg text-white">The Palm Crescent Mansions</h4>
            </div>
            <span className="text-xs font-italiana text-accent">Q4 2027</span>
          </div>
        </div>
      </div>
    </section>
  );
}
