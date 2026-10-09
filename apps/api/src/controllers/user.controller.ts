import { Request, Response, NextFunction } from "express";
import { UserModel } from "../models/User.model.js";
import { RequirementModel } from "../models/Requirement.model.js";

const isUserId = (value: string): boolean => /^[a-f0-9]{64}$/.test(value);

/**
 * Admin directory: every account with its posted-job count, so an admin can
 * decide who deserves the "Verified Poster" badge (Airbnb-Superhost style).
 */
export const listUsers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [users, counts] = await Promise.all([
      UserModel.find()
        .select("email role verified verifiedAt createdAt bannedUntil banReason")
        .sort({ createdAt: -1 })
        .lean(),
      RequirementModel.aggregate([
        { $match: { postedBy: { $ne: null } } },
        { $group: { _id: "$postedBy", count: { $sum: 1 } } },
      ]),
    ]);

    const countMap = new Map<string, number>(
      counts.map((c: { _id: string; count: number }) => [String(c._id), c.count])
    );

    res.json({
      success: true,
      data: users.map((u) => ({
        id: String(u._id),
        email: u.email,
        role: u.role,
        verified: u.verified,
        verifiedAt: u.verifiedAt ?? null,
        createdAt: u.createdAt,
        jobCount: countMap.get(String(u._id)) || 0,
        // Live ban state: expired bans surface as "not banned".
        bannedUntil:
          u.bannedUntil && new Date(u.bannedUntil).getTime() > Date.now()
            ? new Date(u.bannedUntil).toISOString()
            : null,
        banReason: u.banReason || "",
      })),
    });
  } catch (error) {
    next(error);
  }
};

/** Grant or revoke the Verified Poster badge. Admin only. */
export const setUserVerified = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id || !isUserId(id)) {
      res.status(400).json({ success: false, error: "Invalid user id format." });
      return;
    }

    const { verified } = req.body as { verified: boolean };
    const user = await UserModel.findByIdAndUpdate(
      id,
      { verified, verifiedAt: verified ? new Date() : null },
      { new: true }
    ).select("email role verified");

    if (!user) {
      res.status(404).json({ success: false, error: "User not found." });
      return;
    }

    console.log(`[ADMIN] ${req.user?.email} set verified=${verified} for ${user.email}`);
    res.json({
      success: true,
      data: { id: String(user._id), email: user.email, verified: user.verified },
      message: user.verified ? `${user.email} is now a Verified Poster.` : `Verification removed from ${user.email}.`,
    });
  } catch (error) {
    next(error);
  }
};
