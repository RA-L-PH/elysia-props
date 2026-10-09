"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Ban,
  BadgeCheck,
  Loader2,
  Search,
  ShieldAlert,
  ShieldCheck,
  Undo2,
  Users,
} from "lucide-react";
import {
  fetchUsers,
  setUserVerified,
  fetchModerationSettings,
  banUser,
  unbanUser,
  AdminUser,
} from "@/lib/api";
import { useSession } from "@/components/auth/SessionProvider";
import { toast } from "sonner";

/**
 * Users tab: the full directory with search, role/verified/join info, the
 * Verified Poster grant/revoke action, and ban management — ban anyone
 * (except admins and yourself) for a custom number of days, or lift a ban
 * early. Banned accounts can't sign in or use their sessions.
 */
export function AdminUsers() {
  const { user: me } = useSession();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // Ban form state: which row is open, plus its inputs.
  const [banningId, setBanningId] = useState<string | null>(null);
  const [banDays, setBanDays] = useState("14");
  const [banReason, setBanReason] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [list, rules] = await Promise.all([
          fetchUsers(),
          fetchModerationSettings().catch(() => null),
        ]);
        setUsers(list);
        // Pre-fill the ban form with the saved default (14 if unavailable).
        if (rules) setBanDays(String(rules.banDays));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load users");
      } finally {
        setFetching(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.email.toLowerCase().includes(q));
  }, [users, query]);

  const handleToggle = async (target: AdminUser) => {
    setTogglingId(target.id);
    try {
      await setUserVerified(target.id, !target.verified);
      setUsers((prev) =>
        prev.map((u) => (u.id === target.id ? { ...u, verified: !target.verified } : u))
      );
      toast.success(
        target.verified
          ? `Verification removed from ${target.email}`
          : `${target.email} is now a Verified Poster`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update verification");
    } finally {
      setTogglingId(null);
    }
  };

  const handleBan = async (target: AdminUser) => {
    const days = Number(banDays);
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      toast.error("Ban length must be a whole number between 1 and 365 days.");
      return;
    }
    setActionId(target.id);
    try {
      const result = await banUser(
        target.id,
        days,
        banReason.trim() || undefined
      );
      setUsers((prev) =>
        prev.map((u) =>
          u.id === target.id
            ? { ...u, bannedUntil: result.bannedUntil, banReason: banReason.trim() }
            : u
        )
      );
      setBanningId(null);
      setBanReason("");
      toast.success(
        `${target.email} banned for ${result.days} day${result.days === 1 ? "" : "s"}.`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to ban account");
    } finally {
      setActionId(null);
    }
  };

  const handleUnban = async (target: AdminUser) => {
    setActionId(target.id);
    try {
      await unbanUser(target.id);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === target.id ? { ...u, bannedUntil: null, banReason: "" } : u
        )
      );
      toast.success(`${target.email} reinstated.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to lift the ban");
    } finally {
      setActionId(null);
    }
  };

  if (error) {
    return (
      <div className="p-5 rounded-3xl bg-[#FF5757] border-[3px] border-black shadow-[5px_5px_0px_#000] text-white text-xs font-black">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white border-[3px] border-black shadow-[5px_5px_0px_#000] rounded-3xl overflow-hidden">
      <div className="px-5 py-3.5 border-b-2 border-black bg-[#FFF9E6] flex flex-wrap items-center gap-3">
        <Users className="w-4 h-4" />
        <span className="text-xs font-black uppercase tracking-wider">
          Accounts ({users.length})
        </span>
        <label className="ml-auto relative flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-2.5 text-neutral-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search email…"
            aria-label="Search accounts"
            className="pl-8 pr-3 py-1.5 w-44 sm:w-56 text-xs font-bold bg-white border-2 border-black rounded-xl focus:bg-[#FFF9E6] focus:outline-none"
          />
        </label>
      </div>

      {fetching ? (
        <div className="p-8 flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-black">Loading accounts…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center text-xs font-bold text-neutral-600">
          {users.length === 0
            ? "No accounts yet — sign-ups appear here."
            : `No accounts match “${query}”.`}
        </div>
      ) : (
        <ul className="divide-y-2 divide-black/10">
          {filtered.map((u) => {
            const banned = Boolean(u.bannedUntil);
            const canBan = u.role !== "admin" && u.id !== me?.id;
            const bannedLabel = u.bannedUntil
              ? new Date(u.bannedUntil).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "";
            return (
              <li key={u.id} className="px-5 py-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Identity */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-sm truncate">{u.email}</span>
                      {u.role === "admin" && (
                        <span className="px-2 py-0.5 rounded-lg bg-[#FFDE59] border border-black text-[10px] font-black uppercase">
                          Admin
                        </span>
                      )}
                      {u.verified && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#7ED957] border border-black text-[10px] font-black uppercase">
                          <BadgeCheck className="w-3 h-3" /> Verified
                        </span>
                      )}
                      {banned && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#FF5757] text-white border border-black text-[10px] font-black uppercase">
                          <Ban className="w-3 h-3" /> Banned until {bannedLabel}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] font-bold text-neutral-500">
                      <span className="inline-flex items-center gap-1">
                        <span aria-hidden>💼</span>
                        {u.jobCount} post{u.jobCount === 1 ? "" : "s"}
                      </span>
                      {u.createdAt && <span>joined {new Date(u.createdAt).toLocaleDateString()}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggle(u)}
                      disabled={togglingId === u.id}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase border-[2.5px] border-black transition-all flex items-center justify-center gap-1.5 shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] disabled:opacity-50 ${
                        u.verified
                          ? "bg-white hover:bg-[#FF5757] hover:text-white"
                          : "bg-[#7ED957] hover:bg-[#6bc944]"
                      }`}
                    >
                      {togglingId === u.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : u.verified ? (
                        <>
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Remove badge</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Verify poster</span>
                        </>
                      )}
                    </button>

                    {canBan &&
                      (banned ? (
                        <button
                          type="button"
                          onClick={() => handleUnban(u)}
                          disabled={actionId === u.id}
                          className="px-4 py-2 rounded-xl text-xs font-black uppercase border-2 border-black bg-white hover:bg-[#7ED957] transition-all inline-flex items-center gap-1.5 shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] disabled:opacity-50"
                        >
                          {actionId === u.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Undo2 className="w-3.5 h-3.5" />
                          )}
                          Unban
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setBanningId((prev) => (prev === u.id ? null : u.id))
                          }
                          className="px-4 py-2 rounded-xl text-xs font-black uppercase border-2 border-black bg-white hover:bg-[#FF5757] hover:text-white transition-all inline-flex items-center gap-1.5 shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px]"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          Ban
                        </button>
                      ))}
                  </div>
                </div>

                {/* Inline ban form */}
                {banningId === u.id && canBan && (
                  <div className="p-3 rounded-2xl bg-[#FFF0F0] border-2 border-[#FF5757] flex flex-wrap items-end gap-3">
                    <label className="space-y-1">
                      <span className="text-[10px] font-black uppercase block">
                        Days (1–365)
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={365}
                        value={banDays}
                        onChange={(e) => setBanDays(e.target.value)}
                        aria-label="Ban length in days"
                        className="w-24 px-3 py-1.5 text-sm font-black bg-white border-2 border-black rounded-lg focus:outline-none"
                      />
                    </label>
                    <label className="space-y-1 flex-1 min-w-[200px]">
                      <span className="text-[10px] font-black uppercase block">
                        Reason (optional)
                      </span>
                      <input
                        type="text"
                        maxLength={200}
                        value={banReason}
                        onChange={(e) => setBanReason(e.target.value)}
                        placeholder="e.g. fake posts reported by users"
                        className="w-full px-3 py-1.5 text-xs font-bold bg-white border-2 border-black rounded-lg focus:outline-none"
                      />
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setBanningId(null)}
                        className="px-3.5 py-2 rounded-xl bg-white border-2 border-black text-xs font-black uppercase hover:bg-neutral-100 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBan(u)}
                        disabled={actionId === u.id}
                        className="px-4 py-2 rounded-xl bg-[#FF5757] text-white border-2 border-black text-xs font-black uppercase shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-50 inline-flex items-center gap-1.5"
                      >
                        {actionId === u.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Ban className="w-3.5 h-3.5" />
                        )}
                        Confirm ban
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
