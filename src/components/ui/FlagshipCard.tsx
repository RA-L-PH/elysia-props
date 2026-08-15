"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useParallax } from "@/hooks/useParallax";
import { RATES, SYMBOLS, type Currency } from "@/lib/constants";

export interface CardData {
  id: number;
  location: string;
  name: string;
  beds: number;
  baths: number;
  priceAED: number;
  images: string[];
  area: string;
  handover: string;
  tag: string | null;
}

interface Props {
  card: CardData;
  currency: Currency;
  delayClass: string;
  offset?: string;
  /** Parallax speed for the image inside the card (0.04 – 0.12 recommended) */
  parallaxSpeed: number;
}

export default function FlagshipCard({ card, currency, delayClass, offset, parallaxSpeed }: Props) {
  const [thumbIdx, setThumbIdx] = useState(0);
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const fmt = (p: number) =>
    `${SYMBOLS[currency]}${Math.round(p * RATES[currency]).toLocaleString("en-US")}`;

  return (
    <div
      ref={cardRef}
      onMouseLeave={() => setHovered(false)}
      onMouseEnter={() => setHovered(true)}
      className={`glass-panel rounded-xl overflow-hidden relative cursor-pointer transition-all duration-500 shadow-2xl border border-accent/10 ${delayClass} reveal-on-scroll gold-card-hover`}
      style={{ ...(offset ? { marginTop: offset } : {}) }}
    >
      {/* Private Access badge */}
      {card.tag && (
        <div className="absolute top-4 right-4 z-30 bg-canvas/90 backdrop-blur-md px-2.5 py-1 rounded border border-accent/30 text-[9px] uppercase tracking-widest text-accent font-bold flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span>{card.tag}</span>
        </div>
      )}

      {/* ── Image area ─────────────────────────────────────────── */}
      <div className="relative h-72 w-full overflow-hidden">
        {/* Container wrapper — clips the zooming image */}
        <div
          className="absolute inset-0 transition-transform duration-500 ease-out"
          style={{
            transform: `scale(${hovered ? 1.05 : 1})`,
          }}
        >
          {card.images.map((src, i) => (
            <div
              key={i}
              className="absolute inset-0 transition-opacity duration-700"
              style={{ opacity: thumbIdx === i ? 1 : 0 }}
            >
              <Image
                src={src}
                alt={`${card.name} view ${i + 1}`}
                fill
                sizes="33vw"
                className="object-cover"
                unoptimized
              />
            </div>
          ))}
        </div>

        {/* Bottom gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-canvas/80 via-canvas/10 to-transparent z-10" />

        {/* Thumbnail strip — appears on hover */}
        <div
          className="absolute bottom-3 left-1/2 z-20 flex space-x-2 transition-all duration-500"
          style={{
            opacity: hovered ? 1 : 0,
            transform: `translateX(-50%) translateY(${hovered ? "0" : "8px"})`,
          }}
        >
          {card.images.map((src, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setThumbIdx(i); }}
              className={`w-12 h-8 rounded overflow-hidden border-2 transition-all duration-300 ${
                thumbIdx === i ? "border-accent scale-110" : "border-white/30 opacity-70"
              }`}
            >
              <div className="relative w-full h-full">
                <Image src={src} alt="" fill className="object-cover" unoptimized />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Card body ──────────────────────────────────────────── */}
      <div className="p-5 space-y-3 relative" style={{ transform: "translateZ(25px)" }}>
        <div>
          <span className="text-[10px] tracking-wider uppercase font-plus-jakarta text-accent">
            {card.location}
          </span>
          <h3 className="font-cormorant text-xl text-text-primary mt-0.5 leading-tight">
            {card.name}
          </h3>
        </div>

        {/* Spec bar */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-accent/10">
          <div className="text-center">
            <div className="text-[11px] font-bold font-plus-jakarta text-text-primary">{card.beds}</div>
            <div className="text-[9px] uppercase tracking-wider text-text-primary/50 font-plus-jakarta">Beds</div>
          </div>
          <div className="text-center border-x border-accent/10">
            <div className="text-[11px] font-bold font-plus-jakarta text-text-primary">{card.area}</div>
            <div className="text-[9px] uppercase tracking-wider text-text-primary/50 font-plus-jakarta">Sq.Ft</div>
          </div>
          <div className="text-center">
            <div className="text-[11px] font-bold font-plus-jakarta text-text-primary">{card.handover}</div>
            <div className="text-[9px] uppercase tracking-wider text-text-primary/50 font-plus-jakarta">Handover</div>
          </div>
        </div>

        {/* Price row */}
        <div className="flex justify-between items-end pt-1">
          <span className="font-italiana text-lg text-accent tracking-wider">{fmt(card.priceAED)}</span>
          <span className="text-[9px] font-plus-jakarta text-text-primary/40 uppercase tracking-wider">
            {card.baths} Baths
          </span>
        </div>

        {/* Slide-up CTA */}
        <div className="relative overflow-hidden">
          <div className="card-cta-panel">
            <Link
              href="/properties"
              className="w-full flex items-center justify-between px-4 py-3 bg-accent/10 border border-accent/30 rounded text-[10px] font-plus-jakarta uppercase tracking-[0.2em] text-accent hover:bg-accent/20 transition-colors group/cta"
            >
              <span>Explore Blueprint & Specs</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
