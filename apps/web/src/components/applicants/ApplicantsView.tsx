"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpDown,
  ExternalLink,
  Inbox,
  KeyRound,
  Loader2,
  Mail,
  Pause,
  Phone,
  Play,
  Search,
  SearchX,
} from "lucide-react";
import { toast } from "sonner";
import {
  ApiError,
  fetchApplications,
  fetchRequirementById,
  setApplicationsPaused,
  RequirementApplication,
} from "@/lib/api";
import { RequirementDocument, MIN_WORK_LINKS, MAX_WORK_LINKS } from "@elysia/shared";
import { useSession } from "@/components/auth/SessionProvider";

/** Sort choices for the table. */
type SortKey = "newest" | "oldest" | "name";

/** Milliseconds since epoch for an application (missing date → oldest). */
const appliedAt = (a: RequirementApplication): number =>
  a.createdAt ? new Date(a.createdAt).getTime() : 0;

/**
 * The post OWNER's applicant page — a full page (not a dialog, not a dynamic
 * route): `/applicants?post=<postId>`.
 *
 * Authorization: the LIST belongs to the poster and nobody else. The postId
 * in the URL only says WHICH post; the session proves WHO is asking, and the
 * API answers 401/403 unless the session user is that post's poster (admins
 * included — no peeking at other people's applicants).
 */
