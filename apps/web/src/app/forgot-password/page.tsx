import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata = {
  title: "Reset your password • PulseStage",
  description: "Email yourself a 6-digit code and choose a new PulseStage password.",
};

/** Static recovery route — everything happens inside the client form. */
export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
