import { AuthForm } from "@/components/auth/AuthForm";

export const metadata = {
  title: "Sign in • PulseStage",
  description: "Sign in to PulseStage to manage your job posts.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <AuthForm mode="signin" next={next} />;
}
