# PulseStage → Apps Script mail relay

The API never talks to SMTP directly. It POSTs JSON to a Google Apps Script
web app, which sends through *your* Gmail with "PulseStage" as the sender
name. One relay serves every workflow:

| Workflow | Trigger | Email |
|---|---|---|
| Signup verification | `POST /api/auth/signup` → `POST /api/auth/verify` | 6-digit code, **5 min TTL** |
| Password reset | `POST /api/auth/forgot-password` → `reset-password` | 6-digit code, 5 min TTL |
| Account deletion | `POST /api/auth/delete-account/code` → `delete-account` | confirmation code, 5 min TTL |
| Newsletter blast | admin `/admin` → `POST /api/newsletter/send` | personalised HTML, batched 25/call |
| Support | `POST /api/support` (no mail — stored in the `support` collection) | — |

## Deploy

1. Open **https://script.google.com** (logged in as **admin.pulsestage@gmail.com**,
   so every mail is sent *from* that address) → **New project** → paste
   [`PulseStageMail.gs`](./PulseStageMail.gs) over `Code.gs`.
2. **Project Settings → Script properties** → add
   `PULSESTAGE_TOKEN` = a long random string (40+ chars).
3. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Deploy → copy the `/exec` URL.
4. Put both values in `apps/api/.env` and restart the API:

```env
APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfyc.../exec
APPS_SCRIPT_TOKEN=<same value as the Script property>
WEB_BASE_URL=https://your-real-domain   # optional: contact links in emails
```

5. Sanity check: open `APPS_SCRIPT_URL` in a browser — you should see
   `{"ok":true,"service":"PulseStage mail relay",...}`.

## Dev mode (before the URL exists)

With `APPS_SCRIPT_URL` unset (and `NODE_ENV` not `production`), nothing is
emailed — instead the API **logs the code to its own console** and returns
it to the browser as `devCode`, which the verify / reset / delete screens
show as a yellow "Dev mode" hint. Flows stay fully testable locally; in
production a missing URL fails loudly instead of silently dropping mail.

## Quotas

`MailApp` sends ≈100 mails/day on personal Gmail, ≈1000/day on Workspace.
The API batches **25 per call** and the admin panel reports `sent/failed`.
