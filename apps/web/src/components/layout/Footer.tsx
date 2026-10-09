import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, FileText, Mail, LifeBuoy } from "lucide-react";
import { NewsletterForm } from "./NewsletterForm";

const legal = [
  { href: "/terms", label: "Terms & Conditions", icon: ShieldCheck },
  { href: "/privacy", label: "Privacy Policy", icon: FileText },
  { href: "/contact", label: "Contact & Support", icon: LifeBuoy },
];

/**
 * Structured footer: brand column → legal column → newsletter column,
 * then a thin bottom bar. Nav lives in the (sticky) header, so no
 * Browse/Post/Sign-in duplicates here.
 */
export function Footer() {
  return (
    <footer className="w-full bg-[#FFFDF8] border-t-[3.5px] border-black shadow-[0_-4px_0px_rgba(0,0,0,1)] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-black">
        {/* ── Brand ── */}
        <div className="flex flex-col gap-3">
          <Link href="/" aria-label="PulseStage — home" className="flex items-center gap-2 group self-start">
            <span className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center group-hover:translate-x-[1px] group-hover:translate-y-[1px] transition-all">
              <Image
                src="/logo.png"
                alt=""
                width={545}
                height={458}
                className="w-full h-full object-contain"
              />
            </span>
            <Image
              src="/wordmark.png"
              alt="PulseStage"
              width={1189}
              height={210}
              className="h-5 w-auto"
            />
          </Link>
          <p className="text-xs font-bold text-neutral-600 leading-relaxed max-w-xs">
            Where event planners, performers, and crew find each other. Post what
            your event needs — an account is optional.
          </p>
          <a
            href="mailto:mailpulsestage@duck.com"
            className="self-start px-3 py-1.5 rounded-xl bg-[#FFDE59] border-2 border-black shadow-[2px_2px_0px_#000] font-black uppercase text-[10px] tracking-wider hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000] transition-all flex items-center gap-1.5"
          >
            <Mail className="w-3.5 h-3.5 shrink-0" />
            mailpulsestage@duck.com
          </a>
        </div>

        {/* ── Legal ── */}
        <div className="flex flex-col gap-3">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
            The fine print
          </h3>
          <nav className="flex flex-col items-start gap-2">
            {legal.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="px-3 py-1.5 rounded-xl bg-white border-2 border-black shadow-[2px_2px_0px_#000] font-black uppercase text-[10px] tracking-wider hover:bg-[#00F0FF] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000] transition-all flex items-center gap-1.5"
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* ── Newsletter ── */}
        <div className="flex flex-col gap-3">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
            Stay in the loop
          </h3>
          <div className="rounded-2xl bg-[#FFF9E6] border-2 border-black shadow-[3px_3px_0px_#000] p-3.5">
            <NewsletterForm />
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t-2 border-black/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-black uppercase tracking-wider text-neutral-500">
          <p>© 2026 PulseStage</p>
          <p>Post what your event needs — find the right people.</p>
        </div>
      </div>
    </footer>
  );
}
