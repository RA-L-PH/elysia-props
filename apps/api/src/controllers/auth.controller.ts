import { Request, Response, NextFunction } from "express";
import { UserModel, IUser } from "../models/User.model.js";
import {
  hashEmail,
  hashPassword,
  verifyPassword,
  createSession,
  DUMMY_PASSWORD_HASH,
  SESSION_COOKIE,
  SESSION_TTL_MS,
} from "../lib/identity.js";
import { readSessionToken, isBanned, bannedResponse } from "../middlewares/auth.js";
import { subscribeToNewsletter } from "./newsletter.controller.js";
import { sha256Hex } from "../lib/identity.js";
import { issueOtp, verifyOtp, consumeOtpsFor } from "../models/Otp.model.js";
import { RequirementModel } from "../models/Requirement.model.js";
import { ApplicationModel } from "../models/Application.model.js";
import { NewsletterModel } from "../models/Newsletter.model.js";
import { removeApplicationsFor } from "./application.controller.js";
import {
  sendVerificationMail,
  sendPasswordResetMail,
  sendDeletionMail,
} from "../lib/email.js";
import {
  SignupInput,
  LoginInput,
  UpdateProfileInput,
  VerifyEmailInput,
  ResendVerificationInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  DeleteAccountInput,
} from "@elysia/shared";

const publicUser = (user: IUser) => ({
  id: String(user._id),
  email: user.email,
  firstName: user.firstName || "",
  lastName: user.lastName || "",
  phone: user.phone || "",
  role: user.role,
  verified: user.verified,
  createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : undefined,
});

const setSessionCookie = (res: Response, token: string): void => {
  // No `Secure` flag while the app is served over plain http on the LAN —
  // add `Secure` the moment it runs behind TLS in production.
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(
      SESSION_TTL_MS / 1000
    )}`
  );
};

/** Rotate the user's session: prune expired/redundant entries, then append. */
const startSession = async (user: IUser): Promise<string> => {
  const { token, tokenHash } = createSession();
  const now = Date.now();
  const active = (user.sessions || []).filter((s) => s.expiresAt?.getTime?.() > now);
  user.sessions = active.slice(-9) as IUser["sessions"];
  user.sessions.push({ tokenHash, createdAt: new Date(now), expiresAt: new Date(now + SESSION_TTL_MS) });
  await user.save();
  return token;
};

export const signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, firstName, lastName, phone, newsletter } = req.body as SignupInput;
    const userId = hashEmail(email);

    const existing = await UserModel.findById(userId);
    if (existing) {
      res.status(409).json({
        success: false,
        error: "An account with this email already exists. Try signing in instead.",
      });
      return;
    }

    // Admin bootstrap: emails listed in ADMIN_EMAILS, or — when none exist yet —
    // the very first account (so someone can always verify posters).
    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const anyAdminExists = await UserModel.exists({ role: "admin" });
    const role = adminEmails.includes(email) || !anyAdminExists ? "admin" : "user";

    const user = new UserModel({
      _id: userId,
      email,
      passwordHash: await hashPassword(password),
      firstName,
      lastName,
      phone: phone ?? "",
      role,
      newsletter: Boolean(newsletter),
      // OTP gate: the account stays locked (and session-less) until the
      // 6-digit code mailed through Apps Script is entered. Legacy accounts
      // predate the field and are treated as verified (undefined ≠ false).
      emailVerified: false,
      sessions: [],
    });
    await user.save();

    // Checked the box at signup? Mirror the email + full name into the
    // marketing list (fire-and-forget — a list hiccup must never fail
    // account creation).
    if (newsletter) {
      subscribeToNewsletter(email, "signup", `${firstName} ${lastName}`.trim()).catch(() => {});
    }

    if (role === "admin") {
      console.log(`[AUTH] Admin account created (pending email verification): ${email}`);
    }

    // Mail the code. No session cookie yet — verifyEmail hands one over.
    const code = await issueOtp(email, "signup");
    let devCode: string | undefined;
    try {
      devCode = (await sendVerificationMail(email, firstName, code)).devCode;
    } catch (err) {
      // Account exists but is still locked — signing in routes the client
      // to the verify screen, where "resend" retries the delivery.
      console.error("[AUTH] verification email failed:", err);
      res.status(503).json({
        success: false,
        error: "We couldn't send the verification email — try again in a moment.",
      });
      return;
    }

    res.status(202).json({
      success: true,
      data: { email, requiresVerification: true, ...(devCode ? { devCode } : {}) },
      message: `We sent a 6-digit code to ${email}.`,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body as LoginInput;
    const user = await UserModel.findById(hashEmail(email));

    if (!user) {
      // Equalise timing so attackers can't distinguish "no such account"
      // from "wrong password" by response time.
      await verifyPassword(password, DUMMY_PASSWORD_HASH);
      res.status(401).json({ success: false, error: "Invalid email or password." });
      return;
    }

    const passwordOk = await verifyPassword(password, user.passwordHash);
    if (!passwordOk) {
      res.status(401).json({ success: false, error: "Invalid email or password." });
      return;
    }

    // Suspended accounts never get a session, even with the right password.
    if (isBanned(user.bannedUntil)) {
      bannedResponse(
        res,
        new Date(user.bannedUntil as Date).toISOString(),
        user.banReason
      );
      return;
    }

    // Unverified accounts stay locked until the mailed OTP is entered.
    // Only signups through the new flow carry `emailVerified: false`, so
    // every legacy account (field absent) keeps signing in normally.
    if (user.emailVerified === false) {
      res.status(403).json({
        success: false,
        error: "Your email isn't verified yet — enter the 6-digit code we mailed you.",
        code: "EMAIL_NOT_VERIFIED",
      });
      return;
    }

    const token = await startSession(user);
    setSessionCookie(res, token);
    res.json({
      success: true,
      data: publicUser(user),
      message: "Signed in successfully.",
    });
  } catch (error) {
    console.error("[AUTH] Login error:", error);
    if ((error as Error).message?.includes("buffering timed out") || (error as Error).name === "MongooseError" || (error as Error).name === "MongoServerError") {
      res.status(503).json({
        success: false,
        error: "Database is currently connecting or offline. Please verify MONGODB_URI on Render.",
      });
      return;
    }
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = readSessionToken(req);
    if (token) {
      const tokenHash = sha256Hex(token);
      await UserModel.updateOne(
        { "sessions.tokenHash": tokenHash },
        { $pull: { sessions: { tokenHash } } } as never
      );
    }
    res.setHeader(
      "Set-Cookie",
      `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
    );
    res.json({ success: true, message: "Signed out." });
  } catch (error) {
    next(error);
  }
};

