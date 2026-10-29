import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  createProject,
  fetchResearchInterestsFromDB,
  uploadDocument,
} from "@/lib/supabase-db";
import { newRole } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Card, Progress } from "@/components/ui/Card";
import { Field, Input, Textarea, Select } from "@/components/ui/Field";
import { SkillSelector } from "@/components/ui/SkillSelector";
import { TagSelector } from "@/components/ui/TagSelector";
import {
  extractTextFromDocument,
  analyzeProjectDocument,
  DOCUMENT_PURPOSE_LABELS,
  type DocumentPurpose,
  type ExtractedProjectRequirements,
} from "@/lib/projectDocumentIntelligence";
import { RESEARCH_DOMAINS } from "@/lib/taxonomies";
import {
  PROJECT_TYPES,
  ROLE_TEMPLATES,
  type ProjectType,
  type Difficulty,
  type ProjectVisibility,
  type ProjectRole,
} from "@/types";
import {
  FolderPlus,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Loader2,
  Check,
  Upload,
  AlertCircle,
  FileCheck,
  X,
  Users,
  Layers,
  CheckCircle2,
} from "lucide-react";

export function ProjectCreate() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const isFaculty = profile?.role === "faculty";

  // Wizard Step State
  const [currentStep, setCurrentStep] = useState(1);

  // Form State: Step 1 Essentials
  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [type, setType] = useState<ProjectType>(
    isFaculty ? "Faculty-Led Research" : "Academic Project"
  );
  const [domains, setDomains] = useState<string[]>(["Artificial Intelligence"]);
  const [difficulty, setDifficulty] = useState<Difficulty>("intermediate");
  const [visibility, setVisibility] = useState<ProjectVisibility>("public");

  // Form State: Step 2 Document Intelligence & Analysis
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docPurpose, setDocPurpose] = useState<DocumentPurpose>("prd");
  const [analyzingDoc, setAnalyzingDoc] = useState(false);
  const [docAnalysisStep, setDocAnalysisStep] = useState<string>("");
  const [extractedReqs, setExtractedReqs] = useState<ExtractedProjectRequirements | null>(null);
  const [docApplied, setDocApplied] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Form State: Step 3 Roles & Required Skills
  const [requiredSkills, setRequiredSkills] = useState<string[]>(["Python", "PyTorch"]);
  const [roles, setRoles] = useState<ProjectRole[]>([
    newRole({
      name: "Lead Developer / Researcher",
      description: "Directs system architecture, prototyping, and benchmark evaluations.",
      requiredSkills: ["Python"],
      openings: 1,
    }),
  ]);
  const [teamMin, setTeamMin] = useState(2);
  const [teamMax, setTeamMax] = useState(5);
  const [mentorRequired, setMentorRequired] = useState(true);

  // Form State: Step 4 Timeline & Deliverables
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10)
  );
  const [duration, setDuration] = useState("3 months");
  const [expectedOutcomes, setExpectedOutcomes] = useState("Working prototype, paper draft & demo repository");
  const [problemStatement, setProblemStatement] = useState("");
  const [detailedDescription, setDetailedDescription] = useState("");
  const [objectives, setObjectives] = useState<string[]>([
    "Review domain literature and identify benchmark baselines",
    "Implement prototype architecture and conduct reproducible trials",
  ]);
  const [newObjective, setNewObjective] = useState("");
  const [githubRequired, setGithubRequired] = useState(true);
  const [tagsInput, setTagsInput] = useState("research, ai, collaboration");

  const [allDomains, setAllDomains] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchResearchInterestsFromDB().then((res) => {
      if (!cancelled && res?.length) setAllDomains(res);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-navy-50 text-navy">
          <FolderPlus className="h-6 w-6" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-ink">Authentication Required</h2>
        <p className="mt-2 text-sm text-ink-500">
          Please sign in to your institutional account to propose a research project.
        </p>
        <div className="mt-6">
          <Link to="/login">
            <Button>Sign In to Continue</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Handle Document Selection with Validation (27.5)
  const handleFileSelect = (file: File) => {
    setFileError(null);
    setDocApplied(false);
    setExtractedReqs(null);

    // Validate size (max 25MB)
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setFileError("File exceeds the 25MB size limit. Please upload a compressed document.");
      return;
    }

    // Validate type
    const validExtensions = [".pdf", ".docx", ".doc", ".txt", ".md", ".pptx", ".ppt"];
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(ext)) {
      setFileError(
        `Unsupported format (${ext}). Supported formats: PDF, DOCX, TXT, Markdown, and PPTX.`
      );
      return;
    }

    setDocFile(file);
    toast.info("Document loaded", `${file.name} ready for AI Requirement Intelligence.`);
  };

  // Run AI Requirement Analysis (27.5)
  const handleAnalyzeDocument = async () => {
    if (!docFile) return;
    setAnalyzingDoc(true);
    setError(null);
    setDocAnalysisStep("Reading document structure & text stream...");

    try {
      await new Promise((r) => setTimeout(r, 350));
      setDocAnalysisStep("Extracting problem statement & research objectives...");
      const text = await extractTextFromDocument(docFile);

      await new Promise((r) => setTimeout(r, 400));
      setDocAnalysisStep("Detecting tech stack, skills & deriving team roles...");
      const analysis = analyzeProjectDocument(text, docFile.name, docPurpose);

      setExtractedReqs(analysis);
      setDocAnalysisStep("Requirements extracted successfully!");
      toast.success(
        "AI Analysis Complete",
        `Extracted problem statement, ${analysis.requiredSkills.length} skills, and suggested roles.`
      );
    } catch (err: any) {
      setError(err?.message || "Failed to analyze document.");
      toast.error("Analysis Failed", err?.message);
    } finally {
      setAnalyzingDoc(false);
    }
  };

  // Auto-populate form with extracted requirements
  const handleApplyExtractedReqs = () => {
    if (!extractedReqs) return;
    if (extractedReqs.title) setTitle(extractedReqs.title);
    if (extractedReqs.shortDescription) setShortDescription(extractedReqs.shortDescription);
    if (extractedReqs.detailedDescription) setDetailedDescription(extractedReqs.detailedDescription);
    if (extractedReqs.problemStatement) setProblemStatement(extractedReqs.problemStatement);
    if (extractedReqs.objectives?.length) setObjectives(extractedReqs.objectives);
    if (extractedReqs.requiredSkills?.length) setRequiredSkills(extractedReqs.requiredSkills);
    if (extractedReqs.suggestedRoles?.length) {
      setRoles(
        extractedReqs.suggestedRoles.map((r) =>
          newRole({
            name: r.name,
            description: r.description,
            requiredSkills: r.requiredSkills,
            openings: r.openings || 1,
          })
        )
      );
    }
    setDocApplied(true);
    toast.success("Requirements Applied", "Project title, skills, objectives, and roles have been updated.");
  };

  // Objective helpers
  const addObjective = () => {
    if (!newObjective.trim()) return;
    setObjectives([...objectives, newObjective.trim()]);
    setNewObjective("");
  };

  const removeObjective = (index: number) => {
    setObjectives(objectives.filter((_, i) => i !== index));
  };

  // Role helpers
  const addTemplateRole = (templateName: string) => {
    const t = ROLE_TEMPLATES.find((r) => r.name === templateName);
    if (!t) return;
    setRoles([
      ...roles,
      newRole({
        name: t.name,
        description: t.description,
        requiredSkills: [t.name.split(" ")[0]],
        openings: 1,
      }),
    ]);
  };

  const removeRole = (id: string) => {
    setRoles(roles.filter((r) => r.id !== id));
  };

  const updateRole = (id: string, patch: Partial<ProjectRole>) => {
    setRoles(roles.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  // Step Validation & Navigation
  const validateStep = (stepNum: number) => {
    if (stepNum === 1) {
      if (title.trim().length < 5) {
        toast.warning("Title too short", "Project title must be at least 5 characters.");
        return false;
      }
      if (shortDescription.trim().length < 15) {
        toast.warning("Description needed", "Please provide a brief pitch (at least 15 characters).");
        return false;
      }
      if (domains.length === 0) {
        toast.warning("Domain required", "Please select at least 1 research domain.");
        return false;
      }
    }
    if (stepNum === 3) {
      if (requiredSkills.length === 0) {
        toast.warning("Skills required", "Please specify at least 1 required technical skill.");
        return false;
      }
      if (roles.length === 0) {
        toast.warning("Roles required", "Please specify at least 1 team role.");
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(4, prev + 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Final Publish Project
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(3)) return;

    setLoading(true);
    setError(null);
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const created = await createProject(user.id, {
        title,
        shortDescription,
        detailedDescription: detailedDescription || shortDescription,
        problemStatement: problemStatement || shortDescription,
        objectives,
        domains,
        interests: domains,
        requiredSkills,
        roles,
        teamMin: Number(teamMin),
        teamMax: Number(teamMax),
        duration,
        difficulty,
        type,
        visibility,
        deadline,
        expectedOutcomes,
        mentorRequired,
        githubRequired,
        tags,
      });

      // Upload Document to Real Storage if provided (27.5, 27.12)
      if (docFile && created?.id) {
        try {
          await uploadDocument(user.id, created.id, {
            name: docFile.name,
            type: docFile.type || "application/octet-stream",
            size: docFile.size,
            blob: docFile,
            access: "members",
          });
        } catch (docErr) {
          console.warn("Storage upload notice:", docErr);
        }
      }

      toast.success(
        "Project Created Successfully!",
        `"${title}" has been launched. Redirecting to workspace...`
      );
      navigate(`/projects/${created.id}/room`);
    } catch (err: any) {
      setError(err?.message || "Failed to create project");
      toast.error("Creation Failed", err?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="clay-page max-w-4xl space-y-6">
      {/* Header and Back Link */}
      <div className="clay-welcome-banner clay-neural-bg p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              to="/projects"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8C6000] hover:text-[#6E4B00] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Projects Directory
            </Link>
            <span className="text-xs text-[#8C8372]">•</span>
            <span className="clay-badge clay-badge-gold">
              {isFaculty ? "Faculty Research Initiative" : "Student Project Proposal"}
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#181B1F] tracking-tight leading-tight">
            {isFaculty ? "Launch Research Project & Team" : "Create Collaboration Project"}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#5E646A] leading-relaxed">
            Define objectives, attach project specs for AI extraction, and recruit student collaborators.
          </p>
        </div>
      </div>

      {/* 4-Step Guided Wizard Navigation Bar (27.5) */}
      <div className="grid grid-cols-4 gap-2 rounded-2xl bg-white/70 p-1.5 border border-[#ECE5D8] shadow-xs">
        {[
          { num: 1, label: "Essentials", icon: Layers },
          { num: 2, label: "Document AI", icon: Sparkles },
          { num: 3, label: "Team & Skills", icon: Users },
          { num: 4, label: "Review & Launch", icon: CheckCircle2 },
        ].map((s) => {
          const isDone = currentStep > s.num;
          const isCurrent = currentStep === s.num;
          const Icon = s.icon;

          return (
            <button
              key={s.num}
              type="button"
              onClick={() => {
                if (isDone || validateStep(currentStep)) setCurrentStep(s.num);
              }}
              className={`flex flex-col items-center sm:items-start p-2.5 rounded-xl text-left transition-all ${
                isCurrent
                  ? "clay-btn-primary py-2 px-3 shadow-gold-sm"
                  : isDone
                  ? "bg-[#FFFBEA] text-[#8C6000] border border-[#FFE785]"
                  : "text-[#7B828A] opacity-60 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold">
                {isDone ? (
                  <Check className="h-3.5 w-3.5 text-[#8C6000]" />
                ) : (
                  <Icon className={`h-3.5 w-3.5 ${isCurrent ? "text-[#181B1F]" : "text-[#7B828A]"}`} />
                )}
                <span>Step {s.num}</span>
              </div>
              <span className="hidden sm:block text-xs font-extrabold mt-0.5 truncate">
                {s.label}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* =========================================================================
          STEP 1: ESSENTIALS (Title, Pitch, Type, Domains)
          ========================================================================= */}
      {currentStep === 1 && (
        <div className="clay-card p-6 sm:p-8 space-y-6">
          <div className="border-b border-[#ECE5D8] pb-3">
            <h2 className="font-serif text-xl font-bold text-[#181B1F]">1. Project Essentials</h2>
            <p className="text-xs text-[#5E646A]">Provide the core identity and academic scope</p>
          </div>

          <Field label="Project Title" required helper="A concise, descriptive headline for this research or engineering endeavor">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Multimodal Foundation Models for Real-Time Robot Navigation"
              required
            />
          </Field>

          <Field label="Short Pitch / Summary" required helper="Explain the core objective and impact in 1-2 sentences">
            <Textarea
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              rows={3}
              placeholder="Building an open-source vision-language navigation harness that translates natural language commands into robot actuator paths with sub-50ms latency..."
              required
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Project Classification" required>
              <Select value={type} onChange={(e) => setType(e.target.value as ProjectType)}>
                {PROJECT_TYPES.map((pt) => (
                  <option key={pt} value={pt}>
                    {pt}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Difficulty Level">
              <Select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              >
                <option value="beginner">Beginner Friendly</option>
                <option value="intermediate">Intermediate (Standard)</option>
                <option value="advanced">Advanced / Research Grade</option>
              </Select>
            </Field>
          </div>

          <Field label="Project Visibility">
            <Select value={visibility} onChange={(e) => setVisibility(e.target.value as ProjectVisibility)}>
              <option value="public">Public (Open for campus discovery)</option>
              <option value="restricted">Restricted (Institution only)</option>
              <option value="private">Private (Invite only)</option>
            </Select>
          </Field>

          {/* Research Domains using TagSelector */}
          <TagSelector
            label="Research Domains & Focus Areas"
            value={domains}
            onChange={(updated) => setDomains(updated)}
            availableOptions={allDomains.length ? allDomains : RESEARCH_DOMAINS}
            popularSuggestions={RESEARCH_DOMAINS.slice(0, 8)}
            placeholder="Search domain, e.g. Artificial Intelligence, Robotics, Cloud..."
            helperText="Pick 1-4 domains to ensure targeted student talent recommendations"
          />

          <div className="flex justify-end pt-4 border-t border-ink-100">
            <Button type="button" onClick={nextStep}>
              Next: Document Intelligence <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 2: DOCUMENT INTELLIGENCE & AI EXTRACTION (27.5)
          ========================================================================= */}
      {currentStep === 2 && (
        <Card className="p-6 sm:p-8 space-y-6 shadow-card">
          <div className="border-b border-ink-100 pb-3">
            <h2 className="font-serif text-xl font-bold text-ink flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brass" />
              2. Document Upload & AI Requirement Intelligence
            </h2>
            <p className="text-xs text-ink-500">
              Upload a Project Requirements Document (PRD), PDF, syllabus, or slide deck. Our AI engine extracts
              problem statements, required skill taxonomies, and recommends team roles.
            </p>
          </div>

          {/* Purpose Selector */}
          <Field label="Document Category">
            <Select
              value={docPurpose}
              onChange={(e) => setDocPurpose(e.target.value as DocumentPurpose)}
            >
              {Object.entries(DOCUMENT_PURPOSE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>

          {/* Real Upload Dropzone (27.5, 27.12) */}
          <div
            className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all ${
              docFile
                ? "border-emerald-300 bg-emerald-50/40"
                : "border-[#FFE785] clay-card-cream hover:border-[#FFC812]"
            }`}
          >
            {docFile ? (
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 shadow-xs">
                  <FileCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-ink">{docFile.name}</p>
                  <p className="text-xs text-ink-500">
                    {(docFile.size / 1024 / 1024).toFixed(2)} MB • {docFile.type || "Document"}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAnalyzeDocument}
                    loading={analyzingDoc}
                    disabled={analyzingDoc}
                  >
                    <Sparkles className="h-4 w-4 mr-1 text-[#FAB23D]" />
                    {extractedReqs ? "Re-Run AI Analysis" : "Analyze Document with AI"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDocFile(null);
                      setExtractedReqs(null);
                      setDocApplied(false);
                    }}
                  >
                    <X className="h-4 w-4 mr-1 text-red-500" /> Remove
                  </Button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center cursor-pointer gap-2">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF4D0] text-[#8C6000] shadow-xs border border-[#FFE785]">
                  <Upload className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-bold text-[#8C6000] hover:underline">
                    Click to select PRD / PDF / PPTX
                  </span>
                  <span className="text-xs text-ink-500 block">or drag and drop document here</span>
                </div>
                <span className="text-[11px] text-ink-400">
                  Supports PDF, Word (DOCX), TXT, Markdown, PPTX (Max 25MB)
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.doc,.txt,.md,.pptx,.ppt"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelect(f);
                  }}
                />
              </label>
            )}
          </div>

          {fileError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{fileError}</span>
            </div>
          )}

          {/* AI Live Progress Feedback (27.5) */}
          {analyzingDoc && (
            <div className="clay-card-cream p-4 space-y-2.5 border border-[#FFE785]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#8C6000]">
                <Loader2 className="h-4 w-4 animate-spin text-[#BD7D14]" />
                <span>{docAnalysisStep}</span>
              </div>
              <Progress value={75} />
            </div>
          )}

          {/* Extracted Requirements Review Card (27.5) */}
          {extractedReqs && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm font-bold text-emerald-950">
                    Extracted Requirements Ready for Review
                  </span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleApplyExtractedReqs}
                  disabled={docApplied}
                >
                  {docApplied ? "✓ Applied to Form" : "Apply Extracted Details"}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-emerald-100">
                  <span className="font-semibold text-emerald-900 uppercase tracking-wider text-[10px]">
                    Extracted Problem Statement
                  </span>
                  <p className="text-ink-700 leading-relaxed line-clamp-3">
                    {extractedReqs.problemStatement || "Derived from document context"}
                  </p>
                </div>

                <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-emerald-100">
                  <span className="font-semibold text-emerald-900 uppercase tracking-wider text-[10px]">
                    Detected Required Skills ({extractedReqs.requiredSkills.length})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {extractedReqs.requiredSkills.map((sk) => (
                      <span
                        key={sk}
                        className="rounded-md bg-emerald-100 text-emerald-900 px-2 py-0.5 font-semibold text-[11px]"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-ink-100">
            <Button type="button" variant="outline" onClick={prevStep}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <Button type="button" onClick={nextStep}>
              Next: Roles & Skills <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </Card>
      )}

      {/* =========================================================================
          STEP 3: TEAM FORMATION & SKILLS (27.3, 27.5)
          ========================================================================= */}
      {currentStep === 3 && (
        <Card className="p-6 sm:p-8 space-y-6 shadow-card">
          <div className="border-b border-ink-100 pb-3">
            <h2 className="font-serif text-xl font-bold text-ink">3. Team Roles & Required Skills</h2>
            <p className="text-xs text-ink-500">
              Define the open seats and technical prerequisites for candidate matching
            </p>
          </div>

          {/* LinkedIn-grade SkillSelector for Required Skills */}
          <SkillSelector
            label="Required Project Skills & Tech Stack"
            value={requiredSkills}
            onChange={(updated) => setRequiredSkills(updated)}
            withProficiency={false}
            placeholder="Search skills, e.g. Python, PyTorch, React, Docker, NLP..."
            helperText="These skills directly drive the AI talent matching score and student recommendations"
          />

          {/* Team Size Limits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <Field label="Minimum Team Size">
              <Input
                type="number"
                min={1}
                max={15}
                value={teamMin}
                onChange={(e) => setTeamMin(Number(e.target.value))}
              />
            </Field>

            <Field label="Maximum Team Capacity">
              <Input
                type="number"
                min={teamMin}
                max={20}
                value={teamMax}
                onChange={(e) => setTeamMax(Number(e.target.value))}
              />
            </Field>
          </div>

          {/* Open Team Roles Builder */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-semibold text-ink">
                  Configured Team Roles ({roles.length})
                </label>
                <p className="text-xs text-ink-400">Specify openings and responsibilities</p>
              </div>
            </div>

            {/* Quick Template Role Add */}
            <div className="flex flex-wrap gap-1.5 pb-2">
              <span className="text-xs text-ink-500 self-center mr-1">Quick add role:</span>
              {["Frontend Developer", "Backend Developer", "ML Engineer", "UI/UX Designer", "Research Writer"].map(
                (template) => (
                  <button
                    key={template}
                    type="button"
                    onClick={() => addTemplateRole(template)}
                    className="inline-flex items-center gap-1.5 clay-pill text-xs font-bold text-[#8C6000] hover:text-[#5E4800] cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    {template}
                  </button>
                )
              )}
            </div>

            {/* Role List */}
            <div className="space-y-3">
              {roles.map((r) => (
                <div
                  key={r.id}
                  className="clay-card p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <Input
                        value={r.name}
                        onChange={(e) => updateRole(r.id, { name: e.target.value })}
                        placeholder="Role Title (e.g. Computer Vision Researcher)"
                        className="font-semibold text-sm"
                      />
                      <Textarea
                        value={r.description}
                        onChange={(e) => updateRole(r.id, { description: e.target.value })}
                        placeholder="Responsibilities and expected deliverables..."
                        rows={2}
                      />
                    </div>
                    {roles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRole(r.id)}
                        className="rounded-lg p-1.5 text-ink-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete role"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="mentorRequired"
              checked={mentorRequired}
              onChange={(e) => setMentorRequired(e.target.checked)}
              className="h-4 w-4 rounded border-ink-300 text-navy focus:ring-navy"
            />
            <label htmlFor="mentorRequired" className="text-xs font-semibold text-ink cursor-pointer">
              Require Faculty Mentor oversight for academic milestone sign-offs
            </label>
          </div>

          <div className="flex justify-between pt-4 border-t border-ink-100">
            <Button type="button" variant="outline" onClick={prevStep}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <Button type="button" onClick={nextStep}>
              Next: Deliverables & Review <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </Card>
      )}

      {/* =========================================================================
          STEP 4: DELIVERABLES, REVIEW & LAUNCH (27.5)
          ========================================================================= */}
      {currentStep === 4 && (
        <Card className="p-6 sm:p-8 space-y-6 shadow-card">
          <div className="border-b border-ink-100 pb-3">
            <h2 className="font-serif text-xl font-bold text-ink">4. Deliverables & Review</h2>
            <p className="text-xs text-ink-500">
              Establish milestones, deadlines, and launch your project workspace
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Target Completion Deadline" required>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
              />
            </Field>

            <Field label="Expected Duration">
              <Input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 3 months, 1 semester"
              />
            </Field>
          </div>

          <Field label="Expected Deliverables & Outcomes" helper="e.g. Conference submission, working prototype, dataset release">
            <Input
              value={expectedOutcomes}
              onChange={(e) => setExpectedOutcomes(e.target.value)}
            />
          </Field>

          {/* Objectives List */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-ink">Core Project Objectives</label>
            <div className="flex gap-2">
              <Input
                value={newObjective}
                onChange={(e) => setNewObjective(e.target.value)}
                placeholder="Add milestone objective..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addObjective();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addObjective}>
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>

            <div className="space-y-2 pt-2">
              {objectives.map((obj, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between clay-card-cream px-4 py-2.5 text-xs border border-[#FFE785]"
                >
                  <span className="text-ink-800 font-semibold">
                    {i + 1}. {obj}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeObjective(i)}
                    className="text-ink-400 hover:text-red-600 p-1 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-3 border-t border-ink-100">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="githubRequired"
                checked={githubRequired}
                onChange={(e) => setGithubRequired(e.target.checked)}
                className="h-4 w-4 rounded border-ink-300 text-navy focus:ring-navy"
              />
              <label htmlFor="githubRequired" className="text-xs font-semibold text-ink cursor-pointer">
                Require GitHub repository linking for automated commit tracking
              </label>
            </div>

            <Field label="Search Keywords & Tags (comma separated)" helper="Helps other researchers find your project in the global search catalog">
              <Input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. computer-vision, robotics, pytorch, dataset"
              />
            </Field>
          </div>

          {/* Final Launch Summary Card */}
          <div className="rounded-2xl border border-navy-200 bg-navy-50/50 p-5 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-navy block">
              Project Launch Summary
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-ink-400 block text-[10px] uppercase font-semibold">Title</span>
                <span className="font-bold text-ink truncate block">{title}</span>
              </div>
              <div>
                <span className="text-ink-400 block text-[10px] uppercase font-semibold">Classification</span>
                <span className="font-semibold text-ink">{type}</span>
              </div>
              <div>
                <span className="text-ink-400 block text-[10px] uppercase font-semibold">Team Seats</span>
                <span className="font-semibold text-ink">
                  {teamMin} - {teamMax} members
                </span>
              </div>
              <div>
                <span className="text-ink-400 block text-[10px] uppercase font-semibold">Required Skills</span>
                <span className="font-semibold text-ink">{requiredSkills.length} skills</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-ink-100">
            <Button type="button" variant="outline" onClick={prevStep}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <Button type="button" onClick={handlePublish} loading={loading}>
              <FolderPlus className="h-4 w-4 mr-1.5" />
              Publish Project & Open Workspace
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
