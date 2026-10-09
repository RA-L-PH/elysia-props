"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Ban,
  Gavel,
  Loader2,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Undo2,
} from "lucide-react";
import {
  fetchModerationSettings,
  updateModerationSettings,
  fetchFlaggedPosts,
  banUser,
  unbanUser,
  ModerationSettings,
  FlaggedPost,
} from "@/lib/api";
import { useSession } from "@/components/auth/SessionProvider";
import { toast } from "sonner";

const cardCls =
  "bg-white border-[3px] border-black shadow-[5px_5px_0px_#000] rounded-3xl overflow-hidden";
const headCls =
  "px-5 py-3.5 border-b-2 border-black bg-[#FFF9E6] flex items-center gap-2";
const headText = "text-xs font-black uppercase tracking-wider";
const inputCls =
  "w-full px-3 py-2 text-sm font-black bg-white border-[2.5px] border-black rounded-xl focus:bg-[#FFF9E6] focus:outline-none";

/** Severity colour for a report count vs. the current threshold. */
const countTone = (count: number, threshold: number): string =>
  count > threshold
    ? "bg-[#FF5757] text-white"
    : count >= Math.max(2, threshold - 2)
      ? "bg-[#FFDE59] text-black"
      : "bg-neutral-100 text-black";

/**
 * Moderation tab: the four tunable numbers (report threshold, ban length,
 * and the monthly report allowances for signed-in / guest reporters), the
 * flagged-posts queue for manual review, and one-click ban/unban.
 * Auto-rule: crossing the threshold removes the post and suspends its
 * poster for `banDays` — all numbers editable here, instantly.
 */
