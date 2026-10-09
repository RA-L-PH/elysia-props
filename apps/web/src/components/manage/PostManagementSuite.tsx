"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Users,
  Pencil,
  Pause,
  Play,
  Trash2,
  Loader2,
  Inbox,
  AlertTriangle,
  LogIn,
  FileText,
} from "lucide-react";
import { useSession } from "@/components/auth/SessionProvider";
import {
  fetchRequirements,
  deleteRequirement,
  setApplicationsPaused,
  type RequirementWithPoster,
} from "@/lib/api";

type StatusFilter = "all" | "live" | "paused" | "expiring";
type RowStatus = "live" | "paused" | "expiring";

/** "12d 4h left" until auto-expiry — same wording as the feed. */
const timeLeft = (expiresAt?: string | Date | null): string | null => {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h left`;
  return `${Math.max(1, Math.floor(ms / 60_000))}m left`;
};

const statusOf = (post: RequirementWithPoster): RowStatus => {
  if (post.applicationsPaused) return "paused";
  const ms = post.expiresAt ? new Date(post.expiresAt).getTime() - Date.now() : NaN;
  if (Number.isFinite(ms) && ms <= 3 * 86_400_000) return "expiring";
  return "live";
};

const STATUS_STYLE: Record<RowStatus, string> = {
  live: "bg-[#7ED957]",
  paused: "bg-[#FFDE59]",
  expiring: "bg-[#FF66C4] text-white",
};

const STATUS_LABEL: Record<RowStatus, string> = {
  live: "Live",
  paused: "Paused",
  expiring: "Expiring soon",
};

/**
 * The signed-in owner's post management suite: server-side applicant counts,
 * status pills (live / paused / expiring), search + status filters, and the
 * full action set — edit, pause intake, view applicants, delete.
 */
export function PostManagementSuite() {
  const { user, loading: sessionLoading } = useSession();

  const [posts, setPosts] = useState<RequirementWithPoster[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [deleteTarget, setDeleteTarget] = useState<RequirementWithPoster | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Owner-only fetch — the API answers 401 without a session, so wait for one.
  useEffect(() => {
    if (sessionLoading) return;
    if (!user) {
      setPosts([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetchRequirements({ mine: true, page: 1, limit: 100 });
        if (!cancelled) {
          setPosts(res.data);
          setTotal(res.total);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load your posts.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, sessionLoading]);

  const rows = useMemo(
    () => posts.map((post) => ({ post, status: statusOf(post), countdown: timeLeft(post.expiresAt) })),
    [posts]
  );

  const counts = useMemo(() => {
    const c = { all: posts.length, live: 0, paused: 0, expiring: 0 };
    for (const p of posts) c[statusOf(p)] += 1;
    return c;
  }, [posts]);

  const totalApplicants = useMemo(
    () => posts.reduce((n, p) => n + (p.applicantsCount ?? 0), 0),
    [posts]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(({ post, status }) => {
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (!q) return true;
      return [post.title, post.category, post.location?.city, ...(post.tags ?? [])]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q));
    });
  }, [rows, query, statusFilter]);

  const togglePause = async (post: RequirementWithPoster) => {
    const id = String(post._id);
    const next = !post.applicationsPaused;
    setBusyId(id);
    try {
      await setApplicationsPaused(id, next);
      setPosts((prev) =>
        prev.map((p) => (String(p._id) === id ? { ...p, applicationsPaused: next } : p))
      );
      toast.success(next ? "Applications paused." : "Applications reopened.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update intake.");
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const id = String(deleteTarget._id);
    setBusyId(id);
    try {
      // Session proves ownership — no Post ID needed for signed-in owners.
      await deleteRequirement(id);
      setPosts((prev) => prev.filter((p) => String(p._id) !== id));
      toast.success("Post deleted.");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete that post.");
    } finally {
      setBusyId(null);
    }
  };

  // ── Signed out ────────────────────────────────────────────────────────────
  if (!sessionLoading && !user) {
    return (
      <div className="p-6 rounded-3xl bg-white border-[3px] border-black shadow-[5px_5px_0px_#000] space-y-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#00F0FF] border-[3px] border-black shadow-[3px_3px_0px_#000] flex items-center justify-center mx-auto">
          <FileText className="w-7 h-7 text-black" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-black">Manage your posts</h2>
          <p className="text-xs font-bold text-neutral-600 max-w-md mx-auto leading-relaxed">
            Sign in to see every requirement you&apos;ve posted — applicant counts,
            pause/resume intake, edits, and deletions in one place.
          </p>
        </div>
        <Link
          href="/signin?next=/profile"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#00F0FF] hover:bg-[#00d8e6] text-black font-black text-xs uppercase tracking-wider border-[3px] border-black shadow-[4px_4px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          <LogIn className="w-4 h-4" />
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="px-2 py-0.5 rounded border-2 border-black bg-[#FFDE59] text-[10px] font-mono font-black uppercase tracking-wider">
            Post management
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-1.5">Your posts</h1>
          <p className="text-xs font-bold text-neutral-600">
            {loading
              ? "Loading…"
              : `${total} post${total === 1 ? "" : "s"} · ${totalApplicants} applicant${totalApplicants === 1 ? "" : "s"} total`}
          </p>
        </div>
        <Link
          href="/post"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#FF5757] hover:bg-[#ff3b3b] text-white font-black text-xs uppercase tracking-wider border-[3px] border-black shadow-[4px_4px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          <Plus className="w-4 h-4" />
          New post
        </Link>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border-[3px] border-black shadow-[4px_4px_0px_#000]">
          <div className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
            Posts
          </div>
          <div className="text-2xl font-black mt-0.5">{loading ? "—" : total}</div>
        </div>
        <div className="p-4 rounded-2xl bg-[#E0F7FA] border-[3px] border-black shadow-[4px_4px_0px_#000]">
          <div className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
            Applicants
          </div>
          <div className="text-2xl font-black mt-0.5">
            {loading ? "—" : totalApplicants}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[#FFF9E6] border-[3px] border-black shadow-[4px_4px_0px_#000]">
          <div className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
            Paused intake
          </div>
          <div className="text-2xl font-black mt-0.5">
            {loading ? "—" : counts.paused}
          </div>
        </div>
      </div>

      {/* Toolbar: search + status filter chips */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your posts by title, city, or tag…"
            className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "All"],
              ["live", "Live"],
              ["paused", "Paused"],
              ["expiring", "Expiring"],
            ] as [StatusFilter, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={`px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider border-2 border-black transition-all ${
                statusFilter === key
                  ? "bg-[#00F0FF] shadow-[2px_2px_0px_#000]"
                  : "bg-white hover:bg-neutral-100"
              }`}
            >
              {label}
              <span className="ml-1.5 text-neutral-500">{counts[key]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-2xl bg-[#FF5757] border-[2.5px] border-black text-white text-xs font-black shadow-[3px_3px_0px_#000] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-16 rounded-2xl bg-white border-[3px] border-black shadow-[3px_3px_0px_#000] animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty states */}
      {!loading && !error && posts.length === 0 && (
        <div className="p-8 rounded-3xl bg-white border-[3px] border-black shadow-[5px_5px_0px_#000] space-y-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#FFDE59] border-[3px] border-black shadow-[3px_3px_0px_#000] flex items-center justify-center mx-auto">
            <Inbox className="w-7 h-7 text-black" />
          </div>
          <h3 className="text-lg font-black">No posts yet</h3>
          <p className="text-xs font-bold text-neutral-600 max-w-sm mx-auto">
            Post your first requirement — it takes about three minutes and no account
            details beyond the contact block.
          </p>
          <Link
            href="/post"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#FF5757] hover:bg-[#ff3b3b] text-white font-black text-xs uppercase tracking-wider border-[3px] border-black shadow-[4px_4px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            <Plus className="w-4 h-4" />
            Post your first one
          </Link>
        </div>
      )}

      {!loading && !error && posts.length > 0 && filtered.length === 0 && (
        <div className="p-6 rounded-3xl bg-white border-[3px] border-black shadow-[5px_5px_0px_#000] space-y-2 text-center">
          <h3 className="text-base font-black">No posts match</h3>
          <p className="text-xs font-bold text-neutral-600">
            Try a different search term or status filter.
          </p>
        </div>
      )}

      {/* Table */}
      {!loading && filtered.length > 0 && (
        <div className="rounded-3xl bg-white border-[3px] border-black shadow-[5px_5px_0px_#000] overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-black">
            <thead>
              <tr className="border-b-2 border-black bg-[#FFF9E6] text-[10px] font-black uppercase tracking-wider text-neutral-600">
                <th className="px-4 py-3">Post</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Applicants</th>
                <th className="px-4 py-3">Budget</th>
                <th className="px-4 py-3">Auto-expiry</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ post, status, countdown }) => {
                const id = String(post._id);
                const busy = busyId === id;
                const paused = !!post.applicationsPaused;
                return (
                  <tr key={id} className="border-b-2 border-black/10 hover:bg-[#FFFDF8]">
                    <td className="px-4 py-3 max-w-[280px]">
                      <div className="font-black text-xs leading-snug line-clamp-2">
                        {post.title}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-[#00F0FF] border border-black text-[10px] font-black">
                          {post.category}
                        </span>
                        <span className="text-[10px] font-bold text-neutral-500">
                          {post.location?.city}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-lg border-2 border-black text-[10px] font-black uppercase ${STATUS_STYLE[status]}`}
                      >
                        {STATUS_LABEL[status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/applicants?post=${id}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border-2 border-black shadow-[2px_2px_0px_#000] text-xs font-black hover:bg-[#FFDE59] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000] transition-all"
                        title="View applicants"
                      >
                        <Users className="w-3.5 h-3.5" />
                        {post.applicantsCount ?? 0}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs font-black whitespace-nowrap">
                      ${post.budget?.min?.toLocaleString?.() ?? post.budget?.min} – $
                      {post.budget?.max?.toLocaleString?.() ?? post.budget?.max}
                      <span className="text-neutral-500"> {post.budget?.currency}</span>
                    </td>
                    <td className="px-4 py-3 text-xs font-bold whitespace-nowrap text-neutral-600">
                      {countdown ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/post?edit=${id}`}
                          title="Edit post"
                          className="p-2 rounded-xl bg-white border-2 border-black shadow-[2px_2px_0px_#000] hover:bg-[#00F0FF] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000] transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href={`/applicants?post=${id}`}
                          title="View applicants"
                          className="p-2 rounded-xl bg-white border-2 border-black shadow-[2px_2px_0px_#000] hover:bg-[#FFDE59] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000] transition-all"
                        >
                          <Users className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => togglePause(post)}
                          disabled={busy}
                          title={
                            paused ? "Resume applications" : "Pause application intake"
                          }
                          className="p-2 rounded-xl bg-white border-2 border-black shadow-[2px_2px_0px_#000] hover:bg-[#FFDE59] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000] transition-all disabled:opacity-50"
                        >
                          {busy ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : paused ? (
                            <Play className="w-3.5 h-3.5" />
                          ) : (
                            <Pause className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(post)}
                          disabled={busy}
                          title="Delete post"
                          className="p-2 rounded-xl bg-white border-2 border-black shadow-[2px_2px_0px_#000] hover:bg-[#FF5757] hover:text-white hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000] transition-all disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#FFFDF8] border-[3.5px] border-black shadow-[8px_8px_0px_#000] space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FF5757] border-[3px] border-black shadow-[3px_3px_0px_#000] flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-black">Delete this post?</h3>
              <p className="text-xs font-bold text-neutral-600 leading-relaxed">
                <span className="font-black text-black">“{deleteTarget.title}”</span> and
                its applications will be removed permanently. This can&apos;t be undone.
              </p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-5 py-2.5 rounded-2xl bg-white hover:bg-neutral-100 text-black font-black text-xs uppercase border-[3px] border-black shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={busyId === String(deleteTarget._id)}
                className="px-5 py-2.5 rounded-2xl bg-[#FF5757] hover:bg-[#ff3b3b] text-white font-black text-xs uppercase border-[3px] border-black shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {busyId === String(deleteTarget._id) && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
