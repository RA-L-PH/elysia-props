import { redirect } from "next/navigation";

export const metadata = {
  title: "Profile • PulseStage",
  description:
    "Every requirement you've posted — edit, take down, or manage them from one place.",
};

/**
 * "My Posts" became the Profile page (identity + post management suite) —
 * old links and `?next=/myposts` sign-in redirects land here and hop over.
 */
export default function MyPostsPage() {
  redirect("/profile");
}
