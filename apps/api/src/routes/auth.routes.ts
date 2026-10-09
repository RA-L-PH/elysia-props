import { Router } from "express";
import {
  signup,
  login,
  logout,
  me,
  updateMe,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  requestDeletionCode,
  deleteAccount,
} from "../controllers/auth.controller.js";
import { validateBody } from "../middlewares/validate.js";
import { requireAuth } from "../middlewares/auth.js";
import { authRateLimiter } from "../middlewares/rateLimiter.js";
import {
  SignupSchema,
  LoginSchema,
  UpdateProfileSchema,
  VerifyEmailSchema,
  ResendVerificationSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  DeleteAccountSchema,
} from "@elysia/shared";

const router = Router();

// Extra-tight budget for auth endpoints: failed sign-ins/sign-ups are
// throttled hard (brute-force defence on top of the global failed limiter).
// Successful calls skip the budget, so honest OTP flows never burn it.
router.use(authRateLimiter);

router.post("/signup", validateBody(SignupSchema), signup);
router.post("/login", validateBody(LoginSchema), login);
router.post("/logout", logout);
router.get("/me", requireAuth, me);
// Profile edit — session-scoped: name + phone (email is identity, read-only).
router.put("/me", requireAuth, validateBody(UpdateProfileSchema), updateMe);

// Email workflows (6-digit OTPs via the Apps Script relay).
router.post("/verify", validateBody(VerifyEmailSchema), verifyEmail);
router.post("/resend", validateBody(ResendVerificationSchema), resendVerification);
router.post("/forgot-password", validateBody(ForgotPasswordSchema), forgotPassword);
router.post("/reset-password", validateBody(ResetPasswordSchema), resetPassword);

// Account deletion — 2-step: session mails the code, code authorises the sweep.
router.post("/delete-account/code", requireAuth, requestDeletionCode);
router.post("/delete-account", requireAuth, validateBody(DeleteAccountSchema), deleteAccount);

export default router;
