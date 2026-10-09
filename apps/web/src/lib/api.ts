import { CreateRequirementInput, RequirementDocument, RequirementStats } from "@elysia/shared";

// Same-origin BFF: the browser talks to the Next server (works from localhost
// AND from phones on the LAN). `/api/backend/*` is served by the route handler
// in app/api/backend/[...path]/route.ts, which signs every request with a
// server-side secret before forwarding to Express — the secret never reaches
// this bundle. Cookies flow automatically (same-origin), so sessions "just work".
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/backend";

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: "user" | "admin";
  verified: boolean;
  createdAt?: string;
}

export interface AdminUser extends AuthUser {
  jobCount: number;
  /** Live suspension end (ISO); null/undefined when the account is free. */
  bannedUntil?: string | null;
  banReason?: string;
}

export class ApiError extends Error {
  status: number;
  /** Machine-readable marker from the API (e.g. EMAIL_NOT_VERIFIED). */
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/**
 * All API calls go through here: custom client header (CSRF), timeout so a
 * hung network never freezes the UI, and friendly 429 handling.
 */
/**
 * Requests that wait on the Google Apps Script mail relay (measured ≈14s
 * per Gmail send on top of a cold start) outlive the default timeout —
 * signup, resend, password reset, deletion code, and newsletter blasts
 * pass their own longer signal.
 */
const MAIL_TIMEOUT_MS = 60_000;
const mailSignal = (): AbortSignal => AbortSignal.timeout(MAIL_TIMEOUT_MS);

async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method || "GET").toUpperCase();
  const headers = new Headers(init.headers);
  headers.set("X-PulseStage-Client", "pulsestage-web");
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    cache: method === "GET" ? (init.cache ?? "no-store") : "no-store",
    // Callers may override (see MAIL_TIMEOUT_MS above).
    signal:
      init.signal ??
      (typeof AbortSignal !== "undefined" && "timeout" in AbortSignal
        ? AbortSignal.timeout(30_000)
        : undefined),
  });

  if (res.status === 429) {
    // Server 429s carry a specific reason (e.g. monthly report allowance
    // exhausted); the generic copy is only the fallback.
    const body = await res.json().catch(() => ({}));
    throw new ApiError(
      body.error || "Too many requests — give it a few seconds and try again.",
      429,
      body.code
    );
  }
  return res;
}

/** Turn a non-OK response into a readable ApiError (validation details included). */
async function throwFrom(res: Response, fallback: string): Promise<never> {
  const body = await res.json().catch(() => ({}));
  if (Array.isArray(body.details)) {
    const message = body.details
      .map((d: { field: string; message: string }) => `${d.field}: ${d.message}`)
      .join(", ");
    throw new ApiError(message || fallback, res.status, body.code);
  }
  throw new ApiError(body.error || fallback, res.status, body.code);
}

// ── Requirements ───────────────────────────────────────────────────

export interface PosterInfo {
  userId: string;
  verified: boolean;
}

/** Requirement documents carry a hydrated `poster` (verified badge + ownership). */
export type RequirementWithPoster = RequirementDocument & {
  poster?: PosterInfo | null;
  /** Owner-only (`mine=1`): how many applications this post has received. */
  applicantsCount?: number;
};

export interface RequirementListResult {
  data: RequirementWithPoster[];
  total: number;
  page: number;
  totalPages: number;
}

export async function fetchRequirements(params?: {
  category?: string;
  search?: string;
  urgency?: string;
  status?: string;
  /** Location: substring match on city/venue/address. */
  city?: string;
  /** Budget window — posts whose range intersects [minBudget, maxBudget]. */
  minBudget?: number;
  maxBudget?: number;
  payType?: string;
  /** `true` → only MY posts (requires a session; API answers 401 otherwise). */
  mine?: boolean;
  page?: number;
  limit?: number;
}): Promise<RequirementListResult> {
  const query = new URLSearchParams();
  if (params?.category && params.category !== "All") query.append("category", params.category);
  if (params?.search) query.append("search", params.search);
  if (params?.urgency && params.urgency !== "All") query.append("urgency", params.urgency);
  if (params?.status && params.status !== "All") query.append("status", params.status);
  if (params?.city) query.append("city", params.city);
  if (typeof params?.minBudget === "number") query.append("minBudget", String(params.minBudget));
  if (typeof params?.maxBudget === "number") query.append("maxBudget", String(params.maxBudget));
  if (params?.payType && params.payType !== "All") query.append("payType", params.payType);
  if (params?.mine) query.append("mine", "1");
  if (params?.page) query.append("page", params.page.toString());
  if (params?.limit) query.append("limit", params.limit.toString());

  const url = `/requirements${query.toString() ? `?${query.toString()}` : ""}`;
  const res = await apiFetch(url, { cache: "no-store" });
  if (!res.ok) await throwFrom(res, `HTTP ${res.status}: Failed to fetch requirements`);

  const json = await res.json();
  return {
    data: json.data || [],
    total: json.meta?.total || 0,
    page: json.meta?.page || 1,
    totalPages: json.meta?.totalPages || 1,
  };
}

