
import { saveProfile } from "@/lib/supabase-db";
import { Modal } from "@/components/ui/Modal";
import { SkillSelector } from "@/components/ui/SkillSelector";
import { TagSelector } from "@/components/ui/TagSelector";
import { RESEARCH_DOMAINS } from "@/lib/taxonomies";
import { useToast } from "@/context/ToastContext";
import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  fetchProjects,
  fetchProjectMembersByProjects,
  fetchMembershipsByUser,
  fetchJoinRequests,
  fetchJoinRequestsByProjects,
  fetchMentorshipRequests,
  reviewMentorship,
  reviewApplication,
  withdrawApplication,
  fetchAllProfiles,
  getOrFetchProjectAnalyses,
} from "@/lib/supabase-db";
import { recommendCollaborators } from "@/lib/matching";
import { ProjectCard, PersonCard } from "@/components/projects/ProjectCard";
import { AiProjectExplanation } from "@/components/projects/AiProjectExplanation";
import { Button } from "@/components/ui/Button";
import { EmptyState, Progress } from "@/components/ui/Card";
import type { Project, ProjectMember, JoinRequest, MentorshipRequest, Profile, AiAnalysisRecord } from "@/types";
import { FacultyStudentDirectory } from "@/components/faculty/FacultyStudentDirectory";
import { AcademicProjectCreatorModal } from "@/components/faculty/AcademicProjectCreatorModal";
import { DetailedMonitoringModal } from "@/components/faculty/DetailedMonitoringModal";
import {
  Sparkles,
  Layers,
  FolderPlus,
  Users,
  GraduationCap,
  Building2,
  ArrowUpRight,
  Loader2,
  Inbox,
  MessageSquare,
  Compass,
  Wrench,
  Check,
  X,
  Activity,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

export function Dashboard() {
  const { user, profile, refresh } = useAuth();
  const toast = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [mentorshipRequests, setMentorshipRequests] = useState<MentorshipRequest[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // AI-powered Project Recommendations state
  const [aiProjectRecommendations, setAiProjectRecommendations] = useState<{ project: Project; analysis: AiAnalysisRecord }[]>([]);
  const [aiMatchingLoading, setAiMatchingLoading] = useState(false);

  const [addSkillOpen, setAddSkillOpen] = useState(false);
  const [addInterestOpen, setAddInterestOpen] = useState(false);

  // Faculty Workspace State (Req 2, 3, 6)
  const [facultyTab, setFacultyTab] = useState<"monitoring" | "students">("monitoring");
  const [academicCreatorOpen, setAcademicCreatorOpen] = useState(false);
  const [monitoringProject, setMonitoringProject] = useState<Project | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [projs, jrs, mrs, profiles, memberships] = await Promise.all([
          fetchProjects(),
          fetchJoinRequests(undefined, user!.id),
          fetchMentorshipRequests(undefined, user!.id),
          fetchAllProfiles(),
          fetchMembershipsByUser(user!.id),
        ]);
        if (cancelled) return;

        // Fetch members for all projects user is connected to (owned + member + applied)
        const ownedProjectIds = new Set(projs.filter((p) => p.ownerId === user!.id).map((p) => p.id));
        const memberProjectIds = new Set(memberships.filter((m) => m.status === "active").map((m) => m.projectId));
        const appliedProjectIds = new Set(jrs.filter((jr) => jr.status === "accepted").map((jr) => jr.projectId));
        const connectedProjectIds = new Set([...ownedProjectIds, ...memberProjectIds, ...appliedProjectIds]);
        const connectedIds = [...connectedProjectIds];

        // Single batch query — replaces N×fetchProjectMembers
        const membersMap = await fetchProjectMembersByProjects(connectedIds);
        const allMembers: ProjectMember[] = [];
        for (const members of membersMap.values()) allMembers.push(...members);

        // Fetch incoming join requests for owned projects in one batch query
        const allReceivedJrs = connectedIds.length > 0
          ? await fetchJoinRequestsByProjects([...ownedProjectIds]).then((rows) =>
              rows.filter((jr) => jr.applicantId !== user!.id)
            )
          : [];

        if (cancelled) return;
        setProjects(projs);
        setMembers(allMembers);
        setJoinRequests([...jrs, ...allReceivedJrs]);
        setMentorshipRequests(mrs);
        setAllProfiles(profiles);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user]);

  // Derived state
  const userMemberships = members.filter((m) => m.userId === user?.id && m.status === "active");
  const activeProjectIds = new Set([
    ...userMemberships.map((m) => m.projectId),
    ...projects.filter((p) => p.ownerId === user?.id).map((p) => p.id),
  ]);
  const activeProjects = projects.filter((p) => activeProjectIds.has(p.id));

  const isFaculty = Boolean(profile?.designation || profile?.role === "faculty");

  // Projects supervised (as faculty mentor or project owner) - PRD 1 Section 7.1
  const supervisedProjects = useMemo(() => {
    if (!user) return [];
    return projects.filter(
      (p) =>
        p.ownerId === user.id ||
        members.some((m) => m.projectId === p.id && m.userId === user.id && m.systemRole === "mentor")
    );
  }, [projects, members, user]);

  // Compute team health metrics for each supervised project
  const supervisedTeamMetrics = useMemo(() => {
    return supervisedProjects.map((p) => {
      const teamMems = members.filter((m) => m.projectId === p.id && m.status === "active");
      const memberUserIds = new Set(teamMems.map((m) => m.userId));
      const teamProfiles = allProfiles.filter((pr) => memberUserIds.has(pr.userId));

      const coveredSkills = new Set(
        teamProfiles.flatMap((pr) => pr.skills.map((s) => s.skill.toLowerCase()))
      );
      const missingSkills = (p.requiredSkills || []).filter(
        (req) => !coveredSkills.has(req.toLowerCase())
      );

      // Deterministic Progress %
      const progress = p.status === "completed" ? 100 : p.status === "open" ? 50 : 75;

      // Deterministic Health Score (0-100)
      let health = 50;
      const roleCapacityRatio = p.teamMax > 0 ? Math.min(1, teamMems.length / p.teamMax) : 0.5;
      health += Math.round(roleCapacityRatio * 20);

      const skillCoverageRatio =
        p.requiredSkills.length > 0
          ? (p.requiredSkills.length - missingSkills.length) / p.requiredSkills.length
          : 1;
      health += Math.round(skillCoverageRatio * 25);

      if (members.some((m) => m.projectId === p.id && m.systemRole === "mentor")) {
        health += 5;
      }
      health = Math.min(100, Math.max(20, health));

      // Alerts
      const alerts: string[] = [];
      if (missingSkills.length > 0) {
        alerts.push(`Uncovered required skills: ${missingSkills.slice(0, 2).join(", ")}`);
      }
      const pendingJrs = joinRequests.filter((jr) => jr.projectId === p.id && jr.status === "pending");
      if (pendingJrs.length > 0) {
        alerts.push(`${pendingJrs.length} applicant${pendingJrs.length > 1 ? "s" : ""} pending review`);
      }

      return {
        project: p,
        membersCount: teamMems.length,
        progress,
        health,
        missingSkills,
        alerts,
      };
    });
  }, [supervisedProjects, members, allProfiles, joinRequests]);

  // Load AI project recommendations using Supabase cache + Edge Function
  const activeProjectIdsKey = Array.from(activeProjectIds).sort().join(",");
  const candidateProjectsLength = projects.length;

  useEffect(() => {
    if (!user || !profile || loading) return;
    let cancelled = false;

    const candidateProjects = projects.filter(
      (p) => p.status === "open" && p.visibility !== "private" && !activeProjectIds.has(p.id)
    );

    if (candidateProjects.length === 0) {
      setAiProjectRecommendations([]);
      return;
    }

    async function loadAiRecs() {
      setAiMatchingLoading(true);
      try {
        const ranked = await getOrFetchProjectAnalyses(user!.id, candidateProjects, profile);
        if (!cancelled) {
          setAiProjectRecommendations(ranked);
        }
      } catch (err) {
        console.error("Failed to load AI project recommendations:", err);
      } finally {
        if (!cancelled) {
          setAiMatchingLoading(false);
        }
      }
    }

    loadAiRecs();

    return () => {
      cancelled = true;
    };
  }, [user?.id, profile, loading, candidateProjectsLength, activeProjectIdsKey]);

  // Collaborator recommendations
  const sharedIds = useMemo(() => {
    return new Set<string>(
      members.filter((m) => activeProjectIds.has(m.projectId)).map((m) => m.userId)
    );
  }, [members, activeProjectIds]);

  const recommendedCollaborators = useMemo(
    () => {
      if (!profile || !user) return [];
      return recommendCollaborators(
        profile,
        allProfiles.filter((p) => p.userId !== user.id),
        sharedIds
      ).slice(0, 3);
    },
    [allProfiles, members, profile, user, sharedIds]
  );

  // Pre-compute member counts per project — avoids repeated .filter() inside render
  const memberCountByProject = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of members) {
      if (m.status === "active") map.set(m.projectId, (map.get(m.projectId) ?? 0) + 1);
    }
    return map;
  }, [members]);

  if (!user || !profile) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-ink-500">You must be signed in to access the Academic Dashboard.</p>
        <Link to="/login"><Button>Sign In</Button></Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-navy" />
      </div>
    );
  }

  const submittedApplications = joinRequests.filter(
    (jr) => jr.applicantId === user.id
  );
  const ownedProjectIds = new Set(projects.filter((p) => p.ownerId === user.id).map((p) => p.id));
  const receivedApplications = joinRequests.filter(
    (jr) => ownedProjectIds.has(jr.projectId) && jr.status === "pending" && jr.applicantId !== user.id
  );
  const facultyMentorshipRequests = mentorshipRequests.filter(
    (mr) => mr.facultyId === user.id && mr.status === "pending"
  );

  function getProjectStats(projectId: string) {
    return { membersCount: (memberCountByProject.get(projectId) ?? 0) + 1 };
  }

  const handleWithdraw = async (reqId: string) => {
    if (confirm("Are you sure you want to withdraw this application?")) {
      await withdrawApplication(user.id, reqId);
      setJoinRequests((prev) => prev.map((jr) => jr.id === reqId ? { ...jr, status: "withdrawn" } : jr));
    }
  };

  const handleMentorshipResponse = async (reqId: string, accept: boolean) => {
    await reviewMentorship(user.id, reqId, accept);
    setMentorshipRequests((prev) => prev.map((mr) => mr.id === reqId ? { ...mr, status: accept ? "accepted" : "rejected" } : mr));
    refresh();
  };

  const handleReviewJoinApp = async (reqId: string, decision: "accepted" | "rejected") => {
    await reviewApplication(user.id, reqId, decision);
    setJoinRequests((prev) => prev.map((jr) => jr.id === reqId ? { ...jr, status: decision } : jr));
    refresh();
  };

  
  return (
    <div className="clay-page space-y-8">
      {/* Welcome Banner */}
      <div className="clay-welcome-banner clay-neural-bg p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3 relative z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest border"
              style={{ background: "linear-gradient(135deg,#FFF8DC,#FFE680)", color: "#7A4D00", borderColor: "#FFD040" }}
            >
              {user.email?.includes("faculty") || profile.designation
                ? <Building2 className="h-3.5 w-3.5" />
                : <GraduationCap className="h-3.5 w-3.5" />}
              {profile.designation ? "Faculty Workspace" : "Researcher Workspace"}
            </span>
            <span className="text-xs text-[#8C8372] font-semibold bg-white/60 rounded-full px-2.5 py-0.5 border border-[#ECE5D8]">
              {profile.institution}
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-extrabold tracking-tight text-[#181B1F] leading-tight">
            Welcome back,{" "}
            <span style={{ background: "linear-gradient(135deg,#8C6000,#FAB23D)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {profile.fullName.split(" ")[0]}
            </span>!
          </h1>
          <p className="text-sm text-[#5E646A] max-w-xl leading-relaxed">
            {profile.designation
              ? "Guide student initiatives, review research mentorship requests, and track active laboratory collaborations."
              : "Discover research projects matching your skills, coordinate with team members, and track your applications."}
          </p>
          {/* Stats row */}
          <div className="flex flex-wrap gap-4 pt-1">
            <div className="text-center">
              <div className="text-lg font-extrabold text-[#181B1F] font-serif">{activeProjects.length}</div>
              <div className="text-[10px] text-[#8C8372] font-bold uppercase tracking-wider">Active Projects</div>
            </div>
            <div className="w-px bg-[#ECE5D8]" />
            <div className="text-center">
              <div className="text-lg font-extrabold text-[#181B1F] font-serif">{profile.skills.length}</div>
              <div className="text-[10px] text-[#8C8372] font-bold uppercase tracking-wider">Skills</div>
            </div>
            <div className="w-px bg-[#ECE5D8]" />
            <div className="text-center">
              <div className="text-lg font-extrabold text-[#181B1F] font-serif">{submittedApplications.length}</div>
              <div className="text-[10px] text-[#8C8372] font-bold uppercase tracking-wider">Applications</div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5 shrink-0 relative z-10">
          {isFaculty && (
            <Button
              onClick={() => setAcademicCreatorOpen(true)}
              variant="primary"
            >
              <Sparkles className="h-4 w-4" /> Create Academic Project
            </Button>
          )}
          <Link to="/projects/new">
            <Button variant="outline"><FolderPlus className="h-4 w-4" /> Custom Project</Button>
          </Link>
          <Link to="/projects">
            <Button variant="ghost"><Compass className="h-4 w-4" /> Browse</Button>
          </Link>
        </div>
      </div>

      {/* Quick Action Navigation Hub */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {([
          { label: "My Skills", sub: `${profile.skills.length} mapped`, icon: Wrench, gold: true, onClick: () => setAddSkillOpen(true), href: null },
          { label: "My Interests", sub: `${profile.interests.length} domains`, icon: Layers, gold: true, onClick: () => setAddInterestOpen(true), href: null },
          { label: "Create Project", sub: "Assemble team", icon: FolderPlus, gold: true, onClick: null, href: "/projects/new" },
          { label: "Find Projects", sub: "Match skills", icon: Compass, gold: false, onClick: null, href: "/projects" },
          { label: "Collaborators", sub: "People & Faculty", icon: Users, gold: false, onClick: null, href: "/collaborators" },
          { label: "Requests", sub: receivedApplications.length > 0 ? `${receivedApplications.length} pending` : "Manage", icon: Inbox, gold: true, onClick: null, href: "/requests", badge: receivedApplications.length },
          { label: "Messages", sub: "Active rooms", icon: MessageSquare, gold: false, onClick: null, href: "/messages" },
        ] as const).map((item, i) => {
          const Icon = item.icon;
          const Inner = (
            <>
              <div
                className={`h-10 w-10 rounded-2xl flex items-center justify-center mb-2 transition-transform group-hover:scale-110 group-hover:-translate-y-0.5`}
                style={item.gold ? {
                  background: "linear-gradient(145deg,#FFF8DC,#FFE680,#FFC812)",
                  border: "1px solid #FFD040",
                  color: "#7A4D00",
                  boxShadow: "0 3px 10px rgba(255,200,18,0.25),inset 0 1px 0 rgba(255,255,255,0.8)"
                } : {
                  background: "linear-gradient(145deg,#F8F4EC,#EDE5D8)",
                  border: "1px solid #DFD5C4",
                  color: "#635B4D",
                }}
              >
                <Icon className="h-4.5 w-4.5" />
              </div>
              <span className="font-bold text-xs text-[#181B1F]">{item.label}</span>
              <span className="text-[10px] text-[#8C8372] font-medium mt-0.5">{item.sub}</span>
              {(item as any).badge > 0 && (
                <span className="absolute top-2 right-2 flex h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
              )}
            </>
          );
          const cls = "clay-stat relative flex flex-col items-center justify-center p-3 text-center group cursor-pointer";
          return item.href ? (
            <Link key={i} to={item.href} className={cls}>{Inner}</Link>
          ) : (
            <button key={i} type="button" onClick={item.onClick!} className={cls}>{Inner}</button>
          );
        })}
      </div>

      {/* Profile Completeness Alert */}
      {profile.profileCompleteness < 100 && (
        <div className="rounded-3xl border border-[#ECE5D8] bg-gradient-to-r from-[#FFFBEA] via-white to-[#FFFDF5] p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#8C6000]" />
              <h3 className="text-sm font-bold text-[#181B1F]">
                Enhance your AI Matching Precision (Profile Completeness: {profile.profileCompleteness}%)
              </h3>
            </div>
            <p className="text-xs text-[#5E646A]">
              Adding your GitHub profile, past projects, or academic certifications boosts your compatibility scores.
            </p>
            <div className="w-full sm:w-64 pt-2">
              <Progress value={profile.profileCompleteness} />
            </div>
          </div>
          <Link to="/onboarding">
            <Button variant="primary" size="sm" className="whitespace-nowrap">Complete Setup →</Button>
          </Link>
        </div>
      )}

      {/* Faculty Mentorship Requests */}
      {facultyMentorshipRequests.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-2xl font-bold text-[#181B1F]">
              Pending Mentorship Requests ({facultyMentorshipRequests.length})
            </h2>
            <span className="clay-badge clay-badge-brass">Action Needed</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {facultyMentorshipRequests.map((req) => {
              const project = projects.find((p) => p.id === req.projectId);
              const owner = allProfiles.find((pr) => pr.userId === project?.ownerId);
              return (
                <div key={req.id} className="clay-card p-5 space-y-3.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="clay-badge clay-badge-gold text-[10px]">
                        {project?.domains[0] || "Research"}
                      </span>
                      <h4 className="font-serif font-bold text-[#181B1F] text-lg mt-1">{project?.title}</h4>
                      <p className="text-xs text-[#5E646A]">Lead: {owner?.fullName || "Student Lead"}</p>
                    </div>
                    <span className="clay-badge clay-badge-slate text-[10px]">Direct Request</span>
                  </div>
                  <div className="clay-inset p-3 text-xs text-[#5E646A] italic">
                    "{req.message}"
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#ECE5D8]">
                    <Button size="sm" variant="outline" onClick={() => handleMentorshipResponse(req.id, false)}>
                      Decline
                    </Button>
                    <Button size="sm" variant="primary" onClick={() => handleMentorshipResponse(req.id, true)}>
                      Accept Mentorship
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Received Join Applications */}
      {receivedApplications.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-2xl font-bold text-[#181B1F]">
                Incoming Join Applications ({receivedApplications.length})
              </h2>
              <span className="clay-badge clay-badge-gold">Action Required</span>
            </div>
            <Link to="/requests" className="text-xs font-bold text-[#8C6000] hover:underline">
              View in Requests Hub →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {receivedApplications.map((req) => {
              const project = projects.find((p) => p.id === req.projectId);
              const applicant = allProfiles.find((pr) => pr.userId === req.applicantId);
              const role = project?.roles.find((r) => r.id === req.selectedRoleId);
              return (
                <div key={req.id} className="clay-card p-5 space-y-3.5 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <Link to={`/profile/${applicant?.userId}`} className="font-serif font-bold text-[#181B1F] text-base hover:text-[#8C6000] transition-colors">
                          {applicant?.fullName}
                        </Link>
                        <p className="text-xs text-[#5E646A] mt-0.5">
                          Applying for: <strong className="text-[#181B1F]">{role?.name || "Member"}</strong> on <em>{project?.title}</em>
                        </p>
                      </div>
                      {req.analysis && (
                        <span className="clay-badge clay-badge-brass shrink-0 font-bold">
                          {req.analysis.compatibilityScore}% AI Match
                        </span>
                      )}
                    </div>
                    <div className="clay-inset p-3 text-xs text-[#5E646A] line-clamp-2">
                      <strong className="text-[#181B1F]">Motivation:</strong> {req.motivation}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#ECE5D8]">
                    <Link to={`/profile/${applicant?.userId}`}>
                      <Button size="sm" variant="ghost" className="text-xs">
                        View Profile
                      </Button>
                    </Link>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleReviewJoinApp(req.id, "rejected")} className="text-xs text-red-600 hover:text-red-700">
                        <X className="h-3.5 w-3.5 mr-1" /> Decline
                      </Button>
                      <Button size="sm" variant="primary" onClick={() => handleReviewJoinApp(req.id, "accepted")} className="text-xs">
                        <Check className="h-3.5 w-3.5 mr-1" /> Accept
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Staff Coordinator & Project Leader Monitoring Panel (PRD 1 Section 7.1 / Req 2 & 6) */}
      {supervisedProjects.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-2xl font-bold text-[#181B1F]">
                  {isFaculty ? "Faculty Academic Management & Multi-Project Oversight" : "Team Monitoring & Health Oversight"}
                </h2>
                <span className="clay-badge clay-badge-gold"><Activity className="h-3 w-3 mr-1" /> Active Telemetry</span>
              </div>
              <p className="text-xs text-[#5E646A] mt-1">
                Evidence-based project health index, role-to-role dependencies, and collaboration gap monitoring across assigned student pods
              </p>
            </div>

            {/* Faculty Mode Tab Switcher */}
            {isFaculty && (
              <div className="flex items-center gap-1.5 p-1.5 bg-white/70 rounded-2xl border border-[#ECE5D8] self-start sm:self-auto shadow-xs">
                <button
                  type="button"
                  onClick={() => setFacultyTab("monitoring")}
                  className={`clay-btn text-xs px-3.5 py-1.5 ${
                    facultyTab === "monitoring"
                      ? "clay-btn-primary"
                      : "clay-btn-ghost"
                  }`}
                >
                  <Layers className="h-3.5 w-3.5 mr-1" />
                  <span>Monitored Pods ({supervisedProjects.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFacultyTab("students")}
                  className={`clay-btn text-xs px-3.5 py-1.5 ${
                    facultyTab === "students"
                      ? "clay-btn-primary"
                      : "clay-btn-ghost"
                  }`}
                >
                  <Users className="h-3.5 w-3.5 mr-1" />
                  <span>Student Directory</span>
                </button>
              </div>
            )}
          </div>

          {isFaculty && facultyTab === "students" ? (
            <FacultyStudentDirectory profiles={allProfiles} />
          ) : (
            <>
              {/* Quick Stats Panel (PRD 1 Section 7.1) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="clay-card p-5 flex items-center gap-3.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFF8DC] to-[#FFE680] text-[#7A4D00] shrink-0 border border-[#FFD040] shadow-xs">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#8C8372]">Total Teams Supervised</span>
                    <p className="font-serif text-2xl font-extrabold text-[#181B1F] leading-tight">{supervisedProjects.length}</p>
                    <span className="text-[11px] text-[#5E646A] font-medium">Active project pods</span>
                  </div>
                </div>

                <div className="clay-card p-5 flex items-center gap-3.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFF8DC] to-[#FFE680] text-[#7A4D00] shrink-0 border border-[#FFD040] shadow-xs">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#8C8372]">Total Student Collaborators</span>
                    <p className="font-serif text-2xl font-extrabold text-[#181B1F] leading-tight">
                      {new Set(members.filter((m) => supervisedProjects.some((sp) => sp.id === m.projectId) && m.userId !== user?.id).map((m) => m.userId)).size}
                    </p>
                    <span className="text-[11px] text-[#5E646A] font-medium">Enrolled researchers</span>
                  </div>
                </div>

                <div className="clay-card p-5 flex items-center gap-3.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FEF0D4] to-[#FAB23D]/30 text-[#8C6000] shrink-0 border border-[#FAB23D]/50 shadow-xs">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#8C8372]">Open Gaps & Alerts</span>
                    <p className="font-serif text-2xl font-extrabold text-[#181B1F] leading-tight">
                      {supervisedTeamMetrics.reduce((acc, m) => acc + m.alerts.length, 0)}
                    </p>
                    <span className="text-[11px] text-[#8C6000] font-bold">Pending items across teams</span>
                  </div>
                </div>
              </div>

              {/* "My Teams" Multi-Project Panel (Req 6) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {supervisedTeamMetrics.map(({ project: p, membersCount: _membersCount, progress, health, alerts }) => {
                  const healthTone = health >= 75 ? "green" : health >= 55 ? "navy" : "amber";
                  const teamMems = members.filter((m) => m.projectId === p.id && m.status === "active");
                  const teamProfiles = allProfiles.filter((pr) => teamMems.some((m) => m.userId === pr.userId));

                  return (
                    <div key={p.id} className="clay-card p-5 flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-[#8C8372]">
                            {p.domains[0] || "Academic Project"}
                          </span>
                          <span className={`clay-badge text-[10px] ${healthTone === "green" ? "clay-badge-green" : healthTone === "amber" ? "clay-badge-brass" : "clay-badge-gold"}`}>
                            Health: {health}/100
                          </span>
                        </div>

                        <div>
                          <h4 className="font-serif font-bold text-[#181B1F] text-base hover:text-[#8C6000] transition-colors leading-snug">
                            <Link to={`/projects/${p.id}/room?tab=monitoring`}>{p.title}</Link>
                          </h4>
                          <p className="text-xs text-[#5E646A] line-clamp-2 mt-1 leading-relaxed">{p.shortDescription}</p>
                        </div>

                        {/* Assigned Team Members Preview */}
                        <div className="flex items-center gap-1.5 pt-1">
                          <div className="flex -space-x-2 overflow-hidden">
                            {teamProfiles.slice(0, 4).map((pr) => (
                              <div
                                key={pr.id}
                                className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-gradient-to-br from-[#FFF8DC] to-[#FFE680] text-[#7A4D00] text-[10px] font-bold flex items-center justify-center border border-[#FFD040]"
                                title={pr.fullName}
                              >
                                {pr.fullName.charAt(0)}
                              </div>
                            ))}
                          </div>
                          <span className="text-[11px] text-[#5E646A] font-medium ml-1">
                            {teamProfiles.slice(0, 2).map((pr) => pr.fullName.split(" ")[0]).join(", ")}
                            {teamProfiles.length > 2 ? ` +${teamProfiles.length - 2}` : ""}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex justify-between text-xs text-[#5E646A]">
                            <span>Milestone Progress</span>
                            <span className="font-bold text-[#181B1F]">{progress}%</span>
                          </div>
                          <Progress value={progress} />
                        </div>

                        {/* Alerts feed for this team */}
                        {alerts.length > 0 ? (
                          <div className="clay-card-cream p-2.5 text-xs text-[#7A4D00] border border-[#FFE785] space-y-1">
                            {alerts.map((alert, idx) => (
                              <div key={idx} className="flex items-start gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#FAB23D] mt-1.5 shrink-0" />
                                <span className="text-[11px] leading-tight">{alert}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-[#2E7D32] bg-[#E8F5E9] p-2 rounded-xl border border-[#A5D6A7]">
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                            <span className="text-[11px] font-semibold">No active role or dependency gaps</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-[#ECE5D8] flex items-center justify-between text-xs gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setMonitoringProject(p)}
                          className="text-xs flex items-center gap-1"
                        >
                          <Activity className="h-3.5 w-3.5" /> Detailed Telemetry
                        </Button>
                        <Link to={`/projects/${p.id}/room`}>
                          <Button size="sm" variant="primary" className="text-xs">
                            Project Room →
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      )}

      {/* Active Projects */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#181B1F]">Active Project Workspaces</h2>
            <p className="text-xs text-[#5E646A]">Projects where you are currently collaborating as an owner, member, or mentor</p>
          </div>
          <Link to="/projects/new">
            <Button size="sm" variant="outline"><FolderPlus className="h-4 w-4" /> Start New</Button>
          </Link>
        </div>

        {activeProjects.length === 0 ? (
          <EmptyState
            title="No Active Projects Yet"
            body="Explore open academic research projects to join, or initiate your own project proposal."
            action={
              <div className="flex justify-center gap-3 pt-2">
                <Link to="/projects"><Button size="sm" variant="primary">Explore Directory</Button></Link>
                <Link to="/projects/new"><Button size="sm" variant="outline">Create Project</Button></Link>
              </div>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeProjects.map((proj) => {
              const isOwner = proj.ownerId === user.id;
              const isMentor = members.some(
                (m) => m.projectId === proj.id && m.userId === user.id && m.systemRole === "mentor"
              );
              const { membersCount } = getProjectStats(proj.id);

              return (
                <div key={proj.id} className="clay-card p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`clay-badge text-[10px] ${isOwner ? "clay-badge-gold" : isMentor ? "clay-badge-green" : "clay-badge-slate"}`}>
                        {isOwner ? "Project Owner" : isMentor ? "Faculty Mentor" : "Team Member"}
                      </span>
                      <span className="text-[11px] text-[#8C8372] uppercase tracking-wider font-bold">
                        {proj.status}
                      </span>
                    </div>
                    <h3 className="font-serif text-lg font-bold text-[#181B1F] hover:text-[#8C6000] transition-colors leading-snug">
                      <Link to={`/projects/${proj.id}`}>{proj.title}</Link>
                    </h3>
                    <p className="text-xs text-[#5E646A] line-clamp-2 leading-relaxed">{proj.shortDescription}</p>
                    <div className="flex items-center justify-between text-xs text-[#8C8372] pt-2 border-t border-[#ECE5D8]">
                      <span className="flex items-center gap-1 font-medium">
                        <Users className="h-3.5 w-3.5" /> {membersCount} collaborators
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#ECE5D8] flex gap-2">
                    <Link to={`/projects/${proj.id}/room`} className="flex-1">
                      <Button variant="primary" className="w-full text-xs" size="sm">Enter Project Room →</Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Submitted Applications */}
      {submittedApplications.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-bold text-[#181B1F]">
            Your Submitted Applications ({submittedApplications.length})
          </h2>
          <div className="clay-panel overflow-hidden divide-y divide-[#ECE5D8]">
            {submittedApplications.map((app) => {
              const project = projects.find((p) => p.id === app.projectId);
              const role = project?.roles.find((r) => r.id === app.selectedRoleId);
              return (
                <div key={app.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link to={`/projects/${project?.id}`} className="font-serif font-bold text-base text-[#181B1F] hover:text-[#8C6000] transition-colors">
                        {project?.title || "Research Project"}
                      </Link>
                      <span className={`clay-badge text-[10px] ${app.status === "accepted" ? "clay-badge-green" : app.status === "rejected" ? "clay-badge-red" : "clay-badge-gold"}`}>
                        {app.status === "pending" ? "Under Review" : app.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#5E646A]">
                      Target Role: <strong className="text-[#181B1F]">{role?.name || "Collaborator"}</strong> • Applied on {new Date(app.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {app.status === "accepted" && (
                      <Link to={`/projects/${project?.id}/room`}>
                        <Button size="sm" variant="primary" className="text-xs">Open Project Room</Button>
                      </Link>
                    )}
                    {app.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleWithdraw(app.id)}
                        className="text-red-600 hover:text-red-700 text-xs"
                      >
                        Withdraw
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* AI Recommended Projects */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-2xl font-bold text-[#181B1F]">AI Recommended Projects</h2>
              <span className="clay-badge clay-badge-gold"><Sparkles className="h-3 w-3 mr-1" /> Explainable Matching</span>
            </div>
            <p className="text-xs text-[#5E646A]">
              Ranked based on your verified skills, research domains, role compatibility, and availability
            </p>
          </div>
          <Link to="/projects" className="text-xs font-bold text-[#8C6000] hover:underline flex items-center gap-1">
            View all projects <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {aiMatchingLoading && aiProjectRecommendations.length === 0 ? (
          <div className="clay-card-cream p-8 text-center space-y-3 border border-[#FFE785]">
            <Loader2 className="h-7 w-7 animate-spin text-[#BD7D14] mx-auto" />
            <h4 className="font-serif font-bold text-[#181B1F] text-base">AI is analyzing your project matches...</h4>
            <p className="text-xs text-[#5E646A] max-w-md mx-auto">
              Evaluating your technical skills, research interests, past projects, and experience against active campus initiatives.
            </p>
          </div>
        ) : aiProjectRecommendations.length === 0 ? (
          <div className="py-6">
            <EmptyState
              title="No Recommendations Yet"
              body="Complete your profile or add more skills to receive personalized AI matching suggestions."
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {aiProjectRecommendations.slice(0, 3).map(({ project, analysis }) => (
              <div key={project.id} className="flex flex-col justify-between">
                <ProjectCard
                  project={project}
                  match={analysis.output_result.match_score}
                  viewer={profile}
                />
                <AiProjectExplanation analysis={analysis.output_result} defaultExpanded={false} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* AI Recommended Collaborators */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-2xl font-bold text-[#181B1F]">Recommended Collaborators</h2>
              <span className="clay-badge clay-badge-brass">Network Discovery</span>
            </div>
            <p className="text-xs text-[#5E646A]">
              Fellow student researchers and faculty members with complementary research expertise
            </p>
          </div>
          <Link to="/collaborators" className="text-xs font-bold text-[#8C6000] hover:underline flex items-center gap-1">
            Browse all researchers <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommendedCollaborators.length === 0 ? (
            <p className="text-xs text-ink-400 col-span-3 text-center py-6">Add more skills and interests to see collaborator suggestions.</p>
          ) : (
            recommendedCollaborators.map(({ candidate, compatibilityScore, reason }) => (
              <PersonCard key={candidate.id} profile={candidate} score={compatibilityScore} reason={reason} />
            ))
          )}
        </div>
      </section>

      {/* Modals for Skills & Interests Management */}
      <Modal open={addSkillOpen} onClose={() => setAddSkillOpen(false)} title="Manage Technical Skills" wide>
        <div className="space-y-5">
          <p className="text-xs text-ink-500">
            Search and select skills from our comprehensive taxonomy. You can toggle proficiency directly on each skill chip.
          </p>

          <SkillSelector
            value={profile.skills || []}
            onChange={async (updated) => {
              await saveProfile(user.id, { ...profile, skills: updated });
              await refresh();
              toast.success("Skills updated", "Profile skills have been saved.");
            }}
            withProficiency={true}
            placeholder="Search skills, e.g. Python, Machine Learning, React, PyTorch..."
          />

          <div className="flex justify-end pt-3 border-t border-ink-100">
            <Button onClick={() => setAddSkillOpen(false)}>Done</Button>
          </div>
        </div>
      </Modal>

      <Modal open={addInterestOpen} onClose={() => setAddInterestOpen(false)} title="Manage Research Interests">
        <div className="space-y-5">
          <p className="text-xs text-ink-500">
            Choose research disciplines to receive personalized project recommendations and collaborator matches.
          </p>

          <TagSelector
            value={profile.interests || []}
            onChange={async (updated) => {
              await saveProfile(user.id, { ...profile, interests: updated });
              await refresh();
              toast.success("Interests updated", "Research domains saved successfully.");
            }}
            availableOptions={RESEARCH_DOMAINS}
            placeholder="Search or add domain, e.g. Artificial Intelligence, Robotics..."
          />

          <div className="flex justify-end pt-3 border-t border-ink-100">
            <Button onClick={() => setAddInterestOpen(false)}>Done</Button>
          </div>
        </div>
      </Modal>

      {/* Faculty Academic Mini-Project Creator Modal (Req 2 & 3) */}
      {isFaculty && (
        <AcademicProjectCreatorModal
          open={academicCreatorOpen}
          onClose={() => setAcademicCreatorOpen(false)}
          facultyId={user.id}
          allProfiles={allProfiles}
          onCreated={async () => {
            await refresh();
          }}
        />
      )}

      {/* Detailed Multi-Metric Monitoring Modal (Req 6) */}
      <DetailedMonitoringModal
        open={!!monitoringProject}
        onClose={() => setMonitoringProject(null)}
        project={monitoringProject}
      />
    </div>
  );
}
