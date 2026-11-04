import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Building2,
  AlertTriangle,
  Users,
} from "lucide-react";

interface CollegeAdminAccessGuidelinesModalProps {
  open: boolean;
  onClose: () => void;
}

export function CollegeAdminAccessGuidelinesModal({ open, onClose }: CollegeAdminAccessGuidelinesModalProps) {
  const [activeTab, setActiveTab] = useState<"allowed" | "visibility" | "lifecycle" | "isolation">("allowed");

  const allowedPoints = [
    { title: "Campus Workspace & Branding", desc: "Update institution name, logo, permitted campus branding, academic departments, and institutional settings." },
    { title: "Student & Faculty Enrollment", desc: "Invite new students and faculty, monitor pending invitations, resend or revoke invites, and review active member rosters." },
    { title: "Seat Capacity & Quota Management", desc: "Monitor student and faculty seat limits against your institution's subscription plan and allocate active seats." },
    { title: "Institutional Subscriptions & Invoices", desc: "Select and renew subscription tiers, view official tax invoices, and monitor subscription billing cycles." },
    { title: "Audit Trail & Compliance", desc: "Inspect moderation actions, seat allocation logs, and institutional security telemetry." },
    { title: "Campus-Industry Partnerships", desc: "Review industry challenges targeted at your campus and oversee approved joint innovation pods." },
  ];

  const restrictedPoints = [
    { title: "No Access to Student Passwords or Chats", desc: "College administrators cannot view student passwords, auth credentials, or private peer-to-peer conversations." },
    { title: "No Cross-College Data Access", desc: "You cannot access, view, or manage members, projects, or billing records of any other academic institution." },
    { title: "No Platform Owner or Global Controls", desc: "College Admin is scoped to a single institution. Changing global platform pricing, plans, or master system settings is strictly prohibited." },
    { title: "No Deletion of Student Personal Accounts", desc: "Revoking a college membership removes institutional affiliation only; personal student profiles and project work remain intact." },
    { title: "No Academic Grading Without Mentor Role", desc: "College administrators are not automatically project mentors and cannot assign academic grades or evaluate submissions without an explicit role." },
    { title: "No Bypassing Subscription Entitlements", desc: "Paid operations and member additions remain locked if the institutional plan is expired or inactive." },
  ];

  const canViewItems = [
    "Your institution's profile, contact details, departments, and branding configuration.",
    "Students and faculty members officially affiliated with your college.",
    "Member enrollment status, active seat counts, and pending invitation records.",
    "Institution-level project summaries and authorized campus innovation metrics.",
    "Subscription plan tier, billing renewal dates, seat quotas, and payment receipts.",
    "College audit logs, administrative actions, and compliance reports.",
  ];

  const cannotViewItems = [
    "Student authentication passwords, session secrets, or private login tokens.",
    "Private peer-to-peer student messages and personal student task logs.",
    "Another college's student directory, faculty roster, or internal projects.",
    "Another college's payment receipts, invoices, or subscription records.",
    "Platform Owner dashboard, system database credentials, or secret API keys.",
  ];

  const lifecycleRules = [
    { step: "1. Account Linking", rule: "When an existing independent student accepts an invitation, their account is linked to the college rather than creating a duplicate user." },
    { step: "2. Safe Seat Revocation", rule: "Removing a member revokes their college seat only; their personal profile, portfolio, and project history are never deleted." },
    { step: "3. Expired Plan Persistence", rule: "If an institutional subscription expires, the admin can still log in to view historical records, audits, and renewal options." },
    { step: "4. Entitlement Lock", rule: "Paid actions (adding members, bulk invites) require an active verified subscription tier." },
  ];

  const isolationStandards = [
    { standard: "Strict Tenant Scoping", detail: "Every administrative query verifies the authenticated admin's college ID against database records to prevent URL tampering." },
    { standard: "Financial Isolation", detail: "Payment transactions and Razorpay orders are cryptographically bound to the respective college entity." },
    { standard: "Audit Trail Integrity", detail: "Sensitive administrative mutations (member removal, role adjustments) are persistently recorded in audit logs." },
    { standard: "Independent Student Dignity", detail: "Students retain sovereignty over their public portfolios, verified skill scores, and past collaborative code." },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="College Administrator Governance & Security Rules (A–Z)"
      wide
    >
      <div className="space-y-6 pt-2">
        {/* Header Notice */}
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#FFFDF8] border border-[#FFE785]">
          <ShieldCheck className="h-6 w-6 text-[#8C6000] shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-bold text-[#181B1F] block text-sm">
              Single-Institution Administrative Boundary
            </span>
            <p className="text-[#5E646A] leading-relaxed">
              As a College Administrator, your authority is strictly scoped to your verified institution. You manage campus seats, branding, and subscriptions without interfering with other colleges or student personal data sovereignty.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-2 border-b border-[#ECE5D8] pb-3">
          {[
            { id: "allowed", label: "Allowed vs Restricted", icon: ShieldCheck },
            { id: "visibility", label: "Viewing Boundaries", icon: Eye },
            { id: "lifecycle", label: "Member & Plan Lifecycle", icon: Users },
            { id: "isolation", label: "Tenant Isolation", icon: Building2 },
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
                <span>What College Admin CAN DO</span>
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
                <span>What College Admin CANNOT DO</span>
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

        {/* Tab 2: Viewing Boundaries */}
        {activeTab === "visibility" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-[#ECE5D8] space-y-3">
              <div className="flex items-center gap-2 text-[#8C6000] font-bold text-xs uppercase tracking-wider">
                <Eye className="h-4 w-4 text-[#BD7D14]" />
                <span>Authorized Institutional Data</span>
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
                <span>Prohibited / Protected Resources</span>
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

        {/* Tab 3: Member & Plan Lifecycle */}
        {activeTab === "lifecycle" && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-[#FAF7EE] border border-[#ECE5D8] text-xs text-[#5E646A]">
              College Admin governs institutional seat capacity, invitations, and renewals without compromising user data sovereignty.
            </div>
            <div className="space-y-2.5">
              {lifecycleRules.map((lr, i) => (
                <div key={i} className="p-3 rounded-xl bg-white border border-[#ECE5D8] text-xs space-y-1">
                  <span className="font-bold text-[#181B1F] block">{lr.step}</span>
                  <p className="text-[#5E646A] leading-relaxed">{lr.rule}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Tenant Isolation */}
        {activeTab === "isolation" && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {isolationStandards.map((is, i) => (
                <div key={i} className="p-4 rounded-2xl bg-white border border-[#ECE5D8] space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#181B1F]">
                    <Building2 className="h-4 w-4 text-[#8C6000]" />
                    <span>{is.standard}</span>
                  </div>
                  <p className="text-xs text-[#5E646A] leading-relaxed">{is.detail}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-[#ECE5D8] flex items-center justify-between">
          <span className="text-[11px] text-[#7B828A]">
            Enforced by SYNAPTRA Institutional SaaS Security Engine
          </span>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close Guidelines
          </Button>
        </div>
      </div>
    </Modal>
  );
}
