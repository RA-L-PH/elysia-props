import { z } from "zod";

/**
 * Contact-form submissions landing in the `support` collection. Public —
 * guests may write in without an account — so everything is length-capped
 * and the write limiter bounds abuse at the edge.
 */
export const SupportMessageSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Your name is required")
    .max(120, "Name cannot exceed 120 characters"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address")
    .max(254, "Email cannot exceed 254 characters"),
  subject: z
    .string()
    .trim()
    .max(150, "Subject cannot exceed 150 characters")
    .optional(),
  message: z
    .string()
    .trim()
    .min(10, "Tell us a bit more (at least 10 characters)")
    .max(5000, "Message cannot exceed 5000 characters"),
});

export type SupportMessageInput = z.infer<typeof SupportMessageSchema>;

/**
 * Admin triage toggle (PUT /api/support/:id): a message is either waiting
 * ("new") or handled ("read").
 */
export const SupportStatusSchema = z.object({
  status: z.enum(["new", "read"], {
    errorMap: () => ({ message: "Status must be 'new' or 'read'." }),
  }),
});

export type SupportStatusInput = z.infer<typeof SupportStatusSchema>;
