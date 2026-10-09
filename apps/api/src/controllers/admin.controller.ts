import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { UserModel } from "../models/User.model.js";
import { RequirementModel } from "../models/Requirement.model.js";
import { ApplicationModel } from "../models/Application.model.js";
import { NewsletterModel } from "../models/Newsletter.model.js";
import { SupportModel } from "../models/Support.model.js";
import { ReportModel } from "../models/Report.model.js";
import { getModerationSettings } from "../models/ModerationSettings.model.js";

/**
 * Admin dashboard endpoints. Mongo-only by nature — an admin session can't
 * exist without the database (auth is Mongo-only), so no in-memory path is
 * needed here. Everything is read-only except the small status mutators
 * mounted alongside (support mark-read, subscriber removal).
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** ISO yyyy-mm-dd for bucketing (UTC — matches Mongo's dateToString). */
const dayKey = (d: Date): string => d.toISOString().slice(0, 10);

/** The last `days` calendar days, oldest first — the chart's x-axis. */
const lastNDayKeys = (days: number): string[] => {
  const keys: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    keys.push(dayKey(new Date(now.getTime() - i * DAY_MS)));
  }
  return keys;
};

/**
 * GET /api/admin/overview — one round-trip powering the whole dashboard:
 * headline counts, category mix, a 14-day signup curve, and recent-activity
 * feeds. Deliberately aggregate-only: admins manage USERS (verified posters,
 * newsletter, support), never other people's posts — so no per-post data
 * (owners, titles, applicants) crosses this endpoint.
 */
export const getOverview = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * DAY_MS);

    const isLiveFilter = {
      $or: [{ expiresAt: { $gt: now } }, { expiresAt: null }, { expiresAt: { $exists: false } }],
    };

    const [
      userTotal,
      userAdmins,
      userVerified,
      userNew,
      userBanned,
      postTotal,
      postLive,
      postPaused,
      postExpired,
      appTotal,
      newsTotal,
      newsNew,
      supportTotal,
      supportUnread,
      categories,
      signupBuckets,
      recentUsers,
      recentApps,
      reportTotal,
      flaggedPostIds,
      moderationSettings,
    ] = await Promise.all([
      UserModel.countDocuments(),
      UserModel.countDocuments({ role: "admin" }),
      UserModel.countDocuments({ verified: true }),
      UserModel.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      UserModel.countDocuments({ bannedUntil: { $gt: now } }),
      RequirementModel.countDocuments(),
      RequirementModel.countDocuments(isLiveFilter),
      RequirementModel.countDocuments({ ...isLiveFilter, applicationsPaused: true }),
      RequirementModel.countDocuments({ expiresAt: { $lte: now } }),
      ApplicationModel.countDocuments(),
      NewsletterModel.countDocuments(),
      NewsletterModel.countDocuments({ subscribedAt: { $gte: sevenDaysAgo } }),
      SupportModel.countDocuments(),
      SupportModel.countDocuments({ status: "new" }),
      RequirementModel.aggregate<{ category: string; count: number }>([
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $project: { _id: 0, category: "$_id", count: 1 } },
        { $sort: { count: -1 } },
      ]),
      UserModel.aggregate<{ _id: string; count: number }>([
        { $match: { createdAt: { $gte: fourteenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
      ]),
      UserModel.find()
        .select("email role verified createdAt")
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      ApplicationModel.find()
        .select("requirementId name email createdAt")
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      ReportModel.countDocuments(),
      ReportModel.distinct("requirementId"),
      getModerationSettings(),
    ]);

    // Fill the 14-day curve so zero-days render as gaps, not missing bars.
    const signupMap = new Map(signupBuckets.map((b) => [b._id, b.count]));
    const signupsByDay = lastNDayKeys(14).map((day) => ({
      day,
      count: signupMap.get(day) || 0,
    }));

    // Hydrate the application feed: which post each application targeted
    // (a title only — admins see engagement, not ownership of posts).
    const targetIds = Array.from(new Set(recentApps.map((a) => String(a.requirementId))));
    const targets = targetIds.length
      ? await RequirementModel.find({ _id: { $in: targetIds } })
          .select("title")
          .lean()
      : [];
    const targetMap = new Map(targets.map((t) => [String(t._id), t.title]));

    res.json({
      success: true,
      data: {
        users: {
          total: userTotal,
          admins: userAdmins,
          verified: userVerified,
          newLast7Days: userNew,
          banned: userBanned,
        },
        posts: {
          total: postTotal,
          live: postLive,
          paused: postPaused,
          expired: postExpired,
        },
        applications: { total: appTotal },
        newsletter: { total: newsTotal, newLast7Days: newsNew },
        support: { total: supportTotal, unread: supportUnread },
        reports: {
          pending: reportTotal,
          flaggedPosts: flaggedPostIds.length,
          autoRemoved: moderationSettings.autoRemovedPosts,
          threshold: moderationSettings.reportThreshold,
          banDays: moderationSettings.banDays,
        },
        categories,
        signupsByDay,
        recentUsers: recentUsers.map((u) => ({
          id: String(u._id),
          email: u.email,
          role: u.role,
          verified: u.verified,
          createdAt: u.createdAt,
        })),
        recentApplications: recentApps.map((a) => ({
          id: String(a._id),
          name: a.name,
          email: a.email,
          postTitle: targetMap.get(String(a.requirementId)) ?? null,
          createdAt: a.createdAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};
