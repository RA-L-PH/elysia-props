"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Send, LifeBuoy, CheckCircle2 } from "lucide-react";
import { submitSupportMessage } from "@/lib/api";
import { useSession } from "@/components/auth/SessionProvider";

const inputCls =
  "w-full px-3.5 py-2.5 text-sm bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:bg-[#FFF9E6] focus:outline-none";
const labelCls = "block text-xs font-black mb-1.5 uppercase";

/**
 * Public contact form — posts into the `support` collection (admins read it
 * on /admin). Signed-in visitors get their name + email pre-filled.
 */
export function ContactForm() {
  const { user, loading } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      setName((n) => n || `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim());
      setEmail((e) => e || user.email);
    }
  }, [user, loading]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await submitSupportMessage({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject.trim() || undefined,
        message: message.trim(),
      });
      setSent(true);
      toast.success("Message sent — we'll get back to you by email.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send your message.");
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="p-6 sm:p-8 rounded-3xl bg-[#7ED957] border-[3px] border-black shadow-[6px_6px_0px_#000] text-black text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-white border-[3px] border-black shadow-[3px_3px_0px_#000] flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-7 h-7 text-black" />
        </div>
        <h2 className="text-xl font-black">Message received</h2>
        <p className="text-xs font-bold leading-relaxed max-w-sm mx-auto">
          The PulseStage team reads every message — we&apos;ll reply to{" "}
          <strong className="break-all">{email}</strong>, usually within one working day.
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setMessage("");
            setSubject("");
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white hover:bg-neutral-100 text-black font-black text-xs uppercase tracking-wider border-[2.5px] border-black shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] transition-all"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="p-6 sm:p-8 rounded-3xl bg-white border-[3px] border-black shadow-[6px_6px_0px_#000] space-y-4 text-black">
      <div className="flex items-center gap-2 pb-3 border-b-2 border-dashed border-black/20">
        <LifeBuoy className="w-4 h-4 shrink-0" />
        <span className="text-[10px] font-mono font-black uppercase tracking-wider text-neutral-600">
          Write to the team
        </span>
        <span className="ml-auto text-[10px] font-mono font-bold text-neutral-400">1 minute</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="ct-name" className={labelCls}>
            Your name <span className="text-[#FF5757]">*</span>
          </label>
          <input
            id="ct-name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Maya Okonkwo"
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="ct-email" className={labelCls}>
            Email <span className="text-[#FF5757]">*</span>
          </label>
          <input
            id="ct-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label htmlFor="ct-subject" className={labelCls}>
          Subject <span className="text-neutral-500 normal-case font-bold">(optional)</span>
        </label>
        <input
          id="ct-subject"
          type="text"
          maxLength={150}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="What's this about?"
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="ct-message" className={labelCls}>
          Message <span className="text-[#FF5757]">*</span>
        </label>
        <textarea
          id="ct-message"
          required
          rows={6}
          maxLength={5000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us what's going on — account help, a bad listing, feedback, anything."
          className={`${inputCls} resize-y leading-relaxed`}
        />
        <p className="text-[10px] font-bold text-neutral-400 mt-1 text-right">
          {message.length}/5000
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-2xl bg-[#FF5757] border-[2.5px] border-black text-white text-xs font-black shadow-[3px_3px_0px_#000]">
          {error}
        </div>
      )}

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
            <Send className="w-4 h-4" />
            <span>Send message</span>
          </>
        )}
      </button>
    </form>
  );
}
