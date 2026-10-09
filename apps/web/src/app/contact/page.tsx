import { ContactForm } from "@/components/contact/ContactForm";
import { Footer } from "@/components/layout/Footer";
import { Mail, MessageSquare, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Contact & Support • PulseStage",
  description:
    "Write to the PulseStage team — account help, listing issues, feedback. We reply by email.",
};

const channels = [
  {
    icon: Mail,
    title: "Email",
    body: "mailpulsestage@duck.com — every code (verification, reset, deletion) comes from this team.",
  },
  {
    icon: MessageSquare,
    title: "This form",
    body: "Lands straight in our support inbox — no account needed, reply within one working day.",
  },
  {
    icon: ShieldCheck,
    title: "Safety",
    body: "Report a bad listing or a suspicious account and we'll take a look immediately.",
  },
];

/** Public contact page — footer + profile both link here. */
export default function ContactPage() {
  return (
    <>
      <div className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-black">
        <div className="text-center space-y-3 mb-8">
          <span className="inline-block px-3 py-1 rounded border-2 border-black bg-[#00F0FF] text-[10px] font-mono font-black uppercase tracking-wider shadow-[2px_2px_0px_#000]">
            Support
          </span>
          <h1 className="text-3xl sm:text-4xl font-black leading-tight">Contact PulseStage</h1>
          <p className="text-sm font-bold text-neutral-600 max-w-xl mx-auto leading-relaxed">
            Stuck on a code, spotted something wrong, or have an idea? Write to us — a human reads
            every message.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {channels.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="p-4 rounded-3xl bg-[#FFF9E6] border-[3px] border-black shadow-[4px_4px_0px_#000] space-y-2"
            >
              <div className="w-9 h-9 rounded-xl bg-[#FFDE59] border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center">
                <Icon className="w-4.5 h-4.5 text-black" />
              </div>
              <h2 className="text-xs font-black uppercase tracking-wider">{title}</h2>
              <p className="text-[11px] font-bold text-neutral-600 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        <ContactForm />
      </div>
      <Footer />
    </>
  );
}
