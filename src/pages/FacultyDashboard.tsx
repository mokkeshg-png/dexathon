import { useState, useEffect, useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  fetchProjects,
  fetchAllProfiles,
  fetchJoinRequests,
  fetchMentorshipRequests,
  reviewMentorship,
  reviewApplication,
  fetchProjectMembersByProjects,
} from "@/lib/supabase-db";
import { AcademicProjectCreatorModal } from "@/components/faculty/AcademicProjectCreatorModal";
import { DetailedMonitoringModal } from "@/components/faculty/DetailedMonitoringModal";
import { FacultyStudentDirectory } from "@/components/faculty/FacultyStudentDirectory";
import { Button } from "@/components/ui/Button";
import { Card, Badge } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Field";
import type { Project, Profile, JoinRequest, MentorshipRequest, ProjectMember } from "@/types";
import {
  Building2,
  Sparkles,
  Users,
  FolderGit2,
  CheckCircle2,
  Activity,
  Inbox,
  ArrowUpRight,
  PlusCircle,
  BookOpen,
  MessageSquare,
  Check,
  X,
  Zap,
} from "lucide-react";

type FacultyTab = "projects" | "applications" | "students" | "mentorship";

export function FacultyDashboard() {
  const { user, profile, isFaculty, isAdmin, isIndustryPartner, isCollegeAdmin } = useAuth();
  const toast = useToast();

  // Route security: only faculty or admins can access
  if (isIndustryPartner || profile?.role === "industry_partner") {
    return <Navigate to="/industry" replace />;
  }
  if ((isCollegeAdmin || profile?.role === "college_admin") && !isFaculty) {
    return <Navigate to="/admin" replace />;
  }
  if (!isFaculty && profile?.role !== "faculty" && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const [activeTab, setActiveTab] = useState<FacultyTab>("projects");
  const [loading, setLoading] = useState(true);

  // Data states
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [mentorshipRequests, setMentorshipRequests] = useState<MentorshipRequest[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);

  // Modals
  const [creatorModalOpen, setCreatorModalOpen] = useState(false);
  const [monitoringProject, setMonitoringProject] = useState<Project | null>(null);

  // Review Feedback Modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{
    type: "application" | "mentorship";
    id: string;
    projectId?: string;
    applicantName: string;
    projectTitle: string;
    action: "accepted" | "rejected";
  } | null>(null);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Load faculty data
  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [projs, profs, jrs, mrs] = await Promise.all([
        fetchProjects(),
        fetchAllProfiles(),
        fetchJoinRequests(),
        fetchMentorshipRequests(undefined, user.id),
      ]);

      setAllProjects(projs);
      setAllProfiles(profs);
      setJoinRequests(jrs);
      setMentorshipRequests(mrs);

      if (projs.length > 0) {
        const memsMap = await fetchProjectMembersByProjects(projs.map((p) => p.id));
        setMembers(Array.from(memsMap.values()).flat());
      }
    } catch (err: any) {
      console.error("FacultyDashboard load error:", err);
      toast.error("Failed to load workspace", err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Projects supervised/owned by this faculty member
  const myProjects = useMemo(() => {
    if (!user) return [];
    return allProjects.filter((p) => p.ownerId === user.id);
  }, [allProjects, user]);

  // Applications targeting faculty's projects
  const myProjectIds = useMemo(() => new Set(myProjects.map((p) => p.id)), [myProjects]);

  const pendingApplications = useMemo(() => {
    return joinRequests.filter((jr) => myProjectIds.has(jr.projectId) && jr.status === "pending");
  }, [joinRequests, myProjectIds]);

  const pendingMentorships = useMemo(() => {
    return mentorshipRequests.filter((mr) => mr.facultyId === user?.id && mr.status === "pending");
  }, [mentorshipRequests, user]);

  // Students actively supervised
  const supervisedStudentIds = useMemo(() => {
    const ids = new Set<string>();
    members.forEach((m) => {
      if (myProjectIds.has(m.projectId) && m.status === "active") {
        ids.add(m.userId);
      }
    });
    return ids;
  }, [members, myProjectIds]);

  // Review confirmation
  const handleConfirmReview = async () => {
    if (!reviewTarget || !user) return;
    setSubmittingReview(true);
    try {
      if (reviewTarget.type === "application") {
        await reviewApplication(
          user.id,
          reviewTarget.id,
          reviewTarget.action,
          feedbackNote,
          reviewTarget.projectId
        );
      } else {
        await reviewMentorship(
          user.id,
          reviewTarget.id,
          reviewTarget.action === "accepted",
          reviewTarget.projectId
        );
      }
      toast.success(
        `Application ${reviewTarget.action === "accepted" ? "Approved" : "Declined"}`,
        `Feedback delivered to ${reviewTarget.applicantName}.`
      );
      setReviewModalOpen(false);
      setFeedbackNote("");
      await loadData();
    } catch (err: any) {
      toast.error("Review Failed", err?.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7EE] flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-[#7B828A] font-medium">
          <div className="w-5 h-5 border-2 border-[#181B1F] border-t-[#FFC812] rounded-full animate-spin" />
          Loading Faculty Workspace...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* ── FACULTY WELCOME & KPI HEADER ── */}
      <div className="rounded-3xl border border-[#ECE5D8] bg-white p-6 sm:p-8 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-1 text-xs font-bold uppercase tracking-wider bg-[#FFF4D0] text-[#8C6000] border border-[#FFE785]">
              <Building2 className="h-3.5 w-3.5" />
              Faculty Workspace
            </span>
            <span className="text-xs text-[#7B828A] font-semibold bg-[#FAF7EE] rounded-full px-3 py-1 border border-[#ECE5D8]">
              {profile?.institution || "Institutional Faculty"}
            </span>
            <span className="text-xs text-[#7B828A] font-mono bg-[#FAF7EE] rounded-full px-3 py-1 border border-[#ECE5D8]">
              {profile?.department || "Academic Department"}
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-extrabold tracking-tight text-[#181B1F]">
            Professor {profile?.fullName?.split(" ")[0] || "Faculty Member"}
          </h1>
          <p className="text-xs sm:text-sm text-[#5E646A] max-w-2xl leading-relaxed">
            Lead academic project pods, mentor student researchers, conduct milestone reviews, and evaluate AI-assisted progress telemetry.
          </p>

          {/* Quick KPI meters */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold text-[#181B1F] font-serif">{myProjects.length}</span>
              <span className="text-xs text-[#7B828A] uppercase font-bold tracking-wider">Supervised Projects</span>
            </div>
            <span className="text-[#ECE5D8]">•</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold text-[#181B1F] font-serif">{supervisedStudentIds.size}</span>
              <span className="text-xs text-[#7B828A] uppercase font-bold tracking-wider">Active Students</span>
            </div>
            <span className="text-[#ECE5D8]">•</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold text-[#8C6000] font-serif">
                {pendingApplications.length + pendingMentorships.length}
              </span>
              <span className="text-xs text-[#7B828A] uppercase font-bold tracking-wider">Pending Reviews</span>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap md:flex-col gap-2.5 shrink-0">
          <Button
            onClick={() => setCreatorModalOpen(true)}
            variant="primary"
            className="shadow-clay text-xs"
          >
            <Sparkles className="h-4 w-4 mr-1.5" /> Create Academic Project
          </Button>

          <Link to="/curriculum">
            <Button variant="outline" className="text-xs w-full">
              <Zap className="h-3.5 w-3.5 mr-1.5 text-[#8C6000]" /> Curriculum Gap Analysis
            </Button>
          </Link>

          <Link to="/collaborators">
            <Button variant="outline" className="text-xs w-full">
              <Users className="h-3.5 w-3.5 mr-1.5" /> Campus Student Directory
            </Button>
          </Link>
        </div>
      </div>

      {/* ── TABS NAVIGATION ── */}
      <div className="flex flex-wrap gap-2 border-b border-[#ECE5D8] pb-3">
        <button
          onClick={() => setActiveTab("projects")}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === "projects"
              ? "bg-[#181B1F] text-white shadow-xs"
              : "bg-white border border-[#ECE5D8] text-[#5E646A] hover:text-[#181B1F]"
          }`}
        >
          <FolderGit2 className="h-4 w-4" />
          <span>My Academic Projects ({myProjects.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("applications")}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === "applications"
              ? "bg-[#181B1F] text-white shadow-xs"
              : "bg-white border border-[#ECE5D8] text-[#5E646A] hover:text-[#181B1F]"
          }`}
        >
          <Inbox className="h-4 w-4" />
          <span>Student Applications</span>
          {pendingApplications.length > 0 && (
            <span className="rounded-full bg-red-500 px-1.5 py-0.2 text-[10px] text-white font-extrabold">
              {pendingApplications.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("mentorship")}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === "mentorship"
              ? "bg-[#181B1F] text-white shadow-xs"
              : "bg-white border border-[#ECE5D8] text-[#5E646A] hover:text-[#181B1F]"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Mentorship Requests</span>
          {pendingMentorships.length > 0 && (
            <span className="rounded-full bg-[#FFC812] px-1.5 py-0.2 text-[10px] text-[#181B1F] font-extrabold">
              {pendingMentorships.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("students")}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === "students"
              ? "bg-[#181B1F] text-white shadow-xs"
              : "bg-white border border-[#ECE5D8] text-[#5E646A] hover:text-[#181B1F]"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Student Talent & AI Matching</span>
        </button>
      </div>

      {/* ── TAB CONTENT: 1. ACADEMIC PROJECTS STUDIO ── */}
      {activeTab === "projects" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-bold text-[#181B1F]">Mentored Projects & Telemetry</h2>
              <p className="text-xs text-[#7B828A]">Monitor project health, student velocity, deliverables, and submissions.</p>
            </div>
            <Button
              onClick={() => setCreatorModalOpen(true)}
              variant="primary"
              size="sm"
              className="text-xs shadow-clay"
            >
              <PlusCircle className="h-3.5 w-3.5 mr-1" /> New Academic Project
            </Button>
          </div>

          {myProjects.length === 0 ? (
            <Card className="p-12 text-center space-y-4 rounded-3xl border-dashed border-[#ECE5D8] bg-white">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF8DC] text-[#8C6000]">
                <BookOpen className="h-7 w-7" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#181B1F]">No Academic Projects Yet</h3>
              <p className="text-xs text-[#5E646A] max-w-md mx-auto">
                Create structured academic projects, upload PRDs or problem briefs, and match student teams to begin research mentorship.
              </p>
              <Button onClick={() => setCreatorModalOpen(true)} variant="primary" size="sm" className="shadow-clay">
                Create First Project
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {myProjects.map((project) => {
                const projectMembers = members.filter((m) => m.projectId === project.id && m.status === "active");

                return (
                  <Card key={project.id} className="p-6 rounded-3xl border-[#ECE5D8] bg-white shadow-card flex flex-col justify-between hover:border-[#FFC812] transition-all">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg bg-[#FAF7EE] text-[#8C6000] border border-[#ECE5D8]">
                          {project.domains?.[0] || "Academic Research"}
                        </span>
                        <Badge tone={project.status === "open" ? "green" : project.status === "completed" ? "purple" : "slate"}>
                          {project.status.toUpperCase()}
                        </Badge>
                      </div>

                      <h3 className="font-serif text-lg font-bold text-[#181B1F] leading-snug">
                        {project.title}
                      </h3>

                      <p className="text-xs text-[#5E646A] line-clamp-2 leading-relaxed">
                        {project.shortDescription || project.detailedDescription}
                      </p>

                      {/* Required Skills Badges */}
                      {project.requiredSkills && project.requiredSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {project.requiredSkills.slice(0, 4).map((s) => (
                            <span key={s} className="px-2 py-0.5 rounded-md bg-[#FAF7EE] text-[10px] font-medium text-[#5E646A] border border-[#ECE5D8]">
                              {s}
                            </span>
                          ))}
                          {project.requiredSkills.length > 4 && (
                            <span className="text-[10px] text-[#7B828A] self-center">
                              +{project.requiredSkills.length - 4} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Student Team count & progress */}
                      <div className="pt-2 flex items-center justify-between text-xs text-[#7B828A]">
                        <span className="flex items-center gap-1 font-medium">
                          <Users className="h-3.5 w-3.5 text-[#8C6000]" />
                          {projectMembers.length} Student Researchers
                        </span>
                        <span className="font-semibold text-[#181B1F]">
                          {project.type || "Academic Pod"}
                        </span>
                      </div>
                    </div>

                    {/* Faculty Action Bar */}
                    <div className="mt-5 pt-4 border-t border-[#ECE5D8] flex items-center justify-between gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setMonitoringProject(project)}
                        className="text-xs flex items-center gap-1"
                      >
                        <Activity className="h-3.5 w-3.5 text-[#8C6000]" /> Telemetry & Health
                      </Button>

                      <Link to={`/projects/${project.id}/room`}>
                        <Button size="sm" variant="primary" className="text-xs flex items-center gap-1 shadow-xs">
                          Enter Project Room <ArrowUpRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB CONTENT: 2. STUDENT APPLICATIONS ── */}
      {activeTab === "applications" && (
        <div className="space-y-6">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#181B1F]">Student Project Applications</h2>
            <p className="text-xs text-[#7B828A]">Review student join requests, verify prerequisite skill fit, and assign pod roles.</p>
          </div>

          {pendingApplications.length === 0 ? (
            <Card className="p-10 text-center rounded-3xl border-dashed border-[#ECE5D8] bg-white space-y-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
              <h3 className="font-serif text-base font-bold text-[#181B1F]">No Pending Student Applications</h3>
              <p className="text-xs text-[#7B828A]">All project role applications have been reviewed.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingApplications.map((app) => {
                const applicant = allProfiles.find((p) => p.id === app.applicantId);
                const project = myProjects.find((p) => p.id === app.projectId);

                return (
                  <Card key={app.id} className="p-5 rounded-2xl border-[#ECE5D8] bg-white shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#181B1F]">{applicant?.fullName || "Student Researcher"}</span>
                        <span className="text-xs text-[#7B828A]">({applicant?.department || "Student"}, Year {applicant?.academicYear || 3})</span>
                        <Badge tone="amber">Pending Review</Badge>
                      </div>

                      <div className="text-xs text-[#5E646A]">
                        Applying for: <strong className="text-[#181B1F]">{app.selectedRoleId || "Research Contributor"}</strong> on project{" "}
                        <strong className="text-[#8C6000]">"{project?.title || "Academic Project"}"</strong>
                      </div>

                      {app.message && (
                        <p className="text-xs italic bg-[#FAF7EE] p-2.5 rounded-xl border border-[#ECE5D8] text-[#52575C] max-w-xl">
                          "{app.message}"
                        </p>
                      )}

                      {applicant?.skills && applicant.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {applicant.skills.slice(0, 5).map((s) => (
                            <span key={s.skill} className="px-2 py-0.5 rounded-md bg-[#FAF7EE] text-[10px] font-medium text-[#5E646A]">
                              {s.skill} ({s.proficiency})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setReviewTarget({
                            type: "application",
                            id: app.id,
                            projectId: app.projectId,
                            applicantName: applicant?.fullName || "Student",
                            projectTitle: project?.title || "Project",
                            action: "rejected",
                          });
                          setReviewModalOpen(true);
                        }}
                        className="text-xs text-red-600 hover:bg-red-50"
                      >
                        <X className="h-3.5 w-3.5 mr-1" /> Decline
                      </Button>

                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          setReviewTarget({
                            type: "application",
                            id: app.id,
                            projectId: app.projectId,
                            applicantName: applicant?.fullName || "Student",
                            projectTitle: project?.title || "Project",
                            action: "accepted",
                          });
                          setReviewModalOpen(true);
                        }}
                        className="text-xs shadow-clay"
                      >
                        <Check className="h-3.5 w-3.5 mr-1" /> Approve & Assign Role
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB CONTENT: 3. MENTORSHIP REQUESTS ── */}
      {activeTab === "mentorship" && (
        <div className="space-y-6">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#181B1F]">Research Mentorship Inquiries</h2>
            <p className="text-xs text-[#7B828A]">Direct faculty mentorship requests submitted by student teams and autonomous pods.</p>
          </div>

          {pendingMentorships.length === 0 ? (
            <Card className="p-10 text-center rounded-3xl border-dashed border-[#ECE5D8] bg-white space-y-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
              <h3 className="font-serif text-base font-bold text-[#181B1F]">No Pending Mentorship Requests</h3>
              <p className="text-xs text-[#7B828A]">You are up to date on student research guidance requests.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingMentorships.map((mr) => {
                const requester = allProfiles.find((p) => p.id === mr.studentId);
                const project = allProjects.find((p) => p.id === mr.projectId);

                return (
                  <Card key={mr.id} className="p-5 rounded-2xl border-[#ECE5D8] bg-white shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#181B1F]">{requester?.fullName || "Student Team Lead"}</span>
                        <Badge tone="amber">Mentorship Requested</Badge>
                      </div>

                      <div className="text-xs text-[#5E646A]">
                        Project: <strong className="text-[#8C6000]">"{project?.title || "Autonomous Student Project"}"</strong>
                      </div>

                      {mr.message && (
                        <p className="text-xs bg-[#FAF7EE] p-2.5 rounded-xl border border-[#ECE5D8] text-[#52575C] max-w-xl">
                          "{mr.message}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setReviewTarget({
                            type: "mentorship",
                            id: mr.id,
                            projectId: mr.projectId,
                            applicantName: requester?.fullName || "Student",
                            projectTitle: project?.title || "Project",
                            action: "rejected",
                          });
                          setReviewModalOpen(true);
                        }}
                        className="text-xs text-red-600"
                      >
                        Decline
                      </Button>

                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          setReviewTarget({
                            type: "mentorship",
                            id: mr.id,
                            projectId: mr.projectId,
                            applicantName: requester?.fullName || "Student",
                            projectTitle: project?.title || "Project",
                            action: "accepted",
                          });
                          setReviewModalOpen(true);
                        }}
                        className="text-xs shadow-clay"
                      >
                        Accept Mentorship
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB CONTENT: 4. STUDENT TALENT & AI MATCHING ── */}
      {activeTab === "students" && (
        <div className="space-y-6">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#181B1F]">Student Talent Directory & Skill Matching</h2>
            <p className="text-xs text-[#7B828A]">
              Discover student researchers across your department, filter by proficiency, and recruit candidates for your academic projects.
            </p>
          </div>

          <FacultyStudentDirectory profiles={allProfiles} />
        </div>
      )}

      {/* ── MODAL: ACADEMIC PROJECT CREATOR ── */}
      {creatorModalOpen && user && (
        <AcademicProjectCreatorModal
          open={creatorModalOpen}
          onClose={() => setCreatorModalOpen(false)}
          facultyId={user.id}
          allProfiles={allProfiles}
          onCreated={async () => {
            setCreatorModalOpen(false);
            toast.success("Project Created", "Academic project successfully initialized with designated roles.");
            await loadData();
          }}
        />
      )}

      {/* ── MODAL: DETAILED TELEMETRY & MONITORING ── */}
      {monitoringProject && (
        <DetailedMonitoringModal
          open={Boolean(monitoringProject)}
          onClose={() => setMonitoringProject(null)}
          project={monitoringProject}
        />
      )}

      {/* ── MODAL: REVIEW / FEEDBACK ── */}
      {reviewModalOpen && reviewTarget && (
        <Modal
          open={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          title={`${reviewTarget.action === "accepted" ? "Approve" : "Decline"} ${reviewTarget.applicantName}`}
        >
          <div className="space-y-4">
            <p className="text-xs text-[#5E646A]">
              You are about to {reviewTarget.action === "accepted" ? "approve and accept" : "decline"} the request from{" "}
              <strong>{reviewTarget.applicantName}</strong> for <strong>{reviewTarget.projectTitle}</strong>.
            </p>

            <div>
              <label className="text-xs font-bold text-[#181B1F] block mb-1">
                Faculty Mentorship Feedback / Notes (Optional)
              </label>
              <Textarea
                placeholder="Provide constructive feedback, milestone expectations, or next steps..."
                value={feedbackNote}
                onChange={(e) => setFeedbackNote(e.target.value)}
                rows={3}
                className="text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setReviewModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant={reviewTarget.action === "accepted" ? "primary" : "outline"}
                size="sm"
                loading={submittingReview}
                onClick={handleConfirmReview}
                className={reviewTarget.action === "rejected" ? "border-red-300 text-red-600 hover:bg-red-50" : "shadow-clay"}
              >
                Confirm {reviewTarget.action === "accepted" ? "Approval" : "Decision"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
