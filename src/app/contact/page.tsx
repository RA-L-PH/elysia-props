"use client";

import React, { useState } from "react";
import { MessageSquare, Phone, MapPin, ChevronDown, CheckCircle, ArrowRight } from "lucide-react";

export default function Contact() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [tier, setTier] = useState<string>("25m-50m");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const faqs = [
    {
      q: "How do I access off-market listings?",
      a: "Our private inventory is reserved exclusively for pre-screened clients. Once a standard NDA request is submitted and certified by our brokerage desk, a representative will contact you with secure login details.",
    },
    {
      q: "Can I acquire property using cryptocurrency?",
      a: "Yes, Elysia Properties Dubai supports direct cryptocurrency escrows (including BTC, ETH, and USDT) compliant with local UAE financial authorities.",
    },
    {
      q: "What is the procedure for international buyers?",
      a: "International buyers are eligible for UAE Golden Visas with acquisitions starting at AED 2,000,000. Our in-house legal team coordinates all documentation and visa applications remotely.",
    },
    {
      q: "Do you offer private custom design upgrades?",
      a: "Absolutely. Through our Aurelia Privé service, buyers can consult our lead architect to modify floor layouts, select custom stone imports, or request private helipad licensing.",
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 md:px-12 py-12 space-y-16">
      
      {/* HEADER SECTION */}
      <section className="text-center max-w-xl mx-auto space-y-4">
        <span className="text-xs uppercase tracking-[0.3em] text-accent font-plus-jakarta">
          Private Acquisition Desk
        </span>
        <h1 className="font-cormorant text-4xl md:text-6xl text-text-primary leading-tight">
          Begin Your Private <br />
          <span className="font-persian italic text-accent font-normal">Acquisition</span>
        </h1>
      </section>

      {/* SPLIT SCREEN 50/50 LAYOUT */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
        
        {/* LEFT: VIP Inquiry Form */}
        <div className="glass-panel p-8 rounded-lg border border-accent/15 flex flex-col justify-center h-full">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-8">
              <h2 className="font-cormorant text-2xl text-text-primary mb-6">VIP Request Desk</h2>

              {/* Full Name Input */}
              <div className="relative w-full">
                <input
                  type="text"
                  required
                  placeholder="Full Name / Entity"
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField(null)}
                  className="w-full bg-transparent border-b border-accent/20 py-3 text-xs tracking-wider font-plus-jakarta focus:outline-none text-text-primary placeholder-text-primary/40"
                />
                <span
                  className={`absolute bottom-0 left-0 w-full h-[1.5px] bg-accent transition-transform duration-500 origin-center ${
                    focusedField === "name" ? "scale-x-100" : "scale-x-0"
                  }`}
                />
              </div>

              {/* Email Input */}
              <div className="relative w-full">
                <input
                  type="email"
                  required
                  placeholder="Secure Email Address"
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  className="w-full bg-transparent border-b border-accent/20 py-3 text-xs tracking-wider font-plus-jakarta focus:outline-none text-text-primary placeholder-text-primary/40"
                />
                <span
                  className={`absolute bottom-0 left-0 w-full h-[1.5px] bg-accent transition-transform duration-500 origin-center ${
                    focusedField === "email" ? "scale-x-100" : "scale-x-0"
                  }`}
                />
              </div>

              {/* Investment Tier Chips */}
              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-widest text-accent font-plus-jakarta block">
                  Target Investment Capital
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "10m-25m", label: "AED 10M–25M" },
                    { id: "25m-50m", label: "AED 25M–50M" },
                    { id: "50m+", label: "AED 50M+" },
                  ].map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => setTier(chip.id)}
                      className={`py-2 px-1 text-[9px] font-plus-jakarta uppercase tracking-wider rounded border transition-all duration-300 ${
                        tier === chip.id
                          ? "border-accent bg-accent/15 text-accent"
                          : "border-accent/15 hover:border-accent/40 text-text-primary/70"
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div className="relative w-full">
                <textarea
                  rows={3}
                  placeholder="Describe your portfolio intent or request list..."
                  onFocus={() => setFocusedField("message")}
                  onBlur={() => setFocusedField(null)}
                  className="w-full bg-transparent border-b border-accent/20 py-3 text-xs tracking-wider font-plus-jakarta focus:outline-none text-text-primary placeholder-text-primary/40 resize-none"
                />
                <span
                  className={`absolute bottom-0 left-0 w-full h-[1.5px] bg-accent transition-transform duration-500 origin-center ${
                    focusedField === "message" ? "scale-x-100" : "scale-x-0"
                  }`}
                />
              </div>

              {/* Submit NDA Button with magnetic hover effect */}
              <button
                type="submit"
                className="w-full py-4 bg-accent text-canvas text-[10px] font-plus-jakarta uppercase tracking-[0.2em] font-bold rounded shadow-lg hover:shadow-accent/20 transition-all duration-500 hover:tracking-[0.25em]"
              >
                Submit NDA Request
              </button>
            </form>
          ) : (
            <div className="py-12 text-center space-y-6">
              <CheckCircle className="w-16 h-16 text-accent mx-auto animate-bounce" />
              <h3 className="font-cormorant text-2xl text-text-primary">Request Submitted</h3>
              <p className="font-plus-jakarta text-xs text-text-primary/80 leading-relaxed font-light max-w-sm mx-auto">
                Your NDA and private inquiry have been forwarded to the Private Desk. A certified luxury advisor will establish secure communications within 2 hours.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="px-6 py-2.5 border border-accent text-[9px] uppercase tracking-widest text-accent font-plus-jakarta rounded hover:bg-accent/5"
              >
                Submit Another Request
              </button>
            </div>
          )}
        </div>

        {/* RIGHT: Office Details + Map Embed (equal height container) */}
        <div className="flex flex-col gap-8 h-full">
          
          {/* Office Details */}
          <div className="glass-panel p-6 rounded-lg border border-accent/15 space-y-4 text-left">
            <h3 className="font-cormorant text-2xl text-text-primary">DIFC Luxury Lounge</h3>
            
            <div className="space-y-3 text-xs font-plus-jakarta text-text-primary/80 font-light">
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-accent mt-0.5" />
                <span>The Gate District, East Wing Level 4, Dubai International Financial Centre (DIFC)</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-accent" />
                <span>+971 (4) 888-AURELIA</span>
              </div>
              <div className="flex items-center space-x-3">
                <MessageSquare className="w-4 h-4 text-accent" />
                <span>info@elysiaproperties.ae</span>
              </div>
            </div>

            {/* Direct WhatsApp Action Button */}
            <div className="pt-2">
              <a
                href="https://wa.me/97148880000"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 py-3 px-6 border border-emerald-500/30 bg-emerald-500/10 rounded text-[10px] font-plus-jakarta uppercase tracking-wider text-emerald-500 hover:bg-emerald-500/25 transition-all duration-300"
              >
                <span>Direct WhatsApp Chat</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Luxury custom-styled Map Embed (Stretches to fill vertical height) */}
          <div className="w-full flex-1 min-h-[250px] relative rounded-lg overflow-hidden border border-accent/20">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14436.438515093761!2d55.27592476537704!3d25.21639016147492!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f43348a6d2457%3A0x2655f448c5dfc6a3!2sDIFC!5e0!3m2!1sen!2sae!4v1680000000000!5m2!1sen!2sae"
              width="100%"
              height="100%"
              style={{
                border: 0,
                position: "absolute",
                top: 0,
                left: 0,
                filter: "invert(90%) hue-rotate(180deg) contrast(120%) saturate(20%) brightness(85%)"
              }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

        </div>

      </section>

      {/* PRIVATE BROKERAGE ACCORDION FAQ */}
      <section className="border-t border-accent/15 pt-12 text-left">
        <h2 className="font-cormorant text-3xl text-text-primary text-center mb-12">Private Brokerage FAQ</h2>
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border-b border-accent/10">
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full py-5 flex items-center justify-between text-left focus:outline-none group"
              >
                <span className="font-cormorant text-md md:text-lg text-text-primary group-hover:text-accent transition-colors font-medium">
                  {faq.q}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-accent transition-transform duration-300 ${
                    activeFaq === idx ? "transform rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-500 ${
                  activeFaq === idx ? "max-h-40 pb-5" : "max-h-0"
                }`}
              >
                <p className="font-plus-jakarta text-xs text-text-primary/75 leading-relaxed font-light">
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
