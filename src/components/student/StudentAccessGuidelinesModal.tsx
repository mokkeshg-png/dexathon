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
  BookOpen,
  FolderGit2,
} from "lucide-react";

interface StudentAccessGuidelinesModalProps {
  open: boolean;
  onClose: () => void;
}

export function StudentAccessGuidelinesModal({ open, onClose }: StudentAccessGuidelinesModalProps) {
  const [activeTab, setActiveTab] = useState<"allowed" | "visibility" | "activities" | "documents">("allowed");

  const allowedPoints = [
    { title: "Manage Own Profile", desc: "Add & edit skills, bio, academic details, portfolio links, and certifications with verifiable evidence." },
    { title: "Discover & Connect with Peers", desc: "Search public and institutional student profiles, send collaboration requests, and invite peers to your independent projects." },
    { title: "Participate in Independent & Academic Projects", desc: "Create independent student projects (Personal Project, Independent Team Project) or apply to open academic initiatives." },
    { title: "Apply to Industry Innovation Challenges", desc: "Submit team proposals, problem pitches, and technical prototypes to authorized enterprise bounties." },
    { title: "Manage Workspace Tasks & Deadlines", desc: "Update your own assigned tasks on the Kanban board (To Do → In Progress → Ready for Review)." },
    { title: "Submit Weekly Progress & Deliverables", desc: "Submit code repository links, documentation, test reports, and pull requests for faculty mentor evaluation." },
    { title: "Receive & Respond to Feedback", desc: "View faculty mentor assessment, suggestions, and requested changes in the project workspace." },
  ];

  const restrictedPoints = [
    { title: "No Administrative or College Access", desc: "Students are strictly prohibited from accessing `/admin`, college subscription billing, or campus member directories." },
    { title: "No Modifying Other Students' Profiles or Tasks", desc: "You cannot edit, delete, or reassign other students' profiles, tasks, or project submissions." },
    { title: "No Self-Approval of Applications or Submissions", desc: "Students cannot approve their own project applications, teammate join requests, or mark weekly submissions as approved." },
    { title: "No Faculty-Only Project Creation", desc: "Creating 'Faculty Academic Projects' or 'College Innovation Projects' is strictly restricted to verified faculty and campus directors." },
    { title: "No Role Elevation or Impersonation", desc: "Students cannot alter their account role to Faculty, Industry Partner, or College Administrator." },
    { title: "No Private Contact Scraping", desc: "Private emails and personal phone numbers of other members are masked and cannot be harvested or shared." },
  ];

  const canViewItems = [
    "Your personal profile, academic degree details, and verified skill scores.",
    "Public student profiles and college-shared peers within your institution.",
    "Projects you created, joined, or have been invited to participate in.",
    "Authorized team workspaces, assigned Kanban tasks, milestones, and deadlines.",
    "Weekly submission logs, reviewer status, and faculty mentor feedback notes.",
    "Industry innovation challenges open to student eligibility.",
    "Personal notification feed, collaboration invites, and direct team discussions.",
  ];

  const cannotViewItems = [
    "Other students' private profile data, unshared email addresses, and phone numbers.",
    "College administrative management panels, institutional rosters, and audit trails.",
    "College subscription plans, invoices, seat licenses, and payment transactions.",
    "Faculty-only evaluation dashboards, curriculum gap intelligence, and grade records.",
    "Unrelated private project rooms where your membership is not accepted.",
    "Industry internal proprietary business memos or candidate ranking data.",
    "Platform Owner infrastructure settings, database connection keys, and API secrets.",
  ];

  const activitiesExpected = [
    { step: "1. Skill Calibration", text: "Complete your profile skills, connect your GitHub profile, and upload verifiable certificates to elevate your AI Skill Score." },
    { step: "2. Team Alignment", text: "Explore open project opportunities, read requirements, and submit targeted applications highlighting your technical competencies." },
    { step: "3. Milestone Execution", text: "Regularly update task progress on your team's Kanban board, commit code to linked repositories, and respect deadlines." },
    { step: "4. Weekly Reporting", text: "Submit clear weekly summaries with functional demo links, PR references, and questions for faculty guidance." },
    { step: "5. Feedback Iteration", text: "Review faculty comments promptly, implement requested architectural improvements, and resubmit deliverables." },
  ];

  const documentRules = [
    { type: "Weekly Progress Report", format: "Markdown / Rich Text with GitHub Commit/PR links", rule: "Must detail completed backlog tasks, blockers, and deliverables." },
    { type: "Technical Architecture Brief", format: "PDF, DOCX, or Markdown", rule: "Required for complex systems; should outline architecture, database schemas, and API contracts." },
    { type: "Experience & Skill Verification", format: "PDF, JPG, PNG (Max 10MB)", rule: "Must be authentic institution/vendor certificates or signed internship completion letters." },
    { type: "Academic Integrity Standard", format: "Code & Text", rule: "0% tolerance for uncredited plagiarism. All AI-assisted code must be verified, tested, and documented." },
  ];

  return (
    <Modal open={open} onClose={onClose} title="SYNAPTRA Student Guidelines & Access Control (A to Z)">
      <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
        {/* Banner */}
        <div className="clay-card-cream p-4 rounded-2xl border border-[#FFE785] flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-navy text-white flex items-center justify-center shrink-0 font-bold">
            <BookOpen className="h-5 w-5 text-[#FFC812]" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-sm text-[#181B1F]">Student Role Code of Conduct & Permissions</h4>
            <p className="text-xs text-[#5E646A] mt-0.5 leading-relaxed">
              As a verified student researcher, your account provides access to technical collaboration, AI skill profiling, and project development. This guide defines your permitted rights, system boundaries, and academic responsibilities.
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
            <FolderGit2 className="h-3.5 w-3.5 text-[#FFC812]" /> 3. Required Activities
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("documents")}
            className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "documents" ? "bg-navy text-white shadow-sm" : "text-[#5E646A] hover:bg-[#F3EFE6]"
            }`}
          >
            <FileText className="h-3.5 w-3.5 text-[#FFC812]" /> 4. Submissions & Rules
          </button>
        </div>

        {/* TAB 1: Allowed vs Restricted */}
        {activeTab === "allowed" && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <h5 className="font-serif font-bold text-sm text-[#181B1F]">What Students CAN DO (Permitted Rights)</h5>
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
                <h5 className="font-serif font-bold text-sm text-[#181B1F]">What Students CANNOT DO (Strictly Restricted)</h5>
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
                <Eye className="h-4 w-4 text-emerald-600" /> What Students CAN VIEW
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
                <EyeOff className="h-4 w-4 text-red-600" /> What Students CANNOT VIEW
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
              To maintain good standing and qualify for verified research opportunities and faculty recommendations, students must engage in these standardized activities:
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

        {/* TAB 4: Submissions & Documents */}
        {activeTab === "documents" && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl border border-[#FFE785] bg-[#FFF9E6] text-xs text-[#8C6000] flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>All submissions undergo technical consistency checks and faculty mentor peer evaluations.</span>
            </div>

            <div className="space-y-3">
              {documentRules.map((doc, idx) => (
                <div key={idx} className="clay-card-cream p-4 rounded-xl border border-[#ECE5D8] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#181B1F]">{doc.type}</span>
                    <span className="clay-badge-slate text-[10px]">{doc.format}</span>
                  </div>
                  <p className="text-xs text-[#5E646A] leading-relaxed">{doc.rule}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-[#ECE5D8] flex items-center justify-between">
          <span className="text-[11px] text-[#7B828A]">SYNAPTRA Campus Security & Academic Integrity Policy</span>
          <Button variant="primary" size="sm" onClick={onClose}>
            Acknowledge & Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
