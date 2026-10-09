"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, MailCheck, RefreshCw, ShieldCheck, ArrowLeft, AlertCircle } from "lucide-react";
import { verifyEmail, resendVerification } from "@/lib/api";
import { useSession } from "./SessionProvider";

const inputCls =
  "w-full px-3.5 py-2.5 text-sm bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:bg-[#FFF9E6] focus:outline-none";
const labelCls = "block text-xs font-black mb-1.5 uppercase";

/** Only allow same-site relative redirects (blocks open-redirect abuse). */
const safeNext = (next?: string): string =>
  next && next.startsWith("/") && !next.startsWith("//") ? next : "/profile";

interface VerifyEmailFormProps {
  email: string;
  next?: string;
}

/**
 * OTP screen shown after signup (and when an unverified account tries to
 * sign in): enter the 6-digit code, get signed in. In local dev without the
 * Apps Script relay the API echoes the code as `devCode` — surfaced here so
 * the flow is testable before the relay exists.
 */
export function VerifyEmailForm({ email, next }: VerifyEmailFormProps) {
  const router = useRouter();
  const { refresh } = useSession();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // A devCode handed over by signup/resend survives navigation via storage.
  useEffect(() => {
    const stored = sessionStorage.getItem("ps_devcode");
    if (stored) setDevCode(stored);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCooldown = () => {
    setCooldown(45);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1 && timerRef.current) clearInterval(timerRef.current);
        return Math.max(0, c - 1);
      });
    }, 1000);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await verifyEmail(email, code.trim());
      sessionStorage.removeItem("ps_devcode");
      await refresh();
      toast.success("Email verified — you're signed in!");
      router.push(safeNext(next));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (cooldown > 0) return;
    setBusy(true);
    setError(null);
    try {
      const { devCode: fresh } = await resendVerification(email);
      if (fresh) {
        sessionStorage.setItem("ps_devcode", fresh);
        setDevCode(fresh);
        toast.success("New code generated (dev mode — see hint below).");
      } else {
        toast.success("If that address needs a code, it's on its way.");
      }
      setCode("");
      startCooldown();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't resend the code.");
    } finally {
      setBusy(false);
    }
  };

  // Deep link without an address — nothing to verify against.
  if (!email) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-14 text-center">
        <div className="bg-[#FFFDF8] border-[3.5px] border-black shadow-[8px_8px_0px_#000] rounded-3xl p-8 text-black space-y-3">
          <h1 className="text-xl font-black">No email to verify</h1>
          <p className="text-xs font-bold text-neutral-600">
            Start at sign-up or sign-in and we&apos;ll bring you back here with your code.
          </p>
          <Link
            href="/signin"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#00F0FF] hover:bg-[#00d8e6] text-black font-black text-xs uppercase tracking-wider border-[3px] border-black shadow-[4px_4px_0px_#000] hover:shadow-[1px_1px_0px_#000] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 py-10 sm:py-14 flex flex-col">
      <div className="bg-[#FFFDF8] border-[3.5px] border-black shadow-[8px_8px_0px_#000] rounded-3xl p-6 sm:p-8 text-black">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-dashed border-black/20">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-neutral-600">
            Step 2 of 2 — verify email
          </span>
        </div>

        <div className="w-14 h-14 rounded-2xl bg-[#FFDE59] border-[3px] border-black shadow-[3px_3px_0px_#000] flex items-center justify-center mb-4">
          <MailCheck className="w-7 h-7 text-black" />
        </div>

        <h1 className="text-xl sm:text-2xl font-black leading-tight">Check your inbox</h1>
        <p className="text-xs sm:text-sm font-bold text-neutral-600 mt-2 leading-relaxed">
          We mailed a 6-digit code to{" "}
          <strong className="font-black text-black break-all">{email}</strong>. Enter it below to
          activate your account — it expires in 5 minutes.
        </p>

        {/* Dev relay hint — only ever present without the Apps Script URL */}
        {devCode && (
          <div className="mt-4 p-3 rounded-2xl bg-[#E0F7FA] border-[2.5px] border-black text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              Dev mode (no Apps Script yet): your code is{" "}
              <strong className="font-mono text-sm">{devCode}</strong>
            </span>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3.5 rounded-2xl bg-[#FF5757] border-[2.5px] border-black text-white text-xs font-black shadow-[3px_3px_0px_#000]">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="otp-code" className={labelCls}>
              Verification code
            </label>
            <input
              id="otp-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={6}
              pattern="\d{6}"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className={`${inputCls} text-center font-mono text-2xl tracking-[0.5em] py-4`}
            />
          </div>

          <button
            type="submit"
            disabled={busy || code.length !== 6}
            className="w-full px-6 py-3.5 rounded-2xl bg-[#7ED957] hover:bg-[#6ec947] text-black font-black text-sm uppercase tracking-wider border-[3px] border-black shadow-[4px_4px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying…</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verify &amp; sign in</span>
              </>
            )}
          </button>
        </form>

        {/* Resend + escape hatches */}
        <div className="mt-5 pt-4 border-t-2 border-black/10 flex flex-col gap-3 text-xs font-bold text-neutral-600">
          <button
            type="button"
            onClick={resend}
            disabled={busy || cooldown > 0}
            className="inline-flex items-center justify-center gap-1.5 font-black uppercase tracking-wider text-black hover:text-[#FF5757] disabled:opacity-50 disabled:hover:text-black transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
          </button>
          <div className="flex items-center justify-between gap-2">
            <Link
              href={`/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`}
              className="inline-flex items-center gap-1 hover:text-black"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Different email
            </Link>
            <Link href="/contact" className="underline decoration-dotted underline-offset-2 hover:text-black">
              Email not arriving?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
