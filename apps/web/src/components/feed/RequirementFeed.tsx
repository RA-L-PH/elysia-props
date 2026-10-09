"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Music,
  Wrench,
  Search,
  MapPin,
  Layers,
  RefreshCw,
  X,
  AlertCircle,
  BadgeCheck,
  Pencil,
  Trash2,
  KeyRound,
  Hourglass,
  UserCheck,
  ChevronDown,
  Loader2,
  Send,
  Inbox,
  Plus,
  Ban,
  Flag,
} from "lucide-react";
import {
  fetchRequirements,
  deleteRequirement,
  claimRequirement,
  applyToRequirement,
  reportRequirement,
  ReportReason,
  RequirementWithPoster,
} from "@/lib/api";
import { useSession } from "@/components/auth/SessionProvider";
import { loadMyPosts, forgetMyPost, MyPostRecord } from "@/lib/myPosts";
import { toast } from "sonner";
import {
  PlannerDetails,
  PerformerDetails,
  CrewDetails,
  MIN_WORK_LINKS,
  MAX_WORK_LINKS,
} from "@elysia/shared";

type AnyRequirement = RequirementWithPoster;

/** One lazy-load page = two rows on the 3-column desktop grid. */
const PAGE_SIZE = 6;

/** All browse-filter state travels together (one form = one fetch). */
interface FeedFilters {
  category: string;
  search: string;
  city: string;
  minBudget: string;
  maxBudget: string;
  payType: string;
  urgency: string;
}

/** "12d 4h left" until the post auto-expires (event end date, 23:59). */
/** The five report reasons — mirrors the shared ReportSchema enum. */
const REPORT_REASONS: Array<{ value: ReportReason; label: string }> = [
  { value: "fake", label: "Fake or misleading post" },
  { value: "scam", label: "Scam or fraud" },
  { value: "spam", label: "Spam / repeated posting" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "other", label: "Something else" },
];

/** "12d 4h left" until the post auto-expires (event end date, 23:59). */
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

/**
 * The feed serves two surfaces: the public browse page (`mode="browse"`)
 * and the signed-in "My Posts" page (`mode="mine"`, `?mine=1` on the wire).
 */
