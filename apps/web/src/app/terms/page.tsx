import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Footer } from "@/components/layout/Footer";

export const metadata = {
  title: "Terms & Conditions • PulseStage",
  description: "The ground rules for posting, claiming, and managing requirements on PulseStage.",
};

const sections = [
  {
    title: "Who can post",
    body: [
      "Guests can post up to 2 requirements per day. A PulseStage account removes that cap and lets you edit, delete, and claim your posts from any device.",
      "You're responsible for what you post. Requirements must describe a real, lawful event engagement — no fraudulent listings, no impersonation, no discriminatory requirements.",
    ],
  },
  {
    title: "Your Post ID",
    body: [
      "Every post created on PulseStage generates a Post ID key. For guests, this key is the ONLY way to delete the post — it is shown once at creation and stored solely on your device.",
      "Keep it safe. Whoever holds the Post ID can delete the post. PulseStage stores only a hash of the key and cannot recover it for you.",
    ],
  },
  {
    title: "Ownership & claiming",
    body: [
      "The account that creates a post owns it. Only the owner can edit or delete their post — administrators cannot modify other people's posts.",
      "Guest posts are unclaimed until the creator (or someone holding the Post ID) signs in and claims them. Claiming transfers ownership and the contact block to your account details.",
    ],
  },
  {
    title: "Auto-expiry",
    body: [
      "Requirements automatically expire and are removed at 23:59 on the event's end date. Expired posts cannot be restored.",
    ],
  },
  {
    title: "Contact & conduct",
    body: [
      "The contact details on a post are used by other PulseStage users to reach out about that requirement. Don't publish contact info you're not allowed to share.",
      "PulseStage is a noticeboard — arrangements, payments, and performance of any engagement are between the parties involved.",
    ],
  },
];

export default function TermsPage() {
  return (
    <>
      <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-8 text-black">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border-2 border-black shadow-[2px_2px_0px_#000] font-black uppercase text-[10px] tracking-wider hover:bg-[#FFDE59] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000] transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to home
        </Link>

        <div className="bg-[#FFFDF8] border-[3.5px] border-black shadow-[8px_8px_0px_#000] rounded-3xl p-6 sm:p-8 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#FFDE59] border-[3px] border-black shadow-[3px_3px_0px_#000] flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-black" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Terms &amp; Conditions
          </h1>
          <p className="text-xs sm:text-sm font-bold text-neutral-700">
            Plain-language ground rules for posting, claiming, and managing
            requirements on PulseStage. Last updated October 2026.
          </p>
        </div>

        {sections.map((s) => (
          <section
            key={s.title}
            className="bg-white border-[3px] border-black shadow-[5px_5px_0px_#000] rounded-3xl p-6 space-y-3"
          >
            <h2 className="text-xl font-black">{s.title}</h2>
            {s.body.map((p) => (
              <p key={p.slice(0, 32)} className="text-sm font-bold text-neutral-700 leading-relaxed">
                {p}
              </p>
            ))}
          </section>
        ))}

        <section className="bg-[#00F0FF] border-[3px] border-black shadow-[5px_5px_0px_#000] rounded-3xl p-6 space-y-2">
          <h2 className="text-xl font-black">Questions?</h2>
          <p className="text-sm font-bold">
            Mail us at{" "}
            <a href="mailto:mailpulsestage@duck.com" className="font-black underline underline-offset-2">
              mailpulsestage@duck.com
            </a>
            .
          </p>
        </section>
      </div>
      <Footer />
    </>
  );
}
