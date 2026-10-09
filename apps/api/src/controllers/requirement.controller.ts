import { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";
import mongoose from "mongoose";
import { RequirementModel, computeExpiresAt } from "../models/Requirement.model.js";
import { PlannerRequirementModel } from "../models/PlannerRequirement.model.js";
import { PerformerRequirementModel } from "../models/PerformerRequirement.model.js";
import { CrewRequirementModel } from "../models/CrewRequirement.model.js";
import { inMemoryStore } from "../models/inMemoryStore.js";
import { ApplicationModel, applicationMemory } from "../models/Application.model.js";
import { getDatabaseStatus } from "../config/db.js";
import { removeApplicationsFor } from "./application.controller.js";
import { UserModel } from "../models/User.model.js";
import { sha256Hex } from "../lib/identity.js";
import { CreateRequirementInput } from "@elysia/shared";
import { bannedResponse } from "../middlewares/auth.js";

/** Poster info attached to responses so the UI can show verified badges / ownership. */
interface PosterInfo {
  userId: string;
  verified: boolean;
}
type WithPoster<T> = T & { poster: PosterInfo | null };

/**
 * Owner-only rule: edit/delete is the poster's alone — being an admin does
 * NOT grant power over other people's posts (admins verify posters instead).
 */
const canManage = (user: { id: string; role: string } | undefined, postedBy?: string | null): boolean => {
  if (!user) return false;
  return !!postedBy && postedBy === user.id;
};

/** Resolve poster ids → verified flags in a single query. */
const buildPosterMap = async (
  docs: { postedBy?: string | null }[]
): Promise<Map<string, PosterInfo>> => {
  const ids = [...new Set(docs.map((d) => d.postedBy).filter(Boolean))] as string[];
  if (ids.length === 0) return new Map();
  const users = await UserModel.find({ _id: { $in: ids } }).select("verified").lean();
  return new Map(
    users.map((u) => [String(u._id), { userId: String(u._id), verified: !!u.verified }])
  );
};

/** Never leak the stored hash of the Post ID secret in API responses. */
const stripSecrets = <T extends Record<string, unknown>>(doc: T): Omit<T, "deleteKeyHash"> => {
  const { deleteKeyHash, ...rest } = doc;
  void deleteKeyHash;
  return rest;
};

/**
 * Guest Post IDs look like `PS-<postId>-<32 hex secret>` and are shown exactly
 * once at creation. Only the SHA-256 of the secret is stored, so possession of
 * the key is required to delete — while it stays unguessable (128-bit secret).
 */
const isValidPostKey = (key: unknown, id: string, storedHash?: string | null): boolean => {
  if (typeof key !== "string" || !storedHash) return false;
  const match = /^PS-(.+)-([0-9a-f]{32})$/.exec(key);
  if (!match || match[1] !== id) return false;
  const provided = Buffer.from(sha256Hex(match[2]), "hex");
  const stored = Buffer.from(storedHash, "hex");
  if (provided.length !== stored.length) return false;
  return crypto.timingSafeEqual(provided, stored);
};

/** Documents whose TTL moment has passed are gone as far as readers care. */
const isExpired = (expiresAt?: Date | string | null): boolean =>
  !!expiresAt && new Date(expiresAt).getTime() <= Date.now();

/** Mongo filter: not expired (docs from before this feature have no expiresAt). */
const notExpiredFilter = { $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: null }] };

// Escape user-supplied search text before it reaches a RegExp engine — both
// Mongo's $regex and JS RegExp — so `?search=((((a+)+)+)+)` can't ReDoS us.
const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Clamp pagination: `?page=-5&limit=999999` must not become a memory bomb.
const clampPage = (value: unknown): number =>
  Math.max(1, parseInt(String(value), 10) || 1);

const clampLimit = (value: unknown): number =>
  Math.min(100, Math.max(1, parseInt(String(value), 10) || 20));

// Helper to get the right polymorphic model
const getModelForCategory = (category: string) => {
  switch (category) {
    case "Planner":
      return PlannerRequirementModel;
    case "Performer":
      return PerformerRequirementModel;
    case "Crew":
      return CrewRequirementModel;
    default:
      return RequirementModel;
  }
};

