import { useState, useMemo } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Field";
import { Badge, Card, Progress } from "@/components/ui/Card";
import { extractTextFromDocument, analyzeProjectDocument } from "@/lib/projectDocumentIntelligence";
import { createAcademicMiniProject } from "@/lib/supabase-db";
import { useToast } from "@/context/ToastContext";
import type { Profile, FacultyTeamAssignment } from "@/types";
import { ROLE_TEMPLATES } from "@/types";
import {
  Sparkles,
  Upload,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Crown,
  ShieldCheck,
  Check,
} from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  facultyId: string;
  allProfiles: Profile[];
  onCreated: () => void;
}

export function AcademicProjectCreatorModal({
  open,
  onClose,
  facultyId,
  allProfiles,
  onCreated,
}: Props) {
  const toast = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Project Metadata & Document
  const [title, setTitle] = useState("Academic Mini-Project: Distributed Cloud Telemetry");
  const [department, setDepartment] = useState("Computer Science & Engineering");
  const [classSection, setClassSection] = useState("3rd Year - Section A");
  const [problemStatement, setProblemStatement] = useState(
    "Design and deploy an asynchronous distributed service telemetry pipeline with secure authentication and database persistence."
  );
  const [requiredSkills, setRequiredSkills] = useState<string[]>(["React", "Node.js", "Python", "SQL"]);
  const [objectives, setObjectives] = useState<string[]>([
    "Implement client visualization dashboard",
    "Engineer secure RESTful ingestion APIs",
    "Deploy optimized relational database schema",
    "Compile comprehensive architectural documentation",
  ]);
  const [missingRequirements, setMissingRequirements] = useState<string[]>([]);
  const [docAnalyzing, setDocAnalyzing] = useState(false);
  const [uploadedDocName, setUploadedDocName] = useState<string | null>(null);

  // Step 2: Multi-Team Configuration (Req 2)
  const [numTeams, setNumTeams] = useState<number>(1);
  const [teams, setTeams] = useState<FacultyTeamAssignment[]>([
    { teamName: "Team Alpha", students: [] },
  ]);

  // Student search for selection
  const [studentSearch, setStudentSearch] = useState("");
  const [activeTeamIdx, setActiveTeamIdx] = useState(0);

  // Step 3: AI Review & Confirmation
  const [creating, setCreating] = useState(false);

  // Registered eligible students (excluding faculty)
  const eligibleStudents = useMemo(() => {
    return allProfiles.filter((p) => !p.designation && p.role !== "faculty");
  }, [allProfiles]);

  const searchedStudents = useMemo(() => {
    if (!studentSearch.trim()) return eligibleStudents.slice(0, 8);
    const q = studentSearch.toLowerCase();
    return eligibleStudents.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q) ||
        s.skills.some((sk) => sk.skill.toLowerCase().includes(q))
    ).slice(0, 10);
  }, [eligibleStudents, studentSearch]);

  // Handle Document Upload & AI Analysis (Req 2)
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocAnalyzing(true);
    setUploadedDocName(file.name);

    try {
      const text = await extractTextFromDocument(file);
      const extracted = analyzeProjectDocument(text, file.name, "prd");

      setTitle(extracted.title || file.name.replace(/\.[^/.]+$/, ""));
      setProblemStatement(extracted.problemStatement);
      setRequiredSkills(extracted.requiredSkills);
      setObjectives(extracted.objectives);
      setMissingRequirements(extracted.missingOrAmbiguous);

      toast.success(
        "AI Document Analysis Complete",
        `Extracted ${extracted.requiredSkills.length} skills, ${extracted.objectives.length} objectives, and ${extracted.suggestedRoles.length} roles.`
      );
    } catch (err: any) {
      toast.error("Document analysis error", err?.message || "Failed to parse document text.");
    } finally {
      setDocAnalyzing(false);
    }
  };

  // Adjust team count
  const handleSetTeamCount = (count: number) => {
    const clamped = Math.max(1, Math.min(4, count));
    setNumTeams(clamped);
    const updated: FacultyTeamAssignment[] = [];
    const names = ["Team Alpha", "Team Beta", "Team Gamma", "Team Delta"];
    for (let i = 0; i < clamped; i++) {
      updated.push(teams[i] || { teamName: names[i] || `Team ${i + 1}`, students: [] });
    }
    setTeams(updated);
    if (activeTeamIdx >= clamped) {
      setActiveTeamIdx(0);
    }
  };

  // Add student to active team
  const handleAddStudentToTeam = (student: Profile) => {
    const activeTeams = teams.slice(0, numTeams);
    const currentTeam = activeTeams[activeTeamIdx];
    if (!currentTeam) return;

    // Check if student already in this team
    if (currentTeam.students.some((s) => s.userId === student.userId)) {
      toast.info("Already in team", `${student.fullName} is already assigned to this team.`);
      return;
    }

    const defaultRole = student.preferredRoles[0] || "Frontend Developer";
    const isFirstMember = currentTeam.students.length === 0;

    const updated = [...teams];
    updated[activeTeamIdx] = {
      ...currentTeam,
      students: [
        ...currentTeam.students,
        {
          userId: student.userId,
          fullName: student.fullName,
          roleName: defaultRole,
          isLead: isFirstMember,
        },
      ],
    };
    setTeams(updated);
  };

  const handleRemoveStudentFromTeam = (teamIdx: number, studentId: string) => {
    const updated = [...teams];
    const team = updated[teamIdx];
    if (!team) return;
    updated[teamIdx] = {
      ...team,
      students: team.students.filter((s) => s.userId !== studentId),
    };
    setTeams(updated);
  };

  const handleSetStudentRole = (teamIdx: number, studentId: string, roleName: string) => {
    const updated = [...teams];
    const team = updated[teamIdx];
    if (!team) return;
    updated[teamIdx] = {
      ...team,
      students: team.students.map((s) => (s.userId === studentId ? { ...s, roleName } : s)),
    };
    setTeams(updated);
  };

  const handleSetStudentLead = (teamIdx: number, studentId: string) => {
    const updated = [...teams];
    const team = updated[teamIdx];
    if (!team) return;
    updated[teamIdx] = {
      ...team,
      students: team.students.map((s) => ({ ...s, isLead: s.userId === studentId })),
    };
    setTeams(updated);
  };

  // Step 3: AI Team-to-Project Compatibility Review (Req 3)
  const aiCompatibilityReview = useMemo(() => {
    const activeTeams = teams.slice(0, numTeams);
    const coreRoles = ["frontend developer", "backend developer", "database developer"];

    const reviews = activeTeams.map((team) => {
      const assignedUserIds = new Set(team.students.map((s) => s.userId));
      const studentProfiles = eligibleStudents.filter((p) => assignedUserIds.has(p.userId));

      if (team.students.length === 0) {
        return {
          teamName: team.teamName,
          compatibilityScore: 0,
          missingSkills: requiredSkills,
          missingRoles: ["Frontend Developer", "Backend Developer", "Database Developer"],
          mismatches: [],
          hasLead: false,
        };
      }

      const coveredSkills = new Set(
        studentProfiles.flatMap((p) => (p.skills || []).map((s) => s.skill.toLowerCase()))
      );

      const missingSkills = requiredSkills.filter(
        (req) => !coveredSkills.has(req.toLowerCase())
      );

      const assignedRoleNames = new Set(team.students.map((s) => s.roleName.toLowerCase()));
      const missingRoles = coreRoles.filter((r) => !assignedRoleNames.has(r));

      // Skill mismatches: check if assigned student has evidence for assigned role
      const mismatches: Array<{ studentName: string; assignedRole: string; reason: string }> = [];
      let studentsWithEvidence = 0;

      for (const st of team.students) {
        const prof = studentProfiles.find((p) => p.userId === st.userId);
        if (!prof) continue;

        if (prof.skills && prof.skills.length > 0) {
          studentsWithEvidence++;
        } else {
          mismatches.push({
            studentName: st.fullName,
            assignedRole: st.roleName,
            reason: "Insufficient profile evidence: Student has not declared technical skills yet (advisory only).",
          });
          continue;
        }

        const roleLower = st.roleName.toLowerCase();
        if (
          roleLower.includes("backend") &&
          !prof.skills.some((s) =>
            ["node", "express", "python", "sql", "django", "fastapi", "postgres", "api"].some((k) =>
              s.skill.toLowerCase().includes(k)
            )
          )
        ) {
          mismatches.push({
            studentName: st.fullName,
            assignedRole: st.roleName,
            reason: "Declared skills focus on other domains; limited verified backend evidence.",
          });
        }
        if (
          roleLower.includes("ai") &&
          !prof.skills.some((s) =>
            ["python", "pytorch", "tensorflow", "ml", "nlp", "vision", "scikit"].some((k) =>
              s.skill.toLowerCase().includes(k)
            )
          )
        ) {
          mismatches.push({
            studentName: st.fullName,
            assignedRole: st.roleName,
            reason: "Profile lacks demonstrated Python/ML library experience for advanced modeling.",
          });
        }
      }

      // Deterministic, data-driven calculation
      const skillRatio = requiredSkills.length > 0 ? (requiredSkills.length - missingSkills.length) / requiredSkills.length : 1;
      const roleRatio = (coreRoles.length - missingRoles.length) / coreRoles.length;
      const hasLead = team.students.some((s) => s.isLead);
      const evidenceRatio = team.students.length > 0 ? studentsWithEvidence / team.students.length : 0;

      const score = Math.round(skillRatio * 40) + Math.round(roleRatio * 35) + (hasLead ? 15 : 0) + Math.round(evidenceRatio * 10);
      const compatibilityScore = Math.max(25, Math.min(100, score));

      return {
        teamName: team.teamName,
        compatibilityScore,
        missingSkills,
        missingRoles,
        mismatches,
        hasLead,
      };
    });

    const avgScore = reviews.length > 0
      ? Math.round(reviews.reduce((acc, r) => acc + r.compatibilityScore, 0) / reviews.length)
      : 0;

    return {
      avgScore,
      reviews,
      isLiveAI: false,
      engineName: "Deterministic Data-Driven Engine",
    };
  }, [teams, numTeams, eligibleStudents, requiredSkills]);

  // Finalize & Create Project (Req 2 & 3)
  const handleFinalizeProject = async () => {
    // Basic validations
    if (!title.trim() || title.trim().length < 5) {
      toast.error("Missing Title", "Please enter an academic project title (at least 5 characters).");
      return;
    }

    const activeTeams = teams.slice(0, numTeams);
    const totalAssigned = activeTeams.reduce((acc, t) => acc + t.students.length, 0);
    if (totalAssigned === 0) {
      toast.error("No Students Assigned", "Assign at least one student to a team before creating.");
      return;
    }

    setCreating(true);
    try {
      await createAcademicMiniProject(
        facultyId,
        {
          title: title.trim(),
          shortDescription: `${title} — Academic coursework project for ${classSection} (${department}).`,
          detailedDescription: `### Academic Coursework Project\n**Class & Section:** ${classSection}\n**Department:** ${department}\n\n### Problem Statement\n${problemStatement}\n\n### Expected Objectives\n${objectives.map((o) => `• ${o}`).join("\n")}`,
          problemStatement,
          objectives,
          domains: [department],
          requiredSkills,
        },
        activeTeams
      );

      toast.success(
        "Academic Mini-Project Created!",
        `Successfully organized ${activeTeams.length} team${activeTeams.length !== 1 ? "s" : ""} with ${totalAssigned} assigned student${totalAssigned !== 1 ? "s" : ""}.`
      );
      onCreated();
      onClose();
    } catch (err: any) {
      console.error("Project creation error:", err);
      toast.error("Creation failed", err?.message || "Could not finalize academic project. Please verify entries and retry.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Academic Mini-Project & Configure Teams (Faculty Workspace)"
    >
      <div className="space-y-5">
        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-ink-100 pb-3 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs ${
                step === 1 ? "bg-navy text-white" : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {step > 1 ? <Check className="h-3.5 w-3.5" /> : "1"}
            </span>
            <span className={step === 1 ? "font-bold text-ink" : "text-ink-500"}>Project & Brief</span>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-ink-300" />
          <div className="flex items-center gap-2">
            <span
              className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs ${
                step === 2 ? "bg-navy text-white" : step > 2 ? "bg-emerald-100 text-emerald-800" : "bg-ink-100 text-ink-600"
              }`}
            >
              {step > 2 ? <Check className="h-3.5 w-3.5" /> : "2"}
            </span>
            <span className={step === 2 ? "font-bold text-ink" : "text-ink-500"}>Multi-Team Setup</span>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-ink-300" />
          <div className="flex items-center gap-2">
            <span
              className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs ${
                step === 3 ? "bg-navy text-white" : "bg-ink-100 text-ink-600"
              }`}
            >
              3
            </span>
            <span className={step === 3 ? "font-bold text-ink" : "text-ink-500"}>AI Compatibility Review</span>
          </div>
        </div>

        {/* STEP 1: PROJECT METADATA & BRIEF UPLOAD (REQ 2) */}
        {step === 1 && (
          <div className="space-y-4">
            {/* AI Document Intelligence Uploader */}
            <div className="rounded-xl border border-dashed border-navy-200 bg-navy-50/30 p-4 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-navy">
                <Sparkles className="h-4 w-4" />
                <span>Upload Project Brief, PRD, PPT, or PDF (AI Requirement Extraction)</span>
              </div>
              <p className="text-[11px] text-ink-500 max-w-md mx-auto">
                The configured AI service will automatically analyze the document and identify project objectives, technical skills, recommended roles, and missing information.
              </p>
              <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-semibold cursor-pointer hover:bg-navy-800 transition shadow-xs">
                {docAnalyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                <span>{uploadedDocName ? `Re-upload (${uploadedDocName})` : "Upload Document"}</span>
                <input
                  type="file"
                  accept=".pdf,.txt,.md,.json,.doc,.docx,.ppt,.pptx"
                  className="hidden"
                  onChange={handleDocumentUpload}
                  disabled={docAnalyzing}
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-ink-800">Department</label>
                <Input value={department} onChange={(e) => setDepartment(e.target.value)} className="text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-ink-800">Class & Section</label>
                <Input value={classSection} onChange={(e) => setClassSection(e.target.value)} className="text-xs" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink-800">Academic Project Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-xs font-semibold" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink-800">Problem Statement & Scope</label>
              <Textarea
                rows={3}
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink-800">Required Technical Skills</label>
              <div className="flex flex-wrap gap-1.5">
                {requiredSkills.map((sk) => (
                  <Badge key={sk} tone="navy">
                    {sk}
                  </Badge>
                ))}
              </div>
            </div>

            {missingRequirements.length > 0 && (
              <div className="rounded-lg bg-amber-50 p-3 border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-amber-800">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>AI Detected Missing / Ambiguous Information in Brief</span>
                </div>
                {missingRequirements.map((m, idx) => (
                  <p key={idx} className="text-[11px] leading-tight text-amber-800">• {m}</p>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-ink-50">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" onClick={() => setStep(2)}>
                Next: Configure Teams →
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: MULTI-TEAM SETUP & STUDENT SELECTION (REQ 2) */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-paper-50 p-3 rounded-xl border border-ink-100">
              <div>
                <h4 className="font-serif font-bold text-ink text-sm">Number of Teams for Academic Activity</h4>
                <p className="text-[11px] text-ink-500">
                  e.g., create 2 to 4 student teams (e.g. 5 students per team) under this project.
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleSetTeamCount(num)}
                    className={`h-8 w-8 rounded-lg font-bold text-xs transition ${
                      numTeams === num
                        ? "bg-navy text-white shadow-2xs"
                        : "bg-white border border-ink-100 text-ink-600 hover:bg-paper-100"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Team Tabs */}
            <div className="flex gap-2 border-b border-ink-100 pb-2 overflow-x-auto">
              {teams.slice(0, numTeams).map((t, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveTeamIdx(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                    activeTeamIdx === idx
                      ? "bg-navy text-white shadow-xs"
                      : "bg-paper-100 text-ink-600 hover:bg-paper-200"
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>{t.teamName}</span>
                  <span className="rounded-full bg-white/20 text-white px-1.5 text-[10px]">
                    {t.students.length}
                  </span>
                </button>
              ))}
            </div>

            {/* Active Team Student Roster */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink uppercase tracking-wider">
                  Assigned to {teams[activeTeamIdx]?.teamName} ({teams[activeTeamIdx]?.students.length} students)
                </span>
                <span className="text-[11px] text-ink-400">
                  Select Team Leader with the <Crown className="h-3 w-3 inline text-amber-500" /> icon
                </span>
              </div>

              {teams[activeTeamIdx]?.students.length === 0 ? (
                <div className="p-6 border border-dashed border-ink-200 rounded-xl text-center text-xs text-ink-400">
                  No students assigned to {teams[activeTeamIdx]?.teamName} yet. Search and select students below.
                </div>
              ) : (
                <div className="space-y-2">
                  {teams[activeTeamIdx]?.students.map((st) => (
                    <div
                      key={st.userId}
                      className="p-2.5 rounded-xl border border-ink-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSetStudentLead(activeTeamIdx, st.userId)}
                          className={`p-1.5 rounded-lg border transition ${
                            st.isLead
                              ? "bg-amber-50 border-amber-300 text-amber-700 font-bold"
                              : "border-ink-100 text-ink-300 hover:text-amber-600"
                          }`}
                          title={st.isLead ? "Team Leader" : "Make Team Leader"}
                        >
                          <Crown className="h-4 w-4" />
                        </button>
                        <div>
                          <span className="font-semibold text-xs text-ink">{st.fullName}</span>
                          {st.isLead && (
                            <span className="ml-1.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">
                              Leader
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Select
                          value={st.roleName}
                          onChange={(e) => handleSetStudentRole(activeTeamIdx, st.userId, e.target.value)}
                          className="text-xs py-1"
                        >
                          {ROLE_TEMPLATES.map((r) => (
                            <option key={r.name} value={r.name}>
                              {r.name}
                            </option>
                          ))}
                        </Select>
                        <button
                          type="button"
                          onClick={() => handleRemoveStudentFromTeam(activeTeamIdx, st.userId)}
                          className="text-xs text-red-600 hover:underline px-2"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Student Search & Add Picker */}
            <div className="space-y-2 pt-2 border-t border-ink-100">
              <label className="text-xs font-semibold text-ink-800">
                Search & Add Registered Students to {teams[activeTeamIdx]?.teamName}
              </label>
              <Input
                placeholder="Search by student name, department, or skill (e.g. PyTorch, React, SQL)..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="text-xs"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pt-1">
                {searchedStudents.map((s) => {
                  const isAssigned = teams[activeTeamIdx]?.students.some((st) => st.userId === s.userId);
                  return (
                    <div
                      key={s.userId}
                      className="p-2 rounded-lg border border-ink-100 bg-paper-50/50 flex items-center justify-between text-xs"
                    >
                      <div className="truncate mr-2">
                        <p className="font-semibold text-ink truncate">{s.fullName}</p>
                        <p className="text-[10px] text-ink-400 truncate">
                          {s.department} • {s.skills.slice(0, 2).map((sk) => sk.skill).join(", ")}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={isAssigned ? "outline" : "secondary"}
                        disabled={isAssigned}
                        onClick={() => handleAddStudentToTeam(s)}
                        className="text-xs shrink-0 py-0.5 px-2.5"
                      >
                        {isAssigned ? "Added" : "+ Add"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-ink-50">
              <Button variant="outline" type="button" onClick={() => setStep(1)}>
                <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
              </Button>
              <Button type="button" onClick={() => setStep(3)}>
                Next: AI Compatibility Review →
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: AI TEAM-TO-PROJECT COMPATIBILITY REVIEW (REQ 3) */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-navy-200 bg-navy-50/40 p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-navy" />
                  <h4 className="font-serif font-bold text-ink text-sm">
                    AI Project-Team Compatibility Score: {aiCompatibilityReview.avgScore}%
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="navy" className="text-[10px]">
                    {aiCompatibilityReview.isLiveAI ? "Live AI Analysis" : "Data-Driven Fallback Engine"}
                  </Badge>
                  <Badge tone={aiCompatibilityReview.avgScore >= 75 ? "green" : "amber"}>
                    {aiCompatibilityReview.avgScore >= 75 ? "Strong Role Alignment" : "Advisory Warnings Detected"}
                  </Badge>
                </div>
              </div>
              <Progress value={aiCompatibilityReview.avgScore} />
              <p className="text-[11px] text-ink-600">
                AI evaluated team member profiles, required technical skills, and role assignments. Missing profile information is treated as insufficient evidence, not proof that a student lacks a skill. Advisory warnings do not block project creation.
              </p>
            </div>

            {/* Per-Team Review */}
            <div className="space-y-3">
              {aiCompatibilityReview.reviews.map((rev, idx) => (
                <Card key={idx} className="p-4 space-y-3 border-ink-100 bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-serif font-bold text-ink text-sm">{rev.teamName}</h5>
                      <span className="text-[11px] text-ink-400">
                        {teams[idx]?.students.length} students assigned
                      </span>
                    </div>
                    <Badge tone={rev.compatibilityScore >= 75 ? "green" : "navy"}>
                      Team Match: {rev.compatibilityScore}%
                    </Badge>
                  </div>

                  {!rev.hasLead && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                      <span>Warning: No team leader has been selected for this team.</span>
                    </div>
                  )}

                  {rev.missingRoles.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                      <span>
                        Missing or Insufficiently Covered Roles: {rev.missingRoles.map((r) => r.toUpperCase()).join(", ")}
                      </span>
                    </div>
                  )}

                  {rev.mismatches.map((m, mIdx) => (
                    <div key={mIdx} className="text-xs bg-paper-50 p-2.5 rounded border border-ink-100 space-y-0.5">
                      <p className="font-semibold text-ink">
                        Suggested Role Adjustment for {m.studentName} ({m.assignedRole})
                      </p>
                      <p className="text-ink-600 text-[11px]">{m.reason}</p>
                    </div>
                  ))}

                  {rev.missingSkills.length === 0 && rev.mismatches.length === 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-100">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      <span>Excellent skill coverage and role balance across all project requirements.</span>
                    </div>
                  )}
                </Card>
              ))}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-ink-50">
              <Button variant="outline" type="button" onClick={() => setStep(2)}>
                <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Edit Assignments
              </Button>
              <Button type="button" onClick={handleFinalizeProject} disabled={creating}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <ShieldCheck className="h-4 w-4 mr-1.5" />}
                Confirm & Create Academic Mini-Project
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
