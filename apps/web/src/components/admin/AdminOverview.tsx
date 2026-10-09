"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  BadgeCheck,
  Briefcase,
  Gavel,
  Inbox,
  Loader2,
  Mail,
  MessageSquare,
  RefreshCw,
  Users,
} from "lucide-react";
import { fetchAdminOverview, type AdminOverview } from "@/lib/api";

const card =
  "p-4 rounded-3xl bg-white border-[3px] border-black shadow-[5px_5px_0px_#000] space-y-1.5";
const cardLabel = "text-[10px] font-black uppercase tracking-wider text-neutral-500 inline-flex items-center gap-1.5";
const cardValue = "text-3xl font-black leading-none";
const cardSub = "text-[11px] font-bold text-neutral-500";

function Stat({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className={card}>
      <span className={cardLabel}>
        <Icon className="w-3.5 h-3.5" />
        {label}
      </span>
      <div className={`${cardValue} ${accent ? "text-[#FF5757]" : ""}`}>{value}</div>
      {sub && <p className={cardSub}>{sub}</p>}
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  icon: typeof Activity;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border-[3px] border-black shadow-[5px_5px_0px_#000] rounded-3xl overflow-hidden">
      <div className="px-5 py-3.5 border-b-2 border-black bg-[#FFF9E6] flex items-center gap-2">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-black uppercase tracking-wider">{title}</span>
        {action && <span className="ml-auto">{action}</span>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

const fmtDay = (iso: string): string =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
const fmtWhen = (when?: string): string =>
  when ? new Date(when).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—";

/**
 * Overview tab: headline counts, the 14-day signup curve, the category mix,
 * and three recent-activity feeds — one GET /admin/overview round-trip.
 */
export function AdminOverview() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (first = false) => {
    if (first) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      setData(await fetchAdminOverview());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(true);
  }, [load]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4" aria-busy="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-3xl bg-neutral-200 border-[3px] border-black animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 rounded-3xl bg-[#FF5757] border-[3px] border-black shadow-[5px_5px_0px_#000] text-white text-xs font-black flex items-center justify-between gap-3">
        <span>{error}</span>
        <button
          type="button"
          onClick={() => load()}
          className="px-3 py-1.5 rounded-xl bg-white text-black border-2 border-black text-[10px] font-black uppercase"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const maxDaily = Math.max(1, ...data.signupsByDay.map((d) => d.count));
  const catTotal = Math.max(1, ...data.categories.map((c) => c.count));

  return (
    <div className="space-y-5">
      {/* ── Headline metrics ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        <Stat
          icon={Users}
          label="Users"
          value={data.users.total}
          sub={`${data.users.admins} admin${data.users.admins === 1 ? "" : "s"} · ${data.users.verified} verified · ${data.users.banned} banned · +${data.users.newLast7Days} this week`}
        />
        <Stat
          icon={Briefcase}
          label="Live posts"
          value={data.posts.live}
          sub={`${data.posts.total} total · ${data.posts.paused} paused`}
        />
        <Stat
          icon={Activity}
          label="Applications"
          value={data.applications.total}
          sub="across every post"
        />
        <Stat
          icon={Mail}
          label="Subscribers"
          value={data.newsletter.total}
          sub={`+${data.newsletter.newLast7Days} this week`}
        />
        <Stat
          icon={Gavel}
          label="Reports"
          value={data.reports.pending}
          sub={`${data.reports.flaggedPosts} flagged · ${data.reports.autoRemoved} auto-removed`}
          accent={data.reports.pending > 0}
        />
        <Stat
          icon={Inbox}
          label="Support"
          value={data.support.total}
          sub={`${data.support.unread} unread`}
          accent={data.support.unread > 0}
        />
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3">
          <SectionCard
            title="Signups — last 14 days"
            icon={Activity}
            action={
              <button
                type="button"
                onClick={() => load()}
                disabled={refreshing}
                aria-label="Refresh stats"
                className="p-1.5 rounded-lg bg-white border-2 border-black shadow-[1px_1px_0px_#000] hover:shadow-none hover:translate-x-[0.5px] hover:translate-y-[0.5px] transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              </button>
            }
          >
            <div className="flex items-end gap-1.5 h-32" role="img" aria-label="Daily signups, last 14 days">
              {data.signupsByDay.map((d) => {
                const h = d.count === 0 ? 3 : Math.max(10, (d.count / maxDaily) * 100);
                return (
                  <div
                    key={d.day}
                    className="flex-1 flex flex-col items-center justify-end gap-1 min-w-0"
                    title={`${fmtDay(d.day)}: ${d.count} signup${d.count === 1 ? "" : "s"}`}
                  >
                    {d.count > 0 && (
                      <span className="text-[9px] font-black leading-none">{d.count}</span>
                    )}
                    <div
                      className={`w-full rounded-t-md border-2 border-black ${
                        d.count > 0 ? "bg-[#00F0FF]" : "bg-neutral-100"
                      }`}
                      style={{ height: `${h}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-[9px] font-bold text-neutral-400">
              <span>{fmtDay(data.signupsByDay[0]?.day || "")}</span>
              <span>today</span>
            </div>
          </SectionCard>
        </div>

        <div className="lg:col-span-2">
          <SectionCard title="Posts by category" icon={Briefcase}>
            {data.categories.length === 0 ? (
              <p className="text-xs font-bold text-neutral-500">No posts yet.</p>
            ) : (
              <div className="space-y-3">
                {data.categories.map((c) => (
                  <div key={c.category} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-black uppercase tracking-wider">
                      <span>{c.category}</span>
                      <span>{c.count}</span>
                    </div>
                    <div className="h-4 rounded-lg border-2 border-black bg-neutral-100 overflow-hidden">
                      <div
                        className="h-full bg-[#FFDE59] border-r-2 border-black"
                        style={{ width: `${Math.max(4, (c.count / catTotal) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
                {data.posts.expired > 0 && (
                  <p className="text-[10px] font-bold text-neutral-400 pt-1">
                    {data.posts.expired} expired post{data.posts.expired === 1 ? "" : "s"} already
                    swept by the TTL.
                  </p>
                )}
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      {/* ── Recent activity: users + engagement only (never other people's posts) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SectionCard title="Recent signups" icon={Users}>
          {data.recentUsers.length === 0 ? (
            <p className="text-xs font-bold text-neutral-500">Nobody yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {data.recentUsers.map((u) => (
                <li key={u.id} className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold truncate flex-1">{u.email}</span>
                  {u.role === "admin" && (
                    <span className="px-1.5 py-0.5 rounded bg-[#FFDE59] border border-black text-[9px] font-black uppercase shrink-0">
                      Admin
                    </span>
                  )}
                  {u.verified && <BadgeCheck className="w-3.5 h-3.5 text-[#7ED957] shrink-0" />}
                  <span className="text-[10px] font-bold text-neutral-400 shrink-0">
                    {fmtWhen(u.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Recent applications" icon={MessageSquare}>
          {data.recentApplications.length === 0 ? (
            <p className="text-xs font-bold text-neutral-500">No applications yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {data.recentApplications.map((a) => (
                <li key={a.id} className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold truncate">{a.name}</span>
                    <span className="text-[10px] font-bold text-neutral-400 ml-auto shrink-0">
                      {fmtWhen(a.createdAt)}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-neutral-400 truncate">
                    → {a.postTitle || "deleted post"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
