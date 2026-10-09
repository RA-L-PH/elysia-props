import { RequirementFeed } from "@/components/feed/RequirementFeed";

export const metadata = {
  title: "Live Requirements Feed • PulseStage",
  description: "Browse active requirements for Event Planners, Headline Performers, and Stage Crew.",
};

export default function RequirementsFeedPage() {
  return (
    <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <RequirementFeed />
    </div>
  );
}
