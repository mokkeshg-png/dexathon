import { Link } from "react-router-dom";
import { ShieldCheck, Sparkles, BookOpen, GitBranch } from "lucide-react";
import { AI_DISCLAIMER } from "@/types";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[#ECE5D8] bg-[#FAF7EE]/90 text-ink-600">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Col 1: Brand & Ethics */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFC812] text-[#1A1D1F] font-serif font-black text-xl shadow-[0_4px_12px_rgba(255,200,18,0.35),inset_0_1px_1px_rgba(255,255,255,0.8)]">
                S
              </div>
              <div>
                <span className="font-serif text-lg font-bold tracking-tight text-ink block">
                  SYNAPTRA
                </span>
                <span className="text-[10px] uppercase tracking-widest text-[#FAB23D] font-bold block">
                  Academic Collaboration
                </span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-ink-500 max-w-md">
              A centralized university digital ecosystem designed to replace fragmented academic channels with structured, AI-assisted research team formation, compatibility analysis, and private collaborative project rooms.
            </p>
            <div className="rounded-2xl border border-[#FFE799] bg-[#FFF8D1]/70 p-4 text-xs text-[#7A5400] shadow-[0_4px_14px_rgba(255,200,18,0.12),inset_0_1px_1px_rgba(255,255,255,0.9)]">
              <div className="flex items-center gap-1.5 font-bold text-[#8C6000] mb-1">
                <Sparkles className="h-4 w-4 text-[#FFC812]" />
                <span>Academic AI Ethics Principle</span>
              </div>
              <p className="leading-relaxed">{AI_DISCLAIMER}</p>
            </div>
          </div>

          {/* Col 2: Platform Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink-900">
              Platform
            </h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link to="/projects" className="hover:text-[#FAB23D] transition-colors font-medium">
                  Explore Research Projects
                </Link>
              </li>
              <li>
                <Link to="/collaborators" className="hover:text-[#FAB23D] transition-colors font-medium">
                  Find Researchers & Mentors
                </Link>
              </li>
              <li>
                <Link to="/projects/new" className="hover:text-[#FAB23D] transition-colors font-medium">
                  Create Project Proposal
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-[#FAB23D] transition-colors font-medium">
                  Academic Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Academic Standards & Moderation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink-900">
              Governance & Integrity
            </h4>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span className="font-medium">Role-Based Access Control</span>
              </li>
              <li className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[#FAB23D]" />
                <span className="font-medium">Explainable AI Engine</span>
              </li>
              <li className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-ink-500" />
                <span className="font-medium">GitHub Evidence Audit</span>
              </li>
              <li className="pt-1">
                <Link to="/admin" className="text-[#8C6000] font-bold hover:underline text-xs">
                  Institutional Moderation Desk →
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-[#ECE5D8] pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-ink-400 gap-4">
          <p>© {new Date().getFullYear()} SYNAPTRA Academic Network. Built strictly adhering to PRD Master Specification.</p>
          <div className="flex items-center gap-4 font-medium">
            <span>Academic Version 2.0</span>
            <span>•</span>
            <span>All Data Local & Secure</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
