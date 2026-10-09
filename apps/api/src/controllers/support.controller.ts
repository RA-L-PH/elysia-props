import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { SupportMessageInput } from "@elysia/shared";
import { SupportModel } from "../models/Support.model.js";
import { sendSupportNotificationMail } from "../lib/email.js";

/**
 * POST /api/support — public contact form (/contact). Writers need no
 * account; length caps come from the shared schema and the write limiter
 * bounds abuse before this ever runs.
 */
export const createSupportMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const input = req.body as SupportMessageInput;
    const doc = await SupportModel.create({
      name: input.name,
      email: input.email,
      subject: input.subject ?? "",
      message: input.message,
      status: "new",
    });
    // Mirror to the support inbox in the background — the dashboard copy is
    // already saved, and the relay takes ~14s per mail, so the visitor
    // should not wait on Gmail.
    void sendSupportNotificationMail({
      name: input.name,
      email: input.email,
      subject: input.subject,
      message: input.message,
    }).catch((err) => {
      console.error("[SUPPORT] inbox mirror failed:", err);
    });
    res.status(201).json({
      success: true,
      data: { id: String(doc._id) },
      message: "Message sent — the PulseStage team will get back to you.",
    });
  } catch (error) {
    next(error);
  }
};

/** GET /api/support (admin) — newest 50 messages for the admin dashboard. */
export const listSupportMessages = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const list = await SupportModel.find().sort({ createdAt: -1 }).limit(50).lean();
    const total = await SupportModel.countDocuments().exec();
    res.json({ success: true, data: list, meta: { total } });
  } catch (error) {
    next(error);
  }
};

/** PUT /api/support/:id (admin) — flip a message between "new" and "read". */
export const setSupportStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id || !mongoose.isValidObjectId(id)) {
      res.status(400).json({ success: false, error: "Invalid message id." });
      return;
    }
    const { status } = req.body as { status?: string };
    if (status !== "new" && status !== "read") {
      res.status(400).json({ success: false, error: "Status must be 'new' or 'read'." });
      return;
    }
    const doc = await SupportModel.findByIdAndUpdate(id, { status }, { new: true }).select(
      "_id status"
    );
    if (!doc) {
      res.status(404).json({ success: false, error: "Message not found." });
      return;
    }
    res.json({
      success: true,
      data: { id: String(doc._id), status: doc.status },
      message: status === "read" ? "Marked as read." : "Marked as unread.",
    });
  } catch (error) {
    next(error);
  }
};
