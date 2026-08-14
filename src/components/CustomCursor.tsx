"use client";

import React, { useState, useEffect } from "react";

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [trailPosition, setTrailPosition] = useState({ x: -100, y: -100 });
  const [hovered, setHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "BUTTON" ||
        target.tagName === "A" ||
        target.closest("a") ||
        target.closest("button") ||
        target.classList.contains("cursor-pointer") ||
        target.getAttribute("role") === "button"
      ) {
        setHovered(true);
      } else {
        setHovered(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, [isVisible]);

  // Trail interpolation for smooth lag
  useEffect(() => {
    let animationFrameId: number;

    const updateTrail = () => {
      setTrailPosition((prev) => {
        const dx = position.x - prev.x;
        const dy = position.y - prev.y;
        return {
          x: prev.x + dx * 0.15,
          y: prev.y + dy * 0.15,
        };
      });
      animationFrameId = requestAnimationFrame(updateTrail);
    };

    animationFrameId = requestAnimationFrame(updateTrail);
    return () => cancelAnimationFrame(animationFrameId);
  }, [position]);

  if (!isVisible) return null;

  return (
    <>
      {/* Center Dot */}
      <div
        className="fixed w-1.5 h-1.5 bg-accent rounded-full pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-150 ease-out hidden md:block"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          scale: hovered ? "0" : "1",
        }}
      />
      {/* Lagging Ring */}
      <div
        className="fixed rounded-full border pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out hidden md:block"
        style={{
          left: `${trailPosition.x}px`,
          top: `${trailPosition.y}px`,
          width: hovered ? "52px" : "26px",
          height: hovered ? "52px" : "26px",
          backgroundColor: hovered ? "rgba(212, 175, 55, 0.08)" : "transparent",
          borderColor: hovered ? "rgba(212, 175, 55, 0.85)" : "rgba(212, 175, 55, 0.4)",
        }}
      />
    </>
  );
}
