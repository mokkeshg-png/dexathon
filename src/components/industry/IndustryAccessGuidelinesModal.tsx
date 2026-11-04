import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Briefcase,
  AlertTriangle,
  Building2,
  Users,
} from "lucide-react";

interface IndustryAccessGuidelinesModalProps {
  open: boolean;
  onClose: () => void;
}

export function IndustryAccessGuidelinesModal({ open, onClose }: IndustryAccessGuidelinesModalProps) {
  const [activeTab, setActiveTab] = useState<"allowed" | "visibility" | "challenges" | "privacy">("allowed");

  const allowedPoints = [
    { title: "Publish Enterprise R&D Challenges", desc: "Create real-world problem statements, specify required technical skills, set research grants or bounties, and define application deadlines." },
    { title: "Edit & Manage Owned Challenges", desc: "Update requirements, technologies, expected outcomes, or close challenges owned by your organization at any time." },
    { title: "Review Student & Team Proposals", desc: "Evaluate incoming solution architectures, match compatibility telemetry, provide industry feedback, and shortlist candidates." },
    { title: "Offer Internships & Co-Development", desc: "Dispatched direct co-development agreements, sponsored lab grants, and technical internship offers to high-performing student pods." },
    { title: "Discover Verified Campus Talent", desc: "Explore student technical capabilities, verified GitHub code telemetry, and AI skill analysis across participating university campuses." },
    { title: "Campus & Faculty Collaborations", desc: "Establish joint research connections with university departments and sponsor campus capstone pods." },
  ];

  const restrictedPoints = [
    { title: "No Access to Student Private Contact Info", desc: "Industry users cannot view personal phone numbers, private personal emails, or private student documents without explicit consent." },
    { title: "No Modification of Other Companies' Challenges", desc: "You cannot edit, close, or review applications belonging to other industry partners. Strict organization-level data isolation is enforced." },
    { title: "No College Admin or Billing Controls", desc: "Industry users cannot manage college subscription plans, assign institutional seats, or alter university administrative settings." },
    { title: "No Faculty Academic Grading", desc: "Industry partners cannot assign formal curriculum grades or approve academic submissions unless co-appointed as an authorized reviewer." },
    { title: "No Applying to Challenges as Students", desc: "Industry representatives cannot submit student challenge pitches to their own or peer corporate challenges." },
    { title: "No Platform Owner Operations", desc: "Platform database secrets, system telemetry, and owner website controls are strictly inaccessible." },
  ];

  const canViewItems = [
    "Your organization's profile, domain, representatives, and authorized collaboration history.",
    "All public innovation challenges and challenges published by your organization.",
    "Proposals and technical pitches submitted exclusively to your organization's challenges.",
    "Student public profiles, verified technical skills, GitHub repositories, and project portfolios.",
    "AI architectural alignment scores and compatibility telemetry for applicants to your challenges.",
    "Participating university campus directories and approved faculty collaboration contacts.",
    "Status of authorized joint research projects and sponsored student teams.",
  ];

  const cannotViewItems = [
    "Student private personal phone numbers and private email addresses.",
    "Applications and technical pitches submitted to competitor or unrelated industry challenges.",
    "College institutional financial records, subscription tiers, and payment invoices.",
    "Private student-faculty academic conversations and private student chats.",
    "Faculty internal curriculum evaluations and non-public academic records.",
    "Platform administration controls, secret API keys, and database infrastructure.",
  ];

  const challengeRules = [
    { step: "1. Problem Formulation", rule: "Define clear technical scope, required frameworks, domain tags, grant amount, and submission deadlines." },
    { step: "2. Proposal Evaluation", rule: "Evaluate student team proposals using AI architectural alignment scores and technical solution briefs." },
    { step: "3. Shortlisting & Feedback", rule: "Shortlist strong teams, request technical clarifications, or provide constructive industry guidance." },
    { step: "4. Official Offer / Decision", rule: "Formally issue Co-Development Sponsorships, Academic Internship Offers, or mark proposals as Reviewed/Declined." },
    { step: "5. Challenge Lifecycle", rule: "Mark challenges as Open, In Review, or Closed once team selection is finalized." },
  ];

  const privacyStandards = [
    { standard: "Data Isolation", detail: "Multi-tenant tenant isolation ensures zero cross-company data leakage by ID or URL tampering." },
    { standard: "Zero Contact Harassment", detail: "Student direct personal contact details are masked; outreach is channeled through official platform invitations." },
    { standard: "Representative Scoping", detail: "Organization representatives collaborate within their verified enterprise boundary." },
    { standard: "IP & Co-Authorship", detail: "Deliverables adhere to platform IP frameworks safeguarding both student innovation and enterprise research confidentiality." },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Industry Partner Governance & Access Rules (A–Z)"
      wide
    >
      <div className="space-y-6 pt-2">
        {/* Header Notice */}
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#FFFDF8] border border-[#FFE785]">
          <ShieldCheck className="h-6 w-6 text-[#8C6000] shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-bold text-[#181B1F] block text-sm">
              Enterprise Collaboration Governance Matrix
            </span>
            <p className="text-[#5E646A] leading-relaxed">
              As a verified Industry Partner on SYNAPTRA, your account is scoped to manage enterprise innovation challenges, review university team proposals, and discover technical student talent under strict data isolation and privacy boundaries.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-2 border-b border-[#ECE5D8] pb-3">
          {[
            { id: "allowed", label: "Allowed vs Restricted", icon: ShieldCheck },
            { id: "visibility", label: "Viewing Permissions", icon: Eye },
            { id: "challenges", label: "Challenge Lifecycle", icon: Briefcase },
            { id: "privacy", label: "Privacy & Isolation", icon: Building2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? "bg-[#181B1F] text-[#FAF7EE] shadow-sm"
                    : "bg-[#FAF7EE] text-[#5E646A] hover:bg-[#F2ECE0] border border-[#ECE5D8]"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${active ? "text-[#FFC812]" : "text-[#7B828A]"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Allowed vs Restricted */}
        {activeTab === "allowed" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Allowed */}
            <div className="space-y-3 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/70">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>What Industry CAN DO</span>
              </div>
              <div className="space-y-2.5">
                {allowedPoints.map((pt, i) => (
                  <div key={i} className="text-xs space-y-0.5">
                    <strong className="text-[#181B1F] block">{pt.title}</strong>
                    <span className="text-[#5E646A] leading-relaxed block">{pt.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Restricted */}
            <div className="space-y-3 p-4 rounded-2xl bg-red-50/50 border border-red-200/70">
              <div className="flex items-center gap-2 text-red-800 font-bold text-xs uppercase tracking-wider">
                <XCircle className="h-4 w-4 text-red-600" />
                <span>What Industry CANNOT DO</span>
              </div>
              <div className="space-y-2.5">
                {restrictedPoints.map((pt, i) => (
                  <div key={i} className="text-xs space-y-0.5">
                    <strong className="text-[#181B1F] block">{pt.title}</strong>
                    <span className="text-[#5E646A] leading-relaxed block">{pt.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Viewing Permissions */}
        {activeTab === "visibility" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-[#ECE5D8] space-y-3">
              <div className="flex items-center gap-2 text-[#8C6000] font-bold text-xs uppercase tracking-wider">
                <Eye className="h-4 w-4 text-[#BD7D14]" />
                <span>Authorized Visibility</span>
              </div>
              <ul className="space-y-2 text-xs text-[#5E646A]">
                {canViewItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#ECE5D8] space-y-3">
              <div className="flex items-center gap-2 text-red-700 font-bold text-xs uppercase tracking-wider">
                <EyeOff className="h-4 w-4 text-red-500" />
                <span>Prohibited / Hidden Resources</span>
              </div>
              <ul className="space-y-2 text-xs text-[#5E646A]">
                {cannotViewItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Tab 3: Challenge Lifecycle */}
        {activeTab === "challenges" && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-[#FAF7EE] border border-[#ECE5D8] text-xs text-[#5E646A]">
              Enterprise challenges bridge industry problem statements with high-performing student research pods. Review proposals, shortlist leaders, and offer lab grants.
            </div>
            <div className="space-y-2.5">
              {challengeRules.map((cr, i) => (
                <div key={i} className="p-3 rounded-xl bg-white border border-[#ECE5D8] text-xs space-y-1">
                  <span className="font-bold text-[#181B1F] block">{cr.step}</span>
                  <p className="text-[#5E646A] leading-relaxed">{cr.rule}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Privacy & Isolation */}
        {activeTab === "privacy" && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {privacyStandards.map((ps, i) => (
                <div key={i} className="p-4 rounded-2xl bg-white border border-[#ECE5D8] space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#181B1F]">
                    <Users className="h-4 w-4 text-[#8C6000]" />
                    <span>{ps.standard}</span>
                  </div>
                  <p className="text-xs text-[#5E646A] leading-relaxed">{ps.detail}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-[#ECE5D8] flex items-center justify-between">
          <span className="text-[11px] text-[#7B828A]">
            Enforced by SYNAPTRA Security & SaaS Multi-Tenant Engine
          </span>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close Guidelines
          </Button>
        </div>
      </div>
    </Modal>
  );
}