export const listRequirements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      category,
      search,
      urgency,
      status,
      city,
      minBudget,
      maxBudget,
      payType,
      mine,
      page = "1",
      limit = "20",
    } = req.query;
    const dbStatus = getDatabaseStatus();

    // `mine=1` → only the signed-in account's posts (used by /myposts).
    const mineFilter =
      (mine === "1" || mine === "true") && req.user ? { postedBy: req.user.id } : undefined;
    if ((mine === "1" || mine === "true") && !req.user) {
      res.status(401).json({ success: false, error: "Sign in required." });
      return;
    }

    // Budget overlap: a post matches when its [min, max] range intersects the
    // requested [minBudget, maxBudget] window.
    const minB = Number(minBudget);
    const maxB = Number(maxBudget);

    if (dbStatus.isInMemoryFallback || mongoose.connection.readyState !== 1) {
      const results = inMemoryStore
        .getAll({
          category: typeof category === "string" ? category : undefined,
          search: typeof search === "string" ? search : undefined,
          urgency: typeof urgency === "string" ? urgency : undefined,
          status: typeof status === "string" ? status : undefined,
          city: typeof city === "string" ? city : undefined,
          minBudget: Number.isFinite(minB) && minBudget ? minB : undefined,
          maxBudget: Number.isFinite(maxB) && maxBudget ? maxB : undefined,
          payType: typeof payType === "string" ? payType : undefined,
          postedBy: mineFilter?.postedBy,
        })
        .filter((r) => !isExpired((r as { expiresAt?: Date | string | null }).expiresAt));

      const pageNum = clampPage(page);
      const limitNum = clampLimit(limit);
      const paginated = results.slice((pageNum - 1) * limitNum, pageNum * limitNum);

      res.json({
        success: true,
        data: paginated.map((r) =>
          stripSecrets({
            ...r,
            poster: null,
            // `?mine=1` → owner's dashboard: how many applications each post
            // has (one cheap count per row, no application bodies moved).
            ...(mineFilter
              ? { applicantsCount: applicationMemory.countByRequirement(r._id) }
              : {}),
          } as Record<string, unknown>)
        ),
        meta: {
          total: results.length,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(results.length / limitNum),
          engine: "in-memory-fallback",
        },
      });
      return;
    }

    // MongoDB Connected Flow
    const filter: Record<string, unknown> = { ...(mineFilter ?? {}) };

    // A suspended account's posts vanish from the public feed — they
    // reappear automatically the moment the ban expires (checked live on
    // every request). `?mine=1` (owner dashboard) is never filtered.
    if (!mineFilter) {
      const banned = await UserModel.find({ bannedUntil: { $gt: new Date() } })
        .select("_id")
        .lean();
      if (banned.length > 0) {
        filter.postedBy = { $nin: banned.map((b) => String(b._id)) };
      }
    }

    if (category && category !== "All") {
      filter.category = category;
    }

    if (urgency && urgency !== "All") {
      filter.urgency = urgency;
    }

    if (status && status !== "All") {
      filter.status = status;
    }

    if (payType && payType !== "All") {
      filter["budget.payType"] = payType;
    }

    if (typeof city === "string" && city.trim()) {
      filter["location.city"] = { $regex: escapeRegex(city.trim().slice(0, 80)), $options: "i" };
    }

    // Budget overlap: a post matches when its [min, max] range intersects the
    // requested window — post.max >= wanted min AND post.min <= wanted max.
    if (Number.isFinite(minB) && minBudget) filter["budget.max"] = { $gte: minB };
    if (Number.isFinite(maxB) && maxBudget) filter["budget.min"] = { $lte: maxB };

    if (search && typeof search === "string") {
      const safeSearch = escapeRegex(search.slice(0, 100));
      filter.$or = [
        { title: { $regex: safeSearch, $options: "i" } },
        { description: { $regex: safeSearch, $options: "i" } },
        { "location.city": { $regex: safeSearch, $options: "i" } },
        { "location.venue": { $regex: safeSearch, $options: "i" } },
        { tags: { $in: [new RegExp(safeSearch, "i")] } },
      ];
    }

    // Hide posts whose auto-expiry moment (event end date, 23:59) has passed —
    // the TTL index removes them from the collection shortly after as well.
    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, notExpiredFilter];
      delete filter.$or;
    } else {
      Object.assign(filter, notExpiredFilter);
    }

    const pageNum = clampPage(page);
    const limitNum = clampLimit(limit);
    const skip = (pageNum - 1) * limitNum;

    const [requirements, total] = await Promise.all([
      RequirementModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      RequirementModel.countDocuments(filter),
    ]);

    const posterMap = await buildPosterMap(requirements);

    // `?mine=1` → owner's dashboard: one aggregation returns the application
    // count for every listed post (no application bodies cross the wire).
    let applicantCounts = new Map<string, number>();
    if (mineFilter && requirements.length > 0) {
      const ids = requirements.map((r) => String(r._id));
      const rows = await ApplicationModel.aggregate<{ _id: string; count: number }>([
        { $match: { requirementId: { $in: ids } } },
        { $group: { _id: "$requirementId", count: { $sum: 1 } } },
      ]);
      applicantCounts = new Map(rows.map((row) => [row._id, row.count]));
    }

    res.json({
      success: true,
      data: requirements.map((r) =>
        stripSecrets({
          ...r,
          poster: r.postedBy ? posterMap.get(r.postedBy) ?? null : null,
          ...(mineFilter
            ? { applicantsCount: applicantCounts.get(String(r._id)) ?? 0 }
            : {}),
        } as Record<string, unknown>)
      ),
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        engine: "mongodb-atlas",
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getRequirementById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
    const dbStatus = getDatabaseStatus();

    if (dbStatus.isInMemoryFallback || mongoose.connection.readyState !== 1) {
      const requirement = inMemoryStore.getById(id);
      if (!requirement || isExpired((requirement as { expiresAt?: Date | string | null }).expiresAt)) {
        res.status(404).json({ success: false, error: "Requirement not found" });
        return;
      }
      res.json({ success: true, data: stripSecrets({ ...requirement, poster: null } as Record<string, unknown>) });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, error: "Invalid requirement ID format" });
      return;
    }

    const requirement = await RequirementModel.findById(id).lean();
    if (!requirement || isExpired(requirement.expiresAt)) {
      res.status(404).json({ success: false, error: "Requirement not found" });
      return;
    }

    // Hidden while the poster is suspended — same live rule as the feed.
    if (requirement.postedBy) {
      const suspended = await UserModel.exists({
        _id: requirement.postedBy,
        bannedUntil: { $gt: new Date() },
      });
      if (suspended) {
        res.status(404).json({ success: false, error: "Requirement not found" });
        return;
      }
    }

    const posterMap = await buildPosterMap([requirement]);
    res.json({
      success: true,
      data: stripSecrets({
        ...requirement,
        poster: requirement.postedBy ? posterMap.get(requirement.postedBy) ?? null : null,
      } as Record<string, unknown>),
    });
  } catch (error) {
    next(error);
  }
};

