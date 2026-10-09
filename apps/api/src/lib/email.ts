/**
 * Email delivery for PulseStage — routed through a Google Apps Script web app
 * so Gmail credentials never live in this repo. The API POSTs a JSON payload
 * (token + recipient + subject + HTML); Apps Script sends it via MailApp with
 * "PulseStage" as the display name, so every message is branded on arrival.
 *
 * Environment:
 *   APPS_SCRIPT_URL   – deploy URL of the Apps Script web app (New deploy →
 *                       Web app → "Execute as me / Anyone")
 *   APPS_SCRIPT_TOKEN – shared secret both sides compare (Script Properties)
 *   SUPPORT_INBOX     – optional override for where /contact submissions are
 *                       mirrored (defaults to mailpulsestage@duck.com)
 *
 * Development fallback: with no URL configured (and not in production) the
 * code is printed to the API console and echoed back to the caller as
 * `devCode` so flows stay testable before the script exists. In production a
 * missing URL fails the send loudly instead of silently dropping mail.
 */

const scriptUrl = (): string => process.env.APPS_SCRIPT_URL?.trim() || "";
const scriptToken = (): string => process.env.APPS_SCRIPT_TOKEN?.trim() || "";
const isProduction = (): boolean => process.env.NODE_ENV === "production";

export interface MailPayload {
  to: string;
  subject: string;
  html: string;
  /** Short plain-text fallback (Apps Script falls back to it on bad HTML). */
  text?: string;
  /**
   * Per-message Reply-To; falls back to the script-wide REPLY_TO
   * (mailpulsestage@duck.com). Support notifications set this to the
   * person who wrote in so an admin's reply goes straight to them.
   */
  replyTo?: string;
  /** Opaque code echoed back to the caller in dev fallback (OTP flows). */
  devHint?: string;
}

export interface MailResult {
  delivered: boolean;
  /** Present only in the dev fallback — the code that would have been mailed. */
  devCode?: string;
}

/** POST a batch of mails to the Apps Script web app. */
const postBatch = async (
  emails: Array<{
    to: string;
    subject: string;
    html: string;
    text?: string;
    replyTo?: string;
  }>
): Promise<void> => {
  const res = await fetch(scriptUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: scriptToken(), emails }),
    // A batch is one Apps Script execution: project cold start + one
    // MailApp.sendEmail per recipient (measured ≈14s for a single mail),
    // so 30s would abort legitimate sends.
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) {
    throw new Error(`Apps Script answered ${res.status}`);
  }
  const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
  if (body.ok === false) {
    throw new Error(body.error || "Apps Script rejected the send");
  }
};

/** Send one message. See MailResult for the dev fallback contract. */
export const sendMail = async (payload: MailPayload): Promise<MailResult> => {
  if (!scriptUrl()) {
    if (isProduction()) {
      throw new Error("APPS_SCRIPT_URL is not configured — email cannot be sent.");
    }
    console.log(
      `[MAIL DEV] to=${payload.to} subject="${payload.subject}"${
        payload.devHint ? ` code=${payload.devHint}` : ""
      } (APPS_SCRIPT_URL not set — nothing was actually sent)`
    );
    return { delivered: true, devCode: payload.devHint };
  }
  await postBatch([
    {
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      replyTo: payload.replyTo,
    },
  ]);
  return { delivered: true };
};

/**
 * Send many messages in one call (newsletter broadcasts). Chunked so a big
 * list never becomes one giant payload: measured relay cost is ≈14s PER
 * Gmail send, so 5-mail chunks finish in ≈75s — inside the 120s per-request
 * budget. A failed chunk is reported, not swallowed, so the admin sees
 * partial-delivery counts.
 */
export const sendMailBatch = async (
  mails: Array<{ to: string; subject: string; html: string; text?: string }>,
  chunkSize = 5
): Promise<{ sent: number; failed: number }> => {
  if (!scriptUrl()) {
    if (isProduction()) {
      throw new Error("APPS_SCRIPT_URL is not configured — email cannot be sent.");
    }
    console.log(
      `[MAIL DEV] broadcast to ${mails.length} subscriber(s): "${mails[0]?.subject}" (APPS_SCRIPT_URL not set — nothing was actually sent)`
    );
    return { sent: mails.length, failed: 0 };
  }
  let sent = 0;
  let failed = 0;
  for (let i = 0; i < mails.length; i += chunkSize) {
    try {
      await postBatch(mails.slice(i, i + chunkSize));
      sent += Math.min(chunkSize, mails.length - i);
    } catch (err) {
      console.error("[MAIL] batch failed:", err);
      failed += Math.min(chunkSize, mails.length - i);
    }
  }
  return { sent, failed };
};

// ── Templates ────────────────────────────────────────────────────────
// Every transactional mail shares one branded shell: PulseStage name up
// top, the big code in the middle, and a "contact support" line at the
// bottom — so recipients always know who is writing and where to get help.

