"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  LogIn,
  UserPlus,
  ArrowLeft,
  Timer,
  KeyRound,
  History,
  Sparkles,
  Zap,
  PencilLine,
  ShieldCheck,
  Mail,
  Eye,
  EyeOff,
} from "lucide-react";
import { ApiError, login, signup } from "@/lib/api";
import { VerifyEmailForm } from "./VerifyEmailForm";
import { useSession } from "./SessionProvider";
import { toast } from "sonner";

interface AuthFormProps {
  mode: "signin" | "signup";
  /** Relative path to return to after auth (defaults to "/"). */
  next?: string;
}

/** Only allow same-site relative redirects (blocks open-redirect abuse). */
const safeNext = (next?: string): string =>
  next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

export function AuthForm({ mode, next }: AuthFormProps) {
  const router = useRouter();
  const { refresh } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newsletter, setNewsletter] = useState(true);
  // Signup accepted (202 + OTP mailed) → the signup page swaps its own body
  // to the code-entry component instead of waiting on a navigation.
  const [verifyFor, setVerifyFor] = useState<string | null>(null);

  const isSignup = mode === "signup";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isSignup && password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (isSignup && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (isSignup && (!firstName.trim() || !lastName.trim())) {
      setError("First and last name are required.");
      return;
    }

    setBusy(true);
    try {
      if (isSignup) {
        const result = await signup({
          email,
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim() || undefined,
          newsletter: newsletter,
        });
        toast.success(`Check your inbox — we mailed a 6-digit code to ${result.email}.`);
        // Local dev without the Apps Script relay hands the code back.
        if (result.devCode) sessionStorage.setItem("ps_devcode", result.devCode);
        // Show the enter-code step right here, immediately…
        setVerifyFor(result.email);
        // …and sync the URL to the verify route so refresh/back behave the
        // same as a direct /verify-email visit.
        router.replace(
          `/verify-email?email=${encodeURIComponent(result.email)}${
            next ? `&next=${encodeURIComponent(next)}` : ""
          }`
        );
        return;
      } else {
        await login(email, password);
        await refresh();
        toast.success("Welcome back!");
      }
      router.push(safeNext(next));
      router.refresh();
    } catch (err) {
      // Unverified account: password was right, but the OTP gate holds —
      // jump to the code screen instead of dead-ending on an error.
      if (err instanceof ApiError && err.code === "EMAIL_NOT_VERIFIED") {
        toast.error(err.message);
        router.push(
          `/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}${
            next ? `&next=${encodeURIComponent(next)}` : ""
          }`
        );
        return;
      }
      setError(err instanceof Error ? err.message : "Something went wrong, try again.");
    } finally {
      setBusy(false);
    }
  };

  const benefitItems = isSignup
    ? [
        {
          icon: Zap,
          title: "No daily cap",
          body: "guests get 2 posts a day — your account posts as many as it needs.",
        },
        {
          icon: PencilLine,
          title: "Edit anything you post",
          body: "change the details or take it down whenever you want.",
        },
        {
          icon: ShieldCheck,
          title: "Work toward the Verified badge",
          body: "the same checkmark top posters wear on the feed.",
        },
      ]
    : [
        {
          icon: History,
          title: "Drafts & where you left off",
          body: "your half-finished post waits for you.",
        },
        {
          icon: Timer,
          title: "Countdown posts",
          body: "see exactly how much time is left before each listing expires.",
        },
        {
          icon: KeyRound,
          title: "Claim & manage",
          body: "bring your Post ID, claim the post, then edit or delete it freely.",
        },
      ];

  // Shared field/tile primitives (neubrutalist tiles)
  const inputCls =
    "w-full px-3.5 py-2.5 text-sm bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:bg-[#FFF9E6] focus:outline-none";
  const tileCls = "rounded-3xl border-[3px] border-black shadow-[4px_4px_0px_#000] p-3.5 sm:p-4";
  const labelCls = "block text-xs font-black mb-1.5 uppercase";

  // ── SIGN UP — bento grid: left column stacks info + name/phone, right
  //   column is one tall credentials tile spanning both rows. Below md the
  //   three tiles stack info → name/phone → credentials.
  if (isSignup) {
    // Step 2 of 2 — signup done, show the code-entry component on this page
    // (the relay takes ~15s to deliver, so this only appears once the server
    // has confirmed the code was actually mailed).
    if (verifyFor) {
      return (
        <div className="w-full flex flex-col justify-center min-h-[calc(100vh-5.5rem)] sm:min-h-[calc(100vh-8.5rem)] px-4 py-8">
          <VerifyEmailForm email={verifyFor} next={next} />
        </div>
      );
    }
    return (
      <div className="w-full max-w-5xl mx-auto px-4 pt-6 sm:pt-8 pb-8 flex flex-col min-h-[calc(100vh-5.5rem)] sm:min-h-[calc(100vh-8.5rem)]">
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 my-auto"
        >
          {/* ── Info — branding, headline, what the account gets ── */}
          <div
            className={`${tileCls} bg-[#FFDE59] flex flex-col gap-2 relative overflow-hidden md:row-start-1 md:col-start-1`}
          >
            {/* Corner sticker (clipped by the card edge on purpose) */}
            <div
              aria-hidden
              className="absolute -right-5 -top-5 w-16 h-16 bg-[#FF5757] border-[3px] border-black rounded-2xl rotate-12 hidden md:flex items-center justify-center"
            >
              <Sparkles className="w-7 h-7 text-white" />
            </div>

            <span className="text-[10px] font-mono font-black uppercase tracking-wider bg-[#00F0FF] px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_#000] inline-block self-start">
              New around here?
            </span>
            <h1 className="text-xl sm:text-2xl font-black md:pr-10">
              Create your account
            </h1>
            <p className="text-xs sm:text-sm font-bold text-neutral-700 leading-relaxed">
              A name, an email and a password — that&apos;s the whole form. Phone is
              optional, and you can post right away.
            </p>

            {/* What your account gets you */}
            <div className="bg-white border-2 border-black rounded-2xl p-3 space-y-1.5 shadow-[2px_2px_0px_#000]">
              <span className="text-[10px] font-black uppercase tracking-wider bg-[#FFDE59] px-2 py-0.5 rounded border border-black inline-block">
                What your account gets you
              </span>
              <ul className="space-y-1.5 text-[11px] font-bold">
                {benefitItems.map(({ icon: Icon, title, body }) => (
                  <li key={title} className="flex items-start gap-2">
                    <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>
                      <strong className="font-black">{title}</strong> — {body}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-[11px] font-bold text-neutral-700 leading-relaxed mt-auto pt-1">
              Free to join. Just the basics — no credit card, no social login, phone
              stays private.
            </p>
          </div>

          {/* ── Identity — first/last name + phone ── */}
          <div
            className={`${tileCls} bg-[#00F0FF] flex flex-col justify-center gap-3 md:row-start-2 md:col-start-1`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="su-first" className={labelCls}>
                  First Name <span className="text-[#FF5757]">*</span>
                </label>
                <input
                  id="su-first"
                  type="text"
                  required
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Maya"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="su-last" className={labelCls}>
                  Last Name <span className="text-[#FF5757]">*</span>
                </label>
                <input
                  id="su-last"
                  type="text"
                  required
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Okonkwo"
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label htmlFor="su-phone" className={labelCls}>
                Phone <span className="text-neutral-700 normal-case font-bold">(optional)</span>
              </label>
              <input
                id="su-phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +1 (555) 019-2834"
                pattern="[0-9+\(\)\s\-]*"
                title="Phone number can only contain digits and + - ( ) characters"
                className={inputCls}
              />
            </div>
          </div>

          {/* ── Credentials — email, passwords, actions, links ── */}
          <div
            className={`${tileCls} bg-white flex flex-col md:row-start-1 md:row-span-2 md:col-start-2`}
          >
            {/* Fields + button — centered in the tall card so the slack
                splits evenly instead of pooling as one dead gap above the
                footer links */}
            <div className="flex-1 flex flex-col justify-center">
            <div className="space-y-3">
              {/* Email */}
              <div>
                <label htmlFor="su-email" className={labelCls}>
                  Email <span className="text-[#FF5757]">*</span>
                </label>
                <input
                  id="su-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputCls}
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="su-password" className={labelCls}>
                  Password <span className="text-[#FF5757]">*</span>
                </label>
                <div className="relative">
                  <input
                    id="su-password"
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
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg border-2 border-black bg-[#FFDE59] shadow-[1px_1px_0px_#000] hover:translate-x-[0.5px] hover:translate-y-[calc(-50%_+_0.5px)] hover:shadow-none transition-all"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] font-bold text-neutral-500 mt-1.5">
                  8 characters minimum — that&apos;s the only rule.
                </p>
              </div>

              {/* Confirm */}
              <div>
                <label htmlFor="su-confirm" className={labelCls}>
                  Repeat Password <span className="text-[#FF5757]">*</span>
                </label>
                <div className="relative">
                  <input
                    id="su-confirm"
                    type={showConfirm ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Type it once more"
                    className={`${inputCls} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg border-2 border-black bg-[#FFDE59] shadow-[1px_1px_0px_#000] hover:translate-x-[0.5px] hover:translate-y-[calc(-50%_+_0.5px)] hover:shadow-none transition-all"
                  >
                    {showConfirm ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Error, right above the trigger */}
            {error && (
              <div className="mt-4 p-3.5 rounded-2xl bg-[#FF5757] border-[2.5px] border-black text-white text-xs font-black shadow-[3px_3px_0px_#000]">
                {error}
              </div>
            )}

            {/* Newsletter opt-in — consent checkbox, default on but easy to spot */}
            <label
              htmlFor="su-newsletter"
              className="mt-4 flex items-start gap-3 p-3 rounded-2xl bg-[#FFF9E6] border-[2.5px] border-black shadow-[2px_2px_0px_#000] cursor-pointer hover:bg-[#FFDE59] transition-colors"
            >
              <input
                id="su-newsletter"
                type="checkbox"
                checked={newsletter}
                onChange={(e) => setNewsletter(e.target.checked)}
                className="mt-0.5 w-4.5 h-4.5 shrink-0 accent-[#FF5757] cursor-pointer"
              />
              <span className="text-[11px] font-bold text-neutral-700 leading-snug">
                <span className="font-black uppercase tracking-wide text-black">
                  Send me the newsletter
                </span>{" "}
                — new requirements, product updates, and event-industry bits. No spam,
                unsubscribe any time.
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={busy}
              className="mt-4 w-full px-6 py-4 rounded-2xl bg-[#FF5757] hover:bg-[#ff3b3b] text-white font-black text-sm uppercase tracking-wider border-[3px] border-black shadow-[4px_4px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {busy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating account &amp; sending code…</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create account</span>
                </>
              )}
            </button>
            </div>

            {/* Switch mode — pinned to the card bottom */}
            <div className="pt-4 border-t-2 border-black/10 text-xs font-bold text-neutral-600 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span>Already have an account?</span>
              <Link
                href={`/signin${next ? `?next=${encodeURIComponent(next)}` : ""}`}
                className="font-black text-black underline decoration-[#FF5757] decoration-2 underline-offset-2 hover:text-[#FF5757]"
              >
                Sign in instead
              </Link>
            </div>

            <Link
              href="/"
              className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-neutral-500 hover:text-black"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to home</span>
            </Link>
          </div>
        </form>
      </div>
    );
  }

  // ── SIGN IN — pitch panel + form card ───────────────────────────────────
  return (
    <div className="w-full max-w-5xl mx-auto px-4 pt-8 sm:pt-12 pb-12 flex flex-col min-h-[calc(100vh-5.5rem)] sm:min-h-[calc(100vh-8.5rem)]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 items-stretch my-auto">
        {/* Left — brand pitch + what you get */}
        <aside className="bg-[#E0F7FA] border-[3.5px] border-black shadow-[8px_8px_0px_#000] rounded-3xl p-6 sm:p-8 flex flex-col gap-5 text-black relative overflow-hidden">
          {/* Corner sticker (clipped by the card edge on purpose) */}
          <div
            aria-hidden
            className="absolute -right-5 -top-5 w-20 h-20 bg-[#FF5757] border-[3px] border-black rounded-2xl rotate-12 hidden md:flex items-center justify-center"
          >
            <Sparkles className="w-8 h-8 text-white" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-mono font-black uppercase tracking-wider bg-[#FFDE59] px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_#000] inline-block">
              Welcome back
            </span>
            <h1 className="text-2xl sm:text-3xl font-black md:pr-10">
              Sign in to PulseStage
            </h1>
            <p className="text-xs sm:text-sm font-bold text-neutral-700 leading-relaxed">
              Pick up right where you left off. Your drafts are waiting.
            </p>
          </div>

          {/* What you get */}
          <div className="bg-white border-2 border-black rounded-2xl p-4 space-y-2.5 shadow-[3px_3px_0px_#000]">
            <span className="text-[10px] font-black uppercase tracking-wider bg-[#FFDE59] px-2 py-0.5 rounded border border-black inline-block">
              Signing in unlocks
            </span>
            <ul className="space-y-2 text-[11px] sm:text-xs font-bold">
              {benefitItems.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex items-start gap-2">
                  <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    <strong className="font-black">{title}</strong> — {body}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[11px] font-bold text-neutral-600 leading-relaxed mt-auto">
            Your session stays on this device until you sign out. Drafts and Post IDs
            never leave your browser.
          </p>
        </aside>

        {/* Right — the form */}
        <div className="bg-[#FFFDF8] border-[3.5px] border-black shadow-[8px_8px_0px_#000] rounded-3xl p-6 sm:p-8 flex flex-col text-black">
          {/* Small header strip so the form column has its own anchor */}
          <div className="flex items-center gap-2 mb-5 pb-3 border-b-2 border-dashed border-black/20">
            <Mail className="w-4 h-4 shrink-0" />
            <span className="text-[10px] font-mono font-black uppercase tracking-wider text-neutral-600">
              Email + password
            </span>
            <span className="ml-auto text-[10px] font-mono font-bold text-neutral-400">
              5 seconds
            </span>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-[#FF5757] border-[2.5px] border-black text-white text-xs font-black shadow-[3px_3px_0px_#000] mb-4">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 flex-1">
            <div>
              <label className="block text-xs font-black mb-1.5 uppercase">
                Email <span className="text-[#FF5757]">*</span>
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputCls}
              />
            </div>

            <div>
              <label htmlFor="si-password" className="block text-xs font-black mb-1.5 uppercase">
                Password <span className="text-[#FF5757]">*</span>
              </label>
              <div className="relative">
                <input
                  id="si-password"
                  type={showPw ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className={`${inputCls} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg border-2 border-black bg-[#FFDE59] shadow-[1px_1px_0px_#000] hover:translate-x-[0.5px] hover:translate-y-[calc(-50%_+_0.5px)] hover:shadow-none transition-all"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex justify-end mt-1.5">
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-black uppercase tracking-wider text-neutral-500 hover:text-[#FF5757] underline decoration-dotted underline-offset-2"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full px-6 py-3.5 rounded-2xl bg-[#FF5757] hover:bg-[#ff3b3b] text-white font-black text-sm uppercase tracking-wider border-[3px] border-black shadow-[4px_4px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {busy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign in</span>
                </>
              )}
            </button>
          </form>

          {/* Switch mode */}
          <div className="pt-4 mt-4 border-t-2 border-black/10 text-xs font-bold text-neutral-600 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>New to PulseStage?</span>
            <Link
              href={`/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`}
              className="font-black text-black underline decoration-[#FF5757] decoration-2 underline-offset-2 hover:text-[#FF5757]"
            >
              Create an account
            </Link>
          </div>

          <Link
            href="/"
            className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-neutral-500 hover:text-black"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