export const createRequirement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Suspended accounts can't create posts even with a live session
    // (optionalAuth populates them for guests-and-users routes).
    if (req.user?.bannedUntil) {
      bannedResponse(res, req.user.bannedUntil, req.user.banReason);
      return;
    }
    // Server-side attribution: the poster id comes from the verified session
    // (guests get null) — never from the client payload (zod strips unknowns).
    const input = {
      ...(req.body as CreateRequirementInput),
      postedBy: req.user?.id ?? null,
    };

    // One-time Post ID: shown to the creator (and hashed for storage) so a
    // guest can delete their post later without ever owning an account.
    const deleteSecret = crypto.randomBytes(16).toString("hex");
    const deleteKeyHash = sha256Hex(deleteSecret);
    const expiresAt = computeExpiresAt(input.dates);

    const dbStatus = getDatabaseStatus();

    if (dbStatus.isInMemoryFallback || mongoose.connection.readyState !== 1) {
      const created = inMemoryStore.create({
        ...input,
        deleteKeyHash,
        expiresAt,
      } as unknown as CreateRequirementInput);
      res.status(201).json({
        success: true,
        data: stripSecrets({
          ...created,
          postKey: `PS-${created._id}-${deleteSecret}`,
        } as Record<string, unknown>),
        message: `${input.category} requirement posted successfully`,
      });
      return;
    }

    const Model = getModelForCategory(input.category);
    const doc = new Model({ ...input, deleteKeyHash, expiresAt });
    const saved = await doc.save();

    res.status(201).json({
      success: true,
      data: stripSecrets({
        ...(saved.toObject() as Record<string, unknown>),
        postKey: `PS-${String(saved._id)}-${deleteSecret}`,
      }),
      message: `${input.category} requirement posted successfully`,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRequirement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
    // Immutable / server-managed fields can never be supplied by the client.
    const {
      _id,
      __v,
      createdAt,
      updatedAt,
      postedBy,
      expiresAt,
      deleteKeyHash,
      ...updates
    } = (req.body ?? {}) as Record<string, unknown>;
    void _id;
    void __v;
    void createdAt;
    void updatedAt;
    void postedBy;
    void expiresAt;
    void deleteKeyHash;

    // The auto-expiry moment follows the event dates whenever they change.
    const datesUpdate = updates.dates as { endDate?: string; startDate?: string } | undefined;
    if (datesUpdate) {
      const computed = computeExpiresAt(datesUpdate);
      if (computed) updates.expiresAt = computed;
    }

    const dbStatus = getDatabaseStatus();

    if (dbStatus.isInMemoryFallback || mongoose.connection.readyState !== 1) {
      const existing = inMemoryStore.getById(id);
      if (!existing || isExpired((existing as { expiresAt?: Date | string | null }).expiresAt)) {
        res.status(404).json({ success: false, error: "Requirement not found" });
        return;
      }
      if (!canManage(req.user, (existing as { postedBy?: string | null }).postedBy)) {
        res.status(403).json({ success: false, error: "You can only edit your own posts." });
        return;
      }
      const updated = inMemoryStore.update(id, updates as Partial<CreateRequirementInput>);
      if (!updated) {
        res.status(404).json({ success: false, error: "Requirement not found" });
        return;
      }
      res.json({
        success: true,
        data: stripSecrets({ ...updated } as Record<string, unknown>),
        message: "Requirement updated successfully",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, error: "Invalid requirement ID format" });
      return;
    }

    const existing = await RequirementModel.findById(id).select("postedBy expiresAt category").lean();
    if (!existing || isExpired(existing.expiresAt)) {
      res.status(404).json({ success: false, error: "Requirement not found" });
      return;
    }
    if (!canManage(req.user, existing.postedBy)) {
      res.status(403).json({ success: false, error: "You can only edit your own posts." });
      return;
    }

    // Route through the category discriminator: `details` only exists on the
    // discriminator sub-schemas, and the base model's strict mode would strip
    // it from the update (silently dropping every category-specific edit).
    const Model = getModelForCategory(
      (typeof updates.category === "string" && updates.category) || existing.category
    ) as typeof RequirementModel;
    const updated = await Model.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).lean();
    if (!updated) {
      res.status(404).json({ success: false, error: "Requirement not found" });
      return;
    }

    res.json({
      success: true,
      data: stripSecrets({ ...updated } as Record<string, unknown>),
      message: "Requirement updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/requirements/:id/applications/pause — the OWNER opens or closes
 * application intake for their post (`{ paused: boolean }`). While paused the
 * apply endpoint answers 409 and the feed hides the Apply button. Same
 * owner-only rule as edit/delete: admins get no power over other posts.
 */
export const setApplicationsPaused = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
    const { paused } = (req.body ?? {}) as { paused?: unknown };
    if (typeof paused !== "boolean") {
      res.status(400).json({ success: false, error: "`paused` must be a boolean." });
      return;
    }

    const refuse = (
      existingPostedBy: string | null | undefined
    ): void => {
      if (!req.user) {
        res.status(401).json({ success: false, error: "Sign in to manage this post." });
        return;
      }
      if (!canManage(req.user, existingPostedBy)) {
        res
          .status(403)
          .json({ success: false, error: "You can only manage applications on your own posts." });
        return;
      }
      res.status(404).json({ success: false, error: "Requirement not found" });
    };

    const dbStatus = getDatabaseStatus();
    if (dbStatus.isInMemoryFallback || mongoose.connection.readyState !== 1) {
      const existing = inMemoryStore.getById(id);
      if (!existing) {
        refuse(null);
        return;
      }
      const postedBy = (existing as { postedBy?: string | null }).postedBy;
      if (!canManage(req.user, postedBy)) {
        refuse(postedBy);
        return;
      }
      const updated = inMemoryStore.update(id, {
        applicationsPaused: paused,
      } as unknown as Partial<CreateRequirementInput>);
      if (!updated) {
        res.status(404).json({ success: false, error: "Requirement not found" });
        return;
      }
      res.json({
        success: true,
        data: stripSecrets({ ...updated } as Record<string, unknown>),
        message: paused ? "Applications paused." : "Applications reopened.",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, error: "Invalid requirement ID format" });
      return;
    }

    const existing = await RequirementModel.findById(id)
      .select("postedBy expiresAt")
      .lean();
    if (!existing) {
      refuse(null);
      return;
    }
    if (!canManage(req.user, existing.postedBy)) {
      refuse(existing.postedBy);
      return;
    }

    const updated = await RequirementModel.findByIdAndUpdate(
      id,
      { applicationsPaused: paused },
      { new: true }
    ).lean();
    if (!updated) {
      res.status(404).json({ success: false, error: "Requirement not found" });
      return;
    }

    res.json({
      success: true,
      data: stripSecrets({ ...updated } as Record<string, unknown>),
      message: paused ? "Applications paused." : "Applications reopened.",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRequirement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
    // Guest flow: the one-time Post ID travels in the (HMAC-signed) body.
    const { postKey } = (req.body ?? {}) as { postKey?: unknown };
    const dbStatus = getDatabaseStatus();

    if (dbStatus.isInMemoryFallback || mongoose.connection.readyState !== 1) {
      const existing = inMemoryStore.getById(id);
      if (!existing) {
        res.status(404).json({ success: false, error: "Requirement not found" });
        return;
      }
      const keyOk = isValidPostKey(
        postKey,
        id,
        (existing as { deleteKeyHash?: string | null }).deleteKeyHash
      );
      if (!keyOk && !canManage(req.user, (existing as { postedBy?: string | null }).postedBy)) {
        if (!req.user) {
          res.status(401).json({
            success: false,
            error: "Sign in, or send the Post ID you received when creating this post.",
          });
          return;
        }
        res.status(403).json({ success: false, error: "You can only delete your own posts." });
        return;
      }
      const deleted = inMemoryStore.delete(id);
      if (!deleted) {
        res.status(404).json({ success: false, error: "Requirement not found" });
        return;
      }
      void removeApplicationsFor(id);
      res.json({ success: true, message: "Requirement deleted successfully" });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, error: "Invalid requirement ID format" });
      return;
    }

    const existing = await RequirementModel.findById(id)
      .select("postedBy deleteKeyHash")
      .lean();
    if (!existing) {
      res.status(404).json({ success: false, error: "Requirement not found" });
      return;
    }

    // Either the one-time Post ID (guest flow) or an owner/admin session.
    const keyOk = isValidPostKey(postKey, id, existing.deleteKeyHash);
    if (!keyOk && !canManage(req.user, existing.postedBy)) {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Sign in, or send the Post ID you received when creating this post.",
        });
        return;
      }
      res.status(403).json({ success: false, error: "You can only delete your own posts." });
      return;
    }

    const deleted = await RequirementModel.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ success: false, error: "Requirement not found" });
      return;
    }
    void removeApplicationsFor(id);

    res.json({ success: true, message: "Requirement deleted successfully" });
  } catch (error) {
    next(error);
  }
};