export function ApplicantsView({ postId }: { postId: string }) {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();

  const [post, setPost] = useState<RequirementDocument | null>(null);
  const [applicants, setApplicants] = useState<RequirementApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Table tools: free-text search across every field + sort order.
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");

  const goBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/requirements");
  }, [router]);

  // Owner-only intake switch — same toggle as the profile management suite.
  const [pausing, setPausing] = useState(false);
  const togglePause = async () => {
    if (!post || pausing) return;
    const next = !post.applicationsPaused;
    setPausing(true);
    try {
      await setApplicationsPaused(String(post._id), next);
      setPost({ ...post, applicationsPaused: next });
      toast.success(next ? "Applications paused." : "Applications reopened.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update intake.");
    } finally {
      setPausing(false);
    }
  };

  useEffect(() => {
    // The applications fetch needs a resolved session (401 otherwise) — wait
    // for SessionProvider before firing it. The post itself is public, so it
    // loads in parallel with the session check.
    if (!postId || sessionLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      // Both are fetched together but judged apart: the public post fetch
      // hides expired posts (404) while the owner's applications still
      // exist — a dead title must not blank the list.
      const [postResult, appsResult] = await Promise.allSettled([
        fetchRequirementById(postId),
        fetchApplications(postId),
      ]);
      if (cancelled) return;

      if (postResult.status === "fulfilled") setPost(postResult.value);

      if (appsResult.status === "fulfilled") {
        setApplicants(appsResult.value);
      } else {
        const err = appsResult.reason;
        if (err instanceof ApiError && err.status === 404) {
          setError("This post no longer exists — its applications went with it.");
        } else {
          setError(err instanceof Error ? err.message : "Failed to load applications");
        }
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [postId, sessionLoading, user]);

  /** Search hits every field the apply form collects. */
  const visibleApplicants = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = applicants.filter((a) => {
      if (!q) return true;
      return [
        a.name,
        a.email,
        a.phone ?? "",
        a.message,
        ...(a.workLinks ?? []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
    return matches.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "oldest") return appliedAt(a) - appliedAt(b);
      return appliedAt(b) - appliedAt(a);
    });
  }, [applicants, query, sort]);

  const nextSignInHref = `/signin?next=${encodeURIComponent(
    `/applicants?post=${postId}`
  )}`;

  // Link without a post id (hand-edited URL) — nothing to authorize against.
  if (!postId) {
    return (
      <div className="text-center py-16 bg-[#FFFDF8] border-[3.5px] border-black shadow-[6px_6px_0px_#000] rounded-3xl p-8 space-y-4 text-black">
        <div className="w-16 h-16 rounded-2xl bg-[#FFDE59] border-[3px] border-black shadow-[3px_3px_0px_#000] flex items-center justify-center mx-auto">
          <Inbox className="w-8 h-8 text-black" />
        </div>
        <h3 className="text-2xl font-black">No post to show</h3>
        <p className="text-xs font-bold text-neutral-600 max-w-sm mx-auto">
          This page needs the post it belongs to — open it from your posts and
          hit &ldquo;View applicants&rdquo;.
        </p>
        <Link
          href="/profile"
          className="inline-block px-5 py-2.5 rounded-xl bg-[#FFDE59] border-2 border-black font-black text-xs uppercase shadow-[3px_3px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000] transition-all"
        >
          Go to my posts
        </Link>
      </div>
    );
  }

  // Signed out → the applications are behind a session, so prompt for one.
  if (!sessionLoading && !user) {
    return (
      <div className="text-center py-16 bg-[#FFFDF8] border-[3.5px] border-black shadow-[6px_6px_0px_#000] rounded-3xl p-8 space-y-4 text-black">
        <div className="w-16 h-16 rounded-2xl bg-[#00F0FF] border-[3px] border-black shadow-[3px_3px_0px_#000] flex items-center justify-center mx-auto">
          <KeyRound className="w-8 h-8 text-black" />
        </div>
        <h3 className="text-2xl font-black">Sign in to view applicants</h3>
        <p className="text-xs font-bold text-neutral-600 max-w-sm mx-auto">
          Applications are private to the post&apos;s owner — sign in with the
          account that posted it and they&apos;ll all be here.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href={nextSignInHref}
            className="px-5 py-2.5 rounded-xl bg-[#FFDE59] border-2 border-black font-black text-xs uppercase shadow-[3px_3px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000] transition-all"
          >
            Sign in
          </Link>
          <button
            type="button"
            onClick={goBack}
            className="px-5 py-2.5 rounded-xl bg-white border-2 border-black font-black text-xs uppercase shadow-[3px_3px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000] transition-all"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-black">
      {/* Page header — where you are, and back to where you came from */}
      <div className="bg-[#FFFDF8] border-[3.5px] border-black shadow-[8px_8px_0px_#000] rounded-3xl p-6 sm:p-8 space-y-4">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border-2 border-black shadow-[2px_2px_0px_#000] font-black text-xs uppercase hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000] transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl text-xs font-black border-2 border-black shadow-[2px_2px_0px_#000] bg-[#00F0FF] flex items-center gap-1.5">
              <Inbox className="w-3.5 h-3.5" />
              Applicants
            </span>
            {!loading && !error && (
              <span className="px-2 py-0.5 rounded-lg bg-[#7ED957] border border-black text-[10px] font-black uppercase">
                {applicants.length} received
              </span>
            )}
            {post && (
              <button
                type="button"
                onClick={togglePause}
                disabled={pausing}
                title={
                  post.applicationsPaused
                    ? "Reopen applications for this post"
                    : "Pause application intake for this post"
                }
                className={`px-2 py-0.5 rounded-lg border border-black text-[10px] font-black uppercase flex items-center gap-1 transition-all ${
                  post.applicationsPaused
                    ? "bg-[#FFDE59] hover:bg-[#ffd633]"
                    : "bg-white hover:bg-neutral-100"
                } disabled:opacity-60`}
              >
                {pausing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : post.applicationsPaused ? (
                  <Play className="w-3 h-3" />
                ) : (
                  <Pause className="w-3 h-3" />
                )}
                {post.applicationsPaused ? "Resume intake" : "Pause intake"}
              </button>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {post ? post.title : loading ? "Loading…" : "Applications received"}
          </h1>
          <p className="text-xs sm:text-sm font-bold text-neutral-700 max-w-xl">
            Only you — the poster — can see this list. Contact details, pitch,
            and {MIN_WORK_LINKS}–{MAX_WORK_LINKS} work links per applicant.
          </p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-xs font-black uppercase text-neutral-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading applications…
        </div>
      )}

      {/* Error (not the owner, post gone, network down) */}
      {!loading && error && (
        <div className="p-6 rounded-3xl bg-[#FFFDF8] border-[3.5px] border-black shadow-[6px_6px_0px_#000] space-y-3">
          <div className="p-4 rounded-2xl bg-[#FF5757] border-[3px] border-black text-white text-xs font-black shadow-[3px_3px_0px_#000]">
            {error}
          </div>
          <Link
            href="/requirements"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FFDE59] border-2 border-black font-black text-xs uppercase shadow-[3px_3px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000] transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to the feed
          </Link>
        </div>
      )}

      {/* Empty state — no applications at all */}
      {!loading && !error && applicants.length === 0 && (
        <div className="text-center py-16 bg-[#FFFDF8] border-[3.5px] border-dashed border-black rounded-3xl p-8 space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-[#00F0FF] border-[3px] border-black shadow-[3px_3px_0px_#000] flex items-center justify-center mx-auto">
            <Inbox className="w-8 h-8 text-black" />
          </div>
          <h3 className="text-2xl font-black">No applications yet</h3>
          <p className="text-xs font-bold text-neutral-600 max-w-sm mx-auto">
            When someone applies from the feed, their name, contact, pitch, and
            work links land here.
          </p>
        </div>
      )}

      {/* Table: search + sort + every applicant in one grid */}
      {!loading && !error && applicants.length > 0 && (
        <div className="bg-white border-[3.5px] border-black shadow-[6px_6px_0px_#000] rounded-3xl overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 p-4 border-b-[3px] border-black bg-[#FFFDF8]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-black" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, email, phone, pitch, or links…"
                aria-label="Search applicants"
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:bg-[#FFF9E6] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <label
                htmlFor="applicant-sort"
                className="flex items-center gap-1.5 text-[10px] font-black uppercase text-neutral-600"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                Sort
              </label>
              <select
                id="applicant-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="px-3 py-2.5 text-xs bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-black focus:bg-[#FFF9E6] focus:outline-none"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="name">Name A–Z</option>
              </select>

              <span className="px-2 py-1 rounded-lg bg-[#7ED957] border-2 border-black text-[10px] font-black uppercase whitespace-nowrap">
                {visibleApplicants.length}/{applicants.length}
              </span>
            </div>
          </div>

          {/* Rows — horizontally scrollable on small screens */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] border-collapse text-left">
              <thead>
                <tr className="bg-[#FFDE59] border-b-[3px] border-black text-[10px] font-black uppercase tracking-wider">
                  <th className="px-4 py-3 w-10">#</th>
                  <th className="px-4 py-3">Applicant</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Notable work</th>
                  <th className="px-4 py-3">Why suited</th>
                  <th className="px-4 py-3">Applied</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleApplicants.map((a, i) => {
                  const links = a.workLinks ?? [];
                  return (
                    <tr
                      key={a._id}
                      className="border-b-2 border-black/10 last:border-b-0 hover:bg-[#FFF9E6] transition-colors align-top"
                    >
                      <td className="px-4 py-3 font-black text-neutral-500">
                        {i + 1}
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3">
                        <span className="font-black text-sm">{a.name}</span>
                      </td>

                      {/* Email + phone, tap to reach them */}
                      <td className="px-4 py-3 space-y-1">
                        <a
                          href={`mailto:${a.email}`}
                          className="block max-w-[14rem] truncate font-mono text-[11px] font-bold text-neutral-800 underline decoration-dotted underline-offset-2 hover:text-[#FF5757]"
                          title={a.email}
                        >
                          {a.email}
                        </a>
                        {a.phone ? (
                          <a
                            href={`tel:${a.phone}`}
                            className="block font-mono text-[11px] font-bold text-neutral-800 underline decoration-dotted underline-offset-2 hover:text-[#FF5757]"
                            title={a.phone}
                          >
                            {a.phone}
                          </a>
                        ) : (
                          <span className="block text-[11px] font-bold text-neutral-400">
                            No phone
                          </span>
                        )}
                      </td>

                      {/* Work links — count + horizontal chips */}
                      <td className="px-4 py-3">
                        {links.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 max-w-[18rem]">
                            {links.map((link, li) => (
                              <a
                                key={`${a._id}-link-${li}`}
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={link}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-[#E0F7FA] border border-black text-[10px] font-bold font-mono max-w-[9rem] hover:translate-x-[0.5px] hover:translate-y-[0.5px] transition-all"
                              >
                                <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate">
                                  {link.replace(/^https?:\/\//i, "")}
                                </span>
                              </a>
                            ))}
                            <span className="px-1.5 py-0.5 rounded-lg bg-neutral-100 border border-black text-[10px] font-black">
                              {links.length}/{MAX_WORK_LINKS}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] font-bold text-neutral-400">
                            —
                          </span>
                        )}
                      </td>

                      {/* Pitch — clamped; hover for the full text */}
                      <td className="px-4 py-3 max-w-[18rem]">
                        {a.message ? (
                          <p
                            className="text-[11px] font-bold text-neutral-700 leading-relaxed line-clamp-3"
                            title={a.message}
                          >
                            {a.message}
                          </p>
                        ) : (
                          <span className="text-[11px] font-bold text-neutral-400">
                            —
                          </span>
                        )}
                      </td>

                      {/* When they applied */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-[11px] font-black text-neutral-600">
                          {a.createdAt
                            ? new Date(a.createdAt).toLocaleDateString()
                            : "—"}
                        </span>
                      </td>

                      {/* One-click contact */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`mailto:${a.email}`}
                            aria-label={`Email ${a.name}`}
                            title={`Email ${a.name}`}
                            className="w-8 h-8 rounded-lg bg-[#7ED957] border-2 border-black shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000] transition-all flex items-center justify-center"
                          >
                            <Mail className="w-4 h-4" />
                          </a>
                          {a.phone && (
                            <a
                              href={`tel:${a.phone}`}
                              aria-label={`Call ${a.name}`}
                              title={`Call ${a.name}`}
                              className="w-8 h-8 rounded-lg bg-[#00F0FF] border-2 border-black shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000] transition-all flex items-center justify-center"
                            >
                              <Phone className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* Search matched nothing */}
                {visibleApplicants.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center">
                      <div className="inline-flex flex-col items-center gap-2">
                        <SearchX className="w-6 h-6 text-neutral-400" />
                        <p className="text-xs font-black uppercase text-neutral-500">
                          No applicants match &ldquo;{query.trim()}&rdquo;
                        </p>
                        <button
                          type="button"
                          onClick={() => setQuery("")}
                          className="px-4 py-2 rounded-xl bg-[#FFDE59] border-2 border-black shadow-[2px_2px_0px_#000] font-black text-[11px] uppercase hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000] transition-all"
                        >
                          Clear search
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
