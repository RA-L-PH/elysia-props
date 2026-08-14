"use client";
import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import FlagshipCard from "@/components/ui/FlagshipCard";
import { FLAGSHIP_CARDS, type Currency } from "@/lib/constants";

export default function FlagshipShowcase() {
  const [currency, setCurrency] = useState<Currency>("AED");

  return (
    <section className="py-20 relative z-[1]">
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-16 space-y-5 reveal-on-scroll">
          <span className="text-xs uppercase tracking-[0.3em] text-accent font-plus-jakarta">
            Pinnacle Real Estate
          </span>
          <h2 className="font-cormorant text-text-primary leading-none" style={{ fontSize: "clamp(1.75rem, 3.5vw + 0.5rem, 3rem)" }}>
            Flagship <span className="font-persian text-accent normal-case tracking-normal block mt-1" style={{ fontSize: "1.3em" }}>curation</span>
          </h2>
          <div className="section-divider mx-auto" />
          
          {/* Currency Switcher */}
          <div className="flex justify-center space-x-2 pt-2">
            {(["AED", "USD", "EUR", "GBP"] as Currency[]).map((curr) => (
              <button
                key={curr}
                onClick={() => setCurrency(curr)}
                className={`px-3 py-1 rounded text-[10px] tracking-widest font-plus-jakarta border transition-all duration-300 ${
                  currency === curr
                    ? "bg-accent border-accent text-canvas font-semibold shadow-md shadow-accent/20"
                    : "border-accent/10 bg-canvas/30 text-text-primary/70 hover:border-accent/40"
                }`}
              >
                {curr}
              </button>
            ))}
          </div>
        </div>

        {/* Flagship Grid (exactly 3 properties shown on homepage) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {FLAGSHIP_CARDS.slice(0, 3).map((card, i) => (
            <FlagshipCard
              key={card.id}
              card={card}
              currency={currency}
              delayClass={i === 0 ? "delay-100" : i === 1 ? "delay-200" : "delay-300"}
              offset={i === 1 ? "2rem" : undefined}
              parallaxSpeed={i === 0 ? 0.08 : i === 1 ? 0.04 : 0.12}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="flex justify-center mt-14 reveal-on-scroll delay-400">
          <Link
            href="/properties"
            className="inline-flex items-center space-x-3 text-[11px] uppercase tracking-[0.3em] font-plus-jakarta font-semibold text-text-primary border border-accent/20 px-8 py-4 rounded hover:bg-accent/10 hover:border-accent/50 transition-all duration-300 group"
          >
            <span>View All Properties</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
          </Link>
        </div>

      </div>
    </section>
  );
}
