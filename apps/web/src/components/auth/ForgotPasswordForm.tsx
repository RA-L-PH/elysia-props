"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  KeyRound,
  MailQuestion,
  RefreshCw,
  ArrowLeft,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";
import { forgotPassword, resetPassword } from "@/lib/api";
import { useSession } from "./SessionProvider";

const inputCls =
  "w-full px-3.5 py-2.5 text-sm bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:bg-[#FFF9E6] focus:outline-none";
const labelCls = "block text-xs font-black mb-1.5 uppercase";

/**
 * Two-step password recovery, both steps on one page:
 *   1. request — address in, code emailed (same 200 either way: no probing)
 *   2. reset   — code + new password; success signs you in everywhere else
 *      is signed out (all sessions die server-side).
 * A `devCode` from the local relay shows as a hint before the Apps Script
 * webhook exists.
 */
export function ForgotPasswordForm() {
  const router = useRouter();
  const { refresh } = useSession();

  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
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

  const requestCode = async (targetEmail: string): Promise<void> => {
    const { devCode: fresh } = await forgotPassword(targetEmail.trim().toLowerCase());
    if (fresh) {
      sessionStorage.setItem("ps_devcode", fresh);
      setDevCode(fresh);
    } else {
      sessionStorage.removeItem("ps_devcode");
      setDevCode(null);
    }
  };

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await requestCode(email);
      toast.success("Check your inbox — if that address has an account, a code is on its way.");
      setStep("reset");
      startCooldown();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start the reset.");
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (cooldown > 0) return;
    setBusy(true);
    setError(null);
    try {
      await requestCode(email);
      toast.success("A fresh code is on its way.");
      startCooldown();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't resend the code.");
    } finally {
      setBusy(false);
    }
  };

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await resetPassword(email.trim().toLowerCase(), code.trim(), password);
      sessionStorage.removeItem("ps_devcode");
      await refresh();
      toast.success("Password updated — you're signed in. Other devices were signed out.");
      router.push("/profile");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password reset failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-10 sm:py-14 flex flex-col">
      <div className="bg-[#FFFDF8] border-[3.5px] border-black shadow-[8px_8px_0px_#000] rounded-3xl p-6 sm:p-8 text-black">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-dashed border-black/20">
          <KeyRound className="w-4 h-4 shrink-0" />
          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-neutral-600">
            {step === "request" ? "Recover access — step 1 of 2" : "Recover access — step 2 of 2"}
          </span>
        </div>

        <div className="w-14 h-14 rounded-2xl bg-[#00F0FF] border-[3px] border-black shadow-[3px_3px_0px_#000] flex items-center justify-center mb-4">
          <MailQuestion className="w-7 h-7 text-black" />
        </div>

        {step === "request" ? (
          <>
            <h1 className="text-xl sm:text-2xl font-black leading-tight">Forgot your password?</h1>
            <p className="text-xs sm:text-sm font-bold text-neutral-600 mt-2 leading-relaxed">
              Give us the address on your account and we&apos;ll email a 6-digit code to prove it&apos;s
              you. No account details are shown on this page.
            </p>

            {error && (
              <div className="mt-4 p-3.5 rounded-2xl bg-[#FF5757] border-[2.5px] border-black text-white text-xs font-black shadow-[3px_3px_0px_#000]">
                {error}
              </div>
            )}

            <form onSubmit={submitRequest} className="mt-5 space-y-4">
              <div>
                <label htmlFor="fp-email" className={labelCls}>
                  Email
                </label>
                <input
                  id="fp-email"
                  type="email"
                  required
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputCls}
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full px-6 py-3.5 rounded-2xl bg-[#00F0FF] hover:bg-[#00d8e6] text-black font-black text-sm uppercase tracking-wider border-[3px] border-black shadow-[4px_4px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {busy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending…</span>
                  </>
                ) : (
                  <>
                    <MailQuestion className="w-4 h-4" />
                    <span>Email me a code</span>
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-xl sm:text-2xl font-black leading-tight">Enter the code</h1>
            <p className="text-xs sm:text-sm font-bold text-neutral-600 mt-2 leading-relaxed">
              We sent a code to <strong className="font-black text-black break-all">{email}</strong>{" "}
              — it expires in 5 minutes. Then choose a new password.
            </p>

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

            <form onSubmit={submitReset} className="mt-5 space-y-4">
              <div>
                <label htmlFor="fp-code" className={labelCls}>
                  Reset code
                </label>
                <input
                  id="fp-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  maxLength={6}
                  pattern="\d{6}"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className={`${inputCls} text-center font-mono text-xl tracking-[0.4em] py-3`}
                />
              </div>

              <div>
                <label htmlFor="fp-password" className={labelCls}>
                  New password <span className="text-[#FF5757]">*</span>
                </label>
                <div className="relative">
                  <input
                    id="fp-password"
                    type={showPw ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className={`${inputCls} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg border-2 border-black bg-[#FFDE59] shadow-[1px_1px_0px_#000] hover:shadow-none transition-all"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="fp-confirm" className={labelCls}>
                  Repeat new password <span className="text-[#FF5757]">*</span>
                </label>
                <input
                  id="fp-confirm"
                  type={showPw ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Type it once more"
                  className={inputCls}
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
                    <span>Updating…</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Set new password</span>
                  </>
                )}
              </button>
            </form>

            <button
              type="button"
              onClick={resend}
              disabled={busy || cooldown > 0}
              className="mt-4 inline-flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wider text-neutral-600 hover:text-black disabled:opacity-50 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </button>
          </>
        )}

        {/* Escape hatches */}
        <div className="mt-5 pt-4 border-t-2 border-black/10 flex items-center justify-between gap-2 text-xs font-bold text-neutral-600">
          <Link
            href={step === "reset" ? "/forgot-password" : "/signin"}
            onClick={() => {
              if (step === "reset") {
                setStep("request");
                setCode("");
                setError(null);
              }
            }}
            className="inline-flex items-center gap-1 hover:text-black"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {step === "reset" ? "Use a different email" : "Back to sign in"}
          </Link>
          <Link
            href="/contact"
            className="underline decoration-dotted underline-offset-2 hover:text-black"
          >
            Need help?
          </Link>
        </div>
      </div>
    </div>
  );
}
