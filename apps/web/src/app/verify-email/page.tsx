import { VerifyEmailForm } from "@/components/auth/VerifyEmailForm";

export const metadata = {
  title: "Verify your email • PulseStage",
  description: "Enter the 6-digit code we mailed you to activate your PulseStage account.",
};

/**
 * Static route reading the target address from the query
 * (`/verify-email?email=…&next=…`). Next 15 resolves `searchParams` as a
 * promise on the server; the OTP form itself is a client component.
 */
export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; next?: string }>;
}) {
  const { email, next } = await searchParams;
  return <VerifyEmailForm email={(email || "").toLowerCase()} next={next} />;
}
