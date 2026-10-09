import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { Footer } from "@/components/layout/Footer";

export const metadata = {
  title: "Privacy Policy • PulseStage",
  description:
    "What PulseStage stores, what stays on your device, and what never leaves it.",
};

const sections = [
  {
    title: "What we store",
    body: [
      "Your account: email, first/last name, phone (optional), password (hashed — never readable), and role. Posts you create are linked to your account by an opaque public id, not your email.",
      "Your posts: everything you type into the requirement wizard, plus the contact block so other users can reach you. A hash of your Post ID key — not the key itself.",
    ],
  },
  {
    title: "What stays on your device",
    body: [
      "Your Post ID keys for posts created as a guest (or signed in) are saved ONLY in this browser's local storage so you can delete or claim them later. They are never sent to our servers — we only ever receive the key when you yourself enter it to delete or claim a post.",
      "Your half-finished post draft, your cookie choice, and UI preferences also live in local storage. Clearing your browser data removes all of it.",
    ],
  },
  {
    title: "Cookies",
    body: [
      "One cookie matters: the session cookie that keeps you signed in. It's httpOnly (scripts can't read it), same-site, and expires with your session.",
      "No advertising trackers, no cross-site profiling, no third-party analytics cookies.",
    ],
  },
  {
    title: "What we never do",
    body: [
      "We don't sell or rent your data. We don't share your email or phone with other users — only the contact details you deliberately put on a post are shown, and only to people viewing that post.",
      "Deleting a post removes it and its data from our systems. Deleting your account removes your profile and your posts.",
    ],
  },
  {
    title: "Rate limits & logs",
    body: [
      "To stop abuse we briefly keep basic request metadata (IP address, request counts) in memory for rate limiting. It expires within minutes to hours and isn't linked to a profile.",
    ],
  },
];

export default function PrivacyPage() {
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
          <div className="w-14 h-14 rounded-2xl bg-[#00F0FF] border-[3px] border-black shadow-[3px_3px_0px_#000] flex items-center justify-center">
            <FileText className="w-7 h-7 text-black" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm font-bold text-neutral-700">
            What PulseStage stores, what stays on your device, and what never
            leaves it. Last updated October 2026.
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

        <section className="bg-[#FFDE59] border-[3px] border-black shadow-[5px_5px_0px_#000] rounded-3xl p-6 space-y-2">
          <h2 className="text-xl font-black">Want your data gone?</h2>
          <p className="text-sm font-bold">
            Email{" "}
            <a href="mailto:mailpulsestage@duck.com" className="font-black underline underline-offset-2">
              mailpulsestage@duck.com
            </a>{" "}
            and we&apos;ll delete your account and everything tied to it.
          </p>
        </section>
      </div>
      <Footer />
    </>
  );
}
