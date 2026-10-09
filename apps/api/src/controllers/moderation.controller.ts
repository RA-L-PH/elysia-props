import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import {
  ReportInput,
  ModerationSettingsInput,
  BanUserInput,
} from "@elysia/shared";
import { RequirementModel } from "../models/Requirement.model.js";
import { ReportModel } from "../models/Report.model.js";
import {
  ReportQuotaModel,
  currentMonth,
} from "../models/ReportQuota.model.js";
import {
  getModerationSettings,
  ModerationSettingsModel,
} from "../models/ModerationSettings.model.js";
import { UserModel } from "../models/User.model.js";
import { randomUUID } from "node:crypto";
import { removeApplicationsFor } from "./application.controller.js";
import { isBanned, bannedResponse, readCookie } from "../middlewares/auth.js";

const DAY_MS = 24 * 60 * 60 * 1000;

/** User ids are HMAC(email) — 64 lowercase hex chars, not ObjectIds. */
const isUserId = (value: string): boolean => /^[a-f0-9]{64}$/.test(value);

/**
 * POST /api/requirements/:id/report (guests AND signed-in accounts)
 *
 * Dedupe identity: a signed-in reporter keys by account email (one report
 * per account); a guest keys by an anonymous `ps_rpt` cookie issued on
 * first report (one report per browser — the per-IP write limiter caps
 * flooding). Each identity also spends a monthly allowance — 10 reports
 * per month for signed-in accounts, 6 for guests (admin-tunable in the
 * dashboard): once spent, further reports answer 429 until the 1st.
 *
 * When the report count EXCEEDS the admin-tunable threshold (default 10 →
 * 11th report), the post is deleted completely — post, applications, and
 * its reports — and the poster's account is auto-banned for the configured
 * number of days (default 14, editable anytime from the dashboard).
 */
const REPORT_COOKIE = "ps_rpt";

