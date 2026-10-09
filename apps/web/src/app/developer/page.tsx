import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import {
  Code2,
  Cpu,
  Layers,
  ShieldCheck,
  Zap,
  Database,
  Lock,
  Terminal,
  ArrowRight,
  Server,
  Layout,
  Workflow,
  CheckCircle2,
  FileCode2,
  RefreshCw,
  GitBranch,
} from "lucide-react";

export const metadata = {
  title: "Developer Overview • PulseStage Architecture & Tech Stack",
  description:
    "An architectural breakdown of PulseStage: Next.js App Router, Express API, Zustand schema validation, zero-PII storage, and rate-limiting patterns.",
};

const techStack = [
  {
    name: "Next.js 15 (App Router)",
    role: "Frontend Framework",
    desc: "React 19 Server Components, layout persistence, zero-runtime CSS optimization, and custom API proxy routes.",
    color: "#00F0FF",
    icon: Layout,
  },
  {
    name: "Express.js & TypeScript",
    role: "Backend API",
    desc: "Modular REST architecture featuring custom CORS handling, Helmet security headers, and Express rate limiting.",
    color: "#FFDE59",
    icon: Server,
  },
  {
    name: "MongoDB & Mongoose",
    role: "Database & Models",
    desc: "Document storage with strict Mongoose schema enforcement, indexing on key lookup fields, and anonymized reference links.",
    color: "#7ED957",
    icon: Database,
  },
  {
    name: "Zustand & Zod",
    role: "State & Schema Validation",
    desc: "Type-safe client state management with live JSON schema inspection and multi-step wizard state synchronization.",
    color: "#FF56C4",
    icon: Cpu,
  },
];

const architectureHighlights = [
  {
    title: "Monorepo Workspace",
    desc: "Structured using npm workspaces (`@elysia/web`, `@elysia/api`, `@elysia/shared`) ensuring shared TypeScript types and zero duplication across boundaries.",
    icon: GitBranch,
  },
  {
    title: "Client-Driven Dev Inspector",
    desc: "Built-in live inspection tool allowing developers to audit local storage states, session storage, and form schemas in real-time.",
    icon: Terminal,
  },
  {
    title: "Decoupled Verification System",
    desc: "Role-based verification flow with admin dashboard controls, isolated audit logging, and payload sanitization.",
    icon: ShieldCheck,
  },
  {
    title: "Guest Key Cryptographic Hashing",
    desc: "Guest post management uses sha256 hashing. Post ID management keys are never stored raw in backend databases.",
    icon: Lock,
  },
];

const privacyGuarantees = [
  "No secret API keys or private database connection strings exposed to client bundles.",
  "Public API endpoints sanitize user profiles to exclude sensitive flags and hashes.",
  "Rate-limiting buckets stored in volatile memory to prevent persistent IP tracking.",
  "Guest management keys stored solely in client local storage until explicit user invocation.",
];

export default function DeveloperPage() {
  return (
    <>
      <div className="relative overflow-hidden pt-8 pb-16 sm:pt-12 sm:pb-24">
        {/* Top Header / Hero */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border-[2.5px] border-black shadow-[3px_3px_0px_#000] text-xs font-black uppercase tracking-wider">
            <Code2 className="w-4 h-4 text-[#FF5757]" />
            <span>Technical Documentation & Architecture</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-black tracking-tight max-w-4xl mx-auto leading-tight">
            Inside the <span className="bg-[#00F0FF] text-black px-3 py-1 rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_#000] inline-block -rotate-1">PulseStage</span> Tech Stack
          </h1>

          <p className="text-sm sm:text-base font-bold text-neutral-700 max-w-2xl mx-auto leading-relaxed">
            A high-level developer reference detailing system architecture, tech stack components, security practices, and state management patterns.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/requirements"
              className="px-6 py-3.5 rounded-2xl bg-[#FFDE59] hover:bg-[#ffd633] text-black font-black text-xs sm:text-sm uppercase tracking-wider border-[3px] border-black shadow-[4px_4px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none flex items-center gap-2 transition-all"
            >
              <span>Explore Live App</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/privacy"
              className="px-6 py-3.5 rounded-2xl bg-white hover:bg-neutral-100 text-black font-black text-xs sm:text-sm uppercase tracking-wider border-[3px] border-black shadow-[4px_4px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000] transition-all flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-[#FF5757]" />
              <span>Privacy Specs</span>
            </Link>
          </div>
        </section>

        {/* Tech Stack Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
          <div className="text-center space-y-2 mb-10">
            <h2 className="text-3xl font-black text-black">Core Technologies</h2>
            <p className="text-sm font-bold text-neutral-600">
              Modern tooling configured for performance, safety, and rapid iteration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {techStack.map((tech) => {
              const Icon = tech.icon;
              return (
                <div
                  key={tech.name}
                  className="p-6 rounded-3xl bg-white border-[3px] border-black shadow-[5px_5px_0px_#000] flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div
                      className="w-12 h-12 rounded-2xl border-[2.5px] border-black flex items-center justify-center shadow-[3px_3px_0px_#000]"
                      style={{ backgroundColor: tech.color }}
                    >
                      <Icon className="w-6 h-6 text-black" />
                    </div>
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-neutral-100 border border-black text-[10px] font-black uppercase tracking-wider">
                      {tech.role}
                    </span>
                    <h3 className="text-lg font-black text-black">{tech.name}</h3>
                    <p className="text-xs font-bold text-neutral-600 leading-relaxed">
                      {tech.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* System Architecture */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
          <div className="bg-[#FFFDF8] border-[3.5px] border-black shadow-[8px_8px_0px_#000] rounded-3xl p-6 sm:p-10 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-black/10 pb-6">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-[#FF5757]">
                  Design Patterns & Workflow
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-black mt-1">
                  Architecture Overview
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-[#00F0FF] border-2 border-black font-black text-xs shadow-[2px_2px_0px_#000]">
                  Monorepo setup
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-[#FFDE59] border-2 border-black font-black text-xs shadow-[2px_2px_0px_#000]">
                  RESTful API
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {architectureHighlights.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="p-5 rounded-2xl bg-white border-[2.5px] border-black shadow-[4px_4px_0px_#000] flex gap-4 items-start"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#FFF9E6] border-2 border-black flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-black" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-black text-black">{item.title}</h3>
                      <p className="text-xs font-bold text-neutral-600 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Data & Security Guarantees */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
          <div className="bg-[#FFDE59] border-[3.5px] border-black shadow-[8px_8px_0px_#000] rounded-3xl p-6 sm:p-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white border-[2.5px] border-black flex items-center justify-center shadow-[3px_3px_0px_#000]">
                <ShieldCheck className="w-6 h-6 text-black" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-black">
                  Security & Data Privacy Standard
                </h2>
                <p className="text-xs font-bold text-black/80">
                  Architectural safeguards engineered to keep user data isolated and protected.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {privacyGuarantees.map((guarantee, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-white border-2 border-black shadow-[3px_3px_0px_#000] flex items-start gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-[#7ED957] shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-black leading-relaxed">
                    {guarantee}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
