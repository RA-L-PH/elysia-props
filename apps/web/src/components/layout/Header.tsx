"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  PlusCircle,
  Terminal,
  Compass,
  LogIn,
  LogOut,
  ShieldCheck,
  FileText,
  Menu as MenuIcon,
  User,
  X,
  ChevronDown,
} from "lucide-react";
import { useWizardStore } from "@/store/wizardStore";
import { useSession } from "@/components/auth/SessionProvider";
import { toast } from "sonner";

/** Base pill styling shared by every nav item. */
const pillBase =
  "px-2.5 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black border-[2.5px] border-black transition-all flex items-center gap-1.5";
const pillIdle = "bg-white text-black shadow-[3px_3px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px]";

/** Row inside the account dropdown / phone sheet. */
const menuItem =
  "w-full text-left px-3 py-2.5 rounded-xl text-xs font-black border-2 border-black bg-white shadow-[2px_2px_0px_#000] hover:bg-[#FFDE59] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center gap-2";

export function Header() {
  const pathname = usePathname();
  const { toggleInspector, category } = useWizardStore();
  const { user, loading, signOut } = useSession();

  // Account dropdown (desktop) + hamburger sheet (phones) — independent so a
  // resize never leaves a stale panel open.
  const [accountOpen, setAccountOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement | null>(null);

  // Any navigation closes both panels.
  useEffect(() => {
    setAccountOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  // Click-outside + Escape close the desktop dropdown.
  useEffect(() => {
    if (!accountOpen) return;
    const onDown = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAccountOpen(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [accountOpen]);

  const handleSignOut = async () => {
    setAccountOpen(false);
    setMenuOpen(false);
    await signOut();
    toast.success("Signed out");
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FFFDF8] border-b-[3.5px] border-black shadow-[0_4px_0px_rgba(0,0,0,1)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-2">
        {/* Brand: PS mark + PULSESTAGE wordmark (images from /public) */}
        <Link href="/" aria-label="PulseStage — home" className="flex items-center gap-1.5 sm:gap-3 group shrink-0">
          <span className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl overflow-hidden flex items-center justify-center group-hover:translate-x-[2px] group-hover:translate-y-[2px] transition-all">
            <Image
              src="/logo.png"
              alt=""
              width={545}
              height={458}
              priority
              className="w-full h-full object-contain"
            />
          </span>
          <Image
            src="/wordmark.png"
            alt="PulseStage"
            width={1189}
            height={210}
            priority
            className="h-4 sm:h-6 w-auto whitespace-nowrap"
          />
        </Link>

        {/* ---------- Desktop nav (sm+): two links + account dropdown ---------- */}
        <nav className="hidden sm:flex items-center gap-2 lg:gap-3">
          <Link
            href="/requirements"
            className={`${pillBase} ${pathname === "/requirements" ? "bg-[#00F0FF] text-black shadow-[3px_3px_0px_#000]" : pillIdle}`}
          >
            <Compass className="w-4 h-4 shrink-0" />
            <span>Browse Feed</span>
          </Link>

          <Link
            href="/post"
            className={`${pillBase} ${pathname === "/post" ? "bg-[#FF5757] text-white shadow-[3px_3px_0px_#000]" : "bg-[#FFDE59] text-black shadow-[3px_3px_0px_#000] hover:bg-[#ffd633] hover:translate-x-[1px] hover:translate-y-[1px]"}`}
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>Post Requirement</span>
          </Link>

          {loading ? (
            <div
              aria-hidden
              className="w-10 h-10 rounded-xl bg-neutral-200 border-[2.5px] border-black animate-pulse"
            />
          ) : user ? (
            /* One dropdown holds everything account-related — keeps the bar short. */
            <div ref={accountRef} className="relative">
              <button
                type="button"
                onClick={() => setAccountOpen((v) => !v)}
                aria-expanded={accountOpen}
                aria-haspopup="menu"
                aria-label="Account menu"
                title={`Signed in as ${user.email}`}
                className={`${pillBase} ${accountOpen ? "bg-[#FF66C4] text-white shadow-[3px_3px_0px_#000]" : pillIdle}`}
              >
                <LogIn className="w-4 h-4 shrink-0" />
                <span className="max-w-[9rem] truncate">{user.email.split("@")[0]}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 shrink-0 transition-transform ${accountOpen ? "rotate-180" : ""}`}
                />
              </button>

              {accountOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-60 bg-[#FFFDF8] border-[3px] border-black shadow-[6px_6px_0px_#000] rounded-2xl p-2 space-y-1.5 z-50"
                >
                  <Link role="menuitem" href="/profile" className={menuItem}>
                    <User className="w-4 h-4 shrink-0" />
                    Profile
                  </Link>
                  {user.role === "admin" && (
                    <Link role="menuitem" href="/admin" className={menuItem}>
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      Admin dashboard
                    </Link>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={toggleInspector}
                    className={menuItem}
                  >
                    <Terminal className="w-4 h-4 shrink-0" />
                    Dev Inspector
                    <span className="ml-auto px-1.5 py-0.5 rounded-md bg-[#FFDE59] text-[10px] border border-black">
                      {category}
                    </span>
                  </button>
                  <button type="button" role="menuitem" onClick={handleSignOut} className={menuItem}>
                    <LogOut className="w-4 h-4 shrink-0" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/signin" className={`${pillBase} ${pathname === "/signin" ? "bg-[#00F0FF] shadow-[3px_3px_0px_#000]" : pillIdle}`}>
                <LogIn className="w-4 h-4 shrink-0" />
                <span>Sign in</span>
              </Link>
              {/* Dev aid — only worth its pixels on big screens. */}
              <button
                onClick={toggleInspector}
                title="Toggle Live State & Schema Inspector"
                aria-label="Toggle live state inspector"
                className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-black bg-white border-[2.5px] border-black shadow-[3px_3px_0px_#000] hover:bg-[#7ED957] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
              >
                <Terminal className="w-4 h-4 shrink-0" />
                <span>Dev Inspector</span>
              </button>
            </>
          )}
        </nav>

        {/* ---------- Phone nav: primary CTA + hamburger ---------- */}
        <nav className="flex sm:hidden items-center gap-2">
          <Link
            href="/post"
            aria-label="Post a new requirement"
            className={`${pillBase} ${pathname === "/post" ? "bg-[#FF5757] text-white shadow-[3px_3px_0px_#000]" : "bg-[#FFDE59] text-black shadow-[3px_3px_0px_#000]"}`}
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>Post</span>
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border-[2.5px] border-black shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all"
          >
            {menuOpen ? (
              <X className="w-5 h-5 text-black" />
            ) : (
              <MenuIcon className="w-5 h-5 text-black" />
            )}
          </button>
        </nav>
      </div>

      {/* ---------- Phone sheet — everything else, stacked ---------- */}
      {menuOpen && (
        <div className="sm:hidden border-t-2 border-black/10 bg-[#FFFDF8] px-3 py-3 space-y-2">
          <Link href="/requirements" className={menuItem}>
            <Compass className="w-4 h-4 shrink-0" />
            Browse Feed
          </Link>
          {!loading && user && (
            <Link href="/profile" className={menuItem}>
              <User className="w-4 h-4 shrink-0" />
              Profile
            </Link>
          )}
          {!loading && user?.role === "admin" && (
            <Link href="/admin" className={menuItem}>
              <ShieldCheck className="w-4 h-4 shrink-0" />
              Admin dashboard
            </Link>
          )}
          {loading ? (
            <div aria-hidden className="h-10 rounded-xl bg-neutral-200 border-2 border-black animate-pulse" />
          ) : user ? (
            <button type="button" onClick={handleSignOut} className={menuItem}>
              <LogOut className="w-4 h-4 shrink-0" />
              Sign out — {user.email.split("@")[0]}
            </button>
          ) : (
            <Link href="/signin" className={menuItem}>
              <LogIn className="w-4 h-4 shrink-0" />
              Sign in
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