export const reportRequirement = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, error: "Invalid requirement ID format" });
      return;
    }

    const user = req.user;
    // optionalAuth populates signed-in reporters; suspended accounts don't
    // get to flag posts either (requireAuth isn't in this chain).
    if (user?.bannedUntil) {
      bannedResponse(res, user.bannedUntil, user.banReason);
      return;
    }

    const post = await RequirementModel.findById(id)
      .select("title postedBy expiresAt")
      .lean();
    const expired =
      post?.expiresAt && new Date(post.expiresAt).getTime() <= Date.now();
    if (!post || expired) {
      res.status(404).json({ success: false, error: "Post not found." });
      return;
    }

    if (user && post.postedBy && String(post.postedBy) === user.id) {
      res
        .status(400)
        .json({ success: false, error: "You can't report your own post." });
      return;
    }

    // Resolve the dedupe key: account email, or an anonymous browser id.
    let reporterKey: string;
    let reporterEmail = "";
    if (user) {
      reporterEmail = user.email.toLowerCase();
      reporterKey = `u:${reporterEmail}`;
    } else {
      let rid = readCookie(req, REPORT_COOKIE) ?? "";
      // Only accept well-formed ids; anything else (or nothing) is replaced.
      if (!/^[A-Za-z0-9_-]{10,64}$/.test(rid)) {
        rid = randomUUID();
        // Relayed to the browser by the BFF exactly like the session cookie.
        res.setHeader(
          "Set-Cookie",
          `${REPORT_COOKIE}=${rid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`
        );
      }
      reporterKey = `g:${rid}`;
    }

    const { reason, details } = req.body as ReportInput;
    const settings = await getModerationSettings();

    // Monthly allowance — checked BEFORE the report is stored, spent only
    // when a new one actually lands (duplicates409 below without costing).
    const month = currentMonth();
    const quotaLimit = user
      ? settings.reportQuotaUser
      : settings.reportQuotaGuest;
    const quota = await ReportQuotaModel.findOne({ reporterKey, month })
      .select("count")
      .lean();
    if (quota && quota.count >= quotaLimit) {
      res.status(429).json({
        success: false,
        error: user
          ? `Monthly report limit reached — ${quotaLimit} report${
              quotaLimit === 1 ? "" : "s"
            } per account per month. The allowance resets on the 1st.`
          : `Monthly report limit reached — ${quotaLimit} reports per browser per month for guests. Sign in for a separate allowance.`,
        code: "REPORT_QUOTA_EXCEEDED",
        limit: quotaLimit,
        used: quota.count,
      });
      return;
    }

    // Upsert with $setOnInsert: a repeat reporter matches the unique index
    // (upsertedCount 0) and is refused instead of inflating the counter.
    const insert = await ReportModel.updateOne(
      { requirementId: id, reporterKey },
      {
        $setOnInsert: {
          requirementId: id,
          reporterKey,
          reporterEmail,
          reporterIp: req.ip || "",
          reason,
          details: details || "",
        },
      },
      { upsert: true }
    );
    if (!insert.upsertedCount) {
      res
        .status(409)
        .json({ success: false, error: "You've already reported this post." });
      return;
    }

    // The report landed — spend one unit of this month's allowance. The
    // counter lives outside the reports collection on purpose: reports are
    // deleted with their post at the threshold, the allowance is not refunded.
    await ReportQuotaModel.updateOne(
      { reporterKey, month },
      { $inc: { count: 1 } },
      { upsert: true }
    );

    const reportCount = await ReportModel.countDocuments({ requirementId: id });

    // Below the threshold: log it and let admins review (Moderation tab).
    if (reportCount <= settings.reportThreshold) {
      res.status(201).json({
        success: true,
        data: {
          reportCount,
          threshold: settings.reportThreshold,
          postRemoved: false,
          banned: false,
        },
        message: `Report received (${reportCount}/${settings.reportThreshold}) — thanks, our team will review it.`,
      });
      return;
    }

    // Threshold exceeded: remove the post completely, then ban the poster.
    await removeApplicationsFor(id);
    await RequirementModel.deleteOne({ _id: id });
    await ReportModel.deleteMany({ requirementId: id });
    await ModerationSettingsModel.updateOne(
      { _id: "moderation" },
      { $inc: { autoRemovedPosts: 1 } }
    );

    let banned = false;
    let bannedUntil: string | null = null;
    if (post.postedBy) {
      const until = new Date(Date.now() + settings.banDays * DAY_MS);
      // $max: never shorten a ban that's already running longer.
      await UserModel.updateOne(
        { _id: post.postedBy },
        {
          $max: { bannedUntil: until },
          $set: {
            banReason: `Post removed after exceeding the report threshold (${reportCount} reports)`,
          },
        }
      );
      banned = true;
      bannedUntil = until.toISOString();
    }

    res.status(200).json({
      success: true,
      data: {
        reportCount,
        threshold: settings.reportThreshold,
        postRemoved: true,
        banned,
        bannedUntil,
      },
      message: banned
        ? "This post was removed for violating the report threshold — the poster has been suspended."
        : "This post was removed for violating the report threshold.",
    });
  } catch (error) {
    next(error);
  }
};

// ── Admin moderation suite ───────────────────────────────────────────

/** GET /api/admin/settings — current moderation numbers. */
export const getModerationRules = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const s = await getModerationSettings();
    res.json({
      success: true,
      data: {
        reportThreshold: s.reportThreshold,
        banDays: s.banDays,
        reportQuotaUser: s.reportQuotaUser,
        reportQuotaGuest: s.reportQuotaGuest,
        autoRemovedPosts: s.autoRemovedPosts,
      },
    });
  } catch (error) {
    next(error);
  }
};

