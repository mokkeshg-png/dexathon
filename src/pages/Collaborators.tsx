import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  fetchAllProfiles,
  fetchProjects,
  inviteUser,
  fetchSkillsFromDB,
  sendDirectCollaborationRequest,
  requestMentorship,
} from "@/lib/supabase-db";
import { PersonCard } from "@/components/projects/ProjectCard";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { INSTITUTIONS } from "@/lib/taxonomies";
import { ROLE_TEMPLATES } from "@/types";
import type { Profile, Project } from "@/types";
import {
  Search,
  Users,
  Mail,
  Loader2,
  UserPlus,
  GraduationCap,
} from "lucide-react";

export function Collaborators() {
  const { user } = useAuth();
  const toast = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [ownedProjects, setOwnedProjects] = useState<Project[]>([]);
  const [allSkills, setAllSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [query, setQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedTechnicalRole, setSelectedTechnicalRole] = useState<string>("all");
  const [selectedInstitution, setSelectedInstitution] = useState<string>("all");
  const [selectedSkill, setSelectedSkill] = useState<string>("all");

  // Direct Collaboration Modal state (Req 1)
  const [collabModalOpen, setCollabModalOpen] = useState(false);
  const [collabTarget, setCollabTarget] = useState<Profile | null>(null);
  const [collabMode, setCollabMode] = useState<"direct" | "project">("direct");
  const [collabRole, setCollabRole] = useState<string>("Frontend Developer");
  const [collabMsg, setCollabMsg] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [sendingCollab, setSendingCollab] = useState(false);
  const [collabSuccess, setCollabSuccess] = useState(false);
  const [collabError, setCollabError] = useState<string | null>(null);

  // Faculty Mentorship Modal state (Req 7)
  const [mentorModalOpen, setMentorModalOpen] = useState(false);
  const [mentorTarget, setMentorTarget] = useState<Profile | null>(null);
  const [mentorTopic, setMentorTopic] = useState("");
  const [mentorMsg, setMentorMsg] = useState("");
  const [sendingMentor, setSendingMentor] = useState(false);

  const [signInPrompt, setSignInPrompt] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [profs, projs, skills] = await Promise.all([
        fetchAllProfiles(),
        user ? fetchProjects() : Promise.resolve([]),
        fetchSkillsFromDB(),
      ]);
      if (cancelled) return;
      setProfiles(profs);
      setOwnedProjects(projs.filter((p) => p.ownerId === user?.id && p.status === "open"));
      setAllSkills(skills);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      if (query.trim()) {
        const q = query.toLowerCase();
        const matchesQuery =
          p.fullName.toLowerCase().includes(q) ||
          p.department.toLowerCase().includes(q) ||
          p.institution.toLowerCase().includes(q) ||
          (p.headline && p.headline.toLowerCase().includes(q)) ||
          (p.bio && p.bio.toLowerCase().includes(q)) ||
          (p.classSection && p.classSection.toLowerCase().includes(q)) ||
          p.skills.some((s) => s.skill.toLowerCase().includes(q)) ||
          p.interests.some((i) => i.toLowerCase().includes(q)) ||
          p.preferredRoles.some((r) => r.toLowerCase().includes(q));
        if (!matchesQuery) return false;
      }
      if (selectedRole === "faculty" && !p.designation) return false;
      if (selectedRole === "student" && p.designation) return false;
      if (selectedInstitution !== "all" && p.institution !== selectedInstitution) return false;
      if (selectedSkill !== "all" && !p.skills.some((s) => s.skill.toLowerCase() === selectedSkill.toLowerCase()))
        return false;

      // Filter by technical role (e.g. Frontend Developer, Backend Developer, AI Developer, etc.)
      if (selectedTechnicalRole !== "all") {
        const tr = selectedTechnicalRole.toLowerCase();
        const matchesTechRole =
          p.preferredRoles.some((r) => r.toLowerCase().includes(tr)) ||
          (p.headline && p.headline.toLowerCase().includes(tr)) ||
          (p.bio && p.bio.toLowerCase().includes(tr)) ||
          (tr.includes("frontend") && p.skills.some((s) => ["react", "vue", "angular", "css", "html", "tailwind"].some((k) => s.skill.toLowerCase().includes(k)))) ||
          (tr.includes("backend") && p.skills.some((s) => ["node", "express", "django", "fastapi", "spring", "go", "python"].some((k) => s.skill.toLowerCase().includes(k)))) ||
          (tr.includes("ai") && p.skills.some((s) => ["python", "pytorch", "tensorflow", "ml", "nlp", "deep learning"].some((k) => s.skill.toLowerCase().includes(k)))) ||
          (tr.includes("database") && p.skills.some((s) => ["sql", "postgres", "mongodb", "database"].some((k) => s.skill.toLowerCase().includes(k))));
        if (!matchesTechRole) return false;
      }

      return true;
    });
  }, [profiles, query, selectedRole, selectedTechnicalRole, selectedInstitution, selectedSkill]);

  const handleOpenCollab = (target: Profile) => {
    if (!user) {
      setSignInPrompt(true);
      return;
    }
    setCollabTarget(target);
    setCollabMode("direct");
    setCollabRole(target.preferredRoles[0] || "Frontend Developer");
    setCollabMsg(
      `Hi ${target.fullName.split(" ")[0]}, I saw your profile and skills in ${target.skills.slice(0, 2).map((s) => s.skill).join(", ") || "software development"}. Let's collaborate on upcoming projects or hackathons!`
    );
    setSelectedProjectId(ownedProjects[0]?.id || "");
    setCollabError(null);
    setCollabSuccess(false);
    setCollabModalOpen(true);
  };

  const handleOpenMentor = (faculty: Profile) => {
    if (!user) {
      setSignInPrompt(true);
      return;
    }
    setMentorTarget(faculty);
    setMentorTopic(faculty.expertise[0] || faculty.researchDomains[0] || "Technical Project Guidance");
    setMentorMsg(
      `Respected Professor ${faculty.fullName.split(" ")[0]}, I am developing a technical project and would value your academic evaluation and mentorship.`
    );
    setMentorModalOpen(true);
  };

  const handleSendCollaboration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !collabTarget) return;
    setSendingCollab(true);
    setCollabError(null);

    try {
      if (collabMode === "project" && selectedProjectId) {
        await inviteUser(user.id, selectedProjectId, collabTarget.userId, undefined, collabMsg);
        setCollabSuccess(true);
        toast.success("Project invitation sent", `Invited ${collabTarget.fullName} to your project.`);
      } else {
        await sendDirectCollaborationRequest(
          user.id,
          collabTarget.userId,
          collabMsg,
          collabRole,
          collabTarget.department
        );
        setCollabSuccess(true);
        toast.success(
          "Collaboration request sent",
          `Once ${collabTarget.fullName} accepts, your private 1-on-1 chat will activate in Messages.`
        );
      }
      setTimeout(() => {
        setCollabModalOpen(false);
        setCollabSuccess(false);
        setCollabMsg("");
      }, 1500);
    } catch (err: any) {
      setCollabError(err?.message || "Failed to send collaboration request");
    } finally {
      setSendingCollab(false);
    }
  };

  const handleSendMentorship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !mentorTarget) return;
    setSendingMentor(true);
    try {
      await requestMentorship(
        mentorTarget.userId,
        ownedProjects[0]?.id || undefined,
        mentorMsg,
        user.id,
        mentorTopic
      );
      toast.success(
        "Mentorship request submitted",
        `Prof. ${mentorTarget.fullName} has been notified and can review your request.`
      );
      setMentorModalOpen(false);
      setMentorMsg("");
    } catch (err: any) {
      toast.error("Could not send mentorship request", err?.message);
    } finally {
      setSendingMentor(false);
    }
  };

  return (
    <div className="clay-page space-y-6">
      {/* Header */}
      <div className="clay-welcome-banner clay-neural-bg p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest border"
              style={{ background: "linear-gradient(135deg,#FFF8DC,#FFE680)", color: "#7A4D00", borderColor: "#FFD040" }}
            >
              <Users className="h-3.5 w-3.5" /> Campus Academic Network
            </span>
            <span className="text-xs text-[#8C8372] font-semibold bg-white/60 rounded-full px-2.5 py-0.5 border border-[#ECE5D8]">
              {filteredProfiles.length} Members Registered
            </span>
          </div>
          <h1 className="mt-3 font-serif text-3xl sm:text-4xl font-extrabold tracking-tight text-[#181B1F] leading-tight">
            Find Researchers & Collaborators
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#5E646A] max-w-2xl leading-relaxed">
            Discover registered students and faculty across departments, search specialized roles (Frontend, Backend, AI Dev), and collaborate 1-on-1 directly without needing a project.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Link to="/messages">
            <Button variant="outline" size="sm" className="text-xs">
              <Mail className="h-3.5 w-3.5 mr-1.5" /> 1-on-1 Messages
            </Button>
          </Link>
          <Link to="/requests?tab=direct">
            <Button variant="primary" size="sm" className="text-xs">
              <Users className="h-3.5 w-3.5 mr-1.5" /> Collaboration Desk
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters (Req 1 & 2) */}
      <div className="clay-panel p-5 sm:p-6 space-y-4">
        <div className="relative">
          <Input
            placeholder="Search by student or faculty name, department, class, section, skill, or domain..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 text-xs sm:text-sm"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-[#A09488]" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="text-xs">
            <option value="all">All Academic Roles</option>
            <option value="student">Students & Researchers</option>
            <option value="faculty">Faculty & Mentors</option>
          </Select>

          {/* Technical Role Filter (Req 1 & 2: Frontend, Backend, AI Dev, etc.) */}
          <Select
            value={selectedTechnicalRole}
            onChange={(e) => setSelectedTechnicalRole(e.target.value)}
            className="text-xs"
          >
            <option value="all">All Technical Specialties</option>
            {ROLE_TEMPLATES.map((role) => (
              <option key={role.name} value={role.name}>
                {role.name}
              </option>
            ))}
          </Select>

          <Select value={selectedInstitution} onChange={(e) => setSelectedInstitution(e.target.value)} className="text-xs">
            <option value="all">All Institutions</option>
            {INSTITUTIONS.map((inst) => (
              <option key={inst} value={inst}>
                {inst}
              </option>
            ))}
          </Select>

          <Select value={selectedSkill} onChange={(e) => setSelectedSkill(e.target.value)} className="text-xs">
            <option value="all">All Primary Skills</option>
            {allSkills.slice(0, 30).map((s: string) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>

        {(query ||
          selectedRole !== "all" ||
          selectedTechnicalRole !== "all" ||
          selectedInstitution !== "all" ||
          selectedSkill !== "all") && (
          <div className="flex items-center justify-between pt-2 border-t border-[#ECE5D8] text-xs text-[#5E646A]">
            <span>
              Showing {filteredProfiles.length} of {profiles.length} researchers
            </span>
            <button
              onClick={() => {
                setQuery("");
                setSelectedRole("all");
                setSelectedTechnicalRole("all");
                setSelectedInstitution("all");
                setSelectedSkill("all");
              }}
              className="text-[#8C6000] font-bold hover:underline cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>

      {/* Profile Grid */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#BD7D14]" />
        </div>
      ) : filteredProfiles.length === 0 ? (
        <EmptyState
          title="No Researchers Found"
          body="No campus profiles matched your current search filters. Try adjusting your role or department query."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setQuery("");
                setSelectedRole("all");
                setSelectedTechnicalRole("all");
                setSelectedInstitution("all");
                setSelectedSkill("all");
              }}
            >
              Reset Filters
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map((p) => {
            const isFacultyMember = !!p.designation || p.role === "faculty";
            const isSelf = user?.id === p.userId;

            const actionButton = !isSelf && (
              isFacultyMember ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenMentor(p)}
                  className="text-xs"
                >
                  <GraduationCap className="h-3.5 w-3.5 mr-1 text-[#8C6000]" /> Request Mentorship
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleOpenCollab(p)}
                  className="text-xs"
                >
                  <UserPlus className="h-3.5 w-3.5 mr-1" /> Connect / Collaborate
                </Button>
              )
            );

            return <PersonCard key={p.id} profile={p} action={actionButton} />;
          })}
        </div>
      )}

      {/* Direct Peer Collaboration Modal (Req 1) */}
      <Modal
        open={collabModalOpen}
        onClose={() => {
          setCollabModalOpen(false);
          setCollabError(null);
        }}
        title={`Connect & Collaborate with ${collabTarget?.fullName || "Peer"}`}
      >
        <form onSubmit={handleSendCollaboration} className="space-y-4">
          {collabSuccess ? (
            <div className="clay-card-cream p-4 text-xs text-[#2E7D32] border border-[#A5D6A7] text-center space-y-1">
              <p className="font-bold">Collaboration Request Sent!</p>
              <p>Once {collabTarget?.fullName} accepts, your private 1-on-1 chat will be active in Messages.</p>
            </div>
          ) : (
            <>
              {collabError && (
                <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                  {collabError}
                </div>
              )}

              <div className="clay-inset p-3.5 flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#FFF8DC] to-[#FFE680] text-[#7A4D00] border border-[#FFD040] flex items-center justify-center font-bold text-sm shadow-xs">
                  {collabTarget?.fullName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-serif font-bold text-[#181B1F] text-sm">{collabTarget?.fullName}</h4>
                  <p className="text-xs text-[#5E646A]">{collabTarget?.department} • {collabTarget?.institution}</p>
                  <p className="text-[11px] text-[#8C8372]">
                    Skills: {collabTarget?.skills.slice(0, 3).map((s) => s.skill).join(", ") || "General"}
                  </p>
                </div>
              </div>

              {ownedProjects.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#181B1F]">Collaboration Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCollabMode("direct")}
                      className={`clay-btn text-xs py-2 px-3 ${
                        collabMode === "direct"
                          ? "clay-btn-primary"
                          : "clay-btn-outline"
                      }`}
                    >
                      Direct 1-on-1 (No Project)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCollabMode("project")}
                      className={`clay-btn text-xs py-2 px-3 ${
                        collabMode === "project"
                          ? "clay-btn-primary"
                          : "clay-btn-outline"
                      }`}
                    >
                      Invite to Project Team
                    </button>
                  </div>
                </div>
              )}

              {collabMode === "project" && ownedProjects.length > 0 ? (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#181B1F]">Select Project You Own</label>
                  <Select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)}>
                    {ownedProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </Select>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#181B1F]">Role / Specialty to Collaborate On</label>
                  <Select value={collabRole} onChange={(e) => setCollabRole(e.target.value)}>
                    {ROLE_TEMPLATES.map((r) => (
                      <option key={r.name} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </Select>
                  <p className="text-[11px] text-[#8C8372]">
                    Collaborate on project ideas, hackathons, team formation, or technical interests without needing an existing project.
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#181B1F]">Personalized Invitation Message</label>
                <Textarea
                  rows={3}
                  placeholder="Share what topics, hackathons, or project domains you'd like to collaborate on..."
                  value={collabMsg}
                  onChange={(e) => setCollabMsg(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#ECE5D8]">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setCollabModalOpen(false);
                    setCollabError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={sendingCollab}>
                  {sendingCollab ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <UserPlus className="h-4 w-4 mr-1.5" />}
                  {collabMode === "project" ? "Send Project Invitation" : "Send Collaboration Request"}
                </Button>
              </div>
            </>
          )}
        </form>
      </Modal>

      {/* Faculty Mentorship Modal (Req 7) */}
      <Modal
        open={mentorModalOpen}
        onClose={() => setMentorModalOpen(false)}
        title={`Request Faculty Mentorship from Prof. ${mentorTarget?.fullName || "Faculty"}`}
      >
        <form onSubmit={handleSendMentorship} className="space-y-4">
          <div className="clay-inset p-3.5 border-[#FFE176] bg-[#FFF8D1]/70">
            <div className="flex items-center gap-2 text-xs font-bold text-[#7A5200]">
              <GraduationCap className="h-4 w-4 text-[#BD7D14]" />
              <span>Academic Mentorship & Guidance</span>
            </div>
            <p className="text-[11px] text-[#7A5200] mt-1 leading-relaxed">
              Professors can mentor independent student projects, research publications, or hackathon teams across departments within the academic institution.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#181B1F]">Guidance Domain / Research Topic</label>
            <Input
              value={mentorTopic}
              onChange={(e) => setMentorTopic(e.target.value)}
              placeholder="e.g. Distributed Consensus, Machine Learning Verification, Web Architecture"
              className="text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#181B1F]">Project Overview & Support Needed</label>
            <Textarea
              rows={4}
              value={mentorMsg}
              onChange={(e) => setMentorMsg(e.target.value)}
              placeholder="Explain your project goals, current status, and specific questions or guidance required from faculty..."
              className="text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#ECE5D8]">
            <Button variant="outline" type="button" onClick={() => setMentorModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={sendingMentor}>
              {sendingMentor ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <GraduationCap className="h-4 w-4 mr-1.5" />}
              Send Mentorship Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* Sign-in prompt modal */}
      <Modal open={signInPrompt} onClose={() => setSignInPrompt(false)} title="Sign In Required">
        <div className="space-y-4 text-xs text-[#5E646A]">
          <p>You must be signed in to connect with campus researchers or request faculty mentorship.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setSignInPrompt(false)}>
              Cancel
            </Button>
            <Link to="/login">
              <Button variant="primary">Sign In</Button>
            </Link>
          </div>
        </div>
      </Modal>
    </div>
  );
}
