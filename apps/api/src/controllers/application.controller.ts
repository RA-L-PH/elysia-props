import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { ApplyInput } from "@elysia/shared";
import { bannedResponse } from "../middlewares/auth.js";
import { RequirementModel } from "../models/Requirement.model.js";
import { ApplicationModel, applicationMemory, normalizePhone } from "../models/Application.model.js";
import { inMemoryStore } from "../models/inMemoryStore.js";
import { getDatabaseStatus } from "../config/db.js";

const useMemory = (): boolean =>
  getDatabaseStatus().isInMemoryFallback || mongoose.connection.readyState !== 1;

/** Documents whose TTL moment has passed are gone as far as readers care. */
const isExpired = (expiresAt?: Date | string | null): boolean =>
  !!expiresAt && new Date(expiresAt).getTime() <= Date.now();

/**
 * Same owner-only rule as edit/delete: being an admin does NOT grant power
 * over other people's posts — applicant contact details are private to the
 * poster.
 */
const canManage = (user: { id: string; role: string } | undefined, postedBy?: string | null): boolean => {
  if (!user) return false;
  return !!postedBy && postedBy === user.id;
};

/**
 * POST /api/requirements/:id/apply — anyone (guests included) may apply to a
 * live post with their name, contact, pitch, and 3–10 links to their most
 * notable work. One application per post per email OR phone number: second
 * submissions are refused with a 409 so owners never see doubles.
 */
export const applyToRequirement = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Suspended accounts can't submit applications either.
    if (req.user?.bannedUntil) {
      bannedResponse(res, req.user.bannedUntil, req.user.banReason);
      return;
    }
    const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
    const input = req.body as ApplyInput;
    const phoneNorm = normalizePhone(input.phone);
    const hasPhone = phoneNorm.length >= 7;

    /** Shared 409 for a repeat applicant (identifies which field collided). */
    const refuseDuplicate = (existingEmail: string): void => {
      res.status(409).json({
        success: false,
        error:
          existingEmail === input.email
            ? "You've already applied to this post with this email."
            : "You've already applied to this post with this phone number.",
      });
    };

    if (useMemory()) {
      const requirement = inMemoryStore.getById(id);
      if (!requirement || isExpired((requirement as { expiresAt?: Date | string | null }).expiresAt)) {
        res.status(404).json({ success: false, error: "This post is no longer accepting applications." });
        return;
      }
      if ((requirement as { applicationsPaused?: boolean }).applicationsPaused) {
        res
          .status(409)
          .json({ success: false, error: "The poster has paused applications for this post." });
        return;
      }
      const posterId = (requirement as { postedBy?: string | null }).postedBy;
      if (req.user && canManage(req.user, posterId)) {
        res.status(400).json({ success: false, error: "You can't apply to your own post." });
        return;
      }
      const duplicate = applicationMemory
        .listByRequirement(id)
        .find(
          (a) =>
            a.email === input.email ||
            (input.phone && a.phone === input.phone) ||
            (hasPhone && a.phoneNorm === phoneNorm)
        );
      if (duplicate) {
        refuseDuplicate(duplicate.email);
        return;
      }
      const saved = applicationMemory.upsert({
        requirementId: id,
        name: input.name,
        email: input.email,
        phone: input.phone ?? "",
        phoneNorm,
        message: input.message,
        workLinks: input.workLinks ?? [],
        userId: req.user?.id ?? null,
      });
      res.status(201).json({
        success: true,
        data: saved,
        message: "Application sent — the poster has your details.",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, error: "Invalid requirement ID format" });
      return;
    }

    const requirement = await RequirementModel.findById(id)
      .select("postedBy expiresAt applicationsPaused")
      .lean();
    if (!requirement || isExpired(requirement.expiresAt)) {
      res.status(404).json({ success: false, error: "This post is no longer accepting applications." });
      return;
    }
    if (requirement.applicationsPaused) {
      res
        .status(409)
        .json({ success: false, error: "The poster has paused applications for this post." });
      return;
    }
    if (req.user && canManage(req.user, requirement.postedBy)) {
      res.status(400).json({ success: false, error: "You can't apply to your own post." });
      return;
    }

    // Duplicate check: same email, same raw phone, or same normalised phone
    // (raw included so pre-phoneNorm legacy rows still collide).
    const or: Array<Record<string, string>> = [{ email: input.email }];
    if (input.phone) or.push({ phone: input.phone });
    if (hasPhone) or.push({ phoneNorm });
    const duplicate = await ApplicationModel.findOne({ requirementId: id, $or: or })
      .select("email")
      .lean();
    if (duplicate) {
      refuseDuplicate(duplicate.email);
      return;
    }

    let created;
    try {
      created = await ApplicationModel.create({
        requirementId: id,
        name: input.name,
        email: input.email,
        phone: input.phone ?? "",
        phoneNorm,
        message: input.message,
        workLinks: input.workLinks ?? [],
        userId: req.user?.id ?? null,
      });
    } catch (err) {
      // Unique index backstop: a parallel submit slipped past the check.
      if ((err as { code?: number }).code === 11000) {
        refuseDuplicate(input.email);
        return;
      }
      throw err;
    }

    res.status(201).json({
      success: true,
      data: created,
      message: "Application sent — the poster has your details.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/requirements/:id/applications — the post OWNER reads who applied.
 * Requires the owner's session (guest creators hold no session until they
 * claim the post with their Post ID — after which they are the owner).
 */
export const listApplications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, error: "Sign in to view applications." });
      return;
    }

    if (useMemory()) {
      const requirement = inMemoryStore.getById(id);
      if (!requirement) {
        res.status(404).json({ success: false, error: "Requirement not found" });
        return;
      }
      if (!canManage(user, (requirement as { postedBy?: string | null }).postedBy)) {
        res.status(403).json({ success: false, error: "You can only view applications to your own posts." });
        return;
      }
      const list = applicationMemory.listByRequirement(id);
      res.json({ success: true, data: list, meta: { total: list.length } });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, error: "Invalid requirement ID format" });
      return;
    }

    const requirement = await RequirementModel.findById(id)
      .select("postedBy")
      .lean();
    if (!requirement) {
      res.status(404).json({ success: false, error: "Requirement not found" });
      return;
    }
    if (!canManage(user, requirement.postedBy)) {
      res.status(403).json({ success: false, error: "You can only view applications to your own posts." });
      return;
    }

    const list = await ApplicationModel.find({ requirementId: id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: list, meta: { total: list.length } });
  } catch (error) {
    next(error);
  }
};

/** Best-effort cleanup: applications die with their post. */
export const removeApplicationsFor = async (requirementId: string): Promise<void> => {
  try {
    if (useMemory()) {
      applicationMemory.removeByRequirement(requirementId);
      return;
    }
    await ApplicationModel.deleteMany({ requirementId }).exec();
  } catch {
    // Orphan cleanup is best-effort — never fail the delete because of it.
  }
};
