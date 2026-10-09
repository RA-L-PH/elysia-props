import { Router } from "express";
import { listUsers, setUserVerified } from "../controllers/user.controller.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.js";
import { validateBody } from "../middlewares/validate.js";
import { VerifyUserSchema } from "@elysia/shared";

const router = Router();

// Everything under /api/users is admin-only.
router.use(requireAuth, requireAdmin);

router.get("/", listUsers);
router.post("/:id/verify", validateBody(VerifyUserSchema), setUserVerified);

export default router;
