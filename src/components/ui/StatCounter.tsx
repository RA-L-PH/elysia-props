"use client";
import { useEffect, useRef, useState } from "react";

interface StatCounterProps {
  target: number;
  suffix: string;
  label: string;
}

export default function StatCounter({ target, suffix, label }: StatCounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true;
          const duration = 2000;
          const step = (ts: number, t0: number) => {
            const p = Math.min((ts - t0) / duration, 1);
            setCount(Math.round((1 - Math.pow(1 - p, 3)) * target));
            if (p < 1) requestAnimationFrame((t) => step(t, t0));
          };
          requestAnimationFrame((t) => step(t, t));
        }
      },
      { threshold: 0 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);

  return (
    <div ref={ref} className="text-center">
      <div
        className="font-cormorant font-bold stat-shimmer"
        style={{ fontSize: "clamp(2rem, 4vw + 0.5rem, 3rem)" }}
      >
        {count.toLocaleString()}
        {suffix}
      </div>
      <div className="text-[10px] uppercase tracking-[0.25em] font-plus-jakarta text-text-primary/60 mt-1">
        {label}
      </div>
    </div>
  );
}
