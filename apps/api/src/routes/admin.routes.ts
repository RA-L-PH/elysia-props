import { Router } from "express";
import {
  getModerationRules,
  updateModerationRules,
  listFlaggedPosts,
  banUser,
  unbanUser,
} from "../controllers/moderation.controller.js";
import { getOverview } from "../controllers/admin.controller.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.js";
import { validateBody } from "../middlewares/validate.js";
import { ModerationSettingsSchema, BanUserSchema } from "@elysia/shared";

const router = Router();

// Everything under /api/admin is admin-only: dashboard stats and the
// moderation suite. By design there are NO per-post management endpoints —
// admins manage users (bans, verified badges via /users), the newsletter,
// and support, never other people's posts.
router.use(requireAuth, requireAdmin);

router.get("/overview", getOverview);

// Moderation: tunable rules, flagged posts, manual bans.
router.get("/settings", getModerationRules);
router.put("/settings", validateBody(ModerationSettingsSchema), updateModerationRules);
router.get("/reports", listFlaggedPosts);
router.post("/users/:id/ban", validateBody(BanUserSchema), banUser);
router.delete("/users/:id/ban", unbanUser);

export default router;
