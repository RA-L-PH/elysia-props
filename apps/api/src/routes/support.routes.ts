import { Router } from "express";
import {
  createSupportMessage,
  listSupportMessages,
  setSupportStatus,
} from "../controllers/support.controller.js";
import { validateBody } from "../middlewares/validate.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.js";
import { SupportMessageSchema, SupportStatusSchema } from "@elysia/shared";

const router = Router();

// Anyone can write in (guests included); only admins read or triage the inbox.
router.post("/", validateBody(SupportMessageSchema), createSupportMessage);
router.get("/", requireAuth, requireAdmin, listSupportMessages);
router.put("/:id", requireAuth, requireAdmin, validateBody(SupportStatusSchema), setSupportStatus);

export default router;
