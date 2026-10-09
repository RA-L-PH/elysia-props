"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { subscribeNewsletter } from "@/lib/api";

/**
 * Footer "join the newsletter" box. Name + email so sends can greet
 * subscribers personally; the API is idempotent so a repeat join just
 * thanks you again instead of erroring.
 */
export function NewsletterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await subscribeNewsletter(name.trim(), email.trim());
      toast.success("You're on the newsletter list!");
      setName("");
      setEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't join — try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full">
      <span className="text-[10px] font-black uppercase tracking-wider text-black">
        Join the newsletter
      </span>
      <input
        type="text"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        aria-label="Your name"
        className="w-full px-3 py-2 text-xs font-bold bg-white border-2 border-black shadow-[2px_2px_0px_#000] rounded-xl focus:bg-[#FFF9E6] focus:outline-none"
      />
      <div className="flex gap-2 w-full">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-label="Email address"
          className="min-w-0 flex-1 px-3 py-2 text-xs font-bold bg-white border-2 border-black shadow-[2px_2px_0px_#000] rounded-xl focus:bg-[#FFF9E6] focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy}
          className="px-3 py-2 rounded-xl bg-[#7ED957] border-2 border-black shadow-[2px_2px_0px_#000] font-black uppercase text-[10px] tracking-wider hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000] transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-60"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          Join
        </button>
      </div>
      <p className="text-[10px] font-bold text-neutral-500">
        Product news &amp; fresh requirements. No spam.
      </p>
    </form>
  );
}