/** Current session — 401 via requireAuth when the cookie is missing/invalid. */
export const me = (req: Request, res: Response): void => {
  res.json({ success: true, data: req.user });
};

/**
 * PUT /api/auth/me — edit the signed-in profile (name + phone). The email is
 * the sign-in identity and is not editable here; ownership comes from the
 * session, so nobody can edit anyone else's profile.
 */
export const updateMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Sign in required." });
      return;
    }
    const { firstName, lastName, phone } = req.body as UpdateProfileInput;
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      res.status(401).json({ success: false, error: "Sign in required." });
      return;
    }

    user.firstName = firstName;
    user.lastName = lastName;
    user.phone = phone ?? "";
    await user.save();

    res.json({
      success: true,
      data: publicUser(user),
      message: "Profile updated.",
    });
  } catch (error) {
    next(error);
  }
};

// ── Email workflows — 6-digit OTPs mailed via the Apps Script relay ────────

/** Uniform copy for every failed code check (no reason oracle for probing). */
const otpErrorMessage = (reason: string): string =>
  reason === "expired"
    ? "That code has expired — request a fresh one."
    : reason === "too_many_attempts"
      ? "Too many wrong attempts — request a new code."
      : "That code isn't right — check the email and try again.";

/**
 * POST /auth/verify — activate a freshly signed-up account and hand it its
 * first session. Wrong/expired codes never reveal whether the account exists.
 */
