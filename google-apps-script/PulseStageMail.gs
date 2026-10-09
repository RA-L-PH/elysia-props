/**
 * ════════════════════════════════════════════════════════════════════════
 *  PulseStage mail relay — Google Apps Script web app
 * ════════════════════════════════════════════════════════════════════════
 *
 *  The PulseStage API POSTs JSON here; this script sends the mail through
 *  Gmail. It handles EVERY kind of PulseStage email:
 *
 *    • signup verification codes   (6 digits, 5-minute life)
 *    • password-reset codes        (6 digits, 5-minute life)
 *    • account-deletion codes      (6 digits, 5-minute life)
 *    • admin newsletter blasts     (personalised HTML, batched 5 per call)
 *    • anything else the API wants to send (same payload shape)
 *
 *  SENDER: with FROM_ALIAS set (and the Gmail API service enabled) emails
 *  appear as "PulseStage <mailpulsestage@duck.com>"; otherwise MailApp can
 *  only send from the script's own Google account and they appear as
 *  "PulseStage <admin.pulsestage@gmail.com>".
 *  REPLY-TO: every reply goes to mailpulsestage@duck.com (see REPLY_TO),
 *  so that's where OTP answers, newsletter replies, and support land.
 *
 *  ── SETUP (one time, ~3 minutes) ─────────────────────────────────────
 *  1. https://script.google.com (logged in as admin.pulsestage@gmail.com)
 *       → New project → rename it "PulseStage Mail"
 *       → delete the default code and paste this whole file in.
 *  2. Project Settings (⚙) → Script properties → add:
 *       PULSESTAGE_TOKEN = <40+ random chars from a password generator>
 *  2b. Editor toolbar → Services (＋) → search "Gmail API" → Add.
 *       (This is what lets the script send AS FROM_ALIAS.) Then click
 *       Run once, pick doGet, and click Allow when it asks for Gmail
 *       permission — one-time, this account only. Finally run
 *       testDuckSend: the log must print a message id and the mail must
 *       arrive From mailpulsestage@duck.com.
 *  3. Deploy → New deployment → ⚙ → Type: "Web app"
 *       Execute as:  Me
 *       Who has access:  Anyone
 *     → Deploy → copy the /exec URL.
 *  4. In apps/api/.env add BOTH values and restart the API:
 *       APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfyc.../exec
 *       APPS_SCRIPT_TOKEN=<the exact same token from step 2>
 *       WEB_BASE_URL=https://your-domain   (optional: contact links in mails)
 *  5. Sanity check: open APPS_SCRIPT_URL in a browser — you should see
 *     {"ok":true,"service":"PulseStage mail relay",...}.
 *
 *  ── PAYLOADS accepted ────────────────────────────────────────────────
 *    Single : { "token": "...", "emails": [ { "to", "subject", "html", "text?", "replyTo?" } ] }
 *    (the API always wraps singles as a 1-element batch, and batches
 *     newsletter sends in chunks of 5 to respect Apps Script quotas;
 *     replyTo defaults to REPLY_TO when omitted)
 *
 *  ── QUOTAS ───────────────────────────────────────────────────────────
 *    MailApp ≈100 sends/day on personal Gmail, ≈1000/day on Workspace.
 *    The script refuses to start a batch bigger than the remaining quota
 *    and reports exactly how many went out (sent/failed) so the admin
 *    panel never lies about delivery.
 * ════════════════════════════════════════════════════════════════════════
 */

// Shown in every inbox as the sender name.
var SENDER_NAME = "PulseStage";
// Everything is answered here — codes, newsletters, support replies.
// (MailApp can only send FROM the script's own Google account, so this
// Reply-To is how mailpulsestage@duck.com is the public identity.)
var REPLY_TO = "mailpulsestage@duck.com";
// Send AS this address instead of the script account. It must be verified
// in Gmail → Settings → Accounts → "Send mail as", and the script needs
// the Gmail API advanced service (SETUP step 2b). Set to "" to fall back
// to plain MailApp sending from admin.pulsestage@gmail.com.
var FROM_ALIAS = "mailpulsestage@duck.com";
// Safety rail if someone points the API at this URL with a valid token.
var MAX_RECIPIENTS_PER_CALL = 100;

