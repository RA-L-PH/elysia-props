import { ApplicantsView } from "@/components/applicants/ApplicantsView";

export const metadata = {
  title: "Applicants • PulseStage",
  description:
    "Everyone who applied to your post — contact details, pitch, and links to their most notable work.",
};

/**
 * The post owner's applicant list — a STATIC route (`/applicants?post=<id>`),
 * no dynamic segment. The postId in the query says which post; authorization
 * is the owner's session, checked by the API (401/403 for everyone else).
 *
 * Next 15 hands `searchParams` in as a promise — resolve it here and pass the
 * plain id down to the client component that talks to the API.
 */
export default async function ApplicantsPage({
  searchParams,
}: {
  searchParams: Promise<{ post?: string }>;
}) {
  const { post } = await searchParams;
  return (
    <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <ApplicantsView postId={post ?? ""} />
    </div>
  );
}
