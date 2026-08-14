"use client";
import React from "react";
import Link from "next/link";
import { Landmark } from "lucide-react";

export default function Footer() {
  return (
    <footer className="py-16 bg-canvas border-t border-accent/10 relative z-[1]">
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Brand Column */}
        <div className="space-y-4">
          <Link href="/" className="flex items-center space-x-2">
            <Landmark className="w-5 h-5 text-accent" />
            <span className="font-italiana text-lg text-text-primary tracking-widest font-semibold uppercase">
              Elysia
            </span>
          </Link>
          <p className="font-plus-jakarta text-xs text-text-primary/60 leading-relaxed font-light">
            Bespoke real estate curation and NDA-secured advisory services for high-ticket investments in Dubai's premier enclaves.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-cormorant text-md text-text-primary font-bold mb-4 uppercase tracking-wider">
            Collection
          </h4>
          <ul className="space-y-2.5">
            {["The Oasis by Emaar", "DAMAC Islands", "The World Islands", "Dubai Creek Harbour", "Palm Jumeirah"].map((item) => (
              <li key={item}>
                <Link
                  href="/properties"
                  className="font-plus-jakarta text-xs text-text-primary/50 hover:text-accent transition-colors font-light"
                >
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Advisory */}
        <div>
          <h4 className="font-cormorant text-md text-text-primary font-bold mb-4 uppercase tracking-wider">
            Advisory Desk
          </h4>
          <ul className="space-y-2.5">
            <li>
              <Link
                href="/contact"
                className="font-plus-jakarta text-xs text-text-primary/50 hover:text-accent transition-colors font-light"
              >
                NDA Consultation
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="font-plus-jakarta text-xs text-text-primary/50 hover:text-accent transition-colors font-light"
              >
                Bespoke Blueprints
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="font-plus-jakarta text-xs text-text-primary/50 hover:text-accent transition-colors font-light"
              >
                Private Concierge
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact info */}
        <div>
          <h4 className="font-cormorant text-md text-text-primary font-bold mb-4 uppercase tracking-wider">
            Inquiries
          </h4>
          <p className="font-plus-jakarta text-xs text-text-primary/50 leading-relaxed font-light">
            6th Floor, Urbana Business Park,<br />
            Golf Course Road, Sector 67<br />
            <span className="block mt-2 text-accent font-semibold">+91-8810286629</span>
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 mt-12 pt-8 border-t border-accent/5 flex flex-col md:flex-row justify-between items-center text-[10px] font-plus-jakarta text-text-primary/40 uppercase tracking-widest gap-4">
        <span>© {new Date().getFullYear()} Elysia Private Desk. All Rights Reserved.</span>
        <div className="flex space-x-6">
          <Link href="/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-accent transition-colors">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