/**
 * Web-app entry point. The API signs every request with the shared token
 * stored in Script Properties — without it this URL is useless to outsiders.
 */
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);

    var expected = PropertiesService.getScriptProperties().getProperty("PULSESTAGE_TOKEN") || "";
    if (!expected || payload.token !== expected) {
      return json_({ ok: false, error: "unauthorized" });
    }

    // Accept {"emails":[...]} (always sent by the API) and a plain single
    // {to, subject, html, text} for hand testing.
    var emails = payload.emails;
    if (!emails && payload.to) {
      emails = [{ to: payload.to, subject: payload.subject, html: payload.html, text: payload.text, replyTo: payload.replyTo }];
    }
    if (!emails || !emails.length) {
      return json_({ ok: false, error: "no recipients" });
    }
    if (emails.length > MAX_RECIPIENTS_PER_CALL) {
      return json_({
        ok: false,
        error: "too many recipients in one call (" + emails.length + " > " + MAX_RECIPIENTS_PER_CALL + ")"
      });
    }

    // Daily quota guard — don't half-send a batch we can't finish.
    var quota = MailApp.getRemainingDailyQuota();
    if (quota < emails.length) {
      return json_({
        ok: false,
        error: "daily mail quota exhausted: need " + emails.length + ", only " + quota + " left"
      });
    }

    var sent = 0;
    var failedRecipients = [];
    // Gmail API path = the only way to send AS FROM_ALIAS (MailApp has no
    // from parameter). If the service wasn't added, fall back to MailApp
    // (script account) instead of failing every send.
    var useAlias = FROM_ALIAS && !!gmailMessages_();
    if (FROM_ALIAS && !useAlias) {
      console.warn(
        "Gmail API service not enabled — falling back to MailApp (From: script account)."
      );
    }
    for (var i = 0; i < emails.length; i++) {
      var mail = emails[i];
      if (!mail || !mail.to || !mail.subject) {
        failedRecipients.push(mail && mail.to ? mail.to : "(missing recipient)");
        continue;
      }
      try {
        if (useAlias) {
          sendAsAlias_(mail);
        } else {
          MailApp.sendEmail({
            to: mail.to,
            subject: mail.subject,
            htmlBody: mail.html || undefined,
            body: mail.text || stripHtml_(mail.html || mail.subject),
            name: SENDER_NAME, // "PulseStage <admin.pulsestage@gmail.com>"
            // Per-message Reply-To (support mirrors answer the sender directly),
            // falling back to the PulseStage support identity.
            replyTo: mail.replyTo || REPLY_TO
          });
        }
        sent++;
      } catch (err) {
        // Log the real reason — a swallowed error makes relay failures
        // impossible to diagnose from the Executions page.
        console.warn(
          "send failed for " + mail.to + ": " +
            (err && err.message ? err.message : String(err))
        );
        failedRecipients.push(String(mail.to));
      }
      // Gentle pacing on newsletter batches (per-second send limits).
      if (i % 5 === 4) Utilities.sleep(200);
    }

    return json_({
      ok: failedRecipients.length === 0,
      sent: sent,
      failed: failedRecipients.length,
      failures: failedRecipients
    });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/**
 * Send one message through the Gmail API with an explicit From header —
 * the only way to appear as FROM_ALIAS. The address must be a verified
 * "Send mail as" identity or the API rejects it (counted in failures,
 * never dropped silently).
 */
function sendAsAlias_(mail) {
  var mime = [
    "From: " + SENDER_NAME + " <" + FROM_ALIAS + ">",
    "To: " + mail.to,
    "Reply-To: " + (mail.replyTo || REPLY_TO),
    "Subject: " + encodeHeader_(mail.subject || ""),
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    mail.html || stripHtml_(mail.text || mail.subject || "")
  ].join("\r\n");
  var bytes = Utilities.newBlob(mime).getBytes();
  var raw = Utilities.base64EncodeWebSafe(bytes).replace(/=+$/, "");
  var messages = gmailMessages_();
  if (!messages) {
    throw new Error("Gmail API service not enabled (Services ➜ Gmail API)");
  }
  messages.send({ raw: raw }, "me");
}

/**
 * The Gmail API users.messages resource, or null when the advanced service
 * isn't added. This service version exposes it as `Messages` (capital M) —
 * lowercase `messages` reads back undefined and makes every alias send fail
 * with "Cannot read properties of undefined (reading 'send')".
 */
function gmailMessages_() {
  if (typeof Gmail === "undefined" || !Gmail.Users) return null;
  return Gmail.Users.Messages || Gmail.Users.messages || null;
}

/** RFC 2047 word-encoding so non-ASCII subjects survive the header. */
function encodeHeader_(s) {
  return /^[\x20-\x7E]*$/.test(s)
    ? s
    : "=?UTF-8?B?" + Utilities.base64Encode(Utilities.newBlob(s).getBytes()) + "?=";
}

/**
 * Health probe — open the /exec URL in a browser. Also handy for checking
 * how much daily quota is left: {quota: MailApp.getRemainingDailyQuota()}.
 * sendingAs/gmailApi show whether the alias path is live.
 */
function doGet() {
  return json_({
    ok: true,
    service: "PulseStage mail relay",
    sender: SENDER_NAME,
    replyTo: REPLY_TO,
    sendingAs: FROM_ALIAS || "script account",
    gmailApi: !!gmailMessages_(),
    quotaLeft: MailApp.getRemainingDailyQuota()
  });
}

/** JSON response wrapper Apps Script web apps require. */
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/**
 * One-off test: sends a real mail FROM FROM_ALIAS TO the admin inbox.
 * Run it from the editor — the Execution log prints the message id on
 * success or the exact error on failure.
 */
function testDuckSend() {
  var mime = [
    "From: " + SENDER_NAME + " <" + FROM_ALIAS + ">",
    "To: admin.pulsestage@gmail.com",
    "Reply-To: " + REPLY_TO,
    "Subject: Duck alias test " + new Date().toISOString(),
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    "<p style='font-family:Arial'>If the From line reads <b>" + FROM_ALIAS + "</b>, the alias path works.</p>"
  ].join("\r\n");

  try {
    var raw = Utilities.base64EncodeWebSafe(Utilities.newBlob(mime).getBytes())
      .replace(/=+$/, "");
    var messages = gmailMessages_();
    if (!messages) {
      throw new Error("Gmail API service not enabled (Services ➜ Gmail API)");
    }
    var msg = messages.send({ raw: raw }, "me");
    Logger.log("OK sent — id: " + msg.id);
  } catch (err) {
    Logger.log("FAILED: " + (err && err.message ? err.message : String(err)));
    if (err && err.stack) Logger.log(err.stack);
  }
}

/** Crude HTML → plain text for mail clients that can't render htmlBody. */
function stripHtml_(html) {
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
