import { MultiStepWizard } from "@/components/wizard/MultiStepWizard";

export const metadata = {
  title: "Post Production Requirement • PulseStage",
  description: "Create and publish customized requirements for Event Planners, Performers, or Stage Crew with Neubrutalist precision.",
};

export default async function PostRequirementPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  return (
    <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
      <MultiStepWizard editId={edit} />
    </div>
  );
}
