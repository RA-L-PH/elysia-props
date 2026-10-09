import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { NewsletterInput, SendNewsletterInput } from "@elysia/shared";
import { getDatabaseStatus } from "../config/db.js";
import { NewsletterModel, newsletterMemory } from "../models/Newsletter.model.js";
import { sendMailBatch } from "../lib/email.js";

const useMemory = (): boolean =>
  getDatabaseStatus().isInMemoryFallback || mongoose.connection.readyState !== 1;

/** Split one display name into first/last so sends can greet personally. */
const splitName = (name: string): { firstName: string; lastName: string } => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] ?? "", lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
};

/**
 * Add an email to the newsletter list. Idempotent — subscribing twice is a
 * no-op (the first name wins), so the signup mirror and the footer box can
 * both call it without coordinating.
 */
export const subscribeToNewsletter = async (
  email: string,
  source: "footer" | "signup" = "footer",
  name = ""
): Promise<void> => {
  const { firstName, lastName } = splitName(name);
  if (useMemory()) {
    newsletterMemory.add(email, firstName, lastName, source);
    return;
  }
  // Upsert: unique index on email makes repeats harmless.
  await NewsletterModel.updateOne(
    { email },
    {
      $setOnInsert: {
        _id: email,
        email,
        firstName,
        lastName,
        source,
        subscribedAt: new Date(),
      },
    },
    { upsert: true }
  ).exec();
};

/** POST /api/newsletter — footer join box (guests welcome, no account). */
export const subscribe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email } = req.body as NewsletterInput;
    await subscribeToNewsletter(email, "footer", name);
    res.status(201).json({
      success: true,
      message: "You're on the list — see you in your inbox.",
    });
  } catch (error) {
    next(error);
  }
};

// ── Admin newsletter suite ───────────────────────────────────────────

/** Every subscriber from whichever store is live. */
const loadSubscribers = async (): Promise<
  Array<{ email: string; firstName: string; lastName: string; source: string; subscribedAt: Date }>
> => {
  if (useMemory()) return newsletterMemory.all();
  return NewsletterModel.find().lean();
};

/** {{firstName}} / {{lastName}} / {{name}} / {{email}} → recipient values. */
const personalize = (
  html: string,
  sub: { email: string; firstName: string; lastName: string }
): string => {
  const fullName = `${sub.firstName} ${sub.lastName}`.trim();
  return html
    .split("{{firstName}}").join(sub.firstName || "there")
    .split("{{lastName}}").join(sub.lastName || "")
    .split("{{name}}").join(fullName || "there")
    .split("{{email}}").join(sub.email);
};

/** Always appended so every blast is unmistakably a PulseStage mail. */
const pulseStageFooter = (): string => `
<div style="margin-top:28px;padding-top:16px;border-top:2px solid #000;font-family:Arial,Helvetica,sans-serif;">
  <p style="font-size:12px;color:#555;margin:0 0 6px;">
    You're receiving this because you subscribed to the <strong>PulseStage</strong> newsletter.
    <strong>Sent by PulseStage.</strong>
  </p>
  <p style="font-size:12px;color:#555;margin:0;">
    Questions or feedback? Reply to this email or
    <a href="${(process.env.WEB_BASE_URL || "http://localhost:3000")}/contact" style="color:#000;font-weight:bold;">contact support</a>.
  </p>
</div>`;

/**
 * POST /api/newsletter/send (admin) — broadcast raw HTML with per-recipient
 * token replacement and a PulseStage footer. `recipients` (the dashboard's
 * checkbox selection) narrows the blast to those addresses; omitted → roster.
 */
export const sendNewsletter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { subject, html, recipients } = req.body as SendNewsletterInput;
    const subscribers = await loadSubscribers();

    // Checkbox selection: intersect with the live roster (case-insensitive)
    // so a stale selection can't mail arbitrary addresses.
    let targets = subscribers;
    if (recipients) {
      const wanted = new Set(recipients.map((r) => r.toLowerCase()));
      targets = subscribers.filter((s) => wanted.has(s.email.toLowerCase()));
      if (targets.length === 0) {
        res.status(400).json({
          success: false,
          error: "None of the selected addresses are on the subscriber list.",
        });
        return;
      }
    }

    if (targets.length === 0) {
      res.json({
        success: true,
        data: { sent: 0, failed: 0, total: 0 },
        message: "No subscribers yet — nothing was sent.",
      });
      return;
    }

    const footer = pulseStageFooter();
    const mails = targets.map((sub) => ({
      to: sub.email,
      // The subject carries the same {{firstName}}/{{name}}/{{email}} tokens
      // as the body — personalised per subscriber.
      subject: personalize(subject, sub),
      html: personalize(html, sub) + footer,
      text: personalize(subject, sub),
    }));

    const { sent, failed } = await sendMailBatch(mails);
    res.json({
      success: true,
      data: { sent, failed, total: targets.length },
      message:
        failed > 0
          ? `Sent to ${sent}, failed for ${failed}.`
          : `Newsletter sent to ${sent} subscriber${sent === 1 ? "" : "s"}.`,
    });
  } catch (error) {
    next(error);
  }
};

/** GET /api/newsletter/subscribers (admin) — roster for the admin panel. */
export const listSubscribers = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const subscribers = await loadSubscribers();
    res.json({
      success: true,
      data: subscribers,
      meta: { total: subscribers.length },
    });
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/newsletter/:email (admin) — prune an address from the list. */
export const removeSubscriber = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const raw = Array.isArray(req.params.email) ? req.params.email[0] : req.params.email;
    const email = decodeURIComponent(raw || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ success: false, error: "Invalid email address." });
      return;
    }
    const removed = useMemory()
      ? newsletterMemory.remove(email)
      : (await NewsletterModel.deleteOne({ email }).exec()).deletedCount > 0;
    res.json({
      success: true,
      data: { email, removed },
      message: removed
        ? `${email} was removed from the newsletter.`
        : `${email} wasn't on the list.`,
    });
  } catch (error) {
    next(error);
  }
};
