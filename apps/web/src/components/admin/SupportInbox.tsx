"use client";

import { useEffect, useState } from "react";
import { Loader2, Inbox, Mail, RefreshCw } from "lucide-react";
import { fetchSupportMessages, setSupportStatus, SupportMessage } from "@/lib/api";
import { toast } from "sonner";

/**
 * Support tab: everything submitted through /contact lands in the `support`
 * collection — newest first, capped at 50 by the API. Triage with
 * mark read/unread; the unread count feeds the dashboard overview.
 */
export function SupportInbox() {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setFetching(true);
    setError(null);
    try {
      setMessages(await fetchSupportMessages());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleStatus = async (m: SupportMessage) => {
    const next = m.status === "new" ? "read" : "new";
    setBusyId(m._id);
    try {
      await setSupportStatus(m._id, next);
      setMessages((prev) =>
        prev.map((x) => (x._id === m._id ? { ...x, status: next } : x))
      );
      toast.success(next === "read" ? "Marked as read." : "Marked as unread.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update message");
    } finally {
      setBusyId(null);
    }
  };

  const unread = messages.filter((m) => m.status === "new").length;

  return (
    <div className="bg-white border-[3px] border-black shadow-[5px_5px_0px_#000] rounded-3xl overflow-hidden">
      <div className="px-5 py-3.5 border-b-2 border-black bg-[#FFF9E6] flex items-center gap-2">
        <Inbox className="w-4 h-4" />
        <span className="text-xs font-black uppercase tracking-wider">
          Support messages ({messages.length})
        </span>
        {unread > 0 && (
          <span className="px-2 py-0.5 rounded-lg bg-[#FF5757] text-white border border-black text-[10px] font-black uppercase">
            {unread} unread
          </span>
        )}
        <button
          type="button"
          onClick={load}
          disabled={fetching}
          aria-label="Refresh messages"
          className="ml-auto p-1.5 rounded-lg bg-white border-2 border-black shadow-[1px_1px_0px_#000] hover:shadow-none hover:translate-x-[0.5px] hover:translate-y-[0.5px] transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${fetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 text-xs font-black text-[#FF5757]">{error}</div>
      )}

      {fetching ? (
        <div className="p-8 flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-black">Loading messages…</span>
        </div>
      ) : messages.length === 0 ? (
        <div className="p-8 text-center text-xs font-bold text-neutral-600">
          No messages yet — contact-form submissions land here.
        </div>
      ) : (
        <ul className="divide-y-2 divide-black/10 max-h-[520px] overflow-y-auto">
          {messages.map((m) => (
            <li
              key={m._id}
              className={`px-5 py-4 space-y-2 ${m.status === "new" ? "bg-[#FFFDF8]" : ""}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-black text-sm">{m.name}</span>
                <a
                  href={`mailto:${m.email}`}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-500 hover:text-black break-all"
                >
                  <Mail className="w-3 h-3 shrink-0" />
                  {m.email}
                </a>
                {m.status === "new" && (
                  <span className="px-2 py-0.5 rounded-lg bg-[#FF5757] text-white border border-black text-[10px] font-black uppercase">
                    New
                  </span>
                )}
                <span className="ml-auto text-[10px] font-bold text-neutral-400">
                  {m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}
                </span>
              </div>
              {m.subject && (
                <p className="text-xs font-black uppercase tracking-wide">{m.subject}</p>
              )}
              <p className="text-xs font-bold text-neutral-700 leading-relaxed whitespace-pre-wrap">
                {m.message}
              </p>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => toggleStatus(m)}
                  disabled={busyId === m._id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FFDE59] text-black font-black text-[10px] uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-50"
                >
                  {busyId === m._id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Inbox className="w-3 h-3" />
                  )}
                  {m.status === "new" ? "Mark read" : "Mark unread"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
