import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import {
  Sparkles,
  Music,
  Wrench,
  ArrowRight,
  PenLine,
  Megaphone,
  Users,
  Quote,
  Eye,
  Search,
  History,
  Calendar,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative overflow-hidden pt-8 sm:pt-12">
      {/* ───────────────────────── Hero ───────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-7">

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-black max-w-4xl mx-auto leading-[1.05]">
          Tell us what your{" "}
          <span className="bg-[#FF5757] text-white px-3 py-1 rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_#000] inline-block -rotate-1">
            event needs
          </span>
          . The{" "}
          <span className="bg-[#00F0FF] text-black px-3 py-1 rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_#000] inline-block rotate-1">
            right people
          </span>{" "}
          show up.
        </h1>

        <p className="text-sm sm:text-base font-bold text-neutral-700 max-w-2xl mx-auto leading-relaxed">
          That&apos;s PulseStage in one sentence. Post the gap in your line-up — a DJ, a
          lighting tech, a day-of coordinator — and let planners, performers, and crew
          come to you. Takes about three minutes.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            href="/post"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#FF5757] hover:bg-[#ff3b3b] text-white font-black text-sm uppercase tracking-wider border-[3px] border-black shadow-[5px_5px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none flex items-center justify-center gap-2 transition-all group"
          >
            <span>Post what you need</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/requirements"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#00F0FF] hover:bg-[#00d8e6] text-black font-black text-sm uppercase tracking-wider border-[3px] border-black shadow-[5px_5px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none flex items-center justify-center gap-2 transition-all"
          >
            <Search className="w-5 h-5 text-black" />
            <span>Browse the feed</span>
          </Link>
        </div>

        {/* Honest little promises */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-black text-black">
          {["No account needed", "Free to browse", "Works on your phone"].map((promise) => (
            <span
              key={promise}
              className="px-3 py-1.5 rounded-xl bg-white border-[2px] border-black shadow-[2px_2px_0px_#000]"
            >
              {promise}
            </span>
          ))}
        </div>
      </section>

      {/* ───────────────────── Pain / relatability ───────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-3xl sm:text-4xl font-black text-black">Sound familiar?</h2>
          <p className="text-sm font-bold text-neutral-600">
            You&apos;re not disorganized. Your tools are.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white border-[3px] border-black shadow-[5px_5px_0px_#000] space-y-3">
            <div className="w-11 h-11 rounded-xl bg-[#FFDE59] border-[2.5px] border-black flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-black" />
            </div>
            <p className="text-sm font-bold text-neutral-800 leading-relaxed">
              The plan lives in five group chats and a spreadsheet that only you know
              how to read.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border-[3px] border-black shadow-[5px_5px_0px_#000] space-y-3">
            <div className="w-11 h-11 rounded-xl bg-[#FF66C4] border-[2.5px] border-black flex items-center justify-center">
              <Calendar className="w-5 h-5 text-black" />
            </div>
            <p className="text-sm font-bold text-neutral-800 leading-relaxed">
              Someone canceled two days out, and finding a replacement eats your whole
              weekend.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border-[3px] border-black shadow-[5px_5px_0px_#000] space-y-3">
            <div className="w-11 h-11 rounded-xl bg-[#00F0FF] border-[2.5px] border-black flex items-center justify-center">
              <Users className="w-5 h-5 text-black" />
            </div>
            <p className="text-sm font-bold text-neutral-800 leading-relaxed">
              Great people exist — you just have no idea where to find them this week.
            </p>
          </div>
        </div>
      </section>

      {/* ───────────────────── How it works ───────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-3xl sm:text-4xl font-black text-black">How it works</h2>
          <p className="text-sm font-bold text-neutral-600">
            Three steps. About three minutes. No account required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-[#FFFDF8] border-[3px] border-black shadow-[5px_5px_0px_#000] space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-xl bg-[#FFDE59] border-[2.5px] border-black flex items-center justify-center font-black text-lg">
                1
              </span>
              <PenLine className="w-5 h-5 text-neutral-500" />
            </div>
            <h3 className="text-xl font-black text-black">Say what you need</h3>
            <p className="text-sm font-bold text-neutral-700 leading-relaxed">
              A guided form walks you through it — the role, the dates, the budget, the
              venue. No blank text boxes to stare at.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#FFFDF8] border-[3px] border-black shadow-[5px_5px_0px_#000] space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-xl bg-[#00F0FF] border-[2.5px] border-black flex items-center justify-center font-black text-lg">
                2
              </span>
              <Megaphone className="w-5 h-5 text-neutral-500" />
            </div>
            <h3 className="text-xl font-black text-black">It hits the live feed</h3>
            <p className="text-sm font-bold text-neutral-700 leading-relaxed">
              Your post shows up where planners, performers, and crew already browse —
              filterable by category, urgency, and budget.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#FFFDF8] border-[3px] border-black shadow-[5px_5px_0px_#000] space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-xl bg-[#7ED957] border-[2.5px] border-black flex items-center justify-center font-black text-lg">
                3
              </span>
              <Users className="w-5 h-5 text-neutral-500" />
            </div>
            <h3 className="text-xl font-black text-black">Pick your fit</h3>
            <p className="text-sm font-bold text-neutral-700 leading-relaxed">
              Compare what comes in, check the details side by side, and take it from
              there. No bidding wars, no fee.
            </p>
          </div>
        </div>
      </section>

      {/* ───────────────────── Who it's for ───────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-3xl sm:text-4xl font-black text-black">
            Built for all three sides of the room
          </h2>
          <p className="text-sm font-bold text-neutral-600">
            Whoever you are, the other two are already here.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Planner */}
          <div className="p-6 rounded-3xl bg-[#FFDE59] border-[3.5px] border-black shadow-[6px_6px_0px_#000] space-y-4 hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
            <div className="w-14 h-14 rounded-2xl bg-white border-[3px] border-black shadow-[3px_3px_0px_#000] flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-black" />
            </div>
            <h3 className="text-2xl font-black text-black">Event Planners</h3>
            <p className="text-sm font-bold text-neutral-800 leading-relaxed">
              Weddings, festivals, conferences. Post the gaps in your run-sheet and get
              them filled — without another night of cold-calling.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {["Coordinators", "Vendors", "Last-minute fills"].map((chip) => (
                <span
                  key={chip}
                  className="px-2.5 py-1 rounded-lg bg-white border-2 border-black text-[11px] font-black"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>

          {/* Performer */}
          <div className="p-6 rounded-3xl bg-[#FF66C4] border-[3.5px] border-black shadow-[6px_6px_0px_#000] space-y-4 hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
            <div className="w-14 h-14 rounded-2xl bg-white border-[3px] border-black shadow-[3px_3px_0px_#000] flex items-center justify-center">
              <Music className="w-7 h-7 text-black" />
            </div>
            <h3 className="text-2xl font-black text-black">Talent &amp; Performers</h3>
            <p className="text-sm font-bold text-neutral-900 leading-relaxed">
              Musicians, DJs, hosts, speakers. Find gigs that fit your calendar and your
              rate — instead of chasing DMs and group invites.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {["Musicians", "DJs & hosts", "Speakers"].map((chip) => (
                <span
                  key={chip}
                  className="px-2.5 py-1 rounded-lg bg-white border-2 border-black text-[11px] font-black"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>

          {/* Crew */}
          <div className="p-6 rounded-3xl bg-[#00F0FF] border-[3.5px] border-black shadow-[6px_6px_0px_#000] space-y-4 hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
            <div className="w-14 h-14 rounded-2xl bg-white border-[3px] border-black shadow-[3px_3px_0px_#000] flex items-center justify-center">
              <Wrench className="w-7 h-7 text-black" />
            </div>
            <h3 className="text-2xl font-black text-black">Crew &amp; Technicians</h3>
            <p className="text-sm font-bold text-neutral-900 leading-relaxed">
              Sound, lighting, camera, stage. Clear call times and clear expectations
              before you commit to a shift.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {["Sound", "Lighting", "Camera"].map((chip) => (
                <span
                  key={chip}
                  className="px-2.5 py-1 rounded-lg bg-white border-2 border-black text-[11px] font-black"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────── Testimonials ───────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <figure className="p-6 rounded-3xl bg-white border-[3px] border-black shadow-[5px_5px_0px_#000] space-y-4 -rotate-1">
            <Quote className="w-7 h-7 text-[#FF5757]" />
            <blockquote className="text-sm font-bold text-neutral-800 leading-relaxed">
              &ldquo;I posted a lighting gig at 11 p.m. on a Tuesday. By breakfast I had
              three people who actually knew GrandMA3.&rdquo;
            </blockquote>
            <figcaption className="text-xs font-black uppercase tracking-wide text-neutral-500">
              Mara — festival producer
            </figcaption>
          </figure>

          <figure className="p-6 rounded-3xl bg-white border-[3px] border-black shadow-[5px_5px_0px_#000] space-y-4 rotate-1">
            <Quote className="w-7 h-7 text-[#00F0FF]" />
            <blockquote className="text-sm font-bold text-neutral-800 leading-relaxed">
              &ldquo;I stopped digging for gigs in Facebook groups. The feed just tells me
              what&apos;s open this weekend.&rdquo;
            </blockquote>
            <figcaption className="text-xs font-black uppercase tracking-wide text-neutral-500">
              Devon — guitarist
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ───────────────────── Small niceties ───────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
        <div className="p-8 sm:p-12 rounded-3xl bg-white border-[3.5px] border-black shadow-[8px_8px_0px_#000] space-y-8">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-3xl font-black text-black">
              The small things that save you
            </h2>
            <p className="text-sm font-bold text-neutral-600">
              The kind of details you only miss when they&apos;re gone.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-[#FFF9E6] border-[3px] border-black shadow-[4px_4px_0px_#000] space-y-2">
              <History className="w-6 h-6 text-black" />
              <h4 className="text-base font-black text-black">Your draft never vanishes</h4>
              <p className="text-xs font-bold text-neutral-700">
                Tab closed, signal lost, battery died — pick up right where you left off.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#E0F7FA] border-[3px] border-black shadow-[4px_4px_0px_#000] space-y-2">
              <Eye className="w-6 h-6 text-black" />
              <h4 className="text-base font-black text-black">See it before you send it</h4>
              <p className="text-xs font-bold text-neutral-700">
                A live preview shows your post exactly as everyone else will read it —
                while you write.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FFE4E6] border-[3px] border-black shadow-[4px_4px_0px_#000] space-y-2">
              <Search className="w-6 h-6 text-black" />
              <h4 className="text-base font-black text-black">Find the needle</h4>
              <p className="text-xs font-bold text-neutral-700">
                Search and filter by category, urgency, and budget. The feed narrows down
                as you type.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────── Final CTA ───────────────────── */}
      <section className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 p-16 sm:p-20">
        <div className="p-8 sm:p-12 rounded-3xl bg-[#FFDE59] border-[3.5px] border-black shadow-[8px_8px_0px_#000] text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black text-black max-w-2xl mx-auto leading-tight">
            Your next event is closer than you think.
          </h2>
          <div className="flex justify-center">
            <Link
              href="/post"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#FF5757] hover:bg-[#ff3b3b] text-white font-black text-sm uppercase tracking-wider border-[3px] border-black shadow-[5px_5px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none flex items-center justify-center gap-2 transition-all group"
            >
              <span>Post your first one — free</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <p className="text-xs font-black uppercase tracking-wider text-neutral-700">
            No account. No fees. About three minutes.
          </p>
        </div>
      </section>

      {/* Footer: landing, privacy, and terms only */}
      <Footer />
    </div>
  );
}