/** PUT /api/admin/settings — edit the threshold / ban length anytime. */
export const updateModerationRules = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { reportThreshold, banDays, reportQuotaUser, reportQuotaGuest } =
      req.body as ModerationSettingsInput;
    // Older clients send only threshold + banDays — apply what's present.
    const patch: Record<string, number> = {};
    if (typeof reportThreshold === "number") patch.reportThreshold = reportThreshold;
    if (typeof banDays === "number") patch.banDays = banDays;
    if (typeof reportQuotaUser === "number") patch.reportQuotaUser = reportQuotaUser;
    if (typeof reportQuotaGuest === "number") patch.reportQuotaGuest = reportQuotaGuest;
    await ModerationSettingsModel.updateOne(
      { _id: "moderation" },
      { $set: patch },
      { upsert: true, setDefaultsOnInsert: true }
    );
    const s = await getModerationSettings();
    res.json({
      success: true,
      data: {
        reportThreshold: s.reportThreshold,
        banDays: s.banDays,
        reportQuotaUser: s.reportQuotaUser,
        reportQuotaGuest: s.reportQuotaGuest,
      },
      message: `Moderation rules saved — posts are removed after more than ${s.reportThreshold} report${s.reportThreshold === 1 ? "" : "s"}; bans last ${s.banDays} day${s.banDays === 1 ? "" : "s"}; reporters get ${s.reportQuotaUser}/month signed in and ${s.reportQuotaGuest}/month as guests.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/reports — flagged posts below (or at) the threshold:
 * title, author, report count and reason mix, so an admin can manually ban
 * an offender before the auto-rule fires. Posts already swept by the rule
 * are gone along with their reports.
 */
export const listFlaggedPosts = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const groups = await ReportModel.aggregate<{
      _id: string;
      count: number;
      reasons: string[];
      lastReportedAt: Date;
    }>([
      {
        $group: {
          _id: "$requirementId",
          count: { $sum: 1 },
          reasons: { $push: "$reason" },
          lastReportedAt: { $max: "$createdAt" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 50 },
    ]);

    const ids = groups.map((g) => g._id);
    const posts = ids.length
      ? await RequirementModel.find({ _id: { $in: ids } })
          .select("title category postedBy")
          .lean()
      : [];
    const postMap = new Map(posts.map((p) => [String(p._id), p]));

    const ownerIds = Array.from(
      new Set(
        posts.map((p) => String(p.postedBy || "")).filter(Boolean)
      )
    );
    const owners = ownerIds.length
      ? await UserModel.find({ _id: { $in: ownerIds } })
          .select("email bannedUntil")
          .lean()
      : [];
    const ownerMap = new Map(owners.map((o) => [String(o._id), o]));

    const rows = groups.flatMap((g) => {
      const post = postMap.get(g._id);
      if (!post) return []; // post vanished between aggregate and fetch
      const owner = post.postedBy ? ownerMap.get(String(post.postedBy)) : null;
      const reasonCounts: Record<string, number> = {};
      for (const r of g.reasons) reasonCounts[r] = (reasonCounts[r] || 0) + 1;
      return [
        {
          requirementId: g._id,
          title: post.title,
          category: post.category,
          ownerEmail: owner?.email ?? null,
          ownerId: post.postedBy ? String(post.postedBy) : null,
          ownerBanned: isBanned(owner?.bannedUntil),
          count: g.count,
          reasons: reasonCounts,
          lastReportedAt: g.lastReportedAt,
        },
      ];
    });

    res.json({
      success: true,
      data: rows,
      meta: { total: rows.length },
    });
  } catch (error) {
    next(error);
  }
};

/** POST /api/admin/users/:id/ban — manual ban (days default to the setting). */
export const banUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
    if (!isUserId(id)) {
      res.status(400).json({ success: false, error: "Invalid user id." });
      return;
    }
    if (req.user?.id === id) {
      res.status(400).json({ success: false, error: "You can't ban yourself." });
      return;
    }

    const target = await UserModel.findById(id)
      .select("email role bannedUntil")
      .lean();
    if (!target) {
      res.status(404).json({ success: false, error: "Account not found." });
      return;
    }
    if (target.role === "admin") {
      res
        .status(400)
        .json({ success: false, error: "Admin accounts can't be banned." });
      return;
    }

    const body = (req.body ?? {}) as BanUserInput;
    const settings = await getModerationSettings();
    const days = body.days ?? settings.banDays;
    const reason = (body.reason || "").trim() || "Banned by an admin.";
    const until = new Date(Date.now() + days * DAY_MS);

    await UserModel.updateOne(
      { _id: id },
      { $set: { bannedUntil: until, banReason: reason } }
    );

    res.json({
      success: true,
      data: { id, email: target.email, bannedUntil: until.toISOString(), days },
      message: `${target.email} is banned for ${days} day${days === 1 ? "" : "s"} (until ${until.toUTCString()}).`,
    });
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/admin/users/:id/ban — lift a suspension early. */
export const unbanUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
    if (!isUserId(id)) {
      res.status(400).json({ success: false, error: "Invalid user id." });
      return;
    }
    const result = await UserModel.updateOne(
      { _id: id },
      { $set: { bannedUntil: null, banReason: "" } }
    );
    if (!result.matchedCount) {
      res.status(404).json({ success: false, error: "Account not found." });
      return;
    }
    res.json({
      success: true,
      data: { id, bannedUntil: null },
      message: "Account reinstated — the ban has been lifted.",
    });
  } catch (error) {
    next(error);
  }
};
