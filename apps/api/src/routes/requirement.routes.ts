import { Router } from "express";
import {
  listRequirements,
  getRequirementById,
  createRequirement,
  updateRequirement,
  deleteRequirement,
  claimRequirement,
  getRequirementStats,
  setApplicationsPaused,
} from "../controllers/requirement.controller.js";
import { applyToRequirement, listApplications } from "../controllers/application.controller.js";
import { validateBody, validateQuery } from "../middlewares/validate.js";
import { requireAuth, optionalAuth } from "../middlewares/auth.js";
import { anonPostLimiter } from "../middlewares/rateLimiter.js";
import {
  CreateRequirementSchema,
  ClaimSchema,
  ApplySchema,
  PauseApplicationsSchema,
  ReportSchema,
  DeleteRequirementSchema,
  ListRequirementsQuerySchema,
} from "@elysia/shared";
import { reportRequirement } from "../controllers/moderation.controller.js";

const router = Router();

// Stats route must be defined before /:id parameter route
router.get("/stats", getRequirementStats);

// optionalAuth: the list is public, but `?mine=1` resolves the session to
// return only the signed-in account's posts.
router.get("/", optionalAuth, validateQuery(ListRequirementsQuerySchema), listRequirements);
router.get("/:id", getRequirementById);

// Guests CAN post (2/day per IP), signed-in users skip the quota; the poster
// id and Post ID secret are stamped server-side either way.
router.post(
  "/",
  optionalAuth,
  anonPostLimiter,
  validateBody(CreateRequirementSchema),
  createRequirement
);

// Editing requires a session and ownership — a Post ID alone never grants edits.
router.put("/:id", requireAuth, validateBody(CreateRequirementSchema), updateRequirement);

// Claim: signed-in holder of the Post ID takes ownership of a guest post.
router.post("/:id/claim", requireAuth, validateBody(ClaimSchema), claimRequirement);

// Applications: anyone (guests included) may apply to a live post; only the
// post's owner reads them back (session required, admins get nothing extra).
router.post("/:id/apply", optionalAuth, validateBody(ApplySchema), applyToRequirement);
router.get("/:id/applications", requireAuth, listApplications);

// Report: guests AND signed-in accounts may flag a fake/inappropriate post
// once each (accounts key by email, guests by an anonymous report cookie) —
// the counter feeds the auto-removal + auto-ban rule (see moderation controller).
router.post(
  "/:id/report",
  optionalAuth,
  validateBody(ReportSchema),
  reportRequirement
);

// Owner-only intake switch — while paused, /apply answers 409.
router.put(
  "/:id/applications/pause",
  requireAuth,
  validateBody(PauseApplicationsSchema),
  setApplicationsPaused
);

// Deleting accepts either a valid Post ID (body: { postKey }) or the
// owner's session — both checked inside the controller (admins get no
// power over other people's posts).
router.delete("/:id", optionalAuth, validateBody(DeleteRequirementSchema), deleteRequirement);

export default router;
