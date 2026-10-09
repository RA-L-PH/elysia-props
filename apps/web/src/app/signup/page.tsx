import { AuthForm } from "@/components/auth/AuthForm";

export const metadata = {
  title: "Create account • PulseStage",
  description: "Create a PulseStage account with just an email and password.",
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <AuthForm mode="signup" next={next} />;
}
