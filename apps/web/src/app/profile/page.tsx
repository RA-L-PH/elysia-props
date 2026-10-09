import { ProfileView } from "@/components/profile/ProfileView";

export const metadata = {
  title: "Profile • PulseStage",
  description:
    "Your account details and post management — applicant counts, pause intake, edits, and deletions in one place.",
};

/**
 * Account home: profile details on the left (sticky on wide screens), the
 * post management suite on the right. The layout — including the single
 * signed-out guest card — lives in the client ProfileView so the two child
 * components can't render duplicate "sign in" prompts again.
 */
export default function ProfilePage() {
  return (
    <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
      <ProfileView />
    </div>
  );
}
