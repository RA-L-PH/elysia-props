import { redirect } from "next/navigation";

/**
 * `/support` is an alias for `/contact` — the contact page IS the support
 * page (footer link: "Contact & Support"). Keep the short URL working.
 */
export default function SupportPage() {
  redirect("/contact");
}
