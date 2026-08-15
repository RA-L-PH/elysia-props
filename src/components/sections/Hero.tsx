"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { BG_VIEWS } from "@/lib/constants";

interface Props {
  scrollY: number;
  mousePos: { x: number; y: number };
}

export default function Hero({ scrollY, mousePos }: Props) {
  const [activeViewIndex, setActiveViewIndex] = useState(0);

  // Auto-cycle carousel
  useEffect(() => {
    const id = setInterval(() => setActiveViewIndex((p) => (p + 1) % BG_VIEWS.length), 6000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative h-[80vh] md:h-[95vh] w-full flex items-center justify-center overflow-hidden bg-canvas select-none pt-12">

      {/* ── BG layers — each at slightly different parallax rate ── */}
      {BG_VIEWS.map((view, idx) => (
        <div
          key={idx}
          className="absolute inset-0 transition-opacity duration-[1200ms] ease-in-out"
          style={{
            opacity: activeViewIndex === idx ? 0.95 : 0,
            transform: "translate3d(0, 0, 0) scale(1)",
            zIndex: 0,
          }}
        >
          <Image
            src={view.image}
            alt={view.name}
            fill
            sizes="100vw"
            className="object-cover"
            priority={idx === 0}
            unoptimized
          />
        </div>
      ))}

      {/* ── Foreground depth layer — always static ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 10,
        }}
      >
        <Image src="/images/foreground.png" alt="" fill sizes="100vw" className="object-cover" priority unoptimized />
      </div>

      {/* ── Middle depth skyline — medium speed overlay ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `translate3d(0, ${scrollY * 0.12}px, 0) scale(1.15)`,
          willChange: "transform",
          zIndex: 5,
          opacity: 0.15,
          mixBlendMode: "overlay",
        }}
      >
        <Image src="/images/skyline.jpg" alt="" fill sizes="100vw" className="object-cover" priority unoptimized />
      </div>

      {/* ── Vignette + fade-to-canvas ── */}
      <div
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_30%,rgba(0,0,0,0.85)_100%)] mix-blend-multiply"
        style={{ zIndex: 15 }}
      />
      <div
        className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-canvas/20 to-canvas"
        style={{ zIndex: 16 }}
      />

      {/* ── Carousel dots ── */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex space-x-3 z-30">
        {BG_VIEWS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActiveViewIndex(idx)}
            className={`h-3 rounded-full transition-all duration-500 ${
              activeViewIndex === idx ? "bg-accent w-8" : "bg-white/40 w-3 hover:bg-white/70"
            }`}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>

      {/* ── Center caption ── */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 text-center px-4 pointer-events-none flex flex-col items-center w-full">
        <span className="block text-[9px] uppercase tracking-[0.4em] text-accent font-plus-jakarta font-semibold mb-3 bg-canvas/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-accent/20">
          Aurelia Privé Collection
        </span>
        <h1
          className="font-cormorant font-bold text-text-primary tracking-wide leading-none"
          style={{ fontSize: "clamp(2rem, 4.5vw + 0.8rem, 3.75rem)" }}
        >
          Choose your
          <span
            className="block font-persian text-accent normal-case tracking-normal -mt-2 md:-mt-4"
            style={{ fontSize: "clamp(3.5rem, 7.5vw + 1.5rem, 7rem)" }}
          >
            view
          </span>
        </h1>
      </div>

      {/* ── Property label badge — stays static relative to section ── */}
      <div
        className="absolute bottom-28 md:bottom-10 right-4 left-4 md:left-auto md:right-20 z-30 flex flex-col items-center md:items-end text-center md:text-right bg-canvas/60 backdrop-blur-md p-3 md:p-4 rounded border border-accent/15 scale-90 md:scale-100"
      >
        <span className="text-[8px] uppercase tracking-[0.3em] text-accent font-plus-jakarta font-bold mb-1">
          Active Horizon
        </span>
        <h2 className="font-cormorant text-md md:text-lg text-text-primary font-semibold tracking-wider">
          {BG_VIEWS[activeViewIndex]?.name}
        </h2>
        <span className="text-[9px] uppercase tracking-wider text-accent font-plus-jakarta font-light mt-0.5">
          {BG_VIEWS[activeViewIndex]?.label}
        </span>
      </div>

      {/* ── Scroll indicator ── */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
        <span className="text-[8px] uppercase tracking-[0.2em] text-accent font-plus-jakarta mb-1">Scroll</span>
        <div className="w-[1px] h-6 bg-accent/30 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-accent animate-bounce" />
        </div>
      </div>
    </section>
  );
}
