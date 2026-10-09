"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Mail, RefreshCw, Trash2, Users } from "lucide-react";
import {
  fetchNewsletterSubscribers,
  removeNewsletterSubscriber,
  NewsletterSubscriber,
} from "@/lib/api";
import { toast } from "sonner";

const sourceChip = (source: string): string =>
  source === "signup"
    ? "bg-[#E0F7FA] border-black"
    : "bg-[#FFF9E6] border-black/60";

/**
 * Recipients tab: everyone on the mailing list — how they joined, when —
 * with one-click removal. The composer sends to exactly this roster.
 */
export function AdminSubscribers() {
  const [subs, setSubs] = useState<NewsletterSubscriber[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setFetching(true);
    setError(null);
    try {
      setSubs(await fetchNewsletterSubscribers());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load subscribers");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (email: string) => {
    setRemoving(email);
    try {
      await removeNewsletterSubscriber(email);
      setSubs((prev) => prev.filter((s) => s.email !== email));
      toast.success(`${email} removed from the newsletter.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove subscriber");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="bg-white border-[3px] border-black shadow-[5px_5px_0px_#000] rounded-3xl overflow-hidden">
      <div className="px-5 py-3.5 border-b-2 border-black bg-[#FFF9E6] flex items-center gap-2">
        <Users className="w-4 h-4" />
        <span className="text-xs font-black uppercase tracking-wider">
          Recipients ({subs.length})
        </span>
        <button
          type="button"
          onClick={load}
          disabled={fetching}
          aria-label="Refresh recipients"
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
          <span className="text-sm font-black">Loading recipients…</span>
        </div>
      ) : subs.length === 0 ? (
        <div className="p-8 text-center text-xs font-bold text-neutral-600">
          No subscribers yet — the footer join box and signup opt-ins land here.
        </div>
      ) : (
        <ul className="divide-y-2 divide-black/10 max-h-[520px] overflow-y-auto">
          {subs.map((s) => (
            <li key={s.email} className="px-5 py-3.5 flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 shrink-0 rounded-xl bg-[#FFDE59] border-2 border-black flex items-center justify-center text-[11px] font-black">
                {(s.firstName || s.email)[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black truncate">{s.email}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded border text-[9px] font-black uppercase shrink-0 ${sourceChip(
                      s.source
                    )}`}
                  >
                    {s.source === "signup" ? "via signup" : "footer"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-400">
                  <span className="truncate">
                    {s.firstName || s.lastName
                      ? `${s.firstName} ${s.lastName}`.trim()
                      : "no name"}
                  </span>
                  {s.subscribedAt && (
                    <>
                      <span>·</span>
                      <span className="shrink-0">
                        joined {new Date(s.subscribedAt).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => remove(s.email)}
                disabled={removing === s.email}
                aria-label={`Remove ${s.email} from the newsletter`}
                className="shrink-0 p-2 rounded-xl bg-white hover:bg-[#FF5757] hover:text-white text-[#FF5757] border-2 border-[#FF5757] shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-50"
              >
                {removing === s.email ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="px-5 py-3 border-t-2 border-black/10 bg-[#FFFDF8] flex items-center gap-1.5 text-[10px] font-bold text-neutral-500">
        <Mail className="w-3 h-3" />
        Sends go through the Apps Script relay as{" "}
        <strong className="text-black">PulseStage</strong> — 25 emails per batch, failures
        reported per send.
      </div>
    </div>
  );
}