export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, code } = req.body as VerifyEmailInput;
    const user = await UserModel.findById(hashEmail(email));
    if (!user) {
      res.status(400).json({
        success: false,
        error: "We couldn't verify that code. Check the email and code, or request a new one.",
      });
      return;
    }

    // Idempotent: an already-verified account just gets its session back.
    if (user.emailVerified !== false) {
      const token = await startSession(user);
      setSessionCookie(res, token);
      res.json({ success: true, data: publicUser(user) });
      return;
    }

    const check = await verifyOtp(email, "signup", code);
    if (!check.ok) {
      res.status(400).json({ success: false, error: otpErrorMessage(check.reason) });
      return;
    }

    user.emailVerified = true;
    await user.save();
    // Authenticated → every outstanding code for this address is destroyed
    // (verifyOtp already consumed the matched one; this sweeps stragglers).
    await consumeOtpsFor(email);

    const token = await startSession(user);
    setSessionCookie(res, token);
    res.json({
      success: true,
      data: publicUser(user),
      message: "Email verified — you're signed in.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/resend — issue + mail a fresh signup code. The answer is the
 * same whether the address is unknown or already verified (no probing).
 */
export const resendVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body as ResendVerificationInput;
    const user = await UserModel.findById(hashEmail(email));
    let devCode: string | undefined;

    if (user && user.emailVerified === false) {
      const code = await issueOtp(email, "signup");
      try {
        devCode = (await sendVerificationMail(email, user.firstName, code)).devCode;
      } catch (err) {
        console.error("[AUTH] resend verification failed:", err);
        res.status(503).json({
          success: false,
          error: "We couldn't send the email right now — try again in a moment.",
        });
        return;
      }
    }

    res.json({
      success: true,
      data: { ...(devCode ? { devCode } : {}) },
      message: "If that address needs a code, it's on its way.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/forgot-password — always 200 (an attacker learns nothing from
 * the response about which addresses have accounts). Real inboxes get a
 * password-reset code.
 */
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body as ForgotPasswordInput;
    const user = await UserModel.findById(hashEmail(email));
    let devCode: string | undefined;

    if (user) {
      const code = await issueOtp(email, "password-reset");
      try {
        devCode = (await sendPasswordResetMail(email, user.firstName, code)).devCode;
      } catch (err) {
        console.error("[AUTH] forgot-password email failed:", err);
        // Still 200: a delivery hiccup must not double as an oracle.
        devCode = undefined;
      }
    }

    res.json({
      success: true,
      data: { ...(devCode ? { devCode } : {}) },
      message: "If that address has an account, a reset code is on its way.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/reset-password — prove inbox control with the code, then set a
 * new password. Every existing session is destroyed (a stolen session can't
 * outlive the reset) and all outstanding codes for the address are dropped;
 * the successful reset also signs the user in on this device.
 */
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, code, password } = req.body as ResetPasswordInput;
    const user = await UserModel.findById(hashEmail(email));
    if (!user) {
      res.status(400).json({ success: false, error: "That code isn't valid or has expired." });
      return;
    }
    const check = await verifyOtp(email, "password-reset", code);
    if (!check.ok) {
      res.status(400).json({ success: false, error: otpErrorMessage(check.reason) });
      return;
    }

    user.passwordHash = await hashPassword(password);
    user.sessions = []; // sign out every device
    await user.save();
    await consumeOtpsFor(email); // any dangling code dies with the old secret

    const token = await startSession(user);
    setSessionCookie(res, token);
    res.json({
      success: true,
      data: publicUser(user),
      message: "Password updated — you're signed in.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/delete-account/code — step 1 of 2: mail the final confirmation
 * code to the signed-in account's own address.
 */
export const requestDeletionCode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Sign in required." });
      return;
    }
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      res.status(401).json({ success: false, error: "Sign in required." });
      return;
    }

    const code = await issueOtp(user.email, "account-delete");
    let devCode: string | undefined;
    try {
      devCode = (await sendDeletionMail(user.email, user.firstName, code)).devCode;
    } catch (err) {
      console.error("[AUTH] deletion code email failed:", err);
      res.status(503).json({
        success: false,
        error: "We couldn't send the deletion code — try again in a moment.",
      });
      return;
    }

    res.json({
      success: true,
      data: { ...(devCode ? { devCode } : {}) },
      message: `A deletion code was sent to ${user.email}.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/delete-account — step 2 of 2: with the emailed code, remove
 * everything the account owns in one sweep — its posts (and their
 * applications), applications it sent elsewhere, the newsletter entry, and
 * finally the user document itself.
 */
export const deleteAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Sign in required." });
      return;
    }
    const { code } = req.body as DeleteAccountInput;
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      res.status(401).json({ success: false, error: "Sign in required." });
      return;
    }

    const check = await verifyOtp(user.email, "account-delete", code);
    if (!check.ok) {
      res.status(400).json({ success: false, error: otpErrorMessage(check.reason) });
      return;
    }

    const userId = String(user._id);

    // 1. Posts this account owns → applications hanging off them first.
    const mine = await RequirementModel.find({ postedBy: userId }).select("_id").lean();
    for (const doc of mine) {
      await removeApplicationsFor(String(doc._id));
    }
    await RequirementModel.deleteMany({ postedBy: userId }).exec();

    // 2. Applications this account sent to OTHER people's posts.
    await ApplicationModel.deleteMany({ userId }).exec();

    // 3. Newsletter entry for the address.
    await NewsletterModel.deleteOne({ email: user.email }).exec();

    // 4. The account itself — sessions die with the document, and any
    //    leftover codes for the address are destroyed with it.
    await consumeOtpsFor(user.email);
    await user.deleteOne();

    res.setHeader(
      "Set-Cookie",
      `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
    );
    res.json({
      success: true,
      message: "Your account and every post you owned have been deleted.",
    });
  } catch (error) {
    next(error);
  }
};
