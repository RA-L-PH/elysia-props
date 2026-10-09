import Link from "next/link";
import { ArrowRight, Compass, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-16">
      <div className="text-center space-y-8">
        {/* Big number */}
        <div className="inline-block">
          <span className="text-7xl sm:text-9xl font-black text-black bg-[#FFDE59] px-6 sm:px-10 py-2 rounded-3xl border-[4px] border-black shadow-[8px_8px_0px_#000] -rotate-2 inline-block">
            404
          </span>
        </div>

        <div className="space-y-4">
          <h1 className="text-2xl sm:text-4xl font-black text-black leading-tight">
            This page isn&apos;t on the run-sheet.
          </h1>
          <p className="text-sm sm:text-base font-bold text-neutral-600 max-w-xl mx-auto leading-relaxed">
            The link might be old, or we moved something around. Either way, there&apos;s
            nothing here — but there&apos;s plenty one click away.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#FF5757] hover:bg-[#ff3b3b] text-white font-black text-sm uppercase tracking-wider border-[3px] border-black shadow-[5px_5px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none flex items-center justify-center gap-2 transition-all group"
          >
            <Compass className="w-5 h-5" />
            <span>Take me home</span>
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

        <p className="text-xs font-black uppercase tracking-wider text-neutral-500">
          Error 404 · Page not found
        </p>
      </div>
    </div>
  );
}
