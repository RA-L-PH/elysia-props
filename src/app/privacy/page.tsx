"use client";
import React from "react";
import Link from "next/link";
import { Landmark, ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="w-full bg-canvas flex flex-col relative overflow-hidden select-none pb-20">
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translate(-50%, -50%)", width: "800px", height: "800px", borderRadius: "50%", background: "radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 65%)", filter: "blur(80px)" }} />
      </div>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-12 relative z-10 w-full space-y-12">
        <div className="space-y-4 text-center md:text-left">
          <span className="text-[10px] uppercase tracking-[0.35em] text-accent font-plus-jakarta font-bold">
            Protocol Security
          </span>
          <h1 className="font-cormorant text-4xl md:text-6xl text-text-primary leading-tight font-bold">
            Privacy <span className="italic font-normal text-accent font-persian">Protocol</span>
          </h1>
          <div className="section-divider my-4" />
        </div>

        <div className="glass-panel p-8 md:p-12 rounded-2xl border border-accent/15 shadow-2xl space-y-8 font-plus-jakarta text-xs text-text-primary/80 leading-relaxed font-light">
          <section className="space-y-3">
            <h2 className="font-cormorant text-lg text-text-primary font-bold uppercase tracking-wider">1. NDA Encryption</h2>
            <p>
              Elysia operates on complete discretionary protocols. All private data, financial portfolios, and inquiry communications are stored on localized, encrypted systems. We do not disclose buyer profiles or transactional records to third parties without prior executive signing.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-cormorant text-lg text-text-primary font-bold uppercase tracking-wider">2. Data Acquisition</h2>
            <p>
              We collect information explicitly provided during private desk consultations or brokerage registrations (e.g., identity, asset allocation requests, contact coordinates). Ambient metadata is used solely to optimize application responsiveness and visual fidelity across client devices.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-cormorant text-lg text-text-primary font-bold uppercase tracking-wider">3. Retentional Integrity</h2>
            <p>
              All client profiles are reviewed annually. You may request immediate purging of your contact parameters and advisory details at any time by contacting our desk at <span className="text-accent font-semibold">inquiries@elysiaprivedesk.com</span>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
