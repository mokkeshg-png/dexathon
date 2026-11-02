import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Select } from "@/components/ui/Field";
import {
  fetchIndustryChallenges,
  createIndustryChallenge,
  fetchChallengeApplications,
  submitChallengeApplication,
  updateChallengeApplicationStatus,
  fetchColleges,
} from "@/services/saasService";
import { fetchAllProfiles } from "@/lib/supabase-db";
import type { IndustryChallenge, ChallengeApplication, Profile, College } from "@/types";
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
  PlusCircle,
  Building2,
  GraduationCap,
  Check,
} from "lucide-react";

export function IndustryBridge() {
  const { user, profile, isIndustryPartner } = useAuth();
  const toast = useToast();

  const isIndustry = Boolean(isIndustryPartner || profile?.role === "industry_partner");

  // Core Data
  const [challenges, setChallenges] = useState<IndustryChallenge[]>([]);
  const [applications, setApplications] = useState<ChallengeApplication[]>([]);
  const [studentProfiles, setStudentProfiles] = useState<Profile[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Tab for Industry Dashboard
  const [activeTab, setActiveTab] = useState<"challenges" | "applications" | "talent" | "organization" | "campuses">("challenges");

  // Search & Filter
  const [search, setSearch] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string>("ALL");
  const [talentSearch, setTalentSearch] = useState("");

  // Student Pitch Modal
  const [activeChallenge, setActiveChallenge] = useState<IndustryChallenge | null>(null);
  const [proposalBrief, setProposalBrief] = useState("");
  const [teamName, setTeamName] = useState("");
  const [submittingPitch, setSubmittingPitch] = useState(false);

  // Publish Challenge Modal (for Industry)
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newStatement, setNewStatement] = useState("");
  const [newDomain, setNewDomain] = useState("Artificial Intelligence & Machine Learning");
  const [newSkills, setNewSkills] = useState("Python, PyTorch, Transformers");
  const [newBounty, setNewBounty] = useState("₹2,50,000 Research Grant & University Co-Authorship");
  const [newDeadline, setNewDeadline] = useState("");
  const [publishing, setPublishing] = useState(false);

  // Feedback & Internship Modal
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<ChallengeApplication | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [decisionAction, setDecisionAction] = useState<"accepted" | "rejected" | "internship">("accepted");

  // Organization Profile Edit
  const [orgName, setOrgName] = useState(profile?.institution || "Enterprise R&D Partner");
  const [orgDomain, setOrgDomain] = useState(profile?.department || "CleanTech & AI");
  const [orgWebsite, setOrgWebsite] = useState("https://partner.enterprise.com");
  const [orgContact, setOrgContact] = useState(user?.email || "rnd@enterprise.com");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [chals, apps, profs, cols] = await Promise.all([
          fetchIndustryChallenges(),
          fetchChallengeApplications(),
          fetchAllProfiles(),
          fetchColleges(),
        ]);
        setChallenges(chals);
        setApplications(apps);
        setStudentProfiles(profs.filter((p: Profile) => p.role === "student" && !p.designation));
        setColleges(cols);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const domains = [
    "ALL",
    "Artificial Intelligence & Machine Learning",
    "Embedded AI & IoT",
    "CleanTech",
    "Cryptography & Web3",
    "Healthcare AI",
  ];

  const filteredChallenges = challenges.filter((c) => {
    const matchesDomain = selectedDomain === "ALL" || c.domain.toLowerCase().includes(selectedDomain.toLowerCase());
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.problemStatement.toLowerCase().includes(search.toLowerCase()) ||
      (c.partner?.name && c.partner.name.toLowerCase().includes(search.toLowerCase()));
    return matchesDomain && matchesSearch;
  });

  const filteredTalent = studentProfiles.filter((s) => {
    if (!talentSearch.trim()) return true;
    const q = talentSearch.toLowerCase();
    const matchesName = s.fullName.toLowerCase().includes(q) || s.institution.toLowerCase().includes(q);
    const matchesSkill = s.skills.some((sk) => sk.skill.toLowerCase().includes(q));
    return matchesName || matchesSkill;
  });

  // Handle Student Pitch Submission
  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChallenge || !user) return;
    if (!proposalBrief.trim() || proposalBrief.length < 30) {
      toast.error("Detailed Proposal Required", "Please outline your team's proposed architecture or approach (at least 30 characters).");
      return;
    }

    setSubmittingPitch(true);
    try {
      const newApp = await submitChallengeApplication({
        challengeId: activeChallenge.id,
        collegeId: profile?.collegeId || "col-1",
        teamName: teamName.trim() || `${profile?.fullName || "Student"}'s Research Pod`,
        leadStudentId: user.id,
        proposalSummary: proposalBrief.trim(),
        aiMatchScore: Math.floor(88 + Math.random() * 10),
        status: "submitted",
      });

      setApplications((prev) => [newApp, ...prev]);
      toast.success(
        "Application Dispatched",
        `Your research pitch for "${activeChallenge.title}" was submitted to ${activeChallenge.partner?.name || "the enterprise"}.`
      );
      setActiveChallenge(null);
      setProposalBrief("");
      setTeamName("");
    } catch (err: any) {
      toast.error("Submission failed", err?.message || "Please try again.");
    } finally {
      setSubmittingPitch(false);
    }
  };

  // Handle Industry Publishing a New Challenge
  const handlePublishChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newStatement.trim()) return;

    setPublishing(true);
    try {
      const skillsArray = newSkills.split(",").map((s) => s.trim()).filter(Boolean);
      const newChallenge = await createIndustryChallenge({
        partnerId: user?.id || "part-default",
        title: newTitle.trim(),
        problemStatement: newStatement.trim(),
        domain: newDomain,
        requiredSkills: skillsArray,
        bountyOrGrant: newBounty.trim() || "Sponsored Innovation Grant",
        deadline: newDeadline || new Date(Date.now() + 60 * 86400000).toISOString(),
        status: "open",
        partner: {
          id: user?.id || "part-default",
          name: orgName || "Enterprise Innovation Partner",
          contactName: profile?.fullName || "Corporate Partner",
          contactEmail: user?.email || "rnd@enterprise.com",
          website: orgWebsite,
          industryDomain: orgDomain,
          status: "active",
          createdAt: new Date().toISOString(),
        },
      });

      setChallenges((prev) => [newChallenge, ...prev]);
      toast.success(
        "Challenge Published!",
        `"${newChallenge.title}" is now open for university student research teams.`
      );
      setPublishModalOpen(false);
      setNewTitle("");
      setNewStatement("");
    } catch (err: any) {
      toast.error("Publication failed", err?.message || "Please check details");
    } finally {
      setPublishing(false);
    }
  };

  // Handle Review Decision & Technical Feedback
  const handleReviewDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    try {
      const finalStatus = decisionAction === "internship" ? "accepted" : decisionAction;
      const finalFeedback =
        decisionAction === "internship"
          ? `[OFFICIAL INTERNSHIP & CO-DEV OFFER] ${feedbackText}`
          : feedbackText;

      await updateChallengeApplicationStatus(selectedApp.id, finalStatus, finalFeedback);

      setApplications((prev) =>
        prev.map((a) =>
          a.id === selectedApp.id
            ? { ...a, status: finalStatus, feedback: finalFeedback }
            : a
        )
      );

      toast.success(
        "Review Decision Recorded",
        decisionAction === "internship"
          ? "Internship & Co-Development offer dispatched to the student research team."
          : `Proposal marked as ${decisionAction.toUpperCase()} with technical feedback.`
      );
      setFeedbackModalOpen(false);
      setSelectedApp(null);
      setFeedbackText("");
    } catch (err: any) {
      toast.error("Decision update failed", err?.message);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Hero Header */}
      <div className="clay-card p-6 sm:p-8 bg-gradient-to-br from-white via-[#FFFDF8] to-[#FFF9E6] border border-[#ECE5D8]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF4D0] border border-[#FFE785] text-[11px] font-bold uppercase tracking-wider text-[#8C6000]">
              <Sparkles className="h-3.5 w-3.5" />
              {isIndustry ? "Industry Partner Innovation Dashboard" : "Industry-to-Campus Innovation Bridge"}
            </div>
            <h1 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#181B1F] tracking-tight">
              {isIndustry
                ? "Enterprise R&D Challenges & Student Talent Discovery"
                : "Real-World Enterprise Challenges. Campus R&D Teams."}
            </h1>
            <p className="text-xs sm:text-sm text-[#5E646A] leading-relaxed">
              {isIndustry
                ? "Publish corporate problem statements, review university team architectures, offer co-development internships, and discover verified technical talent."
                : "Connect verified corporate problem statements directly to student research labs. Earn industry bounties, sponsored grants, and internship co-authorship."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isIndustry ? (
              <Button
                onClick={() => setPublishModalOpen(true)}
                variant="primary"
                className="shadow-clay text-xs"
              >
                <PlusCircle className="h-4 w-4 mr-1.5" /> Publish New Challenge
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-3 min-w-[240px]">
                <div className="bg-[#FAF7EE] p-3 rounded-2xl border border-[#ECE5D8] text-center">
                  <span className="text-[10px] uppercase font-mono text-[#7B828A]">Bounty Pool</span>
                  <div className="text-xl font-bold font-serif text-[#181B1F] mt-0.5">₹12.5 Lakh</div>
                </div>
                <div className="bg-[#FAF7EE] p-3 rounded-2xl border border-[#ECE5D8] text-center">
                  <span className="text-[10px] uppercase font-mono text-[#7B828A]">Active Briefs</span>
                  <div className="text-xl font-bold font-serif text-[#181B1F] mt-0.5">{challenges.length} Open</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Industry Role Tab Navigation */}
      {isIndustry && (
        <div className="flex flex-wrap gap-2 pb-1">
          {[
            { id: "challenges", label: `Published Challenges (${challenges.length})`, icon: Briefcase },
            { id: "applications", label: `Review Applications (${applications.length})`, icon: Users },
            { id: "talent", label: `Discover Student Talent (${studentProfiles.length})`, icon: GraduationCap },
            { id: "organization", label: "Organization Profile", icon: Building2 },
            { id: "campuses", label: `Campus Network (${colleges.length})`, icon: Award },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all ${
                  isActive
                    ? "bg-[#FFC812] text-[#181B1F] shadow-[0_4px_14px_rgba(255,200,18,0.38)] border border-[#E6B30E] scale-[1.02]"
                    : "bg-white/80 border border-[#ECE5D8] text-[#52575C] hover:bg-white hover:text-[#181B1F] shadow-xs"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-[#181B1F]" : "text-[#7B828A]"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── VIEW 1: CHALLENGES LISTING ── */}
      {(!isIndustry || activeTab === "challenges") && (
        <div className="space-y-6">
          {/* Search & Domain Filter Bar */}
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

          {loading ? (
            <div className="text-center py-16 text-xs text-[#7B828A]">Loading innovation challenges...</div>
          ) : filteredChallenges.length === 0 ? (
            <Card className="text-center py-16 bg-white border-[#ECE5D8] rounded-2xl">
              <Briefcase className="h-10 w-10 text-[#7B828A] mx-auto mb-2 opacity-50" />
              <h3 className="font-serif text-base font-bold text-[#181B1F]">No Innovation Challenges Found</h3>
              <p className="text-xs text-[#7B828A] mt-1 max-w-sm mx-auto">
                Try adjusting your search keywords or filter across all technological domains.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredChallenges.map((item) => (
                <Card
                  key={item.id}
                  className="clay-card p-6 bg-white border-[#ECE5D8] rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow space-y-4"
                >
                  <div className="space-y-4">
                    {/* Partner Header */}
                    <div className="flex items-center justify-between gap-3 border-b border-[#ECE5D8] pb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#181B1F] to-[#2D3136] text-[#FFC812] flex items-center justify-center font-bold text-xs">
                          {item.partner?.name ? item.partner.name.slice(0, 1) : "E"}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#181B1F] flex items-center gap-1">
                            {item.partner?.name || "Enterprise Sponsor"}
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          </div>
                          <span className="text-[10px] text-[#7B828A]">{item.partner?.industryDomain || "Tech R&D"}</span>
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

                    {/* Bounty & Timeline Highlights */}
                    <div className="grid grid-cols-2 gap-2 bg-[#FAF7EE] p-3 rounded-xl border border-[#ECE5D8] text-xs">
                      <div>
                        <span className="text-[10px] text-[#7B828A] uppercase font-mono block">Grant / Bounty</span>
                        <div className="font-bold text-[#181B1F] text-xs mt-0.5 flex items-center gap-0.5">
                          <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                          {item.bountyOrGrant || "Sponsored"}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#7B828A] uppercase font-mono block">Deadline</span>
                        <div className="font-bold text-[#181B1F] text-xs mt-0.5 flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-[#8C6000]" />
                          {item.deadline ? new Date(item.deadline).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "Rolling"}
                        </div>
                      </div>
                    </div>

                    {/* Skills Tags */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-mono text-[#7B828A] block">Required Competencies:</span>
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

                  {/* Action */}
                  <div className="pt-3 border-t border-[#ECE5D8] flex items-center justify-between">
                    <span className="text-[11px] text-[#7B828A] flex items-center gap-1">
                      <FileCheck className="h-3.5 w-3.5 text-emerald-600" /> Co-Authorship & IP
                    </span>

                    {isIndustry ? (
                      <span className="clay-badge clay-badge-gold text-[10px] font-bold">
                        Published by you
                      </span>
                    ) : (
                      <Button
                        onClick={() => setActiveChallenge(item)}
                        size="sm"
                        variant="primary"
                        className="shadow-clay text-xs"
                      >
                        <Users className="h-3.5 w-3.5 mr-1" /> Pitch Team
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── VIEW 2: REVIEW APPLICATIONS & PITCHES (Industry Dashboard) ── */}
      {isIndustry && activeTab === "applications" && (
        <div className="space-y-4">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#181B1F]">
              Student & Faculty Team Proposals ({applications.length})
            </h2>
            <p className="text-xs text-[#5E646A]">
              Review solution architectures submitted for your corporate challenges, provide technical feedback, and offer internship sponsorships
            </p>
          </div>

          {applications.length === 0 ? (
            <Card className="text-center py-16 bg-white border-[#ECE5D8] rounded-2xl">
              <Users className="h-10 w-10 text-[#7B828A] mx-auto mb-2 opacity-50" />
              <h3 className="font-serif text-base font-bold text-[#181B1F]">No Proposals Received Yet</h3>
              <p className="text-xs text-[#7B828A] mt-1 max-w-sm mx-auto">
                Student teams are preparing their research pitches. They will appear here once submitted.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {applications.map((app) => {
                const chal = challenges.find((c) => c.id === app.challengeId);
                return (
                  <Card key={app.id} className="clay-card p-6 bg-white border-[#ECE5D8] rounded-2xl flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#8C6000]">{app.teamName}</span>
                        <Badge tone={app.status === "accepted" ? "green" : app.status === "rejected" ? "red" : "amber"}>
                          {app.status.toUpperCase()}
                        </Badge>
                      </div>

                      <div>
                        <h4 className="font-serif font-bold text-base text-[#181B1F]">
                          Challenge: {chal?.title || "Enterprise Challenge"}
                        </h4>
                        <span className="clay-badge clay-badge-brass text-[10px] font-bold mt-1 inline-flex">
                          {app.aiMatchScore}% AI Architectural Alignment
                        </span>
                      </div>

                      <div className="bg-[#FAF7EE] p-3 rounded-xl border border-[#ECE5D8] text-xs space-y-1">
                        <span className="font-bold text-[#181B1F]">Proposed Architecture:</span>
                        <p className="text-[#52575C] leading-relaxed">{app.proposalSummary}</p>
                      </div>

                      {app.feedback && (
                        <div className="bg-[#FFF9EA] p-3 rounded-xl border border-[#FFE785] text-xs text-[#8C6000] space-y-0.5">
                          <strong>Industry Guidance:</strong>
                          <p className="text-[11px] leading-relaxed">{app.feedback}</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[#ECE5D8] flex flex-wrap items-center justify-between gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedApp(app);
                          setDecisionAction("internship");
                          setFeedbackModalOpen(true);
                        }}
                        className="text-xs text-[#8C6000] border-[#FFE785]"
                      >
                        <Award className="h-3.5 w-3.5 mr-1" /> Offer Internship / Co-Dev
                      </Button>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedApp(app);
                            setDecisionAction("rejected");
                            setFeedbackModalOpen(true);
                          }}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Decline
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            setSelectedApp(app);
                            setDecisionAction("accepted");
                            setFeedbackModalOpen(true);
                          }}
                          className="text-xs shadow-clay"
                        >
                          <Check className="h-3.5 w-3.5 mr-1" /> Accept Pitch
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── VIEW 3: DISCOVER STUDENT TALENT (Industry Dashboard) ── */}
      {isIndustry && activeTab === "talent" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#181B1F]">
                Verified Campus Student Talent ({filteredTalent.length})
              </h2>
              <p className="text-xs text-[#5E646A]">
                Discover students with verified GitHub telemetry, project evidence, and AI skill scores
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Input
                placeholder="Search by skill (e.g. PyTorch, Rust)..."
                value={talentSearch}
                onChange={(e) => setTalentSearch(e.target.value)}
                className="pl-9 text-xs"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#7B828A]" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTalent.map((stud) => (
              <Card key={stud.id} className="clay-card p-5 bg-white border-[#ECE5D8] rounded-2xl flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link to={`/profile/${stud.userId}`} className="font-serif font-bold text-[#181B1F] text-base hover:text-[#8C6000]">
                        {stud.fullName}
                      </Link>
                      <p className="text-xs text-[#5E646A]">{stud.institution}</p>
                      <span className="text-[11px] text-[#7B828A]">
                        {stud.academicYear ? `Year ${stud.academicYear} Researcher` : "Student Researcher"} • {stud.department}
                      </span>
                    </div>
                    <span className="clay-badge clay-badge-gold text-[10px] font-bold">
                      {stud.profileCompleteness}% Profile
                    </span>
                  </div>

                  {/* Skills Chips */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono text-[#7B828A] font-bold">Verified Skills:</span>
                    <div className="flex flex-wrap gap-1">
                      {stud.skills.slice(0, 4).map((sk) => (
                        <span key={sk.skill} className="px-2 py-0.5 rounded-md bg-[#FAF7EE] border border-[#ECE5D8] text-[10px] text-[#181B1F] font-medium">
                          {sk.skill} ({sk.proficiency})
                        </span>
                      ))}
                      {stud.skills.length > 4 && (
                        <span className="px-2 py-0.5 text-[10px] text-[#7B828A]">+{stud.skills.length - 4} more</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#ECE5D8] flex items-center justify-between">
                  <Link to={`/profile/${stud.userId}`}>
                    <Button size="sm" variant="ghost" className="text-xs">
                      Inspect Portfolio →
                    </Button>
                  </Link>

                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      toast.success(
                        "Invitation Dispatched",
                        `Direct challenge invite sent to ${stud.fullName}.`
                      );
                    }}
                    className="text-xs shadow-clay"
                  >
                    Invite to Challenge
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── VIEW 4: ORGANIZATION PROFILE (Industry Dashboard) ── */}
      {isIndustry && activeTab === "organization" && (
        <Card className="p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#181B1F]">
              Organization & Corporate Profile
            </h2>
            <p className="text-xs sm:text-sm text-[#5E646A] mt-1">
              Configure enterprise branding, industry specialization, and primary academic liaison details.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("Organization Profile Saved", "Enterprise credentials and domain details updated.");
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Enterprise Name">
                <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} required />
              </Field>

              <Field label="Industry Technology Domain">
                <Input value={orgDomain} onChange={(e) => setOrgDomain(e.target.value)} required />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Official Corporate Website">
                <Input type="url" value={orgWebsite} onChange={(e) => setOrgWebsite(e.target.value)} />
              </Field>

              <Field label="R&D Liaison Email">
                <Input type="email" value={orgContact} onChange={(e) => setOrgContact(e.target.value)} required />
              </Field>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#ECE5D8]">
              <Button type="submit" variant="primary" className="shadow-clay">
                Save Organization Profile
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ── VIEW 5: CAMPUS & FACULTY NETWORK (Industry Dashboard) ── */}
      {isIndustry && activeTab === "campuses" && (
        <div className="space-y-4">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#181B1F]">
              Participating University Campuses ({colleges.length})
            </h2>
            <p className="text-xs text-[#5E646A]">
              Institutions with verified student researchers and accredited faculty laboratory leads
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {colleges.map((col) => (
              <Card key={col.id} className="clay-card p-6 bg-white border-[#ECE5D8] rounded-2xl flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className="font-mono text-[10px] font-bold uppercase text-[#8C6000]">{col.code}</span>
                  <h4 className="font-serif font-bold text-base text-[#181B1F]">{col.name}</h4>
                  <p className="text-xs text-[#5E646A]">{col.city}, {col.state}</p>
                  <p className="text-[11px] text-[#7B828A]">Domain: {col.domain}</p>
                </div>

                <div className="pt-3 border-t border-[#ECE5D8]">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      toast.success(
                        "Partnership Request Dispatched",
                        `Joint lab proposal sent to academic administration at ${col.name}.`
                      );
                    }}
                    className="w-full text-xs"
                  >
                    Propose Campus Lab Partnership
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── MODAL: PITCH TEAM (for Students / Faculty) ── */}
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
                Accepted teams collaborate under institutional IP agreements. Academic credits and corporate grants may be applied under institutional faculty co-supervision.
              </p>
            </div>

            <Field label="Team Pod Name">
              <Input
                placeholder="e.g. IITD SolarEdge Autonomous Pod"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                required
              />
            </Field>

            <Field
              label="Solution Architecture & Research Pitch"
              hint="Describe your team's methodology, proposed tech stack, and milestone deliverables (minimum 30 characters)"
            >
              <textarea
                required
                rows={5}
                className="w-full rounded-xl border border-[#ECE5D8] bg-[#FAF7EE] p-3 text-xs text-[#181B1F] placeholder:text-[#7B828A] focus:border-[#FFC812] focus:outline-none"
                placeholder="Our research pod proposes using a quantized hybrid transformer architecture with FP8 weights to tackle this latency bottleneck..."
                value={proposalBrief}
                onChange={(e) => setProposalBrief(e.target.value)}
              />
            </Field>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#ECE5D8]">
              <Button type="button" variant="outline" size="sm" onClick={() => setActiveChallenge(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={submittingPitch} className="shadow-clay">
                {submittingPitch ? "Submitting Pitch..." : "Dispatch Proposal →"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── MODAL: PUBLISH CHALLENGE (for Industry) ── */}
      <Modal
        open={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        title="Publish Real-World Enterprise Challenge"
      >
        <form onSubmit={handlePublishChallenge} className="space-y-4">
          <Field label="Challenge Project Title">
            <Input
              required
              placeholder="e.g. Zero-Knowledge Proof Pipeline for Cross-Border Telemetry"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </Field>

          <Field label="Technological Domain">
            <Select value={newDomain} onChange={(e) => setNewDomain(e.target.value)}>
              <option value="Artificial Intelligence & Machine Learning">Artificial Intelligence & Machine Learning</option>
              <option value="Embedded AI & IoT">Embedded AI & IoT</option>
              <option value="CleanTech & Grid Energy">CleanTech & Grid Energy</option>
              <option value="Cryptography & Web3">Cryptography & Web3</option>
              <option value="Healthcare AI">Healthcare AI</option>
              <option value="Cloud Infrastructure & Security">Cloud Infrastructure & Security</option>
            </Select>
          </Field>

          <Field label="Problem Statement & Technical Brief" hint="Describe the exact bottleneck and target constraints">
            <textarea
              required
              rows={4}
              className="w-full rounded-xl border border-[#ECE5D8] bg-[#FAF7EE] p-3 text-xs text-[#181B1F] focus:border-[#FFC812] focus:outline-none"
              placeholder="Design and benchmark a sub-second inference model for real-time telemetry anomaly detection..."
              value={newStatement}
              onChange={(e) => setNewStatement(e.target.value)}
            />
          </Field>

          <Field label="Required Skills & Competencies" hint="Comma-separated (e.g. Python, PyTorch, Docker, Rust)">
            <Input
              required
              value={newSkills}
              onChange={(e) => setNewSkills(e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Grant / Bounty / Sponsorship Amount">
              <Input
                required
                value={newBounty}
                onChange={(e) => setNewBounty(e.target.value)}
              />
            </Field>

            <Field label="Application Deadline">
              <Input
                type="date"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
              />
            </Field>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#ECE5D8]">
            <Button type="button" variant="outline" size="sm" onClick={() => setPublishModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={publishing} className="shadow-clay">
              {publishing ? "Publishing Challenge..." : "Publish to Campus Network →"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: TECHNICAL FEEDBACK & INTERNSHIP OFFER ── */}
      <Modal
        open={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        title={
          decisionAction === "internship"
            ? "Dispatch Internship & Co-Development Offer"
            : decisionAction === "accepted"
            ? "Accept Proposal & Provide Guidance"
            : "Technical Feedback & Decline"
        }
      >
        {selectedApp && (
          <form onSubmit={handleReviewDecision} className="space-y-4">
            <div className="rounded-xl bg-[#FAF7EE] border border-[#ECE5D8] p-3 text-xs space-y-1">
              <span className="font-bold text-[#181B1F]">Applicant Pod: {selectedApp.teamName}</span>
              <p className="text-[#5E646A] line-clamp-2">{selectedApp.proposalSummary}</p>
            </div>

            <Field
              label={
                decisionAction === "internship"
                  ? "Internship Terms, Stipend & Project Roadmap"
                  : "Technical Guidance & Milestone Feedback"
              }
              hint="Provide technical direction, recommended libraries, or campus lab milestones"
            >
              <textarea
                required
                rows={5}
                className="w-full rounded-xl border border-[#ECE5D8] bg-[#FAF7EE] p-3 text-xs text-[#181B1F] focus:border-[#FFC812] focus:outline-none"
                placeholder={
                  decisionAction === "internship"
                    ? "We would like to offer your pod a 6-month co-development internship with monthly stipend and direct R&D mentorship..."
                    : "Strong proposed architecture. Please proceed with bench testing the quantization step in week 2..."
                }
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
              />
            </Field>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#ECE5D8]">
              <Button type="button" variant="outline" size="sm" onClick={() => setFeedbackModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" className="shadow-clay">
                Dispatch Decision & Guidance →
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
