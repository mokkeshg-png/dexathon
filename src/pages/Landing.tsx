import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  BrainCircuit,
  Layers,
  GraduationCap,
} from "lucide-react";

export function Landing() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col">
      {/* Hero Section with College Campus Background */}
      <section className="relative overflow-hidden py-20 lg:py-28 border-b border-[#ECE5D8] bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/college-bg.png')" }}>
        {/* Subtle translucent overlay to ensure all text and UI elements remain perfectly clear and readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FAF7EE]/95 via-[#FAF7EE]/90 to-[#F6F2EA]/95 backdrop-blur-[2px]" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-[#FFE785] bg-[#FFF4D0] px-3.5 py-1.5 text-xs font-bold text-[#8C6000] mb-6 shadow-2xs">
              <Sparkles className="h-4 w-4 text-[#8C6000]" />
              <span>AI-Powered Academic Collaboration Platform • PRD v2.0</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#181B1F] leading-tight">
              From scattered messages to <span className="bg-gradient-to-r from-[#FFC812] to-[#FAB23D] bg-clip-text text-transparent">structured research collaboration</span>.
            </h1>

            <p className="mt-6 text-base sm:text-lg leading-relaxed text-[#52575C] font-normal">
              A centralized digital university platform where students, researchers, and faculty discover projects, match via explainable AI compatibility, form balanced teams, and collaborate inside private research project rooms.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
              {user ? (
                <Link to="/dashboard">
                  <Button size="lg" variant="primary" className="shadow-clay">
                    Open Your Dashboard <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/register">
                    <Button size="lg" variant="primary" className="shadow-clay">
                      Get Started as Student or Faculty
                    </Button>
                  </Link>
                  <Link to="/projects">
                    <Button variant="outline" size="lg" className="shadow-xs">
                      Explore Open Projects
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Live Campus Metrics Banner */}
      <section className="py-8 border-y border-[#ECE5D8]" style={{ background: "linear-gradient(135deg, #FFFFFF 0%, #FFFDF8 50%, #FFF8E8 100%)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 text-center">
            {[
              { num: "4", label: "Top Institutions" },
              { num: "8+", label: "Active Research Projects" },
              { num: "94%", label: "AI Match Accuracy" },
              { num: "100%", label: "Explainable AI Scoring" },
            ].map(({ num, label }) => (
              <div
                key={label}
                className="clay-stat p-4 sm:p-6"
              >
                <p className="font-serif text-3xl sm:text-4xl font-extrabold text-[#181B1F]">{num}</p>
                <p className="text-xs font-bold text-[#8C6000] mt-1.5 uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem vs Solution */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#8C6000]">The Academic Challenge</span>
            <h3 className="mt-2 font-serif text-3xl font-extrabold text-[#181B1F] sm:text-4xl">
              Why Traditional Collaboration Fails
            </h3>
            <p className="mt-3 text-sm text-[#5E646A]">
              Students and professors spend weeks attempting to recruit compatible collaborators through unorganized chat channels and social platforms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* The Old Way */}
            <div className="rounded-3xl border border-red-200 bg-red-50/50 p-6 md:p-8 shadow-xs">
              <div className="flex items-center gap-2.5 text-red-900 font-bold mb-4">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-red-200 text-red-800 text-xs font-bold">✕</span>
                <h4 className="text-base">The Informal Way (WhatsApp / Telegram / Cold Email)</h4>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-red-900/80">
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span><strong>Zero skill verification:</strong> Unchecked self-declarations lead to mismatched technical roles.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span><strong>Unbalanced teams:</strong> Too many duplicate skills with critical areas (frontend, ML, writing) completely missing.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span><strong>Review burnout:</strong> Project owners spend countless hours sifting through unformatted messages.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span><strong>Fragmented progress:</strong> Notes scattered across docs, code lost in repos, no centralized project log.</span>
                </li>
              </ul>
            </div>

            {/* The Synaptra Way */}
            <div className="rounded-3xl border border-[#FFE785] bg-gradient-to-br from-[#FFFBEA] to-white p-6 md:p-8 shadow-card">
              <div className="flex items-center gap-2.5 text-[#8C6000] font-bold mb-4">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#FFF4D0] text-[#8C6000] text-xs font-bold border border-[#FFE785]">✓</span>
                <h4 className="text-base text-[#181B1F]">The SYNAPTRA Ecosystem</h4>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-[#33383F]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#8C6000] shrink-0 mt-0.5" />
                  <span><strong>Explainable AI Matching:</strong> Mathematical compatibility breakdown with strengths, gaps, and evidence.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#8C6000] shrink-0 mt-0.5" />
                  <span><strong>Intelligent Team Formation:</strong> Algorithms identify team skill-gaps and recommend complementary teammates.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#8C6000] shrink-0 mt-0.5" />
                  <span><strong>Private Research Rooms:</strong> Collaborative workspace with Kanban tasks, literature notes, and datasets.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#8C6000] shrink-0 mt-0.5" />
                  <span><strong>Faculty Mentorship:</strong> Structured mentorship requests and milestone tracking for university professors.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Core Platform Pillars */}
      <section className="py-16 lg:py-24 bg-white/60 border-t border-[#ECE5D8]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#8C6000]">Built for Academic Rigor</span>
            <h3 className="mt-2 font-serif text-3xl font-extrabold text-[#181B1F] sm:text-4xl">
              End-to-End Collaboration Architecture
            </h3>
            <p className="mt-3 text-sm text-[#5E646A]">
              Designed according to academic workflow patterns: Discovery, Evaluation, Formation, and Execution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="clay-card p-7 hover:shadow-lift transition-all cursor-default">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl mb-5"
                style={{ background: "linear-gradient(145deg,#FFF8DC,#FFE680,#FFC812)", border: "1px solid #FFD040", color: "#7A4D00", boxShadow: "0 4px 14px rgba(255,200,18,0.28)" }}
              >
                <BrainCircuit className="h-6 w-6" />
              </div>
              <h4 className="font-serif text-xl font-bold text-[#181B1F]">AI Compatibility Engine</h4>
              <p className="mt-2.5 text-sm text-[#52575C] leading-relaxed">
                Calculates a multi-factor score across technical skills, research domain interests, required role fit, and past academic experience with transparent confidence levels.
              </p>
              <div className="mt-5 pt-4 border-t border-[#ECE5D8] flex items-center justify-between text-xs text-[#8C6000] font-bold">
                <span>Deterministic + AI Semantics</span>
                <span>Rule of Ethics ✓</span>
              </div>
            </div>

            <div className="clay-card p-7 hover:shadow-lift transition-all cursor-default">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl mb-5"
                style={{ background: "linear-gradient(145deg,#FFF8DC,#FFE680,#FFC812)", border: "1px solid #FFD040", color: "#7A4D00", boxShadow: "0 4px 14px rgba(255,200,18,0.28)" }}
              >
                <Layers className="h-6 w-6" />
              </div>
              <h4 className="font-serif text-xl font-bold text-[#181B1F]">Private Project Rooms</h4>
              <p className="mt-2.5 text-sm text-[#52575C] leading-relaxed">
                Once accepted, team members access an all-in-one workspace featuring Kanban boards, literature review notes, citation managers, experiment records, and file stores.
              </p>
              <div className="mt-5 pt-4 border-t border-[#ECE5D8] flex items-center justify-between text-xs text-[#8C6000] font-bold">
                <span>10 Specialized Workspaces</span>
                <span>Role Protected</span>
              </div>
            </div>

            <div className="clay-card p-7 hover:shadow-lift transition-all cursor-default">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl mb-5"
                style={{ background: "linear-gradient(145deg,#FFF8DC,#FFE680,#FFC812)", border: "1px solid #FFD040", color: "#7A4D00", boxShadow: "0 4px 14px rgba(255,200,18,0.28)" }}
              >
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h4 className="font-serif text-xl font-bold text-[#181B1F]">Institutional Integrity</h4>
              <p className="mt-2.5 text-sm text-[#52575C] leading-relaxed">
                Clear separation between student and faculty workflows, role-based project access control, GitHub audit trail integration, and an administrative moderation desk.
              </p>
              <div className="mt-5 pt-4 border-t border-[#ECE5D8] flex items-center justify-between text-xs text-[#8C6000] font-bold">
                <span>Student & Faculty Roles</span>
                <span>Full Audit Trail</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action (Warm Cream Clay Banner) */}
      <section className="py-16 bg-gradient-to-br from-[#FFFBEA] via-[#FFF8DE] to-[#FDF4CC] border-t border-[#FFE785] text-center shadow-card">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white border border-[#FFE785] flex items-center justify-center text-[#8C6000] shadow-sm mb-4">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#181B1F]">
            Ready to form your next research breakthrough?
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[#52575C] max-w-2xl mx-auto">
            Join students and faculty across engineering and science departments. Discover projects matching your skills and start collaborating today.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/register">
              <Button size="lg" variant="primary" className="shadow-clay">
                Register Your Account
              </Button>
            </Link>
            <Link to="/projects">
              <Button variant="outline" size="lg" className="shadow-xs bg-white">
                Browse Research Directory
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
