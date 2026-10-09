import { Router } from "express";
import {
  subscribe,
  sendNewsletter,
  listSubscribers,
  removeSubscriber,
} from "../controllers/newsletter.controller.js";
import { validateBody } from "../middlewares/validate.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.js";
import { NewsletterSchema, SendNewsletterSchema } from "@elysia/shared";

const router = Router();

// Guests may join without an account. The global write limiter (mutations
// only) already bounds abuse per IP; validation keeps bad emails out of the list.
router.post("/", validateBody(NewsletterSchema), subscribe);

// Admin suite: subscriber roster, removal, and the HTML broadcast.
router.get("/subscribers", requireAuth, requireAdmin, listSubscribers);
router.delete("/:email", requireAuth, requireAdmin, removeSubscriber);
router.post("/send", requireAuth, requireAdmin, validateBody(SendNewsletterSchema), sendNewsletter);

export default router;