/**
 * Claim a guest post: the holder of the one-time Post ID (proving they
 * created it) signs in and takes ownership — from then on the post is fully
 * manageable (edit/delete) through their account.
 */
export const claimRequirement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
    const { postKey } = (req.body ?? {}) as { postKey?: unknown };
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, error: "Sign in required." });
      return;
    }
    const dbStatus = getDatabaseStatus();

    const authorizeClaim = (
      existing: {
        postedBy?: string | null;
        deleteKeyHash?: string | null;
        expiresAt?: Date | string | null;
        contact?: { name?: string; email?: string; phone?: string; company?: string } | null;
      },
      docId: string
    ): string | null => {
      if (isExpired(existing.expiresAt)) return "Requirement not found";
      if (!isValidPostKey(postKey, docId, existing.deleteKeyHash))
        return "That Post ID doesn't match this post.";
      // Claiming is for UNCLAIMED posts only — nobody (not even an admin)
      // takes over a post that already belongs to another account.
      const owner = existing.postedBy;
      if (owner && owner !== user.id)
        return "This post already belongs to another account.";
      return null;
    };

    // Claiming moves ownership AND the contact block to the claimer's account
    // details — the old guest contact must not keep receiving messages.
    const claimerContact = {
      name:
        `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
      email: user.email,
      phone: user.phone || undefined,
    };

    if (dbStatus.isInMemoryFallback || mongoose.connection.readyState !== 1) {
      const existing = inMemoryStore.getById(id);
      if (!existing) {
        res.status(404).json({ success: false, error: "Requirement not found" });
        return;
      }
      const problem = authorizeClaim(existing as never, id);
      if (problem) {
        res
          .status(problem === "Requirement not found" ? 404 : 403)
          .json({ success: false, error: problem });
        return;
      }
      const existingContact =
        (existing as { contact?: Record<string, unknown> }).contact ?? {};
      const updated = inMemoryStore.update(id, {
        postedBy: user.id,
        contact: {
          ...existingContact,
          ...claimerContact,
          // Keep the previous number when the account has none on file.
          phone: claimerContact.phone ?? existingContact.phone ?? "",
        },
      } as unknown as Partial<CreateRequirementInput>);
      res.json({
        success: true,
        data: stripSecrets({
          ...updated,
          poster: { userId: user.id, verified: user.verified },
        } as Record<string, unknown>),
        message: "Post claimed — it's now managed by your account.",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, error: "Invalid requirement ID format" });
      return;
    }

    const existing = await RequirementModel.findById(id)
      .select("postedBy deleteKeyHash expiresAt")
      .lean();
    if (!existing) {
      res.status(404).json({ success: false, error: "Requirement not found" });
      return;
    }
    const problem = authorizeClaim(existing, id);
    if (problem) {
      res
        .status(problem === "Requirement not found" ? 404 : 403)
        .json({ success: false, error: problem });
      return;
    }

    // Claiming moves ownership AND the contact block to the claimer's account
    // details — the old guest contact must not keep receiving messages.
    const updated = await RequirementModel.findByIdAndUpdate(
      id,
      {
        postedBy: user.id,
        "contact.name": claimerContact.name,
        "contact.email": claimerContact.email,
        ...(claimerContact.phone ? { "contact.phone": claimerContact.phone } : {}),
      },
      { new: true }
    ).lean();
    res.json({
      success: true,
      data: stripSecrets({
        ...updated,
        poster: { userId: user.id, verified: user.verified },
      } as Record<string, unknown>),
      message: "Post claimed — it's now managed by your account.",
    });
  } catch (error) {
    next(error);
  }
};

export const getRequirementStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const dbStatus = getDatabaseStatus();

    if (dbStatus.isInMemoryFallback || mongoose.connection.readyState !== 1) {
      const stats = inMemoryStore.getStats();
      res.json({ success: true, data: stats });
      return;
    }

    // Stats describe what visitors can actually see: posts by suspended
    // accounts are hidden from the feed, so they're excluded here too.
    const bannedIds = (
      await UserModel.find({ bannedUntil: { $gt: new Date() } })
        .select("_id")
        .lean()
    ).map((b) => String(b._id));
    const visible = { postedBy: { $nin: bannedIds } };

    const [total, planner, performer, crew, urgentCount, budgetAgg] = await Promise.all([
      RequirementModel.countDocuments(visible),
      RequirementModel.countDocuments({ ...visible, category: "Planner" }),
      RequirementModel.countDocuments({ ...visible, category: "Performer" }),
      RequirementModel.countDocuments({ ...visible, category: "Crew" }),
      RequirementModel.countDocuments({ ...visible, urgency: "urgent" }),
      RequirementModel.aggregate([{ $match: visible }, { $group: { _id: null, totalBudget: { $sum: "$budget.max" } } }]),
    ]);

    const totalEstimatedBudget = budgetAgg[0]?.totalBudget || 0;

    res.json({
      success: true,
      data: {
        total,
        byCategory: {
          planner,
          performer,
          crew,
        },
        totalEstimatedBudget,
        urgentCount,
      },
    });
  } catch (error) {
    next(error);
  }
};
