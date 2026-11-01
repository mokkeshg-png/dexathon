import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field, Input } from "@/components/ui/Field";
import { fetchIndustryChallenges } from "@/services/saasService";
import type { IndustryChallenge } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  DollarSign,
  FileCheck,
  Search,
  Sparkles,
  Users,
  Award,
} from "lucide-react";

export function IndustryBridge() {
  const { user, profile } = useAuth();
  const toast = useToast();
  const [challenges, setChallenges] = useState<IndustryChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string>("ALL");

  // Application Modal State
  const [activeChallenge, setActiveChallenge] = useState<IndustryChallenge | null>(null);
  const [proposalBrief, setProposalBrief] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchIndustryChallenges();
        setChallenges(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const domains = ["ALL", "Computer Vision", "CleanTech", "FinTech & Cryptography", "Healthcare AI"];

  const filtered = challenges.filter((c) => {
    const matchesDomain = selectedDomain === "ALL" || c.domain === selectedDomain;
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.problemStatement.toLowerCase().includes(search.toLowerCase()) ||
      (c.partner?.name && c.partner.name.toLowerCase().includes(search.toLowerCase()));
    return matchesDomain && matchesSearch;
  });

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChallenge) return;
    if (!proposalBrief.trim()) {
      toast.error("Proposal Required", "Please outline your team's proposed architecture or approach.");
      return;
    }

    setSubmitting(true);
    try {
      // Simulate submission dispatch
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast.success(
        "Application Submitted",
        `Your research pitch for "${activeChallenge.title}" was dispatched to ${activeChallenge.partner?.name || "the enterprise"}.`
      );
      setActiveChallenge(null);
      setProposalBrief("");
    } catch (err: any) {
      toast.error("Submission failed", err?.message || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Hero Header */}
      <div className="clay-card p-6 sm:p-8 bg-gradient-to-br from-white via-[#FFFDF8] to-[#FFF9E6] border border-[#ECE5D8]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF4D0] border border-[#FFE785] text-[11px] font-bold uppercase tracking-wider text-[#8C6000]">
              <Sparkles className="h-3.5 w-3.5" /> Industry-to-Campus Innovation Bridge
            </div>
            <h1 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#181B1F] tracking-tight">
              Real-World Enterprise Challenges. Campus R&D Teams.
            </h1>
            <p className="text-xs sm:text-sm text-[#5E646A] leading-relaxed">
              Connect verified corporate problem statements directly to faculty-led student research labs. Earn industry bounties, sponsored grants, and academic credit under IP co-ownership agreements.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 min-w-[240px]">
            <div className="bg-[#FAF7EE] p-3 rounded-2xl border border-[#ECE5D8] text-center">
              <span className="text-[10px] uppercase font-mono text-[#7B828A]">Active Pool</span>
              <div className="text-xl font-bold font-serif text-[#181B1F] mt-0.5">₹12.5 Lakh</div>
            </div>
            <div className="bg-[#FAF7EE] p-3 rounded-2xl border border-[#ECE5D8] text-center">
              <span className="text-[10px] uppercase font-mono text-[#7B828A]">Partner Labs</span>
              <div className="text-xl font-bold font-serif text-[#181B1F] mt-0.5">14 Verified</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Search enterprise briefs, skills (e.g. PyTorch, Rust), or partners..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-[#7B828A]" />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {domains.map((dom) => (
            <button
              key={dom}
              onClick={() => setSelectedDomain(dom)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedDomain === dom
                  ? "bg-[#181B1F] text-white shadow-xs"
                  : "bg-white text-[#52575C] border border-[#ECE5D8] hover:bg-[#FAF7EE]"
              }`}
            >
              {dom}
            </button>
          ))}
        </div>
      </div>

      {/* Challenges Listing */}
      {loading ? (
        <div className="text-center py-16 text-xs text-[#7B828A]">Loading campus innovation challenges...</div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-16 bg-white border-[#ECE5D8] rounded-2xl">
          <Briefcase className="h-10 w-10 text-[#7B828A] mx-auto mb-2 opacity-50" />
          <h3 className="font-serif text-base font-bold text-[#181B1F]">No Innovation Challenges Found</h3>
          <p className="text-xs text-[#7B828A] mt-1 max-w-sm mx-auto">
            Try adjusting your search keywords or filter across all technological domains.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <Card
              key={item.id}
              className="clay-card p-6 bg-white border-[#ECE5D8] rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div className="space-y-4">
                {/* Partner Header */}
                <div className="flex items-center justify-between gap-3 border-b border-[#ECE5D8] pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#181B1F] to-[#2D3136] text-[#FFC812] flex items-center justify-center font-bold text-xs">
                      {item.partner?.name.slice(0, 1) || "E"}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#181B1F] flex items-center gap-1">
                        {item.partner?.name || "Enterprise Sponsor"}
                        {item.partner?.status === "active" && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        )}
                      </div>
                      <span className="text-[10px] text-[#7B828A]">{item.partner?.industryDomain || "Tech"}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-[#FFF4D0] text-[#8C6000] border border-[#FFE785]">
                    {item.domain}
                  </span>
                </div>

                <div>
                  <h3 className="font-serif text-base font-bold text-[#181B1F] leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#52575C] mt-2 line-clamp-3 leading-relaxed">
                    {item.problemStatement}
                  </p>
                </div>

                {/* Bounty and Timeline Highlights */}
                <div className="grid grid-cols-2 gap-2 bg-[#FAF7EE] p-3 rounded-xl border border-[#ECE5D8] text-xs">
                  <div>
                    <span className="text-[10px] text-[#7B828A] uppercase font-mono block">Grant / Bounty</span>
                    <div className="font-bold text-[#181B1F] text-sm mt-0.5 flex items-center gap-0.5">
                      <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                      {item.bountyOrGrant || "Sponsored"}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#7B828A] uppercase font-mono block">Deadline</span>
                    <div className="font-bold text-[#181B1F] text-xs mt-0.5 flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-[#8C6000]" />
                      {item.deadline ? new Date(item.deadline).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "Open Rolling"}
                    </div>
                  </div>
                </div>

                {/* Skills tags */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono text-[#7B828A] block">Required Competencies</span>
                  <div className="flex flex-wrap gap-1.5">
                    {item.requiredSkills.map((sk) => (
                      <span
                        key={sk}
                        className="px-2 py-0.5 rounded-md bg-[#F4EFE6] text-[#33373B] text-[10px] font-medium"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-5 pt-3 border-t border-[#ECE5D8] flex items-center justify-between">
                <div className="flex items-center gap-1 text-[11px] text-[#7B828A]">
                  <FileCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Institutional IP Model</span>
                </div>
                <Button
                  onClick={() => setActiveChallenge(item)}
                  size="sm"
                  variant="primary"
                  className="shadow-clay text-xs"
                >
                  <Users className="h-3.5 w-3.5 mr-1" /> Pitch Team
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Application Pitch Modal */}
      <Modal
        open={!!activeChallenge}
        onClose={() => setActiveChallenge(null)}
        title={activeChallenge ? `Pitch Team for: ${activeChallenge.title}` : "Challenge Pitch"}
      >
        {activeChallenge && (
          <form onSubmit={handleApply} className="space-y-4">
            <div className="rounded-xl bg-[#FFF9E6] p-3 text-xs text-[#8C6000] border border-[#FFE785] space-y-1">
              <span className="font-bold flex items-center gap-1">
                <Award className="h-4 w-4" /> Faculty & Lab Endorsement Note
              </span>
              <p className="text-[11px] text-[#6E4B00] leading-relaxed">
                Accepted teams collaborate under institutional IP agreements. Academic credits may be applied under institutional faculty co-supervision.
              </p>
            </div>

            <div className="bg-[#FAF7EE] p-3 rounded-xl border border-[#ECE5D8] text-xs space-y-1">
              <span className="font-bold text-[#181B1F]">Applicant Details:</span>
              <p className="text-[#52575C]">{profile?.fullName || user?.email || "Student Researcher"}</p>
              <p className="text-[11px] text-[#7B828A]">Campus Institution: {profile?.institution || "Campus Default Node"}</p>
            </div>

            <Field
              label="Solution Architecture & Research Pitch"
              hint="Describe your team's methodology, proposed tech stack, and milestone deliverables (minimum 50 characters)"
            >
              <textarea
                required
                rows={5}
                className="w-full rounded-xl border border-[#ECE5D8] bg-[#FAF7EE] p-3 text-xs text-[#181B1F] placeholder:text-[#7B828A] focus:border-[#FFC812] focus:outline-none"
                placeholder="Our lab proposes using a quantized hybrid transformer architecture with FP8 weights to tackle this latency bottleneck..."
                value={proposalBrief}
                onChange={(e) => setProposalBrief(e.target.value)}
              />
            </Field>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#ECE5D8]">
              <Button type="button" variant="outline" size="sm" onClick={() => setActiveChallenge(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={submitting}>
                {submitting ? "Submitting Pitch..." : "Dispatch Proposal →"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
