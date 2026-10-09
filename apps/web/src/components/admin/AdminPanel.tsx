"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Gavel,
  Inbox,
  Loader2,
  LogIn,
  Mail,
  Newspaper,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useSession } from "@/components/auth/SessionProvider";
import { AdminOverview } from "./AdminOverview";
import { AdminUsers } from "./AdminUsers";
import { AdminSubscribers } from "./AdminSubscribers";
import { NewsletterComposer } from "./NewsletterComposer";
import { SupportInbox } from "./SupportInbox";
import { AdminModeration } from "./AdminModeration";

/**
 * Admin dashboard shell: four tabs — Overview (aggregate stats), Users
 * (verified posters), Newsletter (composer + recipients), Support (inbox).
 *
 * Scope note: admins manage PEOPLE and PLATFORM, never other users' posts —
 * no endpoint behind this panel exposes per-post management.
 */
type Tab = "overview" | "users" | "newsletter" | "support" | "moderation";

const tabs: Array<{ id: Tab; label: string; icon: typeof BarChart3 }> = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "users", label: "Users", icon: Users },
  { id: "newsletter", label: "Newsletter", icon: Mail },
  { id: "support", label: "Support", icon: Inbox },
  { id: "moderation", label: "Moderation", icon: Gavel },
];

export function AdminPanel() {
  const { user, loading } = useSession();
  const [tab, setTab] = useState<Tab>("overview");

  // Auth gate: spinner while the session resolves, marketing copy for
  // guests and non-admins (never a broken panel).
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-24" aria-busy="true">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="font-black text-sm">Checking your pass…</span>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="max-w-md mx-auto text-center py-16 px-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FFE066] border-2 border-black font-black text-xs uppercase tracking-wider mb-6">
          <ShieldAlert className="w-4 h-4" />
          Admins only
        </div>

        <h1 className="font-black text-4xl md:text-5xl mb-3">Access denied.</h1>

        <p className="font-bold text-sm md:text-base text-neutral-600 mb-8 leading-relaxed">
          The admin dashboard stays closed — verified posters, newsletter
          recipients, and support messages live beyond this door.
        </p>

        {!user && (
          <Link
            href="/signin?next=/admin"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#7ED957] font-black text-sm uppercase border-[3px] border-black shadow-[5px_5px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
          >
            <LogIn className="w-4 h-4" />
            Sign in
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-16">
      {/* ── Header ── */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFDE59] border-2 border-black font-black text-xs uppercase tracking-widest mb-4">
          <ShieldCheck className="w-3.5 h-3.5" />
          PulseStage Admin
        </div>
        <h1 className="font-black text-4xl md:text-5xl mb-2">Admin dashboard</h1>
        <p className="font-bold text-sm md:text-base text-neutral-600 max-w-2xl">
          The pulse of the platform: accounts and verified posters, the HTML
          newsletter and its recipients, and everything the support inbox has
          collected.
        </p>
      </div>

      {/* ── Tab bar ── */}
      <nav
        aria-label="Admin sections"
        className="flex gap-2 mb-6 overflow-x-auto pb-1 -mx-1 px-1"
      >
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(id)}
              className={`shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider border-[2.5px] border-black transition-all ${
                active
                  ? "bg-[#FFDE59] shadow-[3px_3px_0px_#000]"
                  : "bg-white shadow-[2px_2px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] text-neutral-500 hover:text-black"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          );
        })}
      </nav>

      {/* ── Active tab (each fetches its own data on mount) ── */}
      <div role="tabpanel">
        {tab === "overview" && <AdminOverview />}
        {tab === "users" && <AdminUsers />}
        {tab === "newsletter" && (
          <div className="space-y-5">
            <NewsletterComposer />
            <AdminSubscribers />
          </div>
        )}
        {tab === "support" && <SupportInbox />}
        {tab === "moderation" && <AdminModeration />}
      </div>

      {/* ── Scope footnote ── */}
      <p className="mt-8 text-[11px] font-bold text-neutral-400 flex items-center gap-1.5">
        <Newspaper className="w-3 h-3 shrink-0" />
        Admins manage users, the newsletter, and support — post ownership stays
        with its author.
      </p>
    </div>
  );
}
