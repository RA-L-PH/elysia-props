import { z } from "zod";

/**
 * Auth contracts shared between the Express API and the Next.js frontend.
 * Email is normalised (trim + lowercase) at the schema level so the hashed
 * user id derived from it is always deterministic.
 */
const nameField = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(60, `${label} cannot exceed 60 characters`);

export const SignupSchema = z.object({
  firstName: nameField("First name"),
  lastName: nameField("Last name"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address")
    .max(254, "Email cannot exceed 254 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password cannot exceed 128 characters"),
  // Optional: digits and phone punctuation only, never required to sign up.
  phone: z
    .string()
    .trim()
    .max(30, "Phone number cannot exceed 30 characters")
    .regex(/^[0-9+()\-\s]*$/, "Phone number can only contain digits and + - ( ) characters")
    .optional(),
  // Newsletter opt-in from the signup checkbox. Absent = no consent.
  newsletter: z.boolean().optional(),
});

/** Footer "join the newsletter" box — just a name + email, no account needed. */
export const NewsletterSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(120, "Name cannot exceed 120 characters"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address")
    .max(254, "Email cannot exceed 254 characters"),
});

export const LoginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address")
    .max(254, "Email cannot exceed 254 characters"),
  password: z.string().min(1, "Password is required").max(128, "Password cannot exceed 128 characters"),
});

/** Body for the admin verify/unverify endpoint. */
export const VerifyUserSchema = z.object({
  verified: z.boolean(),
});

/**
 * Claim a guest post after signing in: the one-time Post ID travels with the
 * request and proves authorship, after which the post belongs to the account.
 */
export const ClaimSchema = z.object({
  postKey: z
    .string()
    .min(10, "Post ID is required")
    .max(120, "Post ID looks malformed"),
});

/**
 * Profile edit (PUT /auth/me): name + phone only. The email is the account's
 * sign-in identity and deliberately stays out of this contract.
 */
export const UpdateProfileSchema = z.object({
  firstName: nameField("First name"),
  lastName: nameField("Last name"),
  phone: z
    .string()
    .trim()
    .max(30, "Phone number cannot exceed 30 characters")
    .regex(/^[0-9+()\-\s]*$/, "Phone number can only contain digits and + - ( ) characters")
    .optional(),
});

/**
 * 6-digit numeric one-time code shared by every email workflow:
 * signup verification, password reset, and account deletion. The server
 * decides the purpose from the route — clients can't pick one.
 */
const otpCode = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Enter the 6-digit code from your email");

const otpEmail = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address")
  .max(254, "Email cannot exceed 254 characters");

/** POST /auth/verify — activate the account created at signup. */
export const VerifyEmailSchema = z.object({
  email: otpEmail,
  code: otpCode,
});

/** POST /auth/resend — mail a fresh signup code (rate-limited server-side). */
export const ResendVerificationSchema = z.object({
  email: otpEmail,
});

/** POST /auth/forgot-password — always answers 200 (no account enumeration). */
export const ForgotPasswordSchema = z.object({
  email: otpEmail,
});

/** POST /auth/reset-password — prove inbox control, then choose a new password. */
export const ResetPasswordSchema = z.object({
  email: otpEmail,
  code: otpCode,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password cannot exceed 128 characters"),
});

/** POST /auth/delete-account — final confirmation code (session required). */
export const DeleteAccountSchema = z.object({
  code: otpCode,
});

/**
 * Admin broadcast: subject line and raw HTML body sent to selected newsletter
 * subscribers, with {{firstName}} / {{name}} / {{email}} tokens personalised
 * per recipient in both.
 * `recipients` = checkbox selection from the roster; omitted → everyone.
 */
export const SendNewsletterSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(1, "Subject is required")
    .max(150, "Subject cannot exceed 150 characters"),
  html: z
    .string()
    .trim()
    .min(20, "The newsletter body looks too short")
    .max(200000, "Newsletter body cannot exceed 200 KB"),
  recipients: z
    .array(z.string().trim().toLowerCase().email("Invalid recipient email"))
    .min(1, "Select at least one recipient")
    .max(5000, "A single send cannot exceed 5000 recipients")
    .optional(),
});

export type SignupInput = z.infer<typeof SignupSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof ResendVerificationSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type DeleteAccountInput = z.infer<typeof DeleteAccountSchema>;
export type SendNewsletterInput = z.infer<typeof SendNewsletterSchema>;
export type NewsletterInput = z.infer<typeof NewsletterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ClaimInput = z.infer<typeof ClaimSchema>;
