"use client";
import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { VIP_SERVICES } from "@/lib/constants";

export default function VIPConcierge() {
  return (
    <section className="py-24 border-t border-accent/10 relative z-[1]">
      
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 text-center mb-16 space-y-4 reveal-on-scroll">
        <span className="text-xs uppercase tracking-[0.3em] text-accent font-plus-jakarta">Private Access</span>
        <h2 className="font-cormorant text-text-primary" style={{ fontSize: "clamp(1.75rem, 3.5vw + 0.5rem, 3rem)" }}>
          Elysia <span className="font-persian text-accent normal-case tracking-normal italic">Privé</span> Desk
        </h2>
        <div className="section-divider mx-auto" />
      </div>

      {/* Services Grid */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        {VIP_SERVICES.map(({ title, body, cta, href }, i) => (
          <div
            key={i}
            className={`glass-panel p-8 rounded-xl border border-accent/10 relative overflow-hidden space-y-5 reveal-on-scroll ${
              i === 0 ? "delay-100" : i === 1 ? "delay-200" : "delay-300"
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full border border-accent/20 flex items-center justify-center bg-accent/5">
                <ShieldCheck className="w-4 h-4 text-accent" />
              </div>
              <h3 className="font-cormorant text-lg text-text-primary tracking-wide">{title}</h3>
            </div>
            <p className="font-plus-jakarta text-xs text-text-primary/70 leading-relaxed font-light">
              {body}
            </p>
            <div className="pt-2">
              <Link
                href={href}
                className="inline-flex items-center space-x-2 text-[10px] uppercase tracking-[0.2em] font-plus-jakarta text-accent hover:text-white transition-colors group"
              >
                <span>{cta}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            {/* Subtle grid lines */}
            <div className="absolute top-0 right-0 w-16 h-[1px] bg-accent/10" />
            <div className="absolute top-0 right-0 w-[1px] h-16 bg-accent/10" />
          </div>
        ))}
      </div>

    </section>
  );
}
