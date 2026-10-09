"use client";

import { useEffect, useState } from "react";
import { Loader2, Send, Users, Sparkles, AlertCircle } from "lucide-react";
import {
  fetchNewsletterSubscribers,
  sendNewsletter,
  NewsletterSubscriber,
} from "@/lib/api";
import { toast } from "sonner";

const inputCls =
  "w-full px-3.5 py-2.5 text-sm bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:bg-[#FFF9E6] focus:outline-none";
const labelCls = "block text-xs font-black mb-1.5 uppercase";

/**
 * Admin newsletter composer: raw HTML in, personalised broadcast out.
 * Server replaces {{firstName}} / {{name}} / {{email}} per recipient and
 * appends the branded PulseStage footer — this panel only composes.
 */
export function NewsletterComposer() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [busy, setBusy] = useState(false);
  const [armed, setArmed] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchNewsletterSubscribers()
      .then((list) => {
        setSubscribers(list);
        // Everyone checked by default; untick to narrow the blast.
        setSelected(new Set(list.map((s) => s.email)));
      })
      .catch(() => setSubscribers([])); // non-fatal: send still works
  }, []);

  const allSelected =
    subscribers.length > 0 && selected.size === subscribers.length;

  const toggleAll = () =>
    setSelected(
      allSelected ? new Set() : new Set(subscribers.map((s) => s.email))
    );

  const toggleOne = (email: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });

  const send = async () => {
    if (!subject.trim() || html.trim().length < 20) {
      toast.error("A subject and a proper HTML body are required.");
      return;
    }
    if (selected.size === 0) {
      toast.error("Tick at least one recipient.");
      return;
    }
    if (!armed) {
      setArmed(true);
      setTimeout(() => setArmed(false), 5000);
      return;
    }
    setBusy(true);
    setArmed(false);
    try {
      const result = await sendNewsletter(subject.trim(), html, [...selected]);
      toast.success(
        result.failed > 0
          ? `Sent to ${result.sent}, failed for ${result.failed} of ${result.total}.`
          : `Newsletter sent to ${result.total} subscriber${result.total === 1 ? "" : "s"}.`
      );
      if (result.failed === 0) {
        setSubject("");
        setHtml("");
        setShowPreview(false);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Newsletter send failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white border-[3px] border-black shadow-[5px_5px_0px_#000] rounded-3xl overflow-hidden">
      <div className="px-5 py-3.5 border-b-2 border-black bg-[#E0F7FA] flex items-center gap-2">
        <Sparkles className="w-4 h-4" />
        <span className="text-xs font-black uppercase tracking-wider">Newsletter blast</span>
        <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-black text-[10px] font-black uppercase">
          <Users className="w-3 h-3" />
          {subscribers.length} subscriber{subscribers.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <label htmlFor="nl-subject" className={labelCls}>
            Subject <span className="text-[#FF5757]">*</span>
          </label>
          <input
            id="nl-subject"
            type="text"
            maxLength={150}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Hey {{firstName}} — 12 new requirements this week"
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor="nl-html" className={labelCls}>
            HTML body <span className="text-[#FF5757]">*</span>
          </label>
          <textarea
            id="nl-html"
            rows={10}
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            placeholder={'<h2>Hi {{firstName}}!</h2>\n<p>Fresh requirements just landed…</p>'}
            className={`${inputCls} font-mono text-xs resize-y leading-relaxed`}
          />
        </div>

        {/* Token cheat-sheet */}
        <div className="p-3 rounded-2xl bg-[#FFF9E6] border-2 border-black text-[11px] font-bold space-y-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider inline-block px-2 py-0.5 rounded bg-[#FFDE59] border border-black">
            Personalisation
          </span>
          <p className="text-neutral-600 leading-relaxed">
            Use <code className="font-mono font-black">{"{{firstName}}"}</code>,{" "}
            <code className="font-mono font-black">{"{{name}}"}</code>, or{" "}
            <code className="font-mono font-black">{"{{email}}"}</code> — swapped per subscriber in
            the <strong>subject line</strong> and the HTML body. A{" "}
            <strong>PulseStage</strong> footer with the support link is appended automatically.
          </p>
        </div>

        {/* ── Recipient selection (checkboxes) ── */}
        <div className="p-3 rounded-2xl bg-[#E0F7FA] border-2 border-black space-y-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-wider inline-block px-2 py-0.5 rounded bg-white border border-black">
              Send to
            </span>
            <span className="text-[11px] font-black">
              {selected.size} of {subscribers.length} selected
            </span>
            <div className="ml-auto flex gap-1.5">
              <button
                type="button"
                onClick={toggleAll}
                disabled={subscribers.length === 0}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#FFDE59] text-black font-black text-[10px] uppercase border-2 border-black transition-colors disabled:opacity-50"
              >
                {allSelected ? "None" : "All"}
              </button>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                disabled={selected.size === 0}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#FFDE59] text-black font-black text-[10px] uppercase border-2 border-black transition-colors disabled:opacity-50"
              >
                Clear
              </button>
            </div>
          </div>

          {subscribers.length === 0 ? (
            <p className="text-xs font-bold text-neutral-500">
              No subscribers yet — the footer join box and signup opt-ins land
              here.
            </p>
          ) : (
            <ul className="max-h-44 overflow-y-auto space-y-1 pr-1">
              {subscribers.map((s) => (
                <li key={s.email}>
                  <label className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl bg-white border-2 border-black/15 hover:border-black cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={selected.has(s.email)}
                      onChange={() => toggleOne(s.email)}
                      aria-label={`Send to ${s.email}`}
                      className="w-4 h-4 accent-black shrink-0 cursor-pointer"
                    />
                    <span className="text-xs font-bold truncate">{s.email}</span>
                    <span className="ml-auto text-[9px] font-black uppercase text-neutral-400 shrink-0">
                      {s.source === "signup" ? "signup" : "footer"}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        {showPreview && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
              Preview (first subscriber&apos;s tokens)
            </span>
            <iframe
              title="Newsletter preview"
              sandbox=""
              srcDoc={html}
              className="w-full h-64 rounded-2xl border-[2.5px] border-black bg-white"
            />
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            disabled={!html}
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-neutral-100 text-black font-black text-xs uppercase tracking-wider border-[2.5px] border-black shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] transition-all disabled:opacity-50"
          >
            {showPreview ? "Hide preview" : "Preview"}
          </button>
          <button
            type="button"
            onClick={send}
            disabled={busy || selected.size === 0}
            className={`flex-1 min-w-[220px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider border-[2.5px] border-black shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-50 ${
              armed ? "bg-[#FF5757] text-white" : "bg-[#7ED957] hover:bg-[#6ec947] text-black"
            }`}
          >
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending…
              </>
            ) : subscribers.length === 0 ? (
              "No subscribers yet"
            ) : selected.size === 0 ? (
              "Select recipients first"
            ) : armed ? (
              <>
                <AlertCircle className="w-4 h-4" />
                Click again to send to {selected.size}
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send to {selected.size} selected
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
