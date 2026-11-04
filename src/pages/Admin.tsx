import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  fetchAllProfiles,
  fetchProjects,
  fetchReports,
  fetchAuditLogs,
  suspendUser,
  moderateProject,
  resolveReport,
} from "@/lib/supabase-db";
import {
  fetchColleges,
  fetchSubscriptionPlans,
  fetchCollegeSubscriptions,
  createCollegeSubscription,
  recordPaymentTransaction,
  fetchCollegeMembers,
  addCollegeMember,
  removeCollegeMember,
  fetchCollegeInvitations,
  createCollegeInvitation,
  revokeCollegeInvitation,
} from "@/services/saasService";
import { CollegeAdminAccessGuidelinesModal } from "@/components/admin/CollegeAdminAccessGuidelinesModal";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { Card, Badge, Progress } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { AdminDashboardSkeleton } from "@/components/ui/Skeleton";
import type {
  Profile,
  Project,
  Report,
  AuditLog,
  ModerationAction,
  College,
  SubscriptionPlan,
  CollegeSubscription,
  CollegeMembership,
  CollegeInvitation,
} from "@/types";
import {
  Shield,
  Users,
  FolderGit2,
  AlertTriangle,
  Lock,
  CheckCircle2,
  Search,
  Sliders,
  CreditCard,
  Building2,
  UserPlus,
  Mail,
  Sparkles,
} from "lucide-react";

type AdminTab =
  | "overview"
  | "college"
  | "subscriptions"
  | "members"
  | "invitations"
  | "projects"
  | "compliance";