const shell = (headline: string, bodyHtml: string): string => `
<!doctype html>
<html>
  <body style="margin:0;background:#FFF9E6;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF9E6;padding:24px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FFFFFF;border:3px solid #000;border-radius:18px;overflow:hidden;">
          <tr>
            <td style="background:#00F0FF;border-bottom:3px solid #000;padding:14px 20px;">
              <span style="font-size:16px;font-weight:900;letter-spacing:1px;color:#000;">PULSESTAGE</span>
            </td>
          </tr>
          <tr><td style="padding:24px 20px;">
            <h1 style="margin:0 0 12px;font-size:20px;color:#000;">${headline}</h1>
            ${bodyHtml}
          </td></tr>
          <tr>
            <td style="background:#FFDE59;border-top:3px solid #000;padding:12px 20px;font-size:12px;color:#000;">
              Sent by <strong>PulseStage</strong> · Need help?
              <a href="${(process.env.WEB_BASE_URL || "http://localhost:3000")}/contact" style="color:#000;font-weight:bold;">Contact support</a>
              or reply to this email.
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

const codeBlock = (code: string): string => `
  <div style="margin:18px 0;padding:16px;background:#FFF9E6;border:2.5px solid #000;border-radius:14px;text-align:center;">
    <span style="font-size:34px;font-weight:900;letter-spacing:10px;color:#000;font-family:monospace;">${code}</span>
  </div>`;

const small = (text: string): string =>
  `<p style="margin:0 0 10px;font-size:13px;line-height:1.6;color:#333;">${text}</p>`;

/** Signup verification — 6-digit code, 5 minutes to enter it. */
export const sendVerificationMail = (
  to: string,
  firstName: string,
  code: string
): Promise<MailResult> =>
  sendMail({
    to,
    subject: `${code} is your PulseStage verification code`,
    devHint: code,
    text: `Your PulseStage verification code is ${code}. It expires in 5 minutes.`,
    html: shell(
      "Verify your email",
      `${small(`Hi ${firstName || "there"} — one last step before your PulseStage account is live.`)}
       ${codeBlock(code)}
       ${small("Enter this 6-digit code within 5 minutes. Didn't sign up? You can safely ignore this email.")}
       ${small("<strong>Tip:</strong> the code also signs you in once — no need to retype your password.")}`,
    ),
  });

/** Password reset — proof of inbox control before the password changes. */
export const sendPasswordResetMail = (
  to: string,
  firstName: string,
  code: string
): Promise<MailResult> =>
  sendMail({
    to,
    subject: `${code} is your PulseStage password reset code`,
    devHint: code,
    text: `Your PulseStage password reset code is ${code}. It expires in 5 minutes.`,
    html: shell(
      "Reset your password",
      `${small(`Hi ${firstName || "there"} — we received a request to reset the password for ${to}.`)}
       ${codeBlock(code)}
       ${small("This code expires in 5 minutes. If this wasn't you, no action is needed — your password stays unchanged.")}`,
    ),
  });

/** Account deletion — the final confirmation code. */
export const sendDeletionMail = (
  to: string,
  firstName: string,
  code: string
): Promise<MailResult> =>
  sendMail({
    to,
    subject: `${code} is your PulseStage account deletion code`,
    devHint: code,
    text: `Your PulseStage account deletion code is ${code}. It expires in 5 minutes.`,
    html: shell(
      "Confirm account deletion",
      `${small(`Hi ${firstName || "there"} — you asked to permanently delete the PulseStage account for ${to}.`)}
       ${codeBlock(code)}
       ${small("<strong>This cannot be undone.</strong> Deleting removes your account, every post you own, and all applications attached to them. The code expires in 5 minutes. If this wasn't you, ignore this email.")}`,
    ),
  });

// ── Support inbox ───────────────────────────────────────────────────

/** The support inbox — contact-form submissions are mirrored here. */
const supportInbox = (): string =>
  process.env.SUPPORT_INBOX?.trim() || "mailpulsestage@duck.com";

/** Minimal HTML escaping — support bodies are user-typed text. */
const esc = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Mirror a /contact submission to the support inbox. The message already
 * lives in the admin dashboard — this is the email copy so the team can
 * answer straight from mailpulsestage@duck.com; Reply-To is the person who
 * wrote in, so "reply" goes to them, not back to the relay.
 */
export const sendSupportNotificationMail = (message: {
  name: string;
  email: string;
  subject?: string;
  message: string;
}): Promise<MailResult> =>
  sendMail({
    to: supportInbox(),
    subject: `Support: ${message.subject?.trim() || "New message"} — from ${message.name}`,
    replyTo: message.email,
    text: `New PulseStage support message from ${message.name} <${message.email}>.\n\n${message.message}`,
    html: shell(
      "New support message",
      `${small(`<strong>${esc(message.name)}</strong> &lt;${esc(message.email)}&gt; wrote in:`)}
       ${small(`Subject: <strong>${esc(message.subject || "(no subject)")}</strong>`)}
       <div style="margin:14px 0;padding:14px;background:#FFF9E6;border:2.5px solid #000;border-radius:14px;font-size:13px;line-height:1.6;white-space:pre-wrap;word-break:break-word;">${esc(message.message)}</div>
       ${small("Also filed under <strong>Support</strong> in the admin dashboard. Reply to this email to answer the sender.")}`,
    ),
  });