export function RequirementFeed({ mode = "browse" }: { mode?: "browse" | "mine" }) {
  const [requirements, setRequirements] = useState<AnyRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const { user, loading: sessionLoading } = useSession();
  const isMine = mode === "mine";

  // Posts created on THIS device (their Post ID lives in localStorage) —
  // these can be deleted straight from the card without an account, and
  // claimed by the account after signing in.
  const [myPosts, setMyPosts] = useState<MyPostRecord[]>([]);

  // Filters
  const [filters, setFilters] = useState<FeedFilters>({
    category: "ALL",
    search: "",
    city: "",
    minBudget: "",
    maxBudget: "",
    payType: "All",
    urgency: "All",
  });
  // Draft text inputs vs. applied values: search/city/budget only hit the
  // server on submit, so typing never triggers a request storm.
  const [searchQuery, setSearchQuery] = useState("");
  const [advDraft, setAdvDraft] = useState({
    city: "",
    minBudget: "",
    maxBudget: "",
  });
  // "More filters" accordion — collapsed until asked for.
  const [showAdvFilters, setShowAdvFilters] = useState(false);

  // Modal Detail State
  const [activeItem, setActiveItem] = useState<AnyRequirement | null>(null);
  // Claim dialog state: the Post ID key entered here proves authorship.
  const [claimTarget, setClaimTarget] = useState<AnyRequirement | null>(null);
  const [claimKeyInput, setClaimKeyInput] = useState("");
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AnyRequirement | null>(null);
  const [deleteKeyInput, setDeleteKeyInput] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  // Apply dialog state: name + contact + pitch + 3–10 work links, guests
  // welcome.
  const [applyTarget, setApplyTarget] = useState<AnyRequirement | null>(null);
  const [applyForm, setApplyForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    workLinks: [] as string[],
  });
  /** The "Enter link" box — press Add (or Enter) to turn it into a chip. */
  const [linkDraft, setLinkDraft] = useState("");
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  // Report dialog: one report per account per post; crossing the
  // admin-set threshold removes the post and suspends the poster.
  const [reportTarget, setReportTarget] = useState<AnyRequirement | null>(null);
  const [reportReason, setReportReason] = useState<ReportReason>("fake");
  const [reportDetails, setReportDetails] = useState("");
  const [reportError, setReportError] = useState<string | null>(null);
  const [reporting, setReporting] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  // Synchronous guard: the sentinel observer and the Load-more button can
  // both fire in the same tick, before `loadingMore` state re-renders.
  const fetchingMoreRef = useRef(false);

  /** Lazy-loading feed: page 1 replaces, later pages append. */
  const fetchFeed = async (overrides?: Partial<FeedFilters>, fetchPage = 1) => {
    const f = { ...filters, ...overrides };
    if (fetchPage === 1) setLoading(true);
    else setLoadingMore(true);
    setError(null);
    try {
      const min = f.minBudget.trim() === "" ? undefined : Number(f.minBudget);
      const max = f.maxBudget.trim() === "" ? undefined : Number(f.maxBudget);
      const res = await fetchRequirements({
        category: f.category !== "ALL" ? f.category : undefined,
        search: f.search.trim() || undefined,
        city: f.city.trim() || undefined,
        minBudget: Number.isFinite(min) ? min : undefined,
        maxBudget: Number.isFinite(max) ? max : undefined,
        payType: f.payType !== "All" ? f.payType : undefined,
        urgency: f.urgency !== "All" ? f.urgency : undefined,
        mine: isMine || undefined,
        page: fetchPage,
        limit: PAGE_SIZE,
      });
      setRequirements((prev) => {
        if (fetchPage === 1) return res.data;
        // Dedupe by _id: also protects against offset-pagination shifts when
        // a new post lands between page fetches.
        const seen = new Set(prev.map((r) => r._id));
        return [...prev, ...res.data.filter((r) => !seen.has(r._id))];
      });
      setPage(res.page);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch (err: any) {
      setError(err.message || "Failed to reach server");
    } finally {
      if (fetchPage === 1) setLoading(false);
      else setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (loading || fetchingMoreRef.current || page >= totalPages) return;
    fetchingMoreRef.current = true;
    fetchFeed(undefined, page + 1).finally(() => {
      fetchingMoreRef.current = false;
    });
  };

  useEffect(() => {
    // "My Posts" needs a resolved session (the API answers 401 otherwise) —
    // wait for SessionProvider before firing the request.
    if (isMine && sessionLoading) return;
    if (isMine && !user) {
      setLoading(false);
      setRequirements([]);
      return;
    }
    fetchFeed();
    setMyPosts(loadMyPosts());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, isMine, sessionLoading, user?.id]);

  // Auto-load the next page when the sentinel scrolls into view.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadMore();
      },
      { rootMargin: "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, loadingMore, page, totalPages, filters]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Persist the drafts into the filter state — the effect above refetches.
    setFilters((prev) => ({
      ...prev,
      search: searchQuery,
      city: advDraft.city.trim(),
      minBudget: advDraft.minBudget.trim(),
      maxBudget: advDraft.maxBudget.trim(),
    }));
  };

  /** One click wipes every filter and refetches page 1. */
  const clearFilters = () => {
    setSearchQuery("");
    setAdvDraft({ city: "", minBudget: "", maxBudget: "" });
    setFilters({
      category: "ALL",
      search: "",
      city: "",
      minBudget: "",
      maxBudget: "",
      payType: "All",
      urgency: "All",
    });
  };

  /** Chips (category/urgency/payType) apply immediately without a submit. */
  const applyChip = (patch: Partial<FeedFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  /** How many advanced filters are on — drives the accordion badge. */
  const activeAdvCount = [
    filters.city,
    filters.minBudget,
    filters.maxBudget,
    filters.urgency !== "All" ? filters.urgency : "",
    filters.payType !== "All" ? filters.payType : "",
  ].filter(Boolean).length;

  /**
   * Deleting is confirmed with the Post ID: clicking the trash icon opens a
   * dialog that requires entering it (paste shortcut when it's on this
   * device). The signed-in owner can fall back to their session instead —
   * everyone else, admins included, needs the key.
   */
  const handleDelete = (item: AnyRequirement) => {
    setDeleteTarget(item);
    setDeleteKeyInput("");
    setDeleteError(null);
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
    setDeleteKeyInput("");
    setDeleteError(null);
  };

  /**
   * Claim dialog: the Post ID key created together with the post proves
   * authorship. Entering it (paste shortcut when saved on this device)
   * transfers an unclaimed guest post to the signed-in account.
   */
  const openClaimDialog = (item: AnyRequirement) => {
    setClaimTarget(item);
    setClaimKeyInput("");
    setClaimError(null);
  };

  const closeClaimDialog = () => {
    setClaimTarget(null);
    setClaimKeyInput("");
    setClaimError(null);
  };

  const confirmClaim = async () => {
    const target = claimTarget;
    if (!target) return;
    const key = claimKeyInput.trim();
    if (!key) {
      setClaimError("Enter the Post ID key that was created with this post.");
      return;
    }
    setClaiming(true);
    setClaimError(null);
    try {
      const updated = await claimRequirement(target._id, key);
      // The claim overwrites ownership AND the contact block with the
      // claimer's account details — mirror both on the card.
      setRequirements((prev) =>
        prev.map((r) =>
          r._id === target._id
            ? {
                ...r,
                poster: updated.poster ?? r.poster,
                ...(updated.contact ? { contact: updated.contact } : {}),
              }
            : r
        )
      );
      setActiveItem((prev) =>
        prev?._id === target._id
          ? {
              ...prev,
              poster: updated.poster ?? prev.poster,
              ...(updated.contact ? { contact: updated.contact } : {}),
            }
          : prev
      );
      closeClaimDialog();
      toast.success("Post claimed — it's now managed by your account");
    } catch (err) {
      setClaimError(err instanceof Error ? err.message : "Failed to claim post");
    } finally {
      setClaiming(false);
    }
  };

  /**
   * Apply dialog: anyone (guests too) sends name, contact, a short pitch,
   * and links to their most notable work (3–10). Signed-in accounts get
   * their details prefilled.
   */
  const openApplyDialog = (item: AnyRequirement) => {
    setApplyTarget(item);
    setApplyForm({
      name: user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() : "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      message: "",
      workLinks: [],
    });
    setLinkDraft("");
    setApplyError(null);
  };

  const closeApplyDialog = () => {
    setApplyTarget(null);
    setLinkDraft("");
    setApplyError(null);
  };

  /**
   * Report dialog: opened from the card's top-left flag (owner excluded).
   * Accounts and guests both report; reports come back with progress, and a
   * threshold hit removes the post from the feed right here.
   */
  const openReportDialog = (item: AnyRequirement) => {
    setReportTarget(item);
    setReportReason("fake");
    setReportDetails("");
    setReportError(null);
  };

  const closeReportDialog = () => {
    setReportTarget(null);
    setReportError(null);
  };

  const submitReport = async () => {
    const target = reportTarget;
    if (!target) return;
    setReporting(true);
    setReportError(null);
    try {
      const result = await reportRequirement(
        target._id,
        reportReason,
        reportDetails.trim() || undefined
      );
      if (result.postRemoved) {
        // Threshold crossed: the API deleted the post — drop it here too.
        setRequirements((prev) => prev.filter((r) => r._id !== target._id));
        setActiveItem((prev) => (prev?._id === target._id ? null : prev));
        toast.success("Report filed — the post has been removed.", {
          description:
            "It exceeded the community report threshold. Thanks for keeping PulseStage clean.",
        });
      } else {
        toast.success(
          `Report received (${result.reportCount}/${result.threshold}) — thanks!`
        );
      }
      closeReportDialog();
    } catch (err) {
      setReportError(err instanceof Error ? err.message : "Failed to file report");
    } finally {
      setReporting(false);
    }
  };

  /**
   * Trim, add the protocol when the applicant leaves it off, and reject
   * anything that still isn't a web address.
   */
  const normalizeLink = (raw: string): string | null => {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const link = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
      const url = new URL(link);
      if (url.protocol !== "http:" && url.protocol !== "https:") return null;
      if (!url.hostname.includes(".")) return null;
      return link;
    } catch {
      return null;
    }
  };

  /** Chip the typed link: Enter or "Add link" both land it in the list. */
  const addWorkLink = (raw: string) => {
    const link = normalizeLink(raw);
    if (!link) {
      setApplyError("That doesn't look like a valid link — start it with https://");
      return;
    }
    if (applyForm.workLinks.includes(link)) {
      setApplyError("That link is already on your list.");
      return;
    }
    if (applyForm.workLinks.length >= MAX_WORK_LINKS) {
      setApplyError(`You can add up to ${MAX_WORK_LINKS} links.`);
      return;
    }
    setApplyError(null);
    setApplyForm((f) => ({ ...f, workLinks: [...f.workLinks, link] }));
    setLinkDraft("");
  };

  const removeWorkLink = (index: number) => {
    setApplyForm((f) => ({
      ...f,
      workLinks: f.workLinks.filter((_, i) => i !== index),
    }));
  };

  const submitApply = async () => {
    const target = applyTarget;
    if (!target) return;
    const { name, email, phone, message } = applyForm;
    if (!name.trim() || !email.trim() || !message.trim()) {
      setApplyError("Name, email, and a short pitch are required.");
      return;
    }

    // Anything typed but not yet chipped rides along with the submit; a bad
    // draft is reported instead of silently dropped. The API's schema is the
    // final word on the 3–10 window and URL shape.
    const workLinks = [...applyForm.workLinks];
    const draft = linkDraft.trim();
    if (draft) {
      const link = normalizeLink(draft);
      if (!link) {
        setApplyError(`"${draft}" isn't a valid link.`);
        return;
      }
      if (!workLinks.includes(link)) workLinks.push(link);
    }
    if (workLinks.length < MIN_WORK_LINKS) {
      setApplyError(`Add at least ${MIN_WORK_LINKS} links to your most notable work.`);
      return;
    }
    if (workLinks.length > MAX_WORK_LINKS) {
      setApplyError(`You can add up to ${MAX_WORK_LINKS} links.`);
      return;
    }

    setApplying(true);
    setApplyError(null);
    try {
      await applyToRequirement(target._id, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        message: message.trim(),
        workLinks,
      });
      closeApplyDialog();
      toast.success("Application sent — the poster has your details.");
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : "Failed to send application");
    } finally {
      setApplying(false);
    }
  };

  // Esc closes whichever dialog is open (delete, claim, apply, report).
  useEffect(() => {
    if (!deleteTarget && !claimTarget && !applyTarget && !reportTarget) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeDeleteModal();
        closeClaimDialog();
        closeApplyDialog();
        closeReportDialog();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteTarget, claimTarget, applyTarget, reportTarget]);

  const confirmDelete = async () => {
    const target = deleteTarget;
    if (!target) return;
    const key = deleteKeyInput.trim();
    const localRec = myPosts.find((p) => p.id === target._id);
    const poster = target.poster;
    const ownerSession =
      !!user && !!poster && poster.userId === user.id;

    // Session-only delete for the signed-in owner — everyone else (guests,
    // other accounts, admins included) confirms with their Post ID key.
    if (!key && !ownerSession) {
      setDeleteError("Enter the Post ID to confirm the deletion.");
      return;
    }

    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteRequirement(target._id, key || undefined);
      setRequirements((prev) => prev.filter((r) => r._id !== target._id));
      setActiveItem((prev) => (prev?._id === target._id ? null : prev));
      if (localRec) {
        forgetMyPost(target._id);
        setMyPosts((prev) => prev.filter((p) => p.id !== target._id));
      }
      closeDeleteModal();
      toast.success("Post deleted");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete post");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8 text-black">
      {/* Top Banner / Feed Header */}
      <div className="bg-[#FFFDF8] border-[3.5px] border-black shadow-[8px_8px_0px_#000] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-black">
            {isMine ? "My Posts" : "Production Requirement Feed"}
          </h1>
          <p className="text-xs sm:text-sm font-bold text-neutral-700 max-w-xl">
            {isMine
              ? "Everything you've posted — edit, take down, or manage it right here."
              : "Explore verified requirements across Event Planners, Performing Artists, and Technical Crew. Powered by Mongoose discriminators."}
          </p>
        </div>

        <Link
          href="/post"
          className="px-6 py-3.5 rounded-2xl bg-[#FF5757] hover:bg-[#ff3b3b] text-white font-black text-xs sm:text-sm uppercase tracking-wider border-[3px] border-black shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2 shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Post New Requirement</span>
        </Link>
      </div>

      {/* Signed-out visit to /myposts → prompt instead of an empty grid */}
      {isMine && !sessionLoading && !user ? (
        <div className="text-center py-16 bg-[#FFFDF8] border-[3.5px] border-black shadow-[6px_6px_0px_#000] rounded-3xl p-8 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#00F0FF] border-[3px] border-black shadow-[3px_3px_0px_#000] flex items-center justify-center mx-auto">
            <KeyRound className="w-8 h-8 text-black" />
          </div>
          <h3 className="text-2xl font-black">Sign in to see your posts</h3>
          <p className="text-xs font-bold text-neutral-600 max-w-sm mx-auto">
            Your posts live with your account — sign in and they&apos;ll all be
            here, ready to edit or take down.
          </p>
          <Link
            href="/signin?next=/profile"
            className="inline-block px-5 py-2.5 rounded-xl bg-[#FFDE59] border-2 border-black font-black text-xs uppercase shadow-[3px_3px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000] transition-all"
          >
            Sign in
          </Link>
        </div>
      ) : (
      <>
      {/* Filter & Search Bar */}
      <div className="bg-white border-[3px] border-black shadow-[5px_5px_0px_#000] rounded-2xl p-4 space-y-4">
        <form id="feed-filter-form" onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-black" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keywords, tags, roles, or cities..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:bg-[#FFF9E6] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-[#00F0FF] hover:bg-[#00d8e6] text-black font-black text-xs uppercase border-[2.5px] border-black shadow-[3px_3px_0px_#000] transition-all flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>
        </form>

        {/* Quick Category Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t-2 border-black/10">
          <span className="text-xs font-black uppercase text-neutral-600 mr-2">
            Persona:
          </span>

          {[
            { id: "ALL", label: "All Categories", color: "bg-white" },
            { id: "Planner", label: "Event Planners", color: "bg-[#FFDE59]" },
            { id: "Performer", label: "Artists & Performers", color: "bg-[#FF66C4]" },
            { id: "Crew", label: "Technical Crew", color: "bg-[#00F0FF]" },
          ].map((cat) => {
            const isSelected = filters.category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => applyChip({ category: cat.id })}
                className={`px-3 py-1.5 rounded-xl text-xs font-black border-2 border-black transition-all ${
                  isSelected
                    ? `${cat.color} shadow-[3px_3px_0px_#000] translate-x-[-1px] translate-y-[-1px]`
                    : "bg-white shadow-[2px_2px_0px_#000] opacity-70 hover:opacity-100"
                }`}
              >
                {cat.label}
              </button>
            );
          })}

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchFeed()}
              className="p-1.5 rounded-xl bg-white border-2 border-black shadow-[2px_2px_0px_#000] hover:bg-neutral-100 transition-all"
              title="Refresh feed"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* More filters — accordion: location, budget, urgency, pay type */}
        <div className="pt-2 border-t-2 border-black/10">
          <button
            type="button"
            onClick={() => setShowAdvFilters((v) => !v)}
            aria-expanded={showAdvFilters}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FFFDF8] hover:bg-[#FFF9E6] border-2 border-black shadow-[2px_2px_0px_#000] font-black text-xs uppercase transition-all"
          >
            <Layers className="w-4 h-4" />
            <span>{showAdvFilters ? "Hide filters" : "More filters"}</span>
            {activeAdvCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-lg bg-[#FF66C4] text-white text-[10px] border-2 border-black">
                {activeAdvCount}
              </span>
            )}
            <ChevronDown
              className={`w-4 h-4 transition-transform ${showAdvFilters ? "rotate-180" : ""}`}
            />
          </button>

          {showAdvFilters && (
            <div className="mt-3 space-y-4">
              {/* Location + Budget */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-neutral-600">
                    <MapPin className="w-3 h-3 inline -mt-0.5 mr-1" />
                    Location
                  </label>
                  <input
                    type="text"
                    value={advDraft.city}
                    onChange={(e) => setAdvDraft((p) => ({ ...p, city: e.target.value }))}
                    placeholder="City or venue…"
                    className="w-full px-3 py-2 text-xs bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:bg-[#FFF9E6] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-neutral-600">
                    Min budget ($)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={advDraft.minBudget}
                    onChange={(e) => setAdvDraft((p) => ({ ...p, minBudget: e.target.value }))}
                    placeholder="0"
                    className="w-full px-3 py-2 text-xs bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:bg-[#FFF9E6] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-neutral-600">
                    Max budget ($)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={advDraft.maxBudget}
                    onChange={(e) => setAdvDraft((p) => ({ ...p, maxBudget: e.target.value }))}
                    placeholder="Any"
                    className="w-full px-3 py-2 text-xs bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:bg-[#FFF9E6] focus:outline-none"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    type="submit"
                    form="feed-filter-form"
                    className="w-full px-3 py-2 rounded-xl bg-[#00F0FF] hover:bg-[#00d8e6] text-black font-black text-xs uppercase border-[2.5px] border-black shadow-[2px_2px_0px_#000] transition-all"
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="w-full px-3 py-2 rounded-xl bg-[#FFDE59] hover:bg-[#ffd633] text-black font-black text-xs uppercase border-[2.5px] border-black shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000] transition-all"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Urgency + Pay type chips */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black uppercase text-neutral-600 mr-2">
                  Urgency:
                </span>
                {[
                  { id: "All", label: "Any", color: "bg-white" },
                  { id: "standard", label: "Standard", color: "bg-white" },
                  { id: "high", label: "High", color: "bg-[#FFDE59]" },
                  { id: "urgent", label: "Urgent", color: "bg-[#FF5757] text-white" },
                ].map((u) => {
                  const isSelected = filters.urgency === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => applyChip({ urgency: u.id })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black border-2 border-black transition-all ${
                        isSelected
                          ? `${u.color} shadow-[3px_3px_0px_#000] translate-x-[-1px] translate-y-[-1px]`
                          : "bg-white shadow-[2px_2px_0px_#000] opacity-70 hover:opacity-100"
                      }`}
                    >
                      {u.label}
                    </button>
                  );
                })}

                <span className="text-xs font-black uppercase text-neutral-600 ml-4 mr-2">
                  Pay:
                </span>
                {[
                  { id: "All", label: "Any" },
                  { id: "fixed", label: "Fixed" },
                  { id: "hourly", label: "Hourly" },
                  { id: "daily", label: "Daily" },
                  { id: "negotiable", label: "Negotiable" },
                ].map((p) => {
                  const isSelected = filters.payType === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => applyChip({ payType: p.id })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black border-2 border-black transition-all ${
                        isSelected
                          ? "bg-[#7ED957] shadow-[3px_3px_0px_#000] translate-x-[-1px] translate-y-[-1px]"
                          : "bg-white shadow-[2px_2px_0px_#000] opacity-70 hover:opacity-100"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-2xl bg-[#FF5757] border-[3px] border-black text-white text-xs font-black flex items-center gap-2 shadow-[4px_4px_0px_#000]">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid of Requirement Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-64 rounded-3xl bg-white border-[3px] border-black shadow-[5px_5px_0px_#000] animate-pulse p-6 space-y-4"
            >
              <div className="w-24 h-6 bg-neutral-200 rounded-lg" />
              <div className="w-full h-8 bg-neutral-200 rounded-lg" />
              <div className="w-3/4 h-4 bg-neutral-200 rounded-lg" />
              <div className="w-1/2 h-4 bg-neutral-200 rounded-lg" />
            </div>
          ))}
        </div>
      ) : requirements.length === 0 ? (
        <div className="text-center py-16 bg-[#FFFDF8] border-[3.5px] border-black shadow-[6px_6px_0px_#000] rounded-3xl p-8 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#FFDE59] border-[3px] border-black shadow-[3px_3px_0px_#000] flex items-center justify-center mx-auto">
            <Search className="w-8 h-8 text-black" />
          </div>
          <h3 className="text-2xl font-black">No requirements found</h3>
          <p className="text-xs font-bold text-neutral-600 max-w-sm mx-auto">
            No matching listings found for your filters. Try resetting the search or
            post the first one!
          </p>
          <button
            onClick={clearFilters}
            className="px-5 py-2.5 rounded-xl bg-[#00F0FF] border-2 border-black font-black text-xs uppercase shadow-[3px_3px_0px_#000]"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requirements.map((item) => {
            const isPlanner = item.category === "Planner";
            const isPerformer = item.category === "Performer";
            const isCrew = item.category === "Crew";

            const badgeBg = isPlanner
              ? "bg-[#FFDE59]"
              : isPerformer
              ? "bg-[#FF66C4]"
              : "bg-[#00F0FF]";

            const details = item.details;

            // Trust + permission flags: only the signed-in OWNER (never an
            // admin acting on someone else's post) gets full edit/delete
            // management; a Post ID saved on this device allows deletion only.
            const poster = item.poster;
            const isOwner =
              !!user && !!poster && poster.userId === user.id;
            const localRec = myPosts.find((p) => p.id === item._id);
            const canManageCard = isOwner || !!localRec;
            // Flag button (top-left): anyone but the owner — guests can
            // report too (deduped by an anonymous report cookie), and never
            // on a post created on this device (you don't report your own).
            const showReportBtn = !isOwner && !localRec;
            const countdown = timeLeft(item.expiresAt);

            return (
              <div
                key={item._id}
                onClick={() => setActiveItem(item)}
                className="relative bg-white border-[3.5px] border-black shadow-[6px_6px_0px_#000] hover:shadow-[3px_3px_0px_#000] hover:translate-x-[3px] hover:translate-y-[3px] rounded-3xl p-6 flex flex-col justify-between transition-all cursor-pointer group"
              >
                {/* Top-left action — report (anyone but the owner) */}
                {showReportBtn && (
                  <button
                    type="button"
                    aria-label="Report this post"
                    title="Report this post"
                    onClick={(e) => {
                      e.stopPropagation();
                      openReportDialog(item);
                    }}
                    className="absolute top-3 left-3 w-8 h-8 rounded-lg bg-white text-[#FF5757] border-2 border-black shadow-[2px_2px_0px_#000] hover:bg-[#FF5757] hover:text-white hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000] transition-all flex items-center justify-center"
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                )}
                {/* Top actions — Delete on every card (Post ID dialog gates the
                    actual deletion); Edit only for the signed-in owner. */}
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  {isOwner && (
                    <Link
                      href={`/post?edit=${item._id}`}
                      aria-label="Edit post"
                      title="Edit this post"
                      onClick={(e) => e.stopPropagation()}
                      className="w-8 h-8 rounded-lg bg-[#FFDE59] text-black border-2 border-black shadow-[2px_2px_0px_#000] hover:bg-[#ffd633] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000] transition-all flex items-center justify-center"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                  )}
                  <button
                    type="button"
                    aria-label="Delete post"
                    title="Delete this post (requires the Post ID)"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item);
                    }}
                    className="w-8 h-8 rounded-lg bg-white text-black border-2 border-black shadow-[2px_2px_0px_#000] hover:bg-[#FF5757] hover:text-white hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000] transition-all flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Category & Urgency (reserve space for the top-corner
                      actions: flag on the left, edit/delete on the right) */}
                  <div
                    className={`flex items-center justify-between gap-2 ${showReportBtn ? "pl-9" : ""} ${isOwner ? "pr-[72px]" : "pr-9"}`}
                  >
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-black border-2 border-black shadow-[2px_2px_0px_#000] flex items-center gap-1.5 ${badgeBg}`}
                    >
                      {isPlanner && <Sparkles className="w-3.5 h-3.5 text-black" />}
                      {isPerformer && <Music className="w-3.5 h-3.5 text-black" />}
                      {isCrew && <Wrench className="w-3.5 h-3.5 text-black" />}
                      <span>{item.category}</span>
                    </span>

                    {item.urgency === "urgent" && (
                      <span className="px-2 py-0.5 rounded-lg bg-[#FF5757] text-white text-[10px] font-black uppercase border border-black animate-pulse">
                        URGENT CALL
                      </span>
                    )}
                  </div>

                  {/* Poster trust + time-left chips */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Ownership strip: YOUR post (signed-in owner) vs. Post ID
                        saved on THIS device (guest/local record). */}
                    {isOwner ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#FF66C4] text-white border border-black text-[10px] font-black uppercase">
                        Your post
                      </span>
                    ) : (
                      localRec && (
                        <span>                  
                        </span>
                      )
                    )}
                    {poster ? (
                      poster.verified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#7ED957] border border-black text-[10px] font-black">
                          <BadgeCheck className="w-3 h-3" />
                          Verified Poster
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-neutral-100 border border-black text-[10px] font-black">
                          PulseStage account
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#FFDE59] border border-black text-[10px] font-black">
                        <KeyRound className="w-3 h-3" />
                        Guest post
                      </span>
                    )}
                    {item.applicationsPaused && (
                      <span
                        title="The poster paused application intake"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#FFDE59] border border-black text-[10px] font-black uppercase"
                      >
                        <Ban className="w-3 h-3" />
                        Intake paused
                      </span>
                    )}
                    {countdown && (
                      <span
                        title="Auto-removes at 23:59 on the event's end date"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#00F0FF] border border-black text-[10px] font-black"
                      >
                        <Hourglass className="w-3 h-3" />
                        {countdown}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-black text-black group-hover:text-[#FF5757] transition-colors line-clamp-2">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs font-bold text-neutral-700 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Discriminator Spec Highlight */}
                  <div className="p-3 rounded-2xl bg-[#FFF9E6] border-2 border-black space-y-1 text-xs">
                    {isPlanner && (
                      <div className="font-bold truncate">
                        <span className="text-neutral-600">Event:</span>{" "}
                        <strong className="font-black">
                          {(details as PlannerDetails).eventType}
                        </strong>{" "}
                        • <span>{(details as PlannerDetails).guestCount} guests</span>
                      </div>
                    )}
                    {isPerformer && (
                      <div className="font-bold truncate">
                        <span className="text-neutral-600">Act:</span>{" "}
                        <strong className="font-black">
                          {(details as PerformerDetails).performanceCategory}
                        </strong>{" "}
                        •{" "}
                        <span>
                          {(details as PerformerDetails).performanceDurationMinutes} mins
                        </span>
                      </div>
                    )}
                    {isCrew && (
                      <div className="font-bold truncate">
                        <span className="text-neutral-600">Role:</span>{" "}
                        <strong className="font-black">
                          {(details as CrewDetails).roleSpecialization}
                        </strong>{" "}
                        •{" "}
                        <span>
                          {(details as CrewDetails).shiftDurationHours}h shift
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {item.tags.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-lg bg-neutral-100 text-neutral-800 text-[10px] font-bold border border-black"
                        >
                          #{t}
                        </span>
                      ))}
                      {item.tags.length > 3 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-black text-neutral-600">
                          +{item.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Apply — everyone but the signed-in owner can throw their
                    hat in (guest posts created on this device included: the
                    API only rejects an owner applying to their own post).
                    Paused intake shows a closed state instead — the API
                    would answer 409 anyway. */}
                {!isOwner && (
                  <div onClick={(e) => e.stopPropagation()}>
                    {item.applicationsPaused ? (
                      <button
                        type="button"
                        disabled
                        title="The poster has paused applications for this post"
                        className="w-full mt-3 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-200 text-neutral-500 border-2 border-black text-[11px] font-black uppercase tracking-wider cursor-not-allowed"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        Applications paused
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openApplyDialog(item)}
                        className="w-full mt-3 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#FF66C4] text-white border-2 border-black shadow-[2px_2px_0px_#000] text-[11px] font-black uppercase tracking-wider hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000] transition-all"
                        title="Apply for this requirement"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Apply for this
                      </button>
                    )}
                  </div>
                )}

                {/* Owner shortcut: the applications this post received live
                    on the owner-only page (/applicants?post=<id>) — the
                    session decides who gets in, the id says which post. */}
                {isOwner && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <Link
                      href={`/applicants?post=${encodeURIComponent(item._id)}`}
                      className="w-full mt-3 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#00F0FF] border-2 border-black shadow-[2px_2px_0px_#000] text-[11px] font-black uppercase tracking-wider hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000] transition-all"
                      title="View applications to this post"
                    >
                      <Inbox className="w-3.5 h-3.5" />
                      View applicants
                    </Link>
                  </div>
                )}

                {/* Claim — unclaimed guest posts, bottom of the card, signed-in
                    accounts only. Opens a dialog that asks for the Post ID key
                    created with the post. */}
                {!poster && user && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => openClaimDialog(item)}
                      className="w-full mt-3 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#7ED957] border-2 border-black shadow-[2px_2px_0px_#000] text-[11px] font-black uppercase tracking-wider hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000] transition-all"
                      title="Claim this guest post for your account"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Claim this post
                    </button>
                  </div>
                )}

                {/* Card Footer: Budget & Location */}
                <div className="pt-4 mt-4 border-t-2 border-black flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-1 text-neutral-700">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{item.location?.city || "Remote"}</span>
                  </div>

                  <div className="font-black text-sm bg-[#7ED957] px-2.5 py-1 rounded-xl border-2 border-black shadow-[2px_2px_0px_#000]">
                    ${item.budget?.min?.toLocaleString()}–$
                    {item.budget?.max?.toLocaleString()}{" "}
                    <span className="text-[10px] font-mono">{item.budget?.currency}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lazy-load sentinel + manual trigger */}
      {!loading && requirements.length > 0 && page < totalPages && (
        <>
          <div ref={sentinelRef} className="h-px" aria-hidden />
          <div className="flex justify-center">
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="px-6 py-3 rounded-2xl bg-[#FFDE59] hover:bg-[#ffd633] text-black font-black text-xs uppercase tracking-wider border-[3px] border-black shadow-[4px_4px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading…</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  <span>
                    Load more posts ({requirements.length} of {total})
                  </span>
                </>
              )}
            </button>
          </div>
        </>
      )}

      {/* Delete confirmation — the Post ID is the auth */}
      {deleteTarget &&
        (() => {
          const localRec = myPosts.find((p) => p.id === deleteTarget._id);
          const poster = deleteTarget.poster;
          const ownerSession =
            !!user && !!poster && poster.userId === user.id;
          const canSubmit = ownerSession || !!deleteKeyInput.trim();
          return (
            <div
              className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4"
              onClick={closeDeleteModal}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Confirm post deletion"
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-[#FFFDF8] border-[3.5px] border-black shadow-[8px_8px_0px_#000] rounded-3xl p-6 space-y-4 text-black"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 shrink-0 rounded-xl bg-[#FF5757] border-[3px] border-black shadow-[2px_2px_0px_#000] flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-lg font-black">Delete this post?</h2>
                    <p className="text-xs font-bold text-neutral-700 leading-relaxed">
                      <strong className="font-black">{deleteTarget.title}</strong> comes
                      off the feed for everyone. There&apos;s no undo.
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    confirmDelete();
                  }}
                  className="space-y-3"
                >
                  {!ownerSession && (
                    <>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-black uppercase">
                          Post ID <span className="text-[#FF5757]">*</span>
                        </label>
                        <input
                          autoFocus
                          value={deleteKeyInput}
                          onChange={(e) => setDeleteKeyInput(e.target.value)}
                          placeholder="PS-…"
                          className="w-full px-3.5 py-2.5 text-sm bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-mono font-bold focus:bg-[#FFF9E6] focus:outline-none"
                        />
                      </div>

                      {localRec && (
                        <button
                          type="button"
                          onClick={() => setDeleteKeyInput(localRec.postKey)}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#FFDE59] border-2 border-black shadow-[2px_2px_0px_#000] text-[11px] font-black uppercase tracking-wider hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000] transition-all"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          Paste saved Post ID
                        </button>
                      )}

                      <p className="text-[11px] font-bold text-neutral-500 leading-relaxed">
                        {localRec
                          ? "This device has the Post ID saved — paste it (or type it) to confirm the deletion."
                          : "The Post ID was shown once at creation and saved on the creating device. Without it, the post can't be deleted."}
                      </p>
                    </>
                  )}

                  {ownerSession && (
                    <p className="text-[11px] font-bold text-neutral-500 leading-relaxed">
                      You&apos;re signed in as the owner — no Post ID needed, just
                      confirm below.
                    </p>
                  )}

                  {deleteError && (
                    <div className="p-3 rounded-2xl bg-[#FF5757] border-[2.5px] border-black text-white text-xs font-black shadow-[2px_2px_0px_#000]">
                      {deleteError}
                    </div>
                  )}

                  <div className="flex gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={closeDeleteModal}
                      className="flex-1 px-4 py-2.5 rounded-2xl bg-white hover:bg-neutral-100 text-black font-black text-xs uppercase tracking-wider border-[2.5px] border-black shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!canSubmit || deleting}
                      className="flex-1 px-4 py-2.5 rounded-2xl bg-[#FF5757] hover:bg-[#ff3b3b] text-white font-black text-xs uppercase tracking-wider border-[2.5px] border-black shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {deleting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      <span>Delete post</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          );
        })()}

      {/* Report confirmation — reason + optional details; crossing the
          threshold removes the post right here in the feed. */}
      {reportTarget && (
        <div
          className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4"
          onClick={closeReportDialog}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Report this post"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#FFFDF8] border-[3.5px] border-black shadow-[8px_8px_0px_#000] rounded-3xl p-6 space-y-4 text-black max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 shrink-0 rounded-xl bg-[#FF5757] border-[3px] border-black shadow-[3px_3px_0px_#000] flex items-center justify-center">
                <Flag className="w-5 h-5 text-white" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-black">Report this post?</h2>
                <p className="text-xs font-bold text-neutral-700 leading-relaxed">
                  Flagging <strong>{reportTarget.title}</strong> — one report
                  each. Past the threshold the post is removed and the
                  poster suspended.
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitReport();
              }}
              className="space-y-3"
            >
              <div className="space-y-1.5">
                <label htmlFor="report-reason" className="block text-xs font-black uppercase">
                  Reason <span className="text-[#FF5757]">*</span>
                </label>
                <select
                  id="report-reason"
                  autoFocus
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value as ReportReason)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:bg-[#FFF9E6] focus:outline-none"
                >
                  {REPORT_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="report-details" className="block text-xs font-black uppercase">
                  Details <span className="text-neutral-400">(optional)</span>
                </label>
                <textarea
                  id="report-details"
                  rows={3}
                  maxLength={500}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="What looks wrong about this post?"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:bg-[#FFF9E6] focus:outline-none resize-y"
                />
              </div>

              {reportError && (
                <div className="p-3 rounded-2xl bg-[#FF5757] border-[2.5px] border-black text-white text-xs font-black">
                  {reportError}
                </div>
              )}

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={closeReportDialog}
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-white hover:bg-neutral-100 text-black font-black text-xs uppercase tracking-wider border-[2.5px] border-black shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reporting}
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-[#FF5757] hover:bg-[#ff3b3b] text-white font-black text-xs uppercase tracking-wider border-[2.5px] border-black shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {reporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Flag className="w-4 h-4" />
                  )}
                  <span>Submit report</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Claim confirmation — the Post ID key proves authorship */}
      {claimTarget &&
        (() => {
          const rec = myPosts.find((p) => p.id === claimTarget._id);
          return (
            <div
              className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4"
              onClick={closeClaimDialog}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Claim this post"
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-[#FFFDF8] border-[3.5px] border-black shadow-[8px_8px_0px_#000] rounded-3xl p-6 space-y-4 text-black"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 shrink-0 rounded-xl bg-[#7ED957] border-[3px] border-black shadow-[2px_2px_0px_#000] flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-black" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-lg font-black">Claim this post?</h2>
                    <p className="text-xs font-bold text-neutral-700 leading-relaxed">
                      Enter the Post ID key created with{" "}
                      <strong className="font-black">{claimTarget.title}</strong> — it
                      proves you created it and moves the post to your account.
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    confirmClaim();
                  }}
                  className="space-y-3"
                >
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black uppercase">
                      Post ID <span className="text-[#FF5757]">*</span>
                    </label>
                    <input
                      autoFocus
                      value={claimKeyInput}
                      onChange={(e) => setClaimKeyInput(e.target.value)}
                      placeholder="PS-…"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-mono font-bold focus:bg-[#FFF9E6] focus:outline-none"
                    />
                  </div>

                  {rec && (
                    <button
                      type="button"
                      onClick={() => setClaimKeyInput(rec.postKey)}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#FFDE59] border-2 border-black shadow-[2px_2px_0px_#000] text-[11px] font-black uppercase tracking-wider hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000] transition-all"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      Paste saved Post ID
                    </button>
                  )}

                  {claimError && (
                    <div className="p-3 rounded-2xl bg-[#FF5757] border-[2.5px] border-black text-white text-xs font-black shadow-[3px_3px_0px_#000]">
                      {claimError}
                    </div>
                  )}

                  <div className="flex gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={closeClaimDialog}
                      className="flex-1 px-4 py-2.5 rounded-2xl bg-white hover:bg-neutral-100 text-black font-black text-xs uppercase tracking-wider border-[2.5px] border-black shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!claimKeyInput.trim() || claiming}
                      className="flex-1 px-4 py-2.5 rounded-2xl bg-[#7ED957] hover:bg-[#6ec74a] text-black font-black text-xs uppercase tracking-wider border-[2.5px] border-black shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {claiming ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <UserCheck className="w-4 h-4" />
                      )}
                      <span>Claim post</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          );
        })()}

      {/* Apply dialog — name, contact, pitch, 3–10 work links (guests welcome) */}
      {applyTarget && (
        <div
          className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4"
          onClick={closeApplyDialog}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Apply for this requirement"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#FFFDF8] border-[3.5px] border-black shadow-[8px_8px_0px_#000] rounded-3xl p-6 space-y-4 text-black max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 shrink-0 rounded-xl bg-[#FF66C4] border-[3px] border-black shadow-[2px_2px_0px_#000] flex items-center justify-center">
                <Send className="w-5 h-5 text-white" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-black">Apply for this role</h2>
                <p className="text-xs font-bold text-neutral-700 leading-relaxed">
                  Sending your details for{" "}
                  <strong className="font-black">{applyTarget.title}</strong> — name,
                  contact, why you&apos;re a good fit, and links to your most
                  notable work.
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitApply();
              }}
              className="space-y-3"
            >
              <div className="space-y-1.5">
                <label htmlFor="apply-name" className="block text-xs font-black uppercase">
                  Name <span className="text-[#FF5757]">*</span>
                </label>
                <input
                  id="apply-name"
                  autoFocus
                  value={applyForm.name}
                  onChange={(e) => setApplyForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Your full name"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:bg-[#FFF9E6] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="apply-email" className="block text-xs font-black uppercase">
                  Email <span className="text-[#FF5757]">*</span>
                </label>
                <input
                  id="apply-email"
                  type="email"
                  value={applyForm.email}
                  onChange={(e) => setApplyForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:bg-[#FFF9E6] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="apply-phone" className="block text-xs font-black uppercase">
                  Phone <span className="text-neutral-400">(optional)</span>
                </label>
                <input
                  id="apply-phone"
                  type="tel"
                  value={applyForm.phone}
                  onChange={(e) => setApplyForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="e.g. +1 (555) 019-2834"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:bg-[#FFF9E6] focus:outline-none"
                />
              </div>

              {/* Most notable work — enter a link, press Add (or Enter);
                  added links show as chips flowing horizontally. 3–10 total,
                  minimum 3 to submit. */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="apply-link-draft"
                    className="block text-xs font-black uppercase"
                  >
                    Most notable work{" "}
                    <span className="text-[#FF5757]">*</span>
                  </label>
                  <span className="px-1.5 py-0.5 rounded-lg bg-neutral-100 border border-black text-[10px] font-black">
                    {applyForm.workLinks.length}/{MAX_WORK_LINKS}
                  </span>
                </div>
                <p className="text-[11px] font-bold text-neutral-500 leading-relaxed">
                  Enter a link, then press Add — {MIN_WORK_LINKS}–{MAX_WORK_LINKS} links
                  to your best work (reel, portfolio, credits, video…).
                </p>

                {/* Added links — chips side by side, wrapping only when out
                    of room */}
                {applyForm.workLinks.length > 0 && (
                  <ul className="flex flex-wrap gap-1.5">
                    {applyForm.workLinks.map((link, i) => (
                      <li
                        key={link}
                        className="inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-xl bg-[#E0F7FA] border-2 border-black shadow-[2px_2px_0px_#000] text-[11px] font-bold font-mono max-w-full"
                      >
                        <span className="truncate max-w-[11rem]" title={link}>
                          {link.replace(/^https?:\/\//i, "")}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeWorkLink(i)}
                          aria-label={`Remove work link ${i + 1}`}
                          title="Remove this link"
                          className="w-4 h-4 shrink-0 rounded bg-white border border-black hover:bg-[#FF5757] hover:text-white transition-all flex items-center justify-center"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Enter link → Add (hidden once the 10-link cap is hit) */}
                {applyForm.workLinks.length < MAX_WORK_LINKS && (
                  <div className="flex items-center gap-1.5">
                    <input
                      id="apply-link-draft"
                      type="text"
                      inputMode="url"
                      value={linkDraft}
                      onChange={(e) => setLinkDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addWorkLink(linkDraft);
                        }
                      }}
                      placeholder="https://… (enter link)"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:bg-[#FFF9E6] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => addWorkLink(linkDraft)}
                      disabled={!linkDraft.trim()}
                      className="shrink-0 h-[42px] px-3 rounded-xl bg-[#FFDE59] border-2 border-black shadow-[2px_2px_0px_#000] text-[11px] font-black uppercase tracking-wider hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000] transition-all flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add link
                    </button>
                  </div>
                )}

                {/* Minimum reminder */}
                {applyForm.workLinks.length < MIN_WORK_LINKS && (
                  <p className="text-[11px] font-black text-[#FF5757]">
                    {MIN_WORK_LINKS - applyForm.workLinks.length} more link
                    {MIN_WORK_LINKS - applyForm.workLinks.length === 1 ? "" : "s"} needed —{" "}
                    minimum {MIN_WORK_LINKS}.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="apply-message" className="block text-xs font-black uppercase">
                  Why are you suited? <span className="text-[#FF5757]">*</span>
                </label>
                <textarea
                  id="apply-message"
                  rows={4}
                  value={applyForm.message}
                  onChange={(e) => setApplyForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="A couple of lines on your experience and why you're a great pick…"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border-[2.5px] border-black shadow-[2px_2px_0px_#000] rounded-xl font-bold focus:bg-[#FFF9E6] focus:outline-none resize-y"
                />
              </div>

              {applyError && (
                <div className="p-3 rounded-2xl bg-[#FF5757] border-[2.5px] border-black text-white text-xs font-black shadow-[3px_3px_0px_#000]">
                  {applyError}
                </div>
              )}

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={closeApplyDialog}
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-white hover:bg-neutral-100 text-black font-black text-xs uppercase tracking-wider border-[2.5px] border-black shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    applying ||
                    !applyForm.name.trim() ||
                    !applyForm.email.trim() ||
                    !applyForm.message.trim() ||
                    applyForm.workLinks.length + (linkDraft.trim() ? 1 : 0) <
                      MIN_WORK_LINKS
                  }
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-[#FF66C4] hover:bg-[#f752b3] text-white font-black text-xs uppercase tracking-wider border-[2.5px] border-black shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {applying ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Send application</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Specification Deep-Dive Modal */}
      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-[#FFFDF8] border-[4px] border-black shadow-[10px_10px_0px_#000] rounded-3xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200 text-black">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b-2 border-black pb-4">
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-xl text-xs font-black border-2 border-black shadow-[2px_2px_0px_#000] ${
                    activeItem.category === "Planner"
                      ? "bg-[#FFDE59]"
                      : activeItem.category === "Performer"
                      ? "bg-[#FF66C4]"
                      : "bg-[#00F0FF]"
                  }`}
                >
                  {activeItem.category} Specification
                </span>
              </div>

              <button
                onClick={() => setActiveItem(null)}
                className="w-8 h-8 rounded-xl bg-white border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center hover:bg-neutral-100 transition-all"
              >
                <X className="w-4 h-4 text-black" />
              </button>
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-black">{activeItem.title}</h2>
              <p className="text-xs sm:text-sm font-bold text-neutral-800 leading-relaxed">
                {activeItem.description}
              </p>
            </div>

            {/* Persona Specific Details Grid */}
            <div className="p-5 rounded-3xl bg-white border-[3px] border-black shadow-[4px_4px_0px_#000] space-y-4">
              <h4 className="text-xs font-mono font-black uppercase tracking-wider bg-[#FFDE59] px-2 py-0.5 rounded border border-black inline-block">
                Discriminator Technical Scope
              </h4>

              {activeItem.category === "Planner" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold">
                  <div>
                    <span className="text-neutral-500">Event Type:</span>{" "}
                    <strong>{(activeItem.details as PlannerDetails).eventType}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500">Guest Count:</span>{" "}
                    <strong>{(activeItem.details as PlannerDetails).guestCount}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500">Venue Environment:</span>{" "}
                    <strong>{(activeItem.details as PlannerDetails).venueType}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500">Theme / Vibe:</span>{" "}
                    <strong>
                      {(activeItem.details as PlannerDetails).themeOrVibe || "Open"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-neutral-500">Catering Needed:</span>{" "}
                    <strong>
                      {(activeItem.details as PlannerDetails).cateringNeeded
                        ? "Yes"
                        : "No"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-neutral-500">Overall Budget:</span>{" "}
                    <strong>
                      ${(activeItem.details as PlannerDetails).estimatedOverallBudget?.toLocaleString()}
                    </strong>
                  </div>
                </div>
              )}

              {activeItem.category === "Performer" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold">
                  <div>
                    <span className="text-neutral-500">Category:</span>{" "}
                    <strong>
                      {(activeItem.details as PerformerDetails).performanceCategory}
                    </strong>
                  </div>
                  <div>
                    <span className="text-neutral-500">Duration:</span>{" "}
                    <strong>
                      {(activeItem.details as PerformerDetails).performanceDurationMinutes}{" "}
                      mins
                    </strong>
                  </div>
                  <div>
                    <span className="text-neutral-500">Stage Size:</span>{" "}
                    <strong>
                      {(activeItem.details as PerformerDetails).stageSizeRequirement}
                    </strong>
                  </div>
                  <div>
                    <span className="text-neutral-500">Set Breakdown:</span>{" "}
                    <strong>
                      {(activeItem.details as PerformerDetails).setBreakdown || "Standard"}
                    </strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-neutral-500">Tech Rider:</span>{" "}
                    <p className="font-mono text-[11px] bg-neutral-100 p-2 rounded-xl mt-1 border border-black">
                      {(activeItem.details as PerformerDetails).techRiderSpecs ||
                        "Standard soundcheck"}
                    </p>
                  </div>
                </div>
              )}

              {activeItem.category === "Crew" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold">
                  <div>
                    <span className="text-neutral-500">Specialization:</span>{" "}
                    <strong>
                      {(activeItem.details as CrewDetails).roleSpecialization}
                    </strong>
                  </div>
                  <div>
                    <span className="text-neutral-500">Shift Length:</span>{" "}
                    <strong>
                      {(activeItem.details as CrewDetails).shiftDurationHours} hours
                    </strong>
                  </div>
                  <div>
                    <span className="text-neutral-500">Experience:</span>{" "}
                    <strong>{(activeItem.details as CrewDetails).experienceLevel}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500">Call Time:</span>{" "}
                    <strong>{(activeItem.details as CrewDetails).callTime || "TBD"}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-neutral-500">Certifications:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {((activeItem.details as CrewDetails).certificationsRequired || []).map(
                        (c: string) => (
                          <span
                            key={c}
                            className="px-2 py-0.5 rounded-lg bg-[#00F0FF] text-[10px] font-black border border-black"
                          >
                            {c}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Compensation & Logistics Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#FFF9E6] border-[2.5px] border-black space-y-1 text-xs">
                <div className="font-black uppercase text-neutral-600">
                  Location & Dates
                </div>
                <div className="font-black text-sm">
                  {activeItem.location?.venue}, {activeItem.location?.city}
                </div>
                <div className="font-bold text-neutral-700">
                  {activeItem.dates?.startDate}
                  {activeItem.dates?.endDate ? ` → ${activeItem.dates.endDate}` : ""}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#E0F7FA] border-[2.5px] border-black space-y-1 text-xs">
                <div className="font-black uppercase text-neutral-600">
                  Production Compensation
                </div>
                <div className="font-black text-lg text-emerald-700">
                  ${activeItem.budget?.min?.toLocaleString()}–$
                  {activeItem.budget?.max?.toLocaleString()} {activeItem.budget?.currency}
                </div>
                <div className="font-bold text-neutral-700">
                  {activeItem.budget?.payType?.toUpperCase()} •{" "}
                  {activeItem.budget?.isNegotiable ? "Negotiable" : "Fixed"}
                </div>
              </div>
            </div>

            {/* Publisher Contact */}
            <div className="p-4 rounded-2xl bg-white border-[2.5px] border-black text-xs font-bold space-y-1">
              <div className="font-black uppercase text-neutral-600">
                Publisher Contact
              </div>
              <div>
                {activeItem.contact?.name} •{" "}
                <span className="font-mono"><a href={`mailto:${activeItem.contact?.email}`} rel="noopener noreferrer">{activeItem.contact?.email}</a></span>
              </div>
              {activeItem.contact?.company && (
                <div className="text-neutral-600 font-bold">
                  {activeItem.contact.company}
                </div>
              )}
            </div>

            {/* Actions — apply from inside the spec too (same rules as the
                card: everyone but the signed-in owner can apply; owners get
                the applicants page instead). */}
            {(() => {
              const modalIsOwner =
                !!user &&
                !!activeItem.poster &&
                activeItem.poster.userId === user.id;
              return (
                <div className="flex flex-col gap-2">
                  {!modalIsOwner &&
                    (activeItem.applicationsPaused ? (
                      <button
                        type="button"
                        disabled
                        title="The poster has paused applications for this post"
                        className="w-full py-3.5 rounded-2xl bg-neutral-200 text-neutral-500 font-black text-xs uppercase tracking-wider border-[3px] border-black text-center cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Ban className="w-4 h-4" />
                        Applications paused
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openApplyDialog(activeItem)}
                        className="w-full py-3.5 rounded-2xl bg-[#FF66C4] text-white font-black text-xs uppercase tracking-wider border-[3px] border-black shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2"
                        title="Apply for this requirement"
                      >
                        <Send className="w-4 h-4" />
                        Apply for this role
                      </button>
                    ))}
                  {modalIsOwner && (
                    <Link
                      href={`/applicants?post=${encodeURIComponent(activeItem._id)}`}
                      className="w-full py-3.5 rounded-2xl bg-[#00F0FF] font-black text-xs uppercase tracking-wider border-[3px] border-black shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2"
                      title="View applications to this post"
                    >
                      <Inbox className="w-4 h-4" />
                      View applicants
                    </Link>
                  )}
                  <button
                    onClick={() => setActiveItem(null)}
                    className="w-full py-3.5 rounded-2xl bg-[#FF5757] hover:bg-[#ff3b3b] text-white font-black text-xs uppercase tracking-wider border-[3px] border-black shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                  >
                    Close Specification
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
