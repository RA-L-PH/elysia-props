"use client";
import React from "react";
import Link from "next/link";
import { Landmark, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="w-full bg-canvas flex flex-col items-center justify-center py-20 relative overflow-hidden select-none">
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "800px", height: "800px", borderRadius: "50%", background: "radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 65%)", filter: "blur(80px)" }} />
      </div>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center text-center px-6 relative z-10 my-12">
        <div className="space-y-6 max-w-lg glass-panel p-8 md:p-12 rounded-2xl border border-accent/20 shadow-2xl">
          <span className="block text-[10px] uppercase tracking-[0.4em] text-accent font-plus-jakarta font-bold">
            Error Code 404
          </span>
          <h1 className="font-cormorant text-5xl md:text-7xl text-text-primary leading-none font-bold">
            Horizon <br />
            <span className="italic font-normal text-accent font-persian">Lost</span>
          </h1>
          <div className="section-divider mx-auto my-4" />
          <p className="font-plus-jakarta text-xs text-text-primary/70 leading-relaxed font-light">
            The private domain or architectural blueprint you are attempting to access does not exist or has been archived under strict advisory protocols.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center space-x-2.5 text-[10px] uppercase tracking-[0.25em] font-plus-jakarta font-semibold text-canvas bg-accent px-6 py-3.5 rounded hover:bg-accent/95 transition-all duration-300 shadow-lg shadow-accent/20"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Sanctuary</span>
            </Link>
            <Link
              href="/properties"
              className="inline-flex items-center justify-center space-x-2.5 text-[10px] uppercase tracking-[0.25em] font-plus-jakarta font-semibold text-accent border border-accent/30 px-6 py-3.5 rounded hover:bg-accent/10 transition-all duration-300"
            >
              <span>Explore Collection</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
