"use client";

import { useEffect, useState } from "react";
import { Cookie, Check, X } from "lucide-react";

const CONSENT_KEY = "pulsestage_cookie_consent";

/**
 * Neubrutalist cookie-consent popup. Explains WHY cookies/local storage are
 * used — remembering where you left off (wizard drafts), keeping you signed
 * in, and saving Post IDs on your device — and records the visitor's choice.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(CONSENT_KEY)) {
        // Let the first paint settle so the banner slides in politely.
        const t = setTimeout(() => setVisible(true), 600);
        return () => clearTimeout(t);
      }
    } catch {
      /* storage blocked — show it anyway so the choice can be made */
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  const decide = (choice: "accepted" | "declined") => {
    try {
      localStorage.setItem(CONSENT_KEY, choice);
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-[60] bg-[#FFFDF8] border-[3.5px] border-black shadow-[7px_7px_0px_#000] rounded-3xl p-5 space-y-4 text-black animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 shrink-0 rounded-xl bg-[#FFDE59] border-[2.5px] border-black shadow-[2px_2px_0px_#000] flex items-center justify-center">
          <Cookie className="w-5 h-5 text-black" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-sm sm:text-base font-black">Cookies, but useful ones</h3>
          <p className="text-[11px] sm:text-xs font-bold text-neutral-700 leading-relaxed">
            We use cookies &amp; local storage to{" "}
            <strong className="font-black">remember where you left off</strong> — your
            wizard draft, your sign-in, and Post IDs saved on this device. Nothing
            leaves your browser for ads.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5">
        <button
          type="button"
          onClick={() => decide("accepted")}
          className="flex-1 px-4 py-2.5 rounded-2xl bg-[#7ED957] hover:bg-[#6bc944] text-black font-black text-xs uppercase tracking-wider border-[2.5px] border-black shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center justify-center gap-1.5"
        >
          <Check className="w-4 h-4" />
          <span>Accept cookies</span>
        </button>
        <button
          type="button"
          onClick={() => decide("declined")}
          className="flex-1 px-4 py-2.5 rounded-2xl bg-white hover:bg-neutral-100 text-black font-black text-xs uppercase tracking-wider border-[2.5px] border-black shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center justify-center gap-1.5"
        >
          <X className="w-4 h-4" />
          <span>Decline</span>
        </button>
      </div>
    </div>
  );
}
