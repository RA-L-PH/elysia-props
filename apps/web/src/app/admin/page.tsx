import { AdminPanel } from "@/components/admin/AdminPanel";

export const metadata = {
  title: "Admin dashboard • PulseStage",
  description:
    "Platform stats, verified posters, the HTML newsletter and its recipients, and the support inbox.",
};

export default function AdminPage() {
  // AdminPanel brings its own container (max-w-6xl + gutters).
  return <AdminPanel />;
}