export function AdminModeration() {
  const { user: me } = useSession();
  const [settings, setSettings] = useState<ModerationSettings | null>(null);
  const [thresholdInput, setThresholdInput] = useState("");
  const [banDaysInput, setBanDaysInput] = useState("");
  const [quotaUserInput, setQuotaUserInput] = useState("");
  const [quotaGuestInput, setQuotaGuestInput] = useState("");
  const [flagged, setFlagged] = useState<FlaggedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingRules, setSavingRules] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rules, posts] = await Promise.all([
        fetchModerationSettings(),
        fetchFlaggedPosts(),
      ]);
      setSettings(rules);
      setThresholdInput(String(rules.reportThreshold));
      setBanDaysInput(String(rules.banDays));
      setQuotaUserInput(String(rules.reportQuotaUser));
      setQuotaGuestInput(String(rules.reportQuotaGuest));
      setFlagged(posts);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load moderation data"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveRules = async () => {
    const threshold = Number(thresholdInput);
    const banDays = Number(banDaysInput);
    const quotaUser = Number(quotaUserInput);
    const quotaGuest = Number(quotaGuestInput);
    if (!Number.isInteger(threshold) || threshold < 1 || threshold > 100) {
      toast.error("Report threshold must be a whole number between 1 and 100.");
      return;
    }
    if (!Number.isInteger(banDays) || banDays < 1 || banDays > 365) {
      toast.error("Ban length must be a whole number between 1 and 365 days.");
      return;
    }
    if (!Number.isInteger(quotaUser) || quotaUser < 1 || quotaUser > 100) {
      toast.error(
        "The signed-in allowance must be a whole number between 1 and 100."
      );
      return;
    }
    if (!Number.isInteger(quotaGuest) || quotaGuest < 1 || quotaGuest > 100) {
      toast.error(
        "The guest allowance must be a whole number between 1 and 100."
      );
      return;
    }
    setSavingRules(true);
    try {
      const saved = await updateModerationSettings({
        reportThreshold: threshold,
        banDays,
        reportQuotaUser: quotaUser,
        reportQuotaGuest: quotaGuest,
      });
      setSettings((prev) => (prev ? { ...prev, ...saved } : prev));
      toast.success(
        `Rules saved — removal after more than ${saved.reportThreshold} report${saved.reportThreshold === 1 ? "" : "s"}; bans last ${saved.banDays} day${saved.banDays === 1 ? "" : "s"}; reporters get ${saved.reportQuotaUser}/month signed in, ${saved.reportQuotaGuest}/month as guests.`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save rules");
    } finally {
      setSavingRules(false);
    }
  };

  const ban = async (row: FlaggedPost) => {
    if (!row.ownerId) return;
    setBusyId(row.ownerId);
    try {
      await banUser(
        row.ownerId,
        settings?.banDays,
        `Banned after their post drew ${row.count} reports`
      );
      setFlagged((prev) =>
        prev.map((r) =>
          r.requirementId === row.requirementId
            ? { ...r, ownerBanned: true }
            : r
        )
      );
      toast.success(
        `${row.ownerEmail} banned for ${settings?.banDays ?? 14} days.`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to ban account");
    } finally {
      setBusyId(null);
    }
  };

  const unban = async (row: FlaggedPost) => {
    if (!row.ownerId) return;
    setBusyId(row.ownerId);
    try {
      await unbanUser(row.ownerId);
      setFlagged((prev) =>
        prev.map((r) =>
          r.requirementId === row.requirementId
            ? { ...r, ownerBanned: false }
            : r
        )
      );
      toast.success(`${row.ownerEmail} reinstated.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to lift ban");
    } finally {
      setBusyId(null);
    }
  };

  if (loading && !settings) {
    return (
      <div className="p-8 flex items-center justify-center gap-3" aria-busy="true">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm font-black">Loading moderation…</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Tunable rules ── */}
      <div className={cardCls}>
        <div className={headCls}>
          <SlidersHorizontal className="w-4 h-4" />
          <span className={headText}>Moderation rules</span>
          {settings && (
            <span className="ml-auto inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white border border-black text-[10px] font-black uppercase">
              <Gavel className="w-3 h-3" />
              {settings.autoRemovedPosts} post{settings.autoRemovedPosts === 1 ? "" : "s"} auto-removed
            </span>
          )}
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-end">
            <label className="space-y-1.5">
              <span className="text-xs font-black uppercase block">
                Remove post after more than…
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={thresholdInput}
                  onChange={(e) => setThresholdInput(e.target.value)}
                  aria-label="Report threshold"
                  className={`${inputCls} w-24`}
                />
                <span className="text-xs font-bold text-neutral-500">
                  reports
                </span>
              </div>
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-black uppercase block">
                Ban the poster for…
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={banDaysInput}
                  onChange={(e) => setBanDaysInput(e.target.value)}
                  aria-label="Ban length in days"
                  className={`${inputCls} w-24`}
                />
                <span className="text-xs font-bold text-neutral-500">days</span>
              </div>
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-black uppercase block">
                Signed-in reporters get…
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={quotaUserInput}
                  onChange={(e) => setQuotaUserInput(e.target.value)}
                  aria-label="Signed-in monthly report limit"
                  className={`${inputCls} w-24`}
                />
                <span className="text-xs font-bold text-neutral-500">
                  reports/month
                </span>
              </div>
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-black uppercase block">
                Guest reporters get…
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={quotaGuestInput}
                  onChange={(e) => setQuotaGuestInput(e.target.value)}
                  aria-label="Guest monthly report limit"
                  className={`${inputCls} w-24`}
                />
                <span className="text-xs font-bold text-neutral-500">
                  reports/month
                </span>
              </div>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={saveRules}
              disabled={savingRules}
              className="px-5 py-2.5 rounded-2xl bg-[#7ED957] hover:bg-[#6ec947] text-black font-black text-xs uppercase tracking-wider border-[2.5px] border-black shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {savingRules ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              Save rules
            </button>

            <p className="flex-1 min-w-[240px] text-[11px] font-bold text-neutral-500 leading-relaxed">
              Crossing the threshold deletes the post completely — post,
              applications, and reports — and auto-suspends the poster&apos;s
              account for the ban length above. Every reporter also spends a
              monthly allowance (separate budgets for signed-in accounts and
              guest browsers, reset on the 1st). Expired bans lift themselves;
              admins can also lift any ban early from the Users tab.
            </p>
          </div>
        </div>
      </div>

      {/* ── Flagged posts queue ── */}
      <div className={cardCls}>
        <div className={headCls}>
          <Gavel className="w-4 h-4" />
          <span className={headText}>Flagged posts ({flagged.length})</span>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            aria-label="Refresh flagged posts"
            className="ml-auto p-1.5 rounded-lg bg-white border-2 border-black shadow-[1px_1px_0px_#000] hover:shadow-none hover:translate-x-[0.5px] hover:translate-y-[0.5px] transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {flagged.length === 0 ? (
          <div className="p-8 text-center text-xs font-bold text-neutral-600">
            Nothing flagged — no open reports on any post.
          </div>
        ) : (
          <ul className="divide-y-2 divide-black/10">
            {flagged.map((row) => (
              <li
                key={row.requirementId}
                className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-lg border border-black text-[10px] font-black ${countTone(
                        row.count,
                        settings?.reportThreshold ?? 10
                      )}`}
                    >
                      {row.count} report{row.count === 1 ? "" : "s"}
                    </span>
                    <span className="font-black text-sm truncate">
                      {row.title}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] font-bold text-neutral-500">
                    <span className="truncate">{row.ownerEmail || "guest post"}</span>
                    {Object.entries(row.reasons).map(([r, n]) => (
                      <span
                        key={r}
                        className="px-1.5 py-0.5 rounded bg-neutral-100 border border-black/30 text-[9px] font-black uppercase"
                      >
                        {r} ×{n}
                      </span>
                    ))}
                    {row.lastReportedAt && (
                      <span>
                        last {new Date(row.lastReportedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {row.ownerId && row.ownerId !== me?.id && (
                  <div className="shrink-0 flex items-center gap-2">
                    {row.ownerBanned ? (
                      <button
                        type="button"
                        onClick={() => unban(row)}
                        disabled={busyId === row.ownerId}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-[#7ED957] text-black font-black text-xs uppercase border-2 border-black shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-50"
                      >
                        {busyId === row.ownerId ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Undo2 className="w-3.5 h-3.5" />
                        )}
                        Unban
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => ban(row)}
                        disabled={busyId === row.ownerId}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF5757] hover:bg-[#ef4444] text-white font-black text-xs uppercase border-2 border-black shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-50"
                      >
                        {busyId === row.ownerId ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Ban className="w-3.5 h-3.5" />
                        )}
                        Ban {settings?.banDays ?? 14}d
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
