import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  FileText,
  AlertTriangle,
  FolderGit2,
  GraduationCap,
} from "lucide-react";

interface FacultyAccessGuidelinesModalProps {
  open: boolean;
  onClose: () => void;
}

export function FacultyAccessGuidelinesModal({ open, onClose }: FacultyAccessGuidelinesModalProps) {
  const [activeTab, setActiveTab] = useState<"allowed" | "visibility" | "activities" | "documents">("allowed");

  const allowedPoints = [
    { title: "Create & Architect Academic Projects", desc: "Publish Faculty Academic Projects, Faculty-Led Research, and College Innovation Projects with document parsing." },
    { title: "Form & Structure Multi-Disciplinary Teams", desc: "Assemble student candidates into balanced teams based on AI compatibility scores, technical roles, and team leader assignments." },
    { title: "Assign Backlog Tasks & Deadlines", desc: "Create technical tasks, set milestone deadlines, assign specific roles, and track Kanban board throughput." },
    { title: "Review Weekly Progress & Submissions", desc: "Evaluate student code links, PRs, and documentation. Provide formal feedback and mark submissions as Accepted, Changes Requested, or Reviewed." },
    { title: "Curriculum Gap & AI Diagnostics", desc: "Run AI requirement analysis, evaluate technical consistency, and review skill gap summaries across your department." },
    { title: "Mentorship & Guidance", desc: "Direct project architecture, suggest reference papers, and provide academic supervision throughout the project lifecycle." },
  ];

  const restrictedPoints = [
    { title: "No Institutional Billing or Subscription Admin", desc: "Faculty members cannot manage campus subscription plans, view payment records, or modify billing invoices." },
    { title: "No Modification of Other Faculty Members' Projects", desc: "You cannot edit, close, or delete private projects owned by other faculty members unless co-assigned as an official mentor." },
    { title: "No Altering Student Personal Profiles or Roles", desc: "Faculty cannot modify student personal bio data, delete student accounts, or change a student's role." },
    { title: "No Reviewing Unrelated Project Submissions", desc: "Submission review is strictly restricted to projects you own or have an authorized faculty mentor role in." },
    { title: "No Campus-Wide Member Administration", desc: "Inviting or removing college-wide institutional seats is strictly reserved for College Administrators." },
    { title: "No Cross-College Data Access", desc: "All faculty supervisory capabilities are strictly scoped to your verified institutional college membership." },
  ];

  const canViewItems = [
    "Your faculty profile, academic department, teaching areas, and research domains.",
    "Student profiles within your college who have shared visibility or applied to your projects.",
    "Student skills, verified project experiences, GitHub evidence, and certificates relevant to your projects.",
    "Projects you own, manage, or are assigned to as a verified faculty mentor.",
    "Team workspace details: member roster, assigned roles, team leaders, Kanban tasks, and deadlines.",
    "Student weekly submissions, code pull requests, documentation briefs, and progress history.",
    "AI requirement intelligence, team compatibility rankings, and curriculum gap analyses.",
  ];

  const cannotViewItems = [
    "Private student personal conversations and unshared non-academic communications.",
    "Private projects owned by other faculty members where you are not an authorized mentor.",
    "Other colleges' private student registries, departmental data, and research archives.",
    "College subscription payment credentials, billing invoices, and financial transactions.",
    "Industry partner internal candidate shortlists or confidential business strategies.",
    "Platform Owner server infrastructure, database connection strings, and security keys.",
  ];

  const activitiesExpected = [
    { step: "1. Project Inception", text: "Upload project briefs (PRD, syllabus, research proposal) to automatically extract requirements, skills, and suggested role templates." },
    { step: "2. Student Discovery & Matching", text: "Review applicant compatibility scores and form project teams with balanced skills across frontend, backend, AI, and systems." },
    { step: "3. Milestone Supervision", text: "Assign key tasks and track weekly team velocity. Monitor AI consistency checks to identify technical drift early." },
    { step: "4. Submission Evaluation", text: "Provide timely, constructive feedback on student weekly deliverables (Accepted, Changes Requested, Reviewed)." },
    { step: "5. Academic Closure", text: "Verify deliverables against initial objectives and mark project completion upon successful final evaluation." },
  ];

  const evaluationRules = [
    { type: "Weekly Progress Review", rule: "Must evaluate verifiable deliverables (GitHub commits, PRs, design docs) before issuing approval." },
    { type: "Changes Requested Standard", rule: "Provide clear, actionable feedback specifying missing requirements or architectural improvements." },
    { type: "Single-Reviewer Boundary", rule: "Faculty cannot review their own submissions or approve applications for projects they do not supervise." },
    { type: "Multi-Tenant Data Boundary", rule: "All team creation, application approvals, and project documents are strictly isolated to your verified college." },
  ];

  return (
    <Modal open={open} onClose={onClose} title="SYNAPTRA Faculty Governance & Access Control (A to Z)">
      <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
        {/* Banner */}
        <div className="clay-card-cream p-4 rounded-2xl border border-[#FFE785] flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-navy text-white flex items-center justify-center shrink-0 font-bold">
            <GraduationCap className="h-5 w-5 text-[#FFC812]" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-sm text-[#181B1F]">Faculty Academic Governance & Rights</h4>
            <p className="text-xs text-[#5E646A] mt-0.5 leading-relaxed">
              As a verified faculty mentor, your role empowers you to architect academic projects, evaluate student technical progress, and guide collaborative teams. This guide outlines your permitted supervisory rights, boundaries, and governance rules.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#ECE5D8] gap-2 overflow-x-auto pb-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("allowed")}
            className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "allowed" ? "bg-navy text-white shadow-sm" : "text-[#5E646A] hover:bg-[#F3EFE6]"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-[#FFC812]" /> 1. Allowed vs Restricted
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("visibility")}
            className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "visibility" ? "bg-navy text-white shadow-sm" : "text-[#5E646A] hover:bg-[#F3EFE6]"
            }`}
          >
            <Eye className="h-3.5 w-3.5 text-[#FFC812]" /> 2. Viewing Permissions
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("activities")}
            className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "activities" ? "bg-navy text-white shadow-sm" : "text-[#5E646A] hover:bg-[#F3EFE6]"
            }`}
          >
            <FolderGit2 className="h-3.5 w-3.5 text-[#FFC812]" /> 3. Supervisory Workflows
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("documents")}
            className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "documents" ? "bg-navy text-white shadow-sm" : "text-[#5E646A] hover:bg-[#F3EFE6]"
            }`}
          >
            <FileText className="h-3.5 w-3.5 text-[#FFC812]" /> 4. Evaluation Standards
          </button>
        </div>

        {/* TAB 1: Allowed vs Restricted */}
        {activeTab === "allowed" && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <h5 className="font-serif font-bold text-sm text-[#181B1F]">What Faculty CAN DO (Permitted Rights)</h5>
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                {allowedPoints.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/40 text-xs">
                    <strong className="text-emerald-950 font-bold block mb-0.5">✓ {item.title}</strong>
                    <span className="text-emerald-900/80 leading-relaxed">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="h-5 w-5 text-red-600" />
                <h5 className="font-serif font-bold text-sm text-[#181B1F]">What Faculty CANNOT DO (Strictly Restricted)</h5>
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                {restrictedPoints.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-red-100 bg-red-50/40 text-xs">
                    <strong className="text-red-950 font-bold block mb-0.5">✕ {item.title}</strong>
                    <span className="text-red-900/80 leading-relaxed">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Viewing Permissions */}
        {activeTab === "visibility" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-emerald-200 bg-white space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <Eye className="h-4 w-4 text-emerald-600" /> What Faculty CAN VIEW
              </div>
              <ul className="space-y-2 text-xs text-[#2E2A23]">
                {canViewItems.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-2xl border border-red-200 bg-white space-y-3">
              <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
                <EyeOff className="h-4 w-4 text-red-600" /> What Faculty CANNOT VIEW
              </div>
              <ul className="space-y-2 text-xs text-[#2E2A23]">
                {cannotViewItems.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-red-600 font-bold mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* TAB 3: Required Activities */}
        {activeTab === "activities" && (
          <div className="space-y-3">
            <p className="text-xs text-[#5E646A]">
              Standardized supervisory workflow for academic research projects and student team development:
            </p>
            <div className="space-y-2.5">
              {activitiesExpected.map((act, idx) => (
                <div key={idx} className="clay-card-white p-3.5 rounded-xl border border-[#ECE5D8] flex items-start gap-3">
                  <div className="h-7 w-7 rounded-lg bg-[#FFE785] text-[#8C6000] font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <h6 className="font-bold text-xs text-[#181B1F]">{act.step}</h6>
                    <p className="text-xs text-[#5E646A] mt-0.5 leading-relaxed">{act.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Evaluation Standards */}
        {activeTab === "documents" && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl border border-[#FFE785] bg-[#FFF9E6] text-xs text-[#8C6000] flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>All reviews must maintain institutional academic integrity and evidence-backed assessment.</span>
            </div>

            <div className="space-y-3">
              {evaluationRules.map((doc, idx) => (
                <div key={idx} className="clay-card-cream p-4 rounded-xl border border-[#ECE5D8] space-y-1.5">
                  <span className="font-bold text-xs text-[#181B1F]">{doc.type}</span>
                  <p className="text-xs text-[#5E646A] leading-relaxed">{doc.rule}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-[#ECE5D8] flex items-center justify-between">
          <span className="text-[11px] text-[#7B828A]">SYNAPTRA Institutional Faculty Governance</span>
          <Button variant="primary" size="sm" onClick={onClose}>
            Acknowledge & Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