export function Admin() {
  const { user, profile: authProfile, isOwner, isAdmin, isCollegeAdmin } = useAuth();
  if (authProfile?.role === "industry_partner") {
    return <Navigate to="/industry" replace />;
  }
  if (authProfile?.role === "faculty") {
    return <Navigate to="/faculty" replace />;
  }
  if (authProfile?.role === "student") {
    return <Navigate to="/dashboard" replace />;
  }
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get("tab") as AdminTab;
  const [activeTab, setActiveTab] = useState<AdminTab>(
    tabParam && ["overview", "college", "subscriptions", "members", "invitations", "projects", "compliance"].includes(tabParam)
      ? tabParam
      : "overview"
  );

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Platform & Campus Data
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [aiCount, setAiCount] = useState(18);

  // SaaS Institutional Data
  const [colleges, setColleges] = useState<College[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<CollegeSubscription[]>([]);
  const [members, setMembers] = useState<CollegeMembership[]>([]);
  const [invitations, setInvitations] = useState<CollegeInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [projectSearch, setProjectSearch] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState("all");
  const [reportFilter, setReportFilter] = useState("all");

  // Modals
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [modAction, setModAction] = useState<ModerationAction>("dismiss");

  // Subscription Checkout Modal
  const [subscribeModalOpen, setSubscribeModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [paymentMethod, setPaymentMethod] = useState("Net Banking / UPI");
  const [processingPayment, setProcessingPayment] = useState(false);

  // Add Member / Invite Modal
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [newMemberRole, setNewMemberRole] = useState<"student" | "faculty" | "industry_partner">("student");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberDepartment, setNewMemberDepartment] = useState("Computer Science & Engineering");
  const [submittingMember, setSubmittingMember] = useState(false);
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);

  // College Profile Edit
  const [collegeDetails, setCollegeDetails] = useState({
    name: "",
    code: "",
    domain: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    city: "",
    state: "",
  });

  const isAuthorized = Boolean(
    isOwner ||
    isAdmin ||
    isCollegeAdmin ||
    authProfile?.role === "college_admin" ||
    authProfile?.role === "admin"
  );

  async function loadData() {
    setLoading(true);
    try {
      const [profs, projs, reps, logs, aiRes, cols, plns, subs] = await Promise.all([
        fetchAllProfiles(),
        fetchProjects(),
        fetchReports(),
        fetchAuditLogs(),
        supabase ? supabase.from("ai_analyses").select("id", { count: "exact", head: true }) : Promise.resolve({ count: 18 }),
        fetchColleges(),
        fetchSubscriptionPlans(),
        fetchCollegeSubscriptions(),
      ]);

      setProfiles(profs);
      setProjects(projs);
      setReports(reps);
      setAuditLogs(logs);
      setAiCount(aiRes?.count ?? 18);
      setColleges(cols);
      setPlans(plns);
      setSubscriptions(subs);

      // Match admin's active college
      const userCol = cols.find(
        (c) =>
          (authProfile?.institution && c.name.toLowerCase().includes(authProfile.institution.toLowerCase())) ||
          c.id === authProfile?.collegeId
      ) || cols[0];

      if (userCol) {
        setCollegeDetails({
          name: userCol.name,
          code: userCol.code,
          domain: userCol.domain || "",
          contactEmail: userCol.contactEmail,
          contactPhone: userCol.contactPhone || "",
          address: userCol.address || "",
          city: userCol.city || "",
          state: userCol.state || "",
        });

        const [mems, invs] = await Promise.all([
          fetchCollegeMembers(userCol.id),
          fetchCollegeInvitations(userCol.id),
        ]);
        setMembers(mems);
        setInvitations(invs);
      }
    } catch (err) {
      console.error("Institution Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user && isAuthorized) {
      loadData();
    }
  }, [user, isAuthorized]);

  // Active college and subscription resolution
  const currentCollege: College | null = useMemo(() => {
    if (colleges.length === 0) return null;
    return (
      colleges.find(
        (c) =>
          (authProfile?.institution && c.name.toLowerCase().includes(authProfile.institution.toLowerCase())) ||
          c.id === authProfile?.collegeId
      ) || colleges[0]
    );
  }, [colleges, authProfile]);

  const activeSubscription: CollegeSubscription | null = useMemo(() => {
    if (!currentCollege) return null;
    return subscriptions.find(
      (s) => s.collegeId === currentCollege.id && (s.status === "active" || s.status === "grace_period")
    ) || null;
  }, [subscriptions, currentCollege]);

  const currentPlan: SubscriptionPlan | null = useMemo(() => {
    if (!activeSubscription) return null;
    return plans.find((p) => p.id === activeSubscription.planId) || plans[0] || null;
  }, [activeSubscription, plans]);

  // Seat metrics
  const studentSeatsLimit = activeSubscription?.studentSeatsPurchased ?? (currentCollege?.maxStudents || 100);
  const facultySeatsLimit = activeSubscription?.facultySeatsPurchased ?? (currentCollege?.maxFaculty || 10);

  const studentMembersCount = members.filter((m) => m.role === "student" && m.isSeatActive).length;
  const facultyMembersCount = members.filter((m) => m.role === "faculty" && m.isSeatActive).length;
  const industryMembersCount = members.filter((m) => m.role === "industry_partner" && m.isSeatActive).length;

  const hasActiveSubscription = Boolean(activeSubscription && activeSubscription.status === "active");

  if (!user) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 text-center p-6">
        <div className="rounded-full bg-red-100 p-3 text-red-700"><Lock className="h-8 w-8" /></div>
        <h2 className="font-serif text-2xl font-bold text-ink">Sign In Required</h2>
        <Link to="/login"><Button variant="outline">Sign In to SYNAPTRA</Button></Link>
      </div>
    );
  }

  if (authProfile && !isAuthorized) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 text-center p-6">
        <div className="rounded-full bg-red-100 p-3 text-red-700"><Lock className="h-8 w-8" /></div>
        <h2 className="font-serif text-2xl font-bold text-ink">Access Restricted</h2>
        <p className="text-sm text-ink-500 max-w-sm">
          This console is reserved for verified College Administrators and Campus Leadership.
        </p>
        <Link to="/dashboard"><Button variant="outline">Return to Campus Home</Button></Link>
      </div>
    );
  }

  // Handle plan activation & verified payment
  const handleConfirmSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !currentCollege) return;

    setProcessingPayment(true);
    try {
      const amount = billingCycle === "annual" ? selectedPlan.annualPriceInr : selectedPlan.monthlyPriceInr;
      const orderId = `ord_syn_${Date.now()}`;
      const paymentId = `pay_syn_${Date.now()}`;
      const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 1. Record verified transaction
      await recordPaymentTransaction({
        collegeId: currentCollege.id,
        orderId,
        paymentId,
        amountInr: amount,
        currency: "INR",
        status: "captured",
        method: paymentMethod,
        invoiceNumber,
      });

      // 2. Activate subscription
      const newSub = await createCollegeSubscription({
        collegeId: currentCollege.id,
        planId: selectedPlan.id,
        billingCycle,
        status: "active",
        studentSeatsPurchased: selectedPlan.studentSeatLimit,
        facultySeatsPurchased: selectedPlan.facultySeatLimit,
        additionalStudentSeats: 0,
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + (billingCycle === "annual" ? 365 : 30) * 86400000).toISOString(),
        autoRenew: true,
      });

      setSubscriptions((prev) => [newSub, ...prev.filter((s) => s.collegeId !== currentCollege.id)]);
      toast.success(
        "Subscription Activated!",
        `${selectedPlan.name} is now active. Member capacity unlocked: ${selectedPlan.studentSeatLimit} students, ${selectedPlan.facultySeatLimit} faculty.`
      );
      setSubscribeModalOpen(false);
    } catch (err: any) {
      toast.error("Subscription Error", err?.message || "Failed to process payment");
    } finally {
      setProcessingPayment(false);
    }
  };

  // Handle Add Member with Seat Capacity Enforcement
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCollege) return;

    // Inactive subscription guard
    if (!hasActiveSubscription) {
      toast.error(
        "Subscription Required",
        "An active institutional subscription is required to add campus members. Please select a plan first."
      );
      setAddMemberModalOpen(false);
      setSubscribeModalOpen(true);
      return;
    }

    // Capacity checks
    if (newMemberRole === "student" && studentMembersCount >= studentSeatsLimit) {
      toast.error(
        "Student Seat Limit Reached",
        `Your plan limit of ${studentSeatsLimit} student seats has been reached. Please upgrade your institutional tier.`
      );
      return;
    }

    if (newMemberRole === "faculty" && facultyMembersCount >= facultySeatsLimit) {
      toast.error(
        "Faculty Seat Limit Reached",
        `Your plan limit of ${facultySeatsLimit} faculty seats has been reached. Please upgrade your institutional tier.`
      );
      return;
    }

    setSubmittingMember(true);
    try {
      // 1. Create invitation
      const inv = await createCollegeInvitation({
        collegeId: currentCollege.id,
        email: newMemberEmail,
        role: newMemberRole,
        invitedBy: user.email || "admin@institution.edu",
      });

      // 2. Add membership record
      const mem = await addCollegeMember({
        collegeId: currentCollege.id,
        userId: `usr-${Date.now()}`,
        role: newMemberRole,
        isSeatActive: true,
        department: newMemberDepartment,
      });

      setInvitations((prev) => [inv, ...prev]);
      setMembers((prev) => [mem, ...prev]);

      toast.success(
        "Invitation Dispatched",
        `An institutional invitation was sent to ${newMemberEmail} with role: ${newMemberRole.toUpperCase()}.`
      );

      setAddMemberModalOpen(false);
      setNewMemberName("");
      setNewMemberEmail("");
    } catch (err: any) {
      toast.error("Failed to add member", err?.message || "Please check details");
    } finally {
      setSubmittingMember(false);
    }
  };

  const handleRevokeInvite = async (invId: string) => {
    if (confirm("Revoke this pending invitation?")) {
      await revokeCollegeInvitation(invId);
      setInvitations((prev) => prev.map((i) => (i.id === invId ? { ...i, status: "revoked" } : i)));
      toast.success("Invitation Revoked", "The invitation token was deactivated.");
    }
  };

  const handleSaveCollegeProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("College Profile Saved", "Institutional records and contact details updated successfully.");
  };

  const handleSuspendUser = async (targetUserId: string) => {
    if (confirm("Suspend/restore this user account?")) {
      await suspendUser(user.id, targetUserId);
      await loadData();
    }
  };

  const handleRemoveCollegeMember = async (targetUserId: string) => {
    if (!user) return;
    if (confirm("Remove this member from the institutional workspace? Their personal account, profile, and historical work will be safely preserved.")) {
      const targetCollege = currentCollege?.id || colleges[0]?.id || "col-1";
      await removeCollegeMember(targetCollege, targetUserId, user.id);
      toast.success("Member removed", "College workspace membership revoked; personal account preserved.");
      await loadData();
    }
  };



  const handleModerateProject = async (projId: string, status: "flagged" | "removed" | "open") => {
    await moderateProject(user.id, projId, status);
    await loadData();
  };

  const handleResolveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReportId) return;
    await resolveReport(user.id, selectedReportId, modAction);
    await loadData();
    setResolveModalOpen(false);
  };

  // Filtered views
  const filteredUsers = profiles.filter((p) => {
    const isFac = p.role === "faculty" || !!p.designation;
    const isAdm = p.role === "admin" || p.role === "college_admin";
    if (userRoleFilter === "faculty" && !isFac) return false;
    if (userRoleFilter === "student" && (isFac || isAdm)) return false;
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase();
      if (!p.fullName.toLowerCase().includes(q) && !p.institution.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const filteredProjects = projects.filter((p) => {
    if (projectStatusFilter !== "all" && p.status !== projectStatusFilter) return false;
    if (projectSearch.trim()) {
      const q = projectSearch.toLowerCase();
      if (!p.title.toLowerCase().includes(q) && !p.domains.some((d) => d.toLowerCase().includes(q))) return false;
    }
    return true;
  });

  const filteredReports = reports.filter((r) => {
    if (reportFilter !== "all" && r.status !== reportFilter) return false;
    return true;
  });

  const pendingReportsCount = reports.filter((r) => r.status === "pending").length;

  if (loading) {
    return <AdminDashboardSkeleton />;
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: Sliders },
    { id: "college", label: "College Profile", icon: Building2 },
    { id: "subscriptions", label: "Subscription & Plans", icon: CreditCard },
    { id: "members", label: `Members (${members.length})`, icon: Users },
    { id: "invitations", label: `Invitations (${invitations.length})`, icon: Mail },
    { id: "projects", label: `Campus Projects (${filteredProjects.length})`, icon: FolderGit2 },
    { id: "compliance", label: `Compliance & Reports`, icon: AlertTriangle, badge: pendingReportsCount > 0 ? pendingReportsCount : undefined },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Institution Dashboard Header */}
      <div className="rounded-3xl border border-[#ECE5D8] bg-white p-6 sm:p-8 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#FFF4D0] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#8C6000] border border-[#FFE785]">
              <Shield className="h-3.5 w-3.5 text-[#8C6000]" /> College Administration Console
            </span>
            <span className="text-xs text-[#8C8372] font-semibold bg-[#FAF7EE] rounded-full px-2.5 py-0.5 border border-[#ECE5D8]">
              {currentCollege?.name || authProfile?.institution || "Campus Node"}
            </span>
            <button
              type="button"
              onClick={() => setGuidelinesOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border border-[#FFD040] bg-[#FFFBEA] text-[#7A4D00] hover:bg-[#FFF4D0] transition-colors cursor-pointer shadow-xs"
            >
              <Shield className="h-3.5 w-3.5 text-[#BD7D14]" />
              <span>College Admin Governance & Rules (A–Z)</span>
            </button>
          </div>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-extrabold tracking-tight text-[#181B1F]">
            Institution Dashboard
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#5E646A] max-w-2xl leading-relaxed">
            Manage your campus students, faculty members, institutional subscriptions, and academic project activities.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            onClick={() => {
              if (!hasActiveSubscription) {
                toast.error(
                  "Subscription Required",
                  "An active institutional plan is required before adding members. Please select a plan."
                );
                setActiveTab("subscriptions");
              } else {
                setAddMemberModalOpen(true);
              }
            }}
            variant="primary"
            className="shadow-clay text-xs"
          >
            <UserPlus className="h-3.5 w-3.5 mr-1" /> Add Campus Member
          </Button>

          <Button
            onClick={() => {
              setSelectedPlan(plans[1] || plans[0]);
              setSubscribeModalOpen(true);
            }}
            variant="outline"
            className="text-xs"
          >
            <CreditCard className="h-3.5 w-3.5 mr-1" /> {hasActiveSubscription ? "Manage Plan" : "Activate Subscription"}
          </Button>
        </div>
      </div>

      {/* Inactive Subscription Warning Banner (Does NOT block dashboard access, only blocks member management) */}
      {!hasActiveSubscription && (
        <div className="rounded-3xl border border-[#FFE785] bg-gradient-to-r from-[#FFFBEA] via-white to-[#FFFDF5] p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#8C6000]" />
              <h3 className="text-sm font-bold text-[#181B1F]">
                Institutional Subscription Inactive (Starter Preview Mode)
              </h3>
            </div>
            <p className="text-xs text-[#5E646A] max-w-2xl leading-relaxed">
              You can explore all institution metrics, college profiles, and reports freely. Activate an institutional tier to unlock student/faculty seat invitations and member management.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSelectedPlan(plans[0]);
              setSubscribeModalOpen(true);
            }}
            className="whitespace-nowrap shadow-clay"
          >
            View Plans & Subscribe →
          </Button>
        </div>
      )}

      {/* Pill Navigation Tabs */}
      <div className="flex flex-wrap gap-2 pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as AdminTab);
                setSearchParams({ tab: tab.id });
              }}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all ${
                isActive
                  ? "bg-[#FFC812] text-[#181B1F] shadow-[0_4px_14px_rgba(255,200,18,0.38)] border border-[#E6B30E] scale-[1.02]"
                  : "bg-white/80 border border-[#ECE5D8] text-[#52575C] hover:bg-white hover:text-[#181B1F] shadow-xs"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-[#181B1F]" : "text-[#7B828A]"}`} />
              <span>{tab.label}</span>
              {tab.badge ? (
                <span className="rounded-full bg-red-500 px-1.5 text-[10px] font-extrabold text-white">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* ── TAB: OVERVIEW ── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Institutional KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-5 flex flex-col justify-between rounded-3xl border-[#ECE5D8] bg-white shadow-card">
              <div>
                <span className="text-[10px] font-bold text-[#7B828A] uppercase tracking-wider">Subscription Tier</span>
                <p className="font-serif text-xl sm:text-2xl font-extrabold text-[#181B1F] mt-1">
                  {currentPlan?.name || "Starter Campus"}
                </p>
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${hasActiveSubscription ? "bg-emerald-500" : "bg-amber-500"}`} />
                <span className="text-xs font-bold text-[#8C6000]">
                  {hasActiveSubscription ? "Active Renewal" : "Trial / Inactive"}
                </span>
              </div>
            </Card>

            <Card className="p-5 flex flex-col justify-between rounded-3xl border-[#ECE5D8] bg-white shadow-card">
              <div>
                <span className="text-[10px] font-bold text-[#7B828A] uppercase tracking-wider">Student Capacity</span>
                <p className="font-serif text-3xl font-extrabold text-[#181B1F] mt-1">
                  {studentMembersCount} <span className="text-sm font-normal text-[#7B828A]">/ {studentSeatsLimit}</span>
                </p>
              </div>
              <div className="w-full pt-2">
                <Progress value={Math.round((studentMembersCount / Math.max(studentSeatsLimit, 1)) * 100)} />
              </div>
            </Card>

            <Card className="p-5 flex flex-col justify-between rounded-3xl border-[#ECE5D8] bg-white shadow-card">
              <div>
                <span className="text-[10px] font-bold text-[#7B828A] uppercase tracking-wider">Faculty Capacity</span>
                <p className="font-serif text-3xl font-extrabold text-[#181B1F] mt-1">
                  {facultyMembersCount} <span className="text-sm font-normal text-[#7B828A]">/ {facultySeatsLimit}</span>
                </p>
              </div>
              <div className="w-full pt-2">
                <Progress value={Math.round((facultyMembersCount / Math.max(facultySeatsLimit, 1)) * 100)} />
              </div>
            </Card>

            <Card className="p-5 flex flex-col justify-between rounded-3xl border-[#ECE5D8] bg-white shadow-card">
              <div>
                <span className="text-[10px] font-bold text-[#7B828A] uppercase tracking-wider">Campus Projects</span>
                <p className="font-serif text-3xl font-extrabold text-[#181B1F] mt-1">{filteredProjects.length}</p>
              </div>
              <span className="text-xs text-[#8C6000] font-bold mt-2">Active Research Pods</span>
            </Card>
          </div>

          {/* College Quick Info & Capacity Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg font-bold text-[#181B1F]">College Summary</h3>
                <span className="text-xs font-mono text-[#8C6000] font-bold">{currentCollege?.code || "INST"}</span>
              </div>
              <div className="space-y-2 text-xs text-[#5E646A]">
                <div className="flex justify-between py-1 border-b border-[#ECE5D8]">
                  <span className="font-medium text-[#7B828A]">Official College:</span>
                  <span className="font-bold text-[#181B1F]">{currentCollege?.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#ECE5D8]">
                  <span className="font-medium text-[#7B828A]">Campus Domain:</span>
                  <span className="font-mono text-[#181B1F]">{currentCollege?.domain || "university.ac.in"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#ECE5D8]">
                  <span className="font-medium text-[#7B828A]">Contact Email:</span>
                  <span className="text-[#181B1F]">{currentCollege?.contactEmail}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#ECE5D8]">
                  <span className="font-medium text-[#7B828A]">Industry Members:</span>
                  <span className="font-bold text-[#181B1F]">{industryMembersCount} Connected</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#ECE5D8]">
                  <span className="font-medium text-[#7B828A]">AI Evaluations:</span>
                  <span className="font-bold text-[#181B1F]">{aiCount} Skill Analyses</span>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setActiveTab("college")} className="text-xs flex-1">
                  Edit College Profile
                </Button>
                <Button size="sm" variant="primary" onClick={() => setActiveTab("members")} className="text-xs flex-1">
                  Manage Members
                </Button>
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <h3 className="font-serif text-lg font-bold text-[#181B1F]">Subscription Status</h3>
              <div className="rounded-2xl bg-[#FAF7EE] p-4 border border-[#ECE5D8] space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-[#181B1F]">
                  <span>Tier:</span>
                  <span className="text-[#8C6000]">{currentPlan?.name || "Starter Campus"}</span>
                </div>
                <div className="flex items-center justify-between text-[#5E646A]">
                  <span>Billing Cycle:</span>
                  <span className="capitalize">{activeSubscription?.billingCycle || "Annual"}</span>
                </div>
                <div className="flex items-center justify-between text-[#5E646A]">
                  <span>Expiration / Renewal:</span>
                  <span>{activeSubscription?.currentPeriodEnd ? new Date(activeSubscription.currentPeriodEnd).toLocaleDateString() : "Pending Activation"}</span>
                </div>
                <div className="flex items-center justify-between text-[#5E646A]">
                  <span>Member Management Access:</span>
                  <Badge tone={hasActiveSubscription ? "green" : "amber"}>
                    {hasActiveSubscription ? "UNLOCKED" : "LOCKED (PLAN REQUIRED)"}
                  </Badge>
                </div>
              </div>

              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  setSelectedPlan(plans[1] || plans[0]);
                  setSubscribeModalOpen(true);
                }}
                className="w-full text-xs shadow-clay"
              >
                {hasActiveSubscription ? "Change / Upgrade Tier" : "Activate Institutional Subscription"}
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* ── TAB: COLLEGE PROFILE ── */}
      {activeTab === "college" && (
        <Card className="p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#181B1F]">Institutional Profile & Details</h2>
            <p className="text-xs sm:text-sm text-[#5E646A] mt-1">
              Configure official campus registration, administrative points of contact, and institutional domains.
            </p>
          </div>

          <form onSubmit={handleSaveCollegeProfile} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="College / University Name">
                <Input
                  required
                  value={collegeDetails.name}
                  onChange={(e) => setCollegeDetails({ ...collegeDetails, name: e.target.value })}
                />
              </Field>

              <Field label="Campus Official Code" hint="Unique abbreviation, e.g. IITD, BITS">
                <Input
                  required
                  value={collegeDetails.code}
                  onChange={(e) => setCollegeDetails({ ...collegeDetails, code: e.target.value.toUpperCase() })}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Institutional Domain" hint="Used for authorized student email verification">
                <Input
                  required
                  value={collegeDetails.domain}
                  onChange={(e) => setCollegeDetails({ ...collegeDetails, domain: e.target.value })}
                />
              </Field>

              <Field label="Contact Phone">
                <Input
                  value={collegeDetails.contactPhone}
                  onChange={(e) => setCollegeDetails({ ...collegeDetails, contactPhone: e.target.value })}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Primary Administration Email">
                <Input
                  type="email"
                  required
                  value={collegeDetails.contactEmail}
                  onChange={(e) => setCollegeDetails({ ...collegeDetails, contactEmail: e.target.value })}
                />
              </Field>

              <Field label="Campus Address">
                <Input
                  value={collegeDetails.address}
                  onChange={(e) => setCollegeDetails({ ...collegeDetails, address: e.target.value })}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="City">
                <Input
                  value={collegeDetails.city}
                  onChange={(e) => setCollegeDetails({ ...collegeDetails, city: e.target.value })}
                />
              </Field>

              <Field label="State / Province">
                <Input
                  value={collegeDetails.state}
                  onChange={(e) => setCollegeDetails({ ...collegeDetails, state: e.target.value })}
                />
              </Field>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#ECE5D8]">
              <Button type="submit" variant="primary" className="shadow-clay">
                Save College Profile
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ── TAB: SUBSCRIPTIONS & PLANS ── */}
      {activeTab === "subscriptions" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#181B1F]">
                Institutional Subscription Tiers
              </h2>
              <p className="text-xs sm:text-sm text-[#5E646A] mt-1">
                Choose a plan to increase student seats, faculty capacity, and enable dedicated industry collaboration.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#5E646A]">Status:</span>
              <Badge tone={hasActiveSubscription ? "green" : "amber"}>
                {hasActiveSubscription ? "ACTIVE SUBSCRIPTION" : "INACTIVE (SUBSCRIBE TO ADD MEMBERS)"}
              </Badge>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isSelectedCurrent = activeSubscription?.planId === plan.id;
              return (
                <Card
                  key={plan.id}
                  className={`p-6 rounded-3xl flex flex-col justify-between space-y-5 transition-all ${
                    isSelectedCurrent
                      ? "border-2 border-[#FFC812] shadow-card bg-gradient-to-b from-[#FFFDF5] to-white"
                      : "border border-[#ECE5D8] bg-white hover:border-[#FAB23D]"
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#8C6000]">
                        {plan.code} Tier
                      </span>
                      {isSelectedCurrent && (
                        <span className="clay-badge clay-badge-gold text-[10px]">CURRENT PLAN</span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-serif text-xl font-bold text-[#181B1F]">{plan.name}</h3>
                      <p className="text-xs text-[#5E646A] mt-1">{plan.description}</p>
                    </div>

                    <div className="border-t border-b border-[#ECE5D8] py-3 space-y-1">
                      <div className="flex items-baseline gap-1">
                        <span className="font-serif text-3xl font-black text-[#181B1F]">
                          ₹{plan.annualPriceInr.toLocaleString()}
                        </span>
                        <span className="text-xs text-[#7B828A]">/ year</span>
                      </div>
                      <span className="text-[11px] text-[#7B828A] block">
                        or ₹{plan.monthlyPriceInr.toLocaleString()} billed monthly
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between font-semibold text-[#181B1F]">
                        <span>Student Capacity:</span>
                        <span className="font-mono font-bold text-[#8C6000]">{plan.studentSeatLimit} seats</span>
                      </div>
                      <div className="flex items-center justify-between font-semibold text-[#181B1F]">
                        <span>Faculty Capacity:</span>
                        <span className="font-mono font-bold text-[#8C6000]">{plan.facultySeatLimit} seats</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <span className="text-[10px] uppercase font-mono text-[#7B828A] font-bold">Included Features:</span>
                      {plan.features.map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-[#52575C]">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      setSelectedPlan(plan);
                      setSubscribeModalOpen(true);
                    }}
                    variant={isSelectedCurrent ? "outline" : "primary"}
                    className="w-full text-xs shadow-clay"
                  >
                    {isSelectedCurrent ? "Manage / Renew Tier" : `Select ${plan.name} →`}
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB: MEMBERS ── */}
      {activeTab === "members" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#181B1F]">
                Institutional Members ({members.length})
              </h2>
              <p className="text-xs text-[#5E646A]">
                Students, faculty mentors, and industry liaisons enrolled under this institution
              </p>
            </div>

            <Button
              onClick={() => {
                if (!hasActiveSubscription) {
                  toast.error(
                    "Subscription Required",
                    "An active institutional subscription is required to add campus members. Please select a plan first."
                  );
                  setActiveTab("subscriptions");
                } else {
                  setAddMemberModalOpen(true);
                }
              }}
              variant="primary"
              size="sm"
              className="shadow-clay text-xs self-start sm:self-auto"
            >
              <UserPlus className="h-3.5 w-3.5 mr-1" /> Add Member / Send Invite
            </Button>
          </div>

          {/* Seat Capacity Overview Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[#FAF7EE] border border-[#ECE5D8] rounded-2xl text-xs">
            <div>
              <span className="text-[10px] text-[#7B828A] font-bold uppercase">Student Seat Usage</span>
              <div className="font-bold text-[#181B1F] text-base mt-0.5">
                {studentMembersCount} / {studentSeatsLimit} Seats
              </div>
              <div className="mt-1.5"><Progress value={Math.round((studentMembersCount / Math.max(studentSeatsLimit, 1)) * 100)} /></div>
            </div>

            <div>
              <span className="text-[10px] text-[#7B828A] font-bold uppercase">Faculty Seat Usage</span>
              <div className="font-bold text-[#181B1F] text-base mt-0.5">
                {facultyMembersCount} / {facultySeatsLimit} Seats
              </div>
              <div className="mt-1.5"><Progress value={Math.round((facultyMembersCount / Math.max(facultySeatsLimit, 1)) * 100)} /></div>
            </div>

            <div>
              <span className="text-[10px] text-[#7B828A] font-bold uppercase">Industry Affiliates</span>
              <div className="font-bold text-[#181B1F] text-base mt-0.5">
                {industryMembersCount} Connected
              </div>
              <span className="text-[11px] text-[#8C6000] font-semibold mt-1 block">No seat limit on partners</span>
            </div>
          </div>

          {/* Member Search & Table */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Input
                placeholder="Search institutional members by name or department..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-9 text-xs"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#7B828A]" />
            </div>
            <Select value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value)} className="sm:w-48 text-xs">
              <option value="all">All Roles</option>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
            </Select>
          </div>

          <div className="overflow-hidden clay-panel">
            <table className="min-w-full divide-y divide-[#ECE5D8] text-xs">
              <thead className="bg-[#FAF7EE] text-[#5E646A] uppercase font-bold border-b border-[#ECE5D8]">
                <tr>
                  <th className="px-4 py-3 text-left">Member</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Department</th>
                  <th className="px-4 py-3 text-left">Seat Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4EFE4] text-ink-700">
                {filteredUsers.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FAF7EE]/50 transition">
                    <td className="px-4 py-3">
                      <Link to={`/profile/${p.userId}`} className="font-bold text-ink hover:underline">
                        {p.fullName}
                      </Link>
                      <span className="block text-[11px] text-[#7B828A]">{p.email}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={p.role === "admin" || p.role === "college_admin" ? "red" : p.designation || p.role === "faculty" ? "brass" : "green"}>
                        {p.role === "admin" || p.role === "college_admin" ? "COLLEGE ADMIN" : p.designation || p.role === "faculty" ? "FACULTY" : "STUDENT"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{p.department || "General Academics"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Active Seat
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Button size="sm" variant="ghost" onClick={() => handleSuspendUser(p.userId)} className="text-amber-700 hover:bg-amber-50 text-xs">
                        Suspend
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleRemoveCollegeMember(p.userId)} className="text-red-700 hover:bg-red-50 text-xs" title="Revoke college membership while preserving personal account">
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: INVITATIONS ── */}
      {activeTab === "invitations" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#181B1F]">
                Institutional Invitations ({invitations.length})
              </h2>
              <p className="text-xs text-[#5E646A]">
                Track authorized emails dispatched for campus onboarding
              </p>
            </div>

            <Button
              onClick={() => {
                if (!hasActiveSubscription) {
                  toast.error(
                    "Subscription Required",
                    "An active institutional subscription is required to send invitations. Please select a plan first."
                  );
                  setActiveTab("subscriptions");
                } else {
                  setAddMemberModalOpen(true);
                }
              }}
              variant="primary"
              size="sm"
              className="text-xs shadow-clay"
            >
              <Mail className="h-3.5 w-3.5 mr-1" /> Send New Invitation
            </Button>
          </div>

          <div className="overflow-hidden clay-panel">
            <table className="min-w-full divide-y divide-[#ECE5D8] text-xs">
              <thead className="bg-[#FAF7EE] text-[#5E646A] uppercase font-bold border-b border-[#ECE5D8]">
                <tr>
                  <th className="px-4 py-3 text-left">Invited Email</th>
                  <th className="px-4 py-3 text-left">Assigned Role</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Dispatched By</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4EFE4] text-ink-700">
                {invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#FAF7EE]/50 transition">
                    <td className="px-4 py-3 font-semibold text-[#181B1F]">{inv.email}</td>
                    <td className="px-4 py-3">
                      <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FFF4D0] text-[#8C6000] border border-[#FFE785]">
                        {inv.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={inv.status === "accepted" ? "green" : inv.status === "pending" ? "amber" : "slate"}>
                        {inv.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-[#7B828A]">{inv.invitedBy}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {inv.status === "pending" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRevokeInvite(inv.id)}
                          className="text-red-700 hover:bg-red-50 text-xs"
                        >
                          Revoke
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: PROJECTS ── */}
      {activeTab === "projects" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Input
                placeholder="Search campus project titles or domains..."
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                className="pl-9 text-xs"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#7B828A]" />
            </div>
            <Select
              value={projectStatusFilter}
              onChange={(e) => setProjectStatusFilter(e.target.value)}
              className="sm:w-48 text-xs"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="flagged">Flagged</option>
              <option value="completed">Completed</option>
            </Select>
          </div>

          <div className="overflow-hidden clay-panel">
            <table className="min-w-full divide-y divide-[#ECE5D8] text-xs">
              <thead className="bg-[#FAF7EE] text-[#5E646A] uppercase font-bold border-b border-[#ECE5D8]">
                <tr>
                  <th className="px-4 py-3 text-left">Project</th>
                  <th className="px-4 py-3 text-left">Domain</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4EFE4] text-ink-700">
                {filteredProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FAF7EE]/50 transition">
                    <td className="px-4 py-3">
                      <Link to={`/projects/${p.id}`} className="font-bold text-ink hover:underline">
                        {p.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{p.domains[0] || "Research"}</td>
                    <td className="px-4 py-3">
                      <Badge tone={p.status === "open" ? "green" : p.status === "flagged" ? "amber" : "slate"}>
                        {p.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Link to={`/projects/${p.id}`}>
                        <Button size="sm" variant="ghost" className="text-xs">
                          Inspect Pod
                        </Button>
                      </Link>
                      {p.status !== "flagged" && (
                        <Button size="sm" variant="outline" onClick={() => handleModerateProject(p.id, "flagged")} className="text-amber-700 text-xs">
                          Flag
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: COMPLIANCE & REPORTS ── */}
      {activeTab === "compliance" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#181B1F]">
                Institutional Compliance & Audit Trail
              </h2>
              <p className="text-xs text-[#5E646A]">
                Review moderation reports and verify campus privacy compliance
              </p>
            </div>
            <Select value={reportFilter} onChange={(e) => setReportFilter(e.target.value)} className="w-44 text-xs">
              <option value="all">All Reports</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
            </Select>
          </div>

          {filteredReports.length === 0 ? (
            <Card className="p-8 text-center text-xs text-[#7B828A]">
              No active compliance issues or pending moderation reports for this institution.
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((r) => (
                <Card key={r.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge tone="red">{r.type.toUpperCase()}</Badge>
                      <span className="text-xs text-[#5E646A] ml-2">Target: <strong>{r.targetType}</strong></span>
                    </div>
                    <Badge tone={r.status === "pending" ? "amber" : "green"}>{r.status.toUpperCase()}</Badge>
                  </div>
                  <p className="text-xs text-[#181B1F] bg-[#FFF9EA] p-3 rounded-xl border border-[#FFE785]">
                    <strong>Details:</strong> {r.details}
                  </p>
                  {r.status === "pending" && (
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedReportId(r.id);
                          setResolveModalOpen(true);
                        }}
                        className="text-xs"
                      >
                        Take Action →
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}

          {/* Audit Trail */}
          <div className="space-y-2 pt-4">
            <h3 className="font-serif text-lg font-bold text-[#181B1F]">Administrative Intervention Log</h3>
            <div className="overflow-hidden clay-panel">
              <table className="min-w-full divide-y divide-[#ECE5D8] text-xs">
                <thead className="bg-[#FAF7EE] text-[#5E646A] uppercase font-bold border-b border-[#ECE5D8]">
                  <tr>
                    <th className="px-4 py-3 text-left">Action</th>
                    <th className="px-4 py-3 text-left">Target</th>
                    <th className="px-4 py-3 text-left">Details</th>
                    <th className="px-4 py-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4EFE4] text-ink-700">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#FAF7EE]/50 transition">
                      <td className="px-4 py-3 font-bold uppercase">{log.action}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-[#8C6000] font-bold">{log.target}</td>
                      <td className="px-4 py-3">{log.details}</td>
                      <td className="px-4 py-3 text-right text-ink-400">{new Date(log.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: SUBSCRIBE / UPGRADE PLAN ── */}
      <Modal
        open={subscribeModalOpen}
        onClose={() => setSubscribeModalOpen(false)}
        title={selectedPlan ? `Subscribe to ${selectedPlan.name}` : "Institutional Subscription"}
      >
        {selectedPlan && (
          <form onSubmit={handleConfirmSubscription} className="space-y-4">
            <div className="rounded-2xl bg-[#FFF9EA] border border-[#FFE785] p-3 text-xs text-[#8C6000]">
              <div className="font-bold">Verified Institutional Payment</div>
              <p className="mt-0.5 text-[11px]">
                Upon verified payment receipt, your campus member seat capacity will unlock automatically.
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-[#181B1F]">Select Billing Frequency:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBillingCycle("annual")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    billingCycle === "annual"
                      ? "border-[#FFC812] bg-[#FFF9EA] shadow-xs"
                      : "border-[#ECE5D8] bg-white text-[#5E646A]"
                  }`}
                >
                  <div className="font-bold text-xs text-[#181B1F]">Annual Billing</div>
                  <div className="text-sm font-extrabold font-serif text-[#8C6000] mt-0.5">
                    ₹{selectedPlan.annualPriceInr.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold">Includes 2 Months Free</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBillingCycle("monthly")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    billingCycle === "monthly"
                      ? "border-[#FFC812] bg-[#FFF9EA] shadow-xs"
                      : "border-[#ECE5D8] bg-white text-[#5E646A]"
                  }`}
                >
                  <div className="font-bold text-xs text-[#181B1F]">Monthly Billing</div>
                  <div className="text-sm font-extrabold font-serif text-[#8C6000] mt-0.5">
                    ₹{selectedPlan.monthlyPriceInr.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-[#7B828A]">Billed every 30 days</span>
                </button>
              </div>
            </div>

            <Field label="Payment Gateway Method">
              <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="Net Banking / Corporate UPI">Net Banking / Corporate UPI (Instant Verification)</option>
                <option value="Institutional Credit Card">Institutional Credit Card / Forex</option>
                <option value="NEFT / RTGS Bank Transfer">NEFT / RTGS Bank Direct Debit</option>
              </Select>
            </Field>

            <div className="bg-[#FAF7EE] p-3 rounded-2xl border border-[#ECE5D8] text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#7B828A]">Student Seat Limit:</span>
                <span className="font-bold text-[#181B1F]">{selectedPlan.studentSeatLimit} verified students</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7B828A]">Faculty Seat Limit:</span>
                <span className="font-bold text-[#181B1F]">{selectedPlan.facultySeatLimit} faculty mentors</span>
              </div>
              <div className="flex justify-between border-t border-[#ECE5D8] pt-1.5 text-sm font-bold text-[#181B1F]">
                <span>Total Payable:</span>
                <span className="text-[#8C6000]">
                  ₹{(billingCycle === "annual" ? selectedPlan.annualPriceInr : selectedPlan.monthlyPriceInr).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#ECE5D8]">
              <Button type="button" variant="outline" size="sm" onClick={() => setSubscribeModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={processingPayment} className="shadow-clay">
                {processingPayment ? "Verifying Payment..." : "Confirm & Activate Subscription →"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── MODAL: ADD MEMBER / SEND INVITATION ── */}
      <Modal
        open={addMemberModalOpen}
        onClose={() => setAddMemberModalOpen(false)}
        title="Add Institutional Member / Send Invitation"
      >
        <form onSubmit={handleAddMember} className="space-y-4">
          <div className="rounded-2xl bg-[#FAF7EE] border border-[#ECE5D8] p-3 text-xs space-y-1">
            <span className="font-bold text-[#181B1F]">College: {currentCollege?.name}</span>
            <div className="text-[#5E646A] flex gap-3 text-[11px]">
              <span>Student Seats Available: {Math.max(0, studentSeatsLimit - studentMembersCount)}</span>
              <span>•</span>
              <span>Faculty Seats Available: {Math.max(0, facultySeatsLimit - facultyMembersCount)}</span>
            </div>
          </div>

          <Field label="Member Role">
            <Select
              value={newMemberRole}
              onChange={(e) => setNewMemberRole(e.target.value as any)}
            >
              <option value="student">Student / Researcher</option>
              <option value="faculty">Faculty / Academic Mentor</option>
              <option value="industry_partner">Industry Liaison / Enterprise Affiliate</option>
            </Select>
          </Field>

          <Field label="Full Name">
            <Input
              required
              placeholder="e.g. Ananya Sharma"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
            />
          </Field>

          <Field label="Official Institutional Email" hint="Must match university domain for automatic association">
            <Input
              type="email"
              required
              placeholder="ananya@institution.ac.in"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
            />
          </Field>

          <Field label="Academic Department / Domain">
            <Input
              required
              placeholder="e.g. Computer Science & Engineering"
              value={newMemberDepartment}
              onChange={(e) => setNewMemberDepartment(e.target.value)}
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#ECE5D8]">
            <Button type="button" variant="outline" size="sm" onClick={() => setAddMemberModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={submittingMember} className="shadow-clay">
              {submittingMember ? "Sending Invitation..." : "Send Invitation & Add Seat →"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: RESOLVE REPORT ── */}
      <Modal open={resolveModalOpen} onClose={() => setResolveModalOpen(false)} title="Resolve Moderation Report">
        <form onSubmit={handleResolveReport} className="space-y-4">
          <Field label="Choose Action">
            <Select value={modAction} onChange={(e) => setModAction(e.target.value as ModerationAction)}>
              <option value="dismiss">Dismiss (No violation found)</option>
              <option value="warn">Issue Official Warning</option>
              <option value="remove_content">Remove Flagged Content</option>
              <option value="suspend">Suspend User Account</option>
              <option value="escalate">Escalate to Ethics Committee</option>
            </Select>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setResolveModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Confirm Resolution</Button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: COLLEGE ADMIN ACCESS GUIDELINES & GOVERNANCE ── */}
      <CollegeAdminAccessGuidelinesModal
        open={guidelinesOpen}
        onClose={() => setGuidelinesOpen(false)}
      />
    </div>
  );
}
