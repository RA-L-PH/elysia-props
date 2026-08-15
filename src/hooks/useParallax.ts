"use client";
import { useEffect, useState } from "react";

/**
 * Section-relative parallax hook.
 * Computes a translateY offset based on how far the section's centre
 * is from the viewport centre. GPU-accelerated via will-change: transform.
 * On mobile/touch devices, JS-based parallax is disabled (returns 0) to ensure
 * smooth, native scrolling.
 *
 * @param sectionRef  Ref attached to the section / container element.
 * @param speed       Multiplier. Negative → element drifts UP as you scroll down.
 */
export function useParallax(
  sectionRef: React.RefObject<HTMLElement | null>,
  speed: number,
  maxOffset: number = 75
): number {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    // Disable JS calculations completely on touch/mobile to prevent scroll jitter
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setOffset(0);
      return;
    }

    const update = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const sectionMid = rect.top + rect.height / 2;
      const viewMid = window.innerHeight / 2;
      
      const computed = (sectionMid - viewMid) * speed;
      const clamped = Math.min(Math.max(computed, -maxOffset), maxOffset);
      setOffset(clamped);
    };

    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, [sectionRef, speed, maxOffset]);

  return offset;
}

/**
 * Computes 0→1 scroll progress for a section as it enters the viewport.
 */
export function useSectionProgress(
  sectionRef: React.RefObject<HTMLElement | null>
): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const wh = window.innerHeight;
      if (rect.top < wh && rect.bottom > 0) {
        setProgress(Math.min(Math.max((wh - rect.top) / rect.height, 0), 1));
      }
    };

    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, [sectionRef]);

  return progress;
}

/** Registers a global IntersectionObserver for .reveal-on-scroll elements. */
export function useRevealObserver() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("reveal-active");
        }),
      { threshold: 0, rootMargin: "0px 0px -60px 0px" }
    );
    document
      .querySelectorAll(".reveal-on-scroll, .reveal-left, .reveal-right, .reveal-scale")
      .forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}
