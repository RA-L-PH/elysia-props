"use client";
import React from "react";
import Link from "next/link";
import { Landmark, ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
            Legal Framework
          </span>
          <h1 className="font-cormorant text-4xl md:text-6xl text-text-primary leading-tight font-bold">
            Terms of <span className="italic font-normal text-accent font-persian">Service</span>
          </h1>
          <div className="section-divider my-4" />
        </div>

        <div className="glass-panel p-8 md:p-12 rounded-2xl border border-accent/15 shadow-2xl space-y-8 font-plus-jakarta text-xs text-text-primary/80 leading-relaxed font-light">
          <section className="space-y-3">
            <h2 className="font-cormorant text-lg text-text-primary font-bold uppercase tracking-wider">1. Advisory Limits</h2>
            <p>
              Elysia provides real estate curations and advisory introductions. All structural specifications, blueprint designs, and estimations are for architectural preview and scheduling guidance only, and subject to official developer execution parameters.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-cormorant text-lg text-text-primary font-bold uppercase tracking-wider">2. Discretion Requirement</h2>
            <p>
              Access to selected off-market enclaves and private acquisitions is restricted to clients signing specific NDA protocols. Any unauthorized dissemination of blueprint materials or private pricing is strictly prohibited under local commercial laws.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-cormorant text-lg text-text-primary font-bold uppercase tracking-wider">3. Jurisdiction</h2>
            <p>
              These conditions shall be governed by and construed in accordance with the regulatory and civil laws of the Emirate of Dubai, United Arab Emirates.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
