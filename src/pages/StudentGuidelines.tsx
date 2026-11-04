import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import {
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  Lock,
  Shield,
  Users,
  Briefcase,
  GraduationCap,
  Bell,
  Settings,
  XCircle,
} from "lucide-react";

const sections = [
  {
    id: "identity",
    title: "Who a student is",
    icon: GraduationCap,
    body: "A student is an individual participant in academic projects, independent collaboration, skill development, and authorized industry opportunities. You may work independently or through verified college memberships. You may only access resources you are authorized to use.",
  },
];

export function StudentGuidelines() {
  const { user, isStudent, profile } = useAuth();
  const signedInStudent = Boolean(user && (isStudent || profile?.role === "student"));

  return (
    <div className="clay-page max-w-5xl space-y-8">
      <div className="clay-welcome-banner clay-neural-bg p-6 sm:p-8 space-y-4">
        <span className="inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest border bg-[#FFF8DC] text-[#7A4D00] border-[#FFD040]">
          <BookOpen className="h-3.5 w-3.5" /> Student Handbook
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#181B1F] tracking-tight">
          Student access, responsibilities, and platform rules
        </h1>
        <p className="text-sm text-[#5E646A] max-w-3xl leading-relaxed">
          This page is the complete student guide for SYNAPTRA. If an action is allowed here, the product must let you do it.
          If an action is restricted here, the product must block it even if you type a URL, change an ID, or hide a button.
        </p>
        <div className="flex flex-wrap gap-2">
          {signedInStudent ? (
            <Link to="/dashboard">
              <Button variant="primary" size="sm">Open Student Dashboard</Button>
            </Link>
          ) : (
            <Link to="/register">
              <Button variant="primary" size="sm">Join as a Student</Button>
            </Link>
          )}
          <Link to="/projects">
            <Button variant="outline" size="sm">Browse Projects</Button>
          </Link>
        </div>
      </div>

      <section className="clay-card p-6 space-y-3">
        <h2 className="font-serif text-xl font-bold text-[#181B1F] flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-[#8C6000]" /> 1. Student identity
        </h2>
        <p className="text-sm text-[#5E646A] leading-relaxed">{sections[0].body}</p>
        <ul className="text-sm text-[#2E2A23] space-y-1.5 list-disc pl-5">
          <li>Independent students can build a profile, join public work, and create independent projects.</li>
          <li>College-connected students also see authorized campus projects and college-shared profiles.</li>
          <li>Your role is assigned by registration and college membership. You cannot promote yourself to Faculty, Industry, Admin, or Owner.</li>
        </ul>
      </section>

      <section className="clay-card p-6 space-y-4">
        <h2 className="font-serif text-xl font-bold text-[#181B1F] flex items-center gap-2">
          <Eye className="h-5 w-5 text-[#8C6000]" /> 2. What students can view
        </h2>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="clay-card-cream p-4 space-y-2">
            <h3 className="font-bold">Personal profile</h3>
            <ul className="list-disc pl-4 text-[#5E646A] space-y-1">
              <li>Your profile, academics, skills, projects, certificates, GitHub and LinkedIn</li>
              <li>Your visibility settings and skill analysis</li>
            </ul>
          </div>
          <div className="clay-card-cream p-4 space-y-2">
            <h3 className="font-bold">Student discovery</h3>
            <ul className="list-disc pl-4 text-[#5E646A] space-y-1">
              <li>Public student profiles</li>
              <li>College-shared profiles when your membership authorizes it</li>
              <li>Search results allowed by privacy settings</li>
            </ul>
          </div>
          <div className="clay-card-cream p-4 space-y-2">
            <h3 className="font-bold">Projects and teams</h3>
            <ul className="list-disc pl-4 text-[#5E646A] space-y-1">
              <li>Public projects and industry challenges for your audience</li>
              <li>Projects you joined, were invited to, or were assigned to</li>
              <li>Team members, your role, tasks, deadlines, authorized documents, submissions, faculty feedback, and progress</li>
            </ul>
          </div>
          <div className="clay-card-cream p-4 space-y-2">
            <h3 className="font-bold">Your own activity</h3>
            <ul className="list-disc pl-4 text-[#5E646A] space-y-1">
              <li>Notifications, collaboration requests, applications, and authorized messages</li>
              <li>Learning recommendations and knowledge recovery paths assigned to you</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="clay-card p-6 space-y-3">
        <h2 className="font-serif text-xl font-bold text-[#181B1F] flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-700" /> 3. What students can do
        </h2>
        <ul className="grid sm:grid-cols-2 gap-2 text-sm text-[#2E2A23]">
          {[
            "Create and edit your own permitted profile information",
            "Add skills, experience, certificates, and supporting evidence",
            "Manage profile visibility (public, members, institution, private)",
            "Search authorized student profiles and send collaboration requests",
            "Accept or reject collaboration requests you received",
            "Create independent / personal / academic student projects",
            "Apply to eligible public projects and industry challenges",
            "Request to join eligible teams; accept or decline invitations",
            "Work in assigned project rooms and update your own task statuses",
            "Upload and update your own submissions where the workflow allows",
            "View faculty feedback and respond where permitted",
            "Send and receive authorized messages",
            "Withdraw your own pending applications",
            "Manage your notification preferences",
          ].map((item) => (
            <li key={item} className="flex gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="clay-card p-6 space-y-4">
        <h2 className="font-serif text-xl font-bold text-[#181B1F] flex items-center gap-2">
          <EyeOff className="h-5 w-5 text-red-700" /> 4. What students cannot view
        </h2>
        <ul className="grid sm:grid-cols-2 gap-2 text-sm">
          {[
            "Other students' private profile fields",
            "Private emails or phone numbers unless explicitly shared",
            "College administration pages and member-management consoles",
            "Subscription, billing, and payment records",
            "Other colleges' private dashboards",
            "Faculty private administrative information",
            "Industry internal business information and other teams' applications",
            "Other students' private submissions and private faculty feedback outside your team",
            "Projects and team documents you have no permission to access",
            "Platform Owner dashboard, system configuration, API keys, and secrets",
          ].map((item) => (
            <li key={item} className="flex gap-2 text-[#5E646A]">
              <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="clay-card p-6 space-y-3">
        <h2 className="font-serif text-xl font-bold text-[#181B1F] flex items-center gap-2">
          <Lock className="h-5 w-5 text-red-700" /> 5. What students cannot do
        </h2>
        <ul className="grid sm:grid-cols-2 gap-2 text-sm">
          {[
            "Edit or delete another student's profile or account",
            "Edit faculty information or create faculty-only projects",
            "Create or manage college subscriptions, billing, or seats",
            "Invite, remove, or approve college memberships",
            "Use College Admin, Faculty Studio, or Platform Owner controls",
            "Assign students on faculty-managed teams without authorization",
            "Select or remove a faculty-approved team leader without permission",
            "Edit another student's tasks or submissions",
            "Approve your own faculty-reviewed submission",
            "Approve another student's application on faculty or industry workflows",
            "Change project ownership or college-wide settings",
            "Approve industry applications or access unauthorized industry records",
            "Change your role to Faculty, Industry, or Admin",
            "Bypass subscription, privacy, or project permission checks",
          ].map((item) => (
            <li key={item} className="flex gap-2 text-[#5E646A]">
              <Lock className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="clay-card p-6 space-y-3">
        <h2 className="font-serif text-xl font-bold text-[#181B1F] flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-[#8C6000]" /> 6. Applications and approvals
        </h2>
        <p className="text-sm text-[#5E646A]">Students may apply, request to join, and send collaboration requests. Students may not approve their own application, another student's application on faculty/industry review, college membership, or their own submission as a reviewer.</p>
        <p className="text-sm text-[#2E2A23] font-medium">If you are not eligible, the Apply action is shown as disabled with a clear reason — not hidden without explanation.</p>
      </section>

      <section className="clay-card p-6 space-y-3">
        <h2 className="font-serif text-xl font-bold text-[#181B1F] flex items-center gap-2">
          <Users className="h-5 w-5 text-[#8C6000]" /> 7. Pages you should see
        </h2>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-bold mb-2 text-emerald-800">Shown</p>
            <ul className="space-y-1 text-[#5E646A]">
              {[
                "Student Dashboard",
                "My Profile",
                "Discover Students",
                "Projects",
                "My Teams / Requests",
                "My Tasks and Submissions (in project rooms)",
                "Collaboration Requests",
                "Industry Opportunities",
                "Notifications",
                "Skill Insights",
                "Settings",
                "This Student Guidelines page",
              ].map((x) => (
                <li key={x}>• {x}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-bold mb-2 text-red-800">Hidden and blocked</p>
            <ul className="space-y-1 text-[#5E646A]">
              {[
                "Faculty Dashboard",
                "College Admin Dashboard",
                "Industry Management Dashboard",
                "Platform Owner Dashboard",
                "Subscription Management",
                "College Member Management",
                "Faculty Project Approval Controls",
              ].map((x) => (
                <li key={x}>• {x}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="clay-card p-6 space-y-3">
        <h2 className="font-serif text-xl font-bold text-[#181B1F] flex items-center gap-2">
          <FileText className="h-5 w-5 text-[#8C6000]" /> 8. Files and documents to read and submit
        </h2>
        <ul className="text-sm text-[#5E646A] space-y-2 list-disc pl-5">
          <li>Read this Student Guidelines page and your project brief, problem statement, and role description before applying.</li>
          <li>Submit your own certificates and evidence on your profile (images or PDFs you own).</li>
          <li>In assigned project rooms, upload authorized team documents and weekly progress submissions (code links, reports, designs).</li>
          <li>Do not upload another person's private documents, credentials, or unrelated-team files.</li>
          <li>Faculty feedback on your submissions is readable by you; you cannot mark your own work as faculty-approved.</li>
        </ul>
      </section>

      <section className="clay-card p-6 space-y-3">
        <h2 className="font-serif text-xl font-bold text-[#181B1F] flex items-center gap-2">
          <Shield className="h-5 w-5 text-[#8C6000]" /> 9. Responsibilities and integrity
        </h2>
        <ul className="text-sm text-[#5E646A] space-y-2 list-disc pl-5">
          <li>Keep your profile accurate. Skills and evidence should reflect real work.</li>
          <li>Respect privacy: do not share private contact details you see in a team room outside that team.</li>
          <li>Meet task deadlines you accept. Update only your permitted task statuses.</li>
          <li>Use collaboration and industry applications in good faith — no self-approval and no impersonation.</li>
          <li>Report misleading projects or harassment instead of attempting to bypass access controls.</li>
          <li>Technical enforcement includes protected routes, role-aware navigation, server-side checks, Supabase RLS, and storage policies. Button hiding is not the security boundary.</li>
        </ul>
      </section>

      <div className="flex flex-wrap gap-2">
        <Link to="/dashboard">
          <Button variant="primary" size="sm">
            <Bell className="h-4 w-4 mr-1" /> Go to Student Dashboard
          </Button>
        </Link>
        <Link to="/settings">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-1" /> Notification settings
          </Button>
        </Link>
      </div>
    </div>
  );
}