export async function fetchRequirementById(id: string): Promise<RequirementDocument> {
  const res = await apiFetch(`/requirements/${encodeURIComponent(id)}`);
  if (!res.ok) await throwFrom(res, "Failed to fetch requirement");
  const json = await res.json();
  return json.data;
}

/** Result of a create: the stored document plus the one-time Post ID key. */
export type CreatedRequirement = RequirementWithPoster & {
  /** `PS-<id>-<secret>` — shown once, lets a guest delete without an account. */
  postKey?: string;
};

export async function createRequirement(payload: CreateRequirementInput): Promise<CreatedRequirement> {
  const res = await apiFetch("/requirements", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) await throwFrom(res, "Failed to create requirement");
  const json = await res.json();
  return json.data;
}

export async function updateRequirement(
  id: string,
  payload: CreateRequirementInput
): Promise<RequirementDocument> {
  const res = await apiFetch(`/requirements/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) await throwFrom(res, "Failed to update requirement");
  const json = await res.json();
  return json.data;
}

/**
 * Delete a post: signed-in owners/admins need nothing extra; guests pass the
 * Post ID they received at creation (travels in the HMAC-signed body).
 */
export async function deleteRequirement(id: string, postKey?: string): Promise<boolean> {
  const res = await apiFetch(`/requirements/${encodeURIComponent(id)}`, {
    method: "DELETE",
    body: JSON.stringify(postKey ? { postKey } : {}),
  });
  if (!res.ok) await throwFrom(res, "Failed to delete requirement");
  return true;
}

/**
 * Claim a guest post for your account: requires sign-in PLUS the original
 * Post ID. Afterwards the post is fully manageable through the session.
 */
export async function claimRequirement(
  id: string,
  postKey: string
): Promise<RequirementWithPoster> {
  const res = await apiFetch(`/requirements/${encodeURIComponent(id)}/claim`, {
    method: "POST",
    body: JSON.stringify({ postKey }),
  });
  if (!res.ok) await throwFrom(res, "Failed to claim post");
  const json = await res.json();
  return json.data;
}

export async function fetchStats(): Promise<RequirementStats> {
  try {
    const res = await apiFetch("/requirements/stats");
    if (!res.ok) throw new Error("Failed to fetch stats");
    const json = await res.json();
    return json.data;
  } catch {
    return {
      total: 0,
      byCategory: { planner: 0, performer: 0, crew: 0 },
      totalEstimatedBudget: 0,
      urgentCount: 0,
    };
  }
}

// ── Auth ───────────────────────────────────────────────────────────
// The session itself lives in an httpOnly cookie set by the API (relayed by
// the BFF). No token is ever readable from JavaScript.

export interface SignupPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  /** Newsletter opt-in from the signup checkbox. */
  newsletter?: boolean;
}

/**
 * Signup no longer signs anyone in — the API answers 202 with the address
 * the verification code was mailed to. In local dev (no Apps Script yet)
 * `devCode` comes back so the flow stays testable.
 */
export interface SignupResult {
  email: string;
  requiresVerification: boolean;
  devCode?: string;
}

export async function signup(payload: SignupPayload): Promise<SignupResult> {
  const res = await apiFetch("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
    signal: mailSignal(), // waits for the OTP email to go out
  });
  if (!res.ok) await throwFrom(res, "Sign-up failed");
  const json = await res.json();
  return json.data;
}

/** Verify a freshly signed-up account with the 6-digit code — signs you in. */
export async function verifyEmail(email: string, code: string): Promise<AuthUser> {
  const res = await apiFetch("/auth/verify", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
  if (!res.ok) await throwFrom(res, "Verification failed");
  const json = await res.json();
  return json.data;
}

/** Ask for a fresh signup code. Same 200 answer whether or not it was sent. */
export async function resendVerification(email: string): Promise<{ devCode?: string }> {
  const res = await apiFetch("/auth/resend", {
    method: "POST",
    body: JSON.stringify({ email }),
    signal: mailSignal(),
  });
  if (!res.ok) await throwFrom(res, "Couldn't resend the code");
  const json = await res.json();
  return json.data ?? {};
}

/** Start password reset — always resolves (no account enumeration). */
export async function forgotPassword(email: string): Promise<{ devCode?: string }> {
  const res = await apiFetch("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
    signal: mailSignal(),
  });
  if (!res.ok) await throwFrom(res, "Couldn't start the password reset");
  const json = await res.json();
  return json.data ?? {};
}

/** Prove inbox control with the code, set a new password — signs you in. */
export async function resetPassword(
  email: string,
  code: string,
  password: string
): Promise<AuthUser> {
  const res = await apiFetch("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, code, password }),
  });
  if (!res.ok) await throwFrom(res, "Password reset failed");
  const json = await res.json();
  return json.data;
}

/** Deletion step 1: mail the confirmation code to the signed-in address. */
export async function requestDeletionCode(): Promise<{ devCode?: string }> {
  const res = await apiFetch("/auth/delete-account/code", {
    method: "POST",
    body: JSON.stringify({}),
    signal: mailSignal(),
  });
  if (!res.ok) await throwFrom(res, "Couldn't send the deletion code");
  const json = await res.json();
  return json.data ?? {};
}

/** Deletion step 2: code authorises wiping the account + all its posts. */
export async function deleteAccount(code: string): Promise<void> {
  const res = await apiFetch("/auth/delete-account", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
  if (!res.ok) await throwFrom(res, "Account deletion failed");
}

/** Footer newsletter join box — no account needed. */
export async function subscribeNewsletter(name: string, email: string): Promise<void> {
  const res = await apiFetch("/newsletter", {
    method: "POST",
    body: JSON.stringify({ name, email }),
  });
  if (!res.ok) await throwFrom(res, "Couldn't join the newsletter");
}

// ── Applications ────────────────────────────────────────────────────
export interface ApplyPayload {
  name: string;
  email: string;
  phone?: string;
  message: string;
  /** "Most notable work" — the API enforces 3 to 10 links. */
  workLinks: string[];
}

export interface RequirementApplication {
  _id: string;
  requirementId: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  /** Absent on applications saved before the field existed. */
  workLinks?: string[];
  createdAt?: string;
}

/** Apply to a live post — guests welcome; one application per email OR phone. */
export async function applyToRequirement(
  requirementId: string,
  payload: ApplyPayload
): Promise<void> {
  const res = await apiFetch(`/requirements/${encodeURIComponent(requirementId)}/apply`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) await throwFrom(res, "Failed to send your application");
}

/** Owner-only: who applied to this post (session required). */
export async function fetchApplications(requirementId: string): Promise<RequirementApplication[]> {
  const res = await apiFetch(
    `/requirements/${encodeURIComponent(requirementId)}/applications`
  );
  if (!res.ok) await throwFrom(res, "Failed to load applications");
  const json = await res.json();
  return json.data ?? [];
}

/**
 * Owner-only: pause (or reopen) application intake. While paused the API
 * rejects new applications with 409 and the feed shows the Apply button as
 * closed.
 */
export async function setApplicationsPaused(
  requirementId: string,
  paused: boolean
): Promise<RequirementWithPoster> {
  const res = await apiFetch(
    `/requirements/${encodeURIComponent(requirementId)}/applications/pause`,
    { method: "PUT", body: JSON.stringify({ paused }) }
  );
  if (!res.ok) await throwFrom(res, "Failed to update applications");
  const json = await res.json();
  return json.data;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) await throwFrom(res, "Sign-in failed");
  const json = await res.json();
  return json.data;
}

export async function logout(): Promise<void> {
  const res = await apiFetch("/auth/logout", {
    method: "POST",
    body: JSON.stringify({}),
  });
  if (!res.ok) await throwFrom(res, "Sign-out failed");
}

/** Returns the signed-in user, or null when there is no valid session. */
export async function fetchSession(): Promise<AuthUser | null> {
  const res = await apiFetch("/auth/me");
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? null;
}

/**
 * Edit the signed-in profile (name + phone). Email is the sign-in identity
 * and isn't editable here. Returns the updated user.
 */
export async function updateProfile(input: {
  firstName: string;
  lastName: string;
  phone?: string;
}): Promise<AuthUser> {
  const res = await apiFetch("/auth/me", {
    method: "PUT",
    body: JSON.stringify(input),
  });
  if (!res.ok) await throwFrom(res, "Failed to update profile");
  const json = await res.json();
  return json.data;
}

// ── Support (contact page) ──────────────────────────────────────────

export interface SupportPayload {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

export interface SupportMessage extends SupportPayload {
  _id: string;
  status: "new" | "read";
  createdAt?: string;
}

/** Public contact form — no account needed. */
export async function submitSupportMessage(payload: SupportPayload): Promise<void> {
  const res = await apiFetch("/support", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) await throwFrom(res, "Couldn't send your message");
}

/** Admin: recent contact-form messages (newest first). */
export async function fetchSupportMessages(): Promise<SupportMessage[]> {
  const res = await apiFetch("/support");
  if (!res.ok) await throwFrom(res, "Failed to load support messages");
  const json = await res.json();
  return json.data ?? [];
}

// ── Admin newsletter ────────────────────────────────────────────────

export interface NewsletterSubscriber {
  email: string;
  firstName: string;
  lastName: string;
  source: "footer" | "signup";
  subscribedAt?: string;
}

export async function fetchNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
  const res = await apiFetch("/newsletter/subscribers");
  if (!res.ok) await throwFrom(res, "Failed to load subscribers");
  const json = await res.json();
  return json.data ?? [];
}

export interface NewsletterSendResult {
  sent: number;
  failed: number;
  total: number;
}

/**
 * Admin: broadcast HTML to every subscriber. `{{firstName}}`, `{{name}}`,
 * `{{email}}` tokens are personalised per recipient in the subject line and
 * the body; a PulseStage footer is appended server-side.
 */
export async function sendNewsletter(
  subject: string,
  html: string,
  recipients?: string[]
): Promise<NewsletterSendResult> {
  const res = await apiFetch("/newsletter/send", {
    method: "POST",
    body: JSON.stringify(
      recipients ? { subject, html, recipients } : { subject, html }
    ),
    // Batched chunks of recipients, each a relay round-trip — the one
    // client call allowed to take minutes on a big list.
    signal: AbortSignal.timeout(600_000),
  });
  if (!res.ok) await throwFrom(res, "Newsletter send failed");
  const json = await res.json();
  return json.data;
}

/** Admin: remove one address from the newsletter list. */
export async function removeNewsletterSubscriber(email: string): Promise<void> {
  const res = await apiFetch(`/newsletter/${encodeURIComponent(email)}`, {
    method: "DELETE",
  });
  if (!res.ok) await throwFrom(res, "Failed to remove subscriber");
}

/** Admin: flip a support message between unread and read. */
export async function setSupportStatus(id: string, status: "new" | "read"): Promise<void> {
  const res = await apiFetch(`/support/${id}`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
  if (!res.ok) await throwFrom(res, "Failed to update message");
}

// ── Admin dashboard ────────────────────────────────────────────

export interface AdminOverview {
  users: {
    total: number;
    admins: number;
    verified: number;
    newLast7Days: number;
    banned: number;
  };
  posts: { total: number; live: number; paused: number; expired: number };
  applications: { total: number };
  newsletter: { total: number; newLast7Days: number };
  support: { total: number; unread: number };
  reports: {
    /** Open reports across all posts (below/at the threshold). */
    pending: number;
    /** Distinct posts carrying at least one report. */
    flaggedPosts: number;
    /** Lifetime posts swept by the auto-removal rule. */
    autoRemoved: number;
    threshold: number;
    banDays: number;
  };
  categories: Array<{ category: string; count: number }>;
  /** 14 calendar days, oldest first — zero-days included. */
  signupsByDay: Array<{ day: string; count: number }>;
  recentUsers: Array<{
    id: string;
    email: string;
    role: string;
    verified: boolean;
    createdAt?: string;
  }>;
  recentApplications: Array<{
    id: string;
    name: string;
    email: string;
    postTitle: string | null;
    createdAt?: string;
  }>;
}

export async function fetchAdminOverview(): Promise<AdminOverview> {
  const res = await apiFetch("/admin/overview");
  if (!res.ok) await throwFrom(res, "Failed to load dashboard stats");
  const json = await res.json();
  return json.data;
}

// ── Moderation ──────────────────────────────────────────────────

export type ReportReason = "fake" | "scam" | "inappropriate" | "spam" | "other";

export interface ReportResult {
  reportCount: number;
  threshold: number;
  postRemoved: boolean;
  banned: boolean;
  bannedUntil?: string | null;
}

/**
 * Report a post — guests and signed-in users both can (accounts dedupe by
 * email, guests by an anonymous report cookie): one report per identity per
 * post. Crossing the threshold removes the post and suspends the poster.
 */
export async function reportRequirement(
  id: string,
  reason: ReportReason,
  details?: string
): Promise<ReportResult> {
  const res = await apiFetch(`/requirements/${encodeURIComponent(id)}/report`, {
    method: "POST",
    body: JSON.stringify(details ? { reason, details } : { reason }),
  });
  if (!res.ok) await throwFrom(res, "Failed to report post");
  const json = await res.json();
  return json.data;
}

export interface ModerationSettings {
  /** Post is removed once reports EXCEED this number (default 10 → 11th). */
  reportThreshold: number;
  /** Auto-ban / default manual-ban length in days (default 14). */
  banDays: number;
  /** Monthly report allowance per signed-in account (default 10). */
  reportQuotaUser: number;
  /** Monthly report allowance per guest browser (default 6). */
  reportQuotaGuest: number;
  autoRemovedPosts: number;
}

export async function fetchModerationSettings(): Promise<ModerationSettings> {
  const res = await apiFetch("/admin/settings");
  if (!res.ok) await throwFrom(res, "Failed to load moderation settings");
  const json = await res.json();
  return json.data;
}

export type ModerationSettingsPatch = Pick<
  ModerationSettings,
  "reportThreshold" | "banDays" | "reportQuotaUser" | "reportQuotaGuest"
>;

export async function updateModerationSettings(
  values: ModerationSettingsPatch
): Promise<ModerationSettingsPatch> {
  const res = await apiFetch("/admin/settings", {
    method: "PUT",
    body: JSON.stringify(values),
  });
  if (!res.ok) await throwFrom(res, "Failed to save moderation settings");
  const json = await res.json();
  return json.data;
}

export interface FlaggedPost {
  requirementId: string;
  title: string;
  category: string;
  ownerEmail: string | null;
  /** HMAC user id of the poster (null for guest posts). */
  ownerId: string | null;
  ownerBanned: boolean;
  count: number;
  reasons: Record<string, number>;
  lastReportedAt?: string;
}

/** Posts carrying reports — admin review before the auto-rule fires. */
export async function fetchFlaggedPosts(): Promise<FlaggedPost[]> {
  const res = await apiFetch("/admin/reports");
  if (!res.ok) await throwFrom(res, "Failed to load flagged posts");
  const json = await res.json();
  return json.data ?? [];
}

/** Manual ban; `days` defaults to the saved moderation setting. */
export async function banUser(
  id: string,
  days?: number,
  reason?: string
): Promise<{ bannedUntil: string; days: number }> {
  const res = await apiFetch(`/admin/users/${encodeURIComponent(id)}/ban`, {
    method: "POST",
    body: JSON.stringify(days && reason ? { days, reason } : days ? { days } : reason ? { reason } : {}),
  });
  if (!res.ok) await throwFrom(res, "Failed to ban account");
  const json = await res.json();
  return json.data;
}

/** Lift a suspension early. */
export async function unbanUser(id: string): Promise<void> {
  const res = await apiFetch(`/admin/users/${encodeURIComponent(id)}/ban`, {
    method: "DELETE",
  });
  if (!res.ok) await throwFrom(res, "Failed to lift the ban");
}

// ── Admin ──────────────────────────────────────────────────────────

export async function fetchUsers(): Promise<AdminUser[]> {
  const res = await apiFetch("/users");
  if (!res.ok) await throwFrom(res, "Failed to fetch users");
  const json = await res.json();
  return json.data || [];
}

export async function setUserVerified(userId: string, verified: boolean): Promise<void> {
  const res = await apiFetch(`/users/${encodeURIComponent(userId)}/verify`, {
    method: "POST",
    body: JSON.stringify({ verified }),
  });
  if (!res.ok) await throwFrom(res, "Failed to update verification");
}
