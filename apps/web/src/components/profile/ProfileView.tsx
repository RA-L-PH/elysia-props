"use client";

import Link from "next/link";
import { LogIn, UserRound, FileText } from "lucide-react";
import { useSession } from "@/components/auth/SessionProvider";
import { ProfileCard } from "./ProfileCard";
import { PostManagementSuite } from "@/components/manage/PostManagementSuite";

/**
 * Account-home layout for /profile. Previously BOTH child components carried
 * their own signed-out state, so guests saw two competing "Sign in" cards
 * side by side. Exactly one guest card now lives here; signed-in users get
 * the two-column layout (sticky identity card + post management suite).
 */
export function ProfileView() {
  const { user, loading } = useSession();

  if (loading) {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 xl:items-start" aria-busy="true">
        <div className="xl:col-span-1 xl:sticky xl:top-24">
          <div className="p-5 rounded-3xl bg-white border-[3px] border-black shadow-[5px_5px_0px_#000] space-y-4">
            <div className="h-4 w-24 rounded-lg bg-neutral-200 border-2 border-black animate-pulse" />
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-neutral-200 border-[3px] border-black animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-2/3 rounded-lg bg-neutral-200 border-2 border-black animate-pulse" />
                <div className="h-3.5 w-1/2 rounded-lg bg-neutral-200 border-2 border-black animate-pulse" />
              </div>
            </div>
          </div>
        </div>
        <div className="xl:col-span-3 min-w-0 space-y-5">
          <div className="h-9 w-56 rounded-lg bg-neutral-200 border-2 border-black animate-pulse" />
          <div className="h-44 rounded-3xl bg-neutral-200 border-[3px] border-black animate-pulse" />
        </div>
      </div>
    );
  }

  // ── Signed out: ONE card covering both promises (profile + post mgmt) ──
  if (!user) {
    return (
      <div className="max-w-3xl mx-auto p-8 sm:p-10 rounded-3xl bg-[#FFF9E6] border-[3px] border-black shadow-[6px_6px_0px_#000] space-y-5 text-center">
        <div className="flex items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-[#FFDE59] border-[3px] border-black shadow-[3px_3px_0px_#000] flex items-center justify-center">
            <UserRound className="w-7 h-7 text-black" />
          </div>
          <div className="w-14 h-14 rounded-2xl bg-[#00F0FF] border-[3px] border-black shadow-[3px_3px_0px_#000] flex items-center justify-center">
            <FileText className="w-7 h-7 text-black" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black">You&apos;re browsing as a guest</h1>
          <p className="text-sm font-bold text-neutral-600 max-w-lg mx-auto leading-relaxed">
            Sign in to see your profile details and manage every requirement you&apos;ve posted —
            applicant counts, pause/resume intake, edits, and deletions in one place.
          </p>
        </div>
        <Link
          href="/signin?next=/profile"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#00F0FF] hover:bg-[#00d8e6] text-black font-black text-xs uppercase tracking-wider border-[3px] border-black shadow-[4px_4px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          <LogIn className="w-4 h-4" />
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 xl:items-start">
      <div className="xl:col-span-1 xl:sticky xl:top-24">
        <ProfileCard />
      </div>
      <div className="xl:col-span-3 min-w-0">
        <PostManagementSuite />
      </div>
    </div>
  );
}
