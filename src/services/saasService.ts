import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type {
  College,
  IndustryPartner,
  SubscriptionPlan,
  CollegeSubscription,
  PaymentTransaction,
  CollegeMembership,
  CollegeInvitation,
  ChallengeApplication,
  IndustryChallenge,
  CurriculumGapReport,
  KnowledgeRecoveryPath,
} from "@/types";

// =============================================================================
// DEFAULT IN-MEMORY SEEDS (Graceful fallback if database migration is pending)
// =============================================================================

export const DEFAULT_PLANS: SubscriptionPlan[] = [
  {
    id: "plan-starter",
    name: "Starter Campus",
    code: "starter",
    description: "For small academic departments and research cohorts",
    monthlyPriceInr: 9999,
    annualPriceInr: 99999,
    studentSeatLimit: 100,
    facultySeatLimit: 10,
    features: ["Core Project Workspace", "Basic AI Matching", "Weekly Submissions", "Role-Based Access"],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "plan-growth",
    name: "Growth Institution",
    code: "growth",
    description: "For growing multi-department engineering and science colleges",
    monthlyPriceInr: 24999,
    annualPriceInr: 249999,
    studentSeatLimit: 500,
    facultySeatLimit: 50,
    features: [
      "All Starter Features",
      "Full Gemini AI Integration",
      "Industry Innovation Bridge",
      "Detailed Faculty Monitoring",
      "Dedicated Support",
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "plan-enterprise",
    name: "Enterprise University",
    code: "enterprise",
    description: "Full institutional deployment with custom seats and priority integration",
    monthlyPriceInr: 49999,
    annualPriceInr: 499999,
    studentSeatLimit: 2000,
    facultySeatLimit: 200,
    features: [
      "All Growth Features",
      "Curriculum Evolution Intelligence",
      "Custom Domain SSO",
      "Unlimited Storage",
      "24/7 SLA Support",
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_COLLEGES: College[] = [
  {
    id: "col-1",
    name: "Indian Institute of Technology, Delhi",
    code: "IITD",
    domain: "iitd.ac.in",
    address: "Hauz Khas, New Delhi",
    city: "New Delhi",
    state: "Delhi",
    contactEmail: "admin@iitd.ac.in",
    contactPhone: "+91 11 2659 7135",
    status: "active",
    maxStudents: 1500,
    maxFaculty: 120,
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "col-2",
    name: "Birla Institute of Technology and Science, Pilani",
    code: "BITS",
    domain: "pilani.bits-pilani.ac.in",
    address: "Vidya Vihar, Pilani",
    city: "Pilani",
    state: "Rajasthan",
    contactEmail: "dean.research@pilani.bits-pilani.ac.in",
    contactPhone: "+91 1596 242 207",
    status: "active",
    maxStudents: 800,
    maxFaculty: 80,
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "col-3",
    name: "National Institute of Technology, Karnataka",
    code: "NITK",
    domain: "nitk.edu.in",
    address: "Srinivasnagar, Surathkal",
    city: "Mangalore",
    state: "Karnataka",
    contactEmail: "academics@nitk.edu.in",
    contactPhone: "+91 824 247 4000",
    status: "active",
    maxStudents: 500,
    maxFaculty: 50,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// In-memory runtime caches
let _cachedColleges: College[] = [...INITIAL_COLLEGES];
let _cachedSubscriptions: CollegeSubscription[] = [
  {
    id: "sub-1",
    collegeId: "col-1",
    planId: "plan-enterprise",
    billingCycle: "annual",
    status: "active",
    studentSeatsPurchased: 1500,
    facultySeatsPurchased: 120,
    additionalStudentSeats: 0,
    currentPeriodStart: new Date(Date.now() - 60 * 86400000).toISOString(),
    currentPeriodEnd: new Date(Date.now() + 305 * 86400000).toISOString(),
    autoRenew: true,
  },
  {
    id: "sub-2",
    collegeId: "col-2",
    planId: "plan-growth",
    billingCycle: "annual",
    status: "active",
    studentSeatsPurchased: 800,
    facultySeatsPurchased: 80,
    additionalStudentSeats: 300,
    currentPeriodStart: new Date(Date.now() - 45 * 86400000).toISOString(),
    currentPeriodEnd: new Date(Date.now() + 320 * 86400000).toISOString(),
    autoRenew: true,
  },
  {
    id: "sub-3",
    collegeId: "col-3",
    planId: "plan-starter",
    billingCycle: "monthly",
    status: "active",
    studentSeatsPurchased: 500,
    facultySeatsPurchased: 50,
    additionalStudentSeats: 0,
    currentPeriodStart: new Date(Date.now() - 15 * 86400000).toISOString(),
    currentPeriodEnd: new Date(Date.now() + 15 * 86400000).toISOString(),
    autoRenew: true,
  },
];

let _cachedPayments: PaymentTransaction[] = [
  {
    id: "pay-1",
    collegeId: "col-1",
    subscriptionId: "sub-1",
    orderId: "order_syn_8492048",
    paymentId: "pay_syn_94829384",
    amountInr: 499999,
    currency: "INR",
    status: "captured",
    method: "Net Banking",
    invoiceNumber: "INV-2026-0001",
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: "pay-2",
    collegeId: "col-2",
    subscriptionId: "sub-2",
    orderId: "order_syn_8492049",
    paymentId: "pay_syn_94829385",
    amountInr: 249999,
    currency: "INR",
    status: "captured",
    method: "UPI",
    invoiceNumber: "INV-2026-0002",
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
];

// =============================================================================
// 1. COLLEGE MANAGEMENT SERVICES
// =============================================================================

export async function fetchColleges(): Promise<College[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from("colleges").select("*").order("name");
      if (!error && data && data.length > 0) {
        return data.map((r: any) => ({
          id: r.id,
          name: r.name,
          code: r.code,
          domain: r.domain,
          logoUrl: r.logo_url,
          address: r.address,
          city: r.city,
          state: r.state,
          contactEmail: r.contact_email,
          contactPhone: r.contact_phone,
          adminId: r.admin_id,
          status: r.status,
          maxStudents: r.max_students ?? 100,
          maxFaculty: r.max_faculty ?? 10,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }));
      }
    } catch (err) {
      console.warn("Using fallback colleges seed:", err);
    }
  }
  return _cachedColleges;
}

export async function createCollege(data: Omit<College, "id" | "createdAt" | "updatedAt">): Promise<College> {
  const newCol: College = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: inserted, error } = await supabase
        .from("colleges")
        .insert({
          id: newCol.id,
          name: newCol.name,
          code: newCol.code,
          domain: newCol.domain,
          logo_url: newCol.logoUrl,
          address: newCol.address,
          city: newCol.city,
          state: newCol.state,
          contact_email: newCol.contactEmail,
          contact_phone: newCol.contactPhone,
          status: newCol.status,
          max_students: newCol.maxStudents,
          max_faculty: newCol.maxFaculty,
        })
        .select()
        .single();
      if (!error && inserted) {
        newCol.id = inserted.id;
      }
    } catch (err) {
      console.warn("Fallback local college store:", err);
    }
  }

  _cachedColleges = [newCol, ..._cachedColleges];
  return newCol;
}

export async function updateCollegeStatus(id: string, status: College["status"]): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("colleges").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    } catch {}
  }
  _cachedColleges = _cachedColleges.map((c) => (c.id === id ? { ...c, status } : c));
}

// =============================================================================
// 2. SUBSCRIPTION & BILLING SERVICES
// =============================================================================

export async function fetchSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from("subscription_plans").select("*").eq("is_active", true);
      if (!error && data && data.length > 0) {
        return data.map((p: any) => ({
          id: p.id,
          name: p.name,
          code: p.code,
          description: p.description,
          monthlyPriceInr: Number(p.monthly_price_inr),
          annualPriceInr: Number(p.annual_price_inr),
          studentSeatLimit: p.student_seat_limit,
          facultySeatLimit: p.faculty_seat_limit,
          features: Array.isArray(p.features) ? p.features : [],
          isActive: p.is_active,
          createdAt: p.created_at,
        }));
      }
    } catch {}
  }
  return DEFAULT_PLANS;
}

export async function fetchCollegeSubscriptions(_collegeId?: string): Promise<CollegeSubscription[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from("college_subscriptions").select("*, subscription_plans(*), colleges(*)");
      if (!error && data && data.length > 0) {
        return data.map((s: any) => ({
          id: s.id,
          collegeId: s.college_id,
          planId: s.plan_id,
          billingCycle: s.billing_cycle,
          status: s.status,
          studentSeatsPurchased: s.student_seats_purchased,
          facultySeatsPurchased: s.faculty_seats_purchased,
          additionalStudentSeats: s.additional_student_seats,
          currentPeriodStart: s.current_period_start,
          currentPeriodEnd: s.current_period_end,
          autoRenew: s.auto_renew,
        }));
      }
    } catch {}
  }
  return _cachedSubscriptions;
}

// =============================================================================
// 3. PAYMENT & REVENUE SERVICES
// =============================================================================

export async function fetchPaymentTransactions(_collegeId?: string): Promise<PaymentTransaction[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from("payment_transactions").select("*").order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map((t: any) => ({
          id: t.id,
          collegeId: t.college_id,
          subscriptionId: t.subscription_id,
          orderId: t.order_id,
          paymentId: t.payment_id,
          signature: t.signature,
          amountInr: Number(t.amount_inr),
          currency: t.currency,
          status: t.status,
          method: t.method,
          invoiceNumber: t.invoice_number,
          createdAt: t.created_at,
        }));
      }
    } catch {}
  }
  return _cachedPayments;
}

// =============================================================================
// 4. FUTURE FEATURE 1: INDUSTRY INNOVATION BRIDGE
// =============================================================================

export const SAMPLE_CHALLENGES: IndustryChallenge[] = [
  {
    id: "chal-1",
    partnerId: "part-1",
    title: "Edge AI for Predictive Equipment Diagnostics in Clean Energy Grids",
    problemStatement:
      "Design and evaluate a lightweight inference model for sub-second telemetry anomaly detection on low-power solar inverter microcontrollers.",
    domain: "Embedded AI & IoT",
    requiredSkills: ["Python", "TensorFlow Lite", "Time-Series Analysis", "Embedded Systems"],
    expectedOutcomes: "Quantized ONNX/TFLite model benchmarked with >94% precision and <50ms latency.",
    bountyOrGrant: "₹2,50,000 Research Grant & Industry Co-Authorship",
    deadline: new Date(Date.now() + 60 * 86400000).toISOString(),
    status: "open",
    createdAt: new Date().toISOString(),
    partner: {
      id: "part-1",
      name: "Solaria Clean Energy Systems",
      contactName: "Dr. Vikram Seth",
      contactEmail: "rnd@solariagrid.in",
      website: "https://solariagrid.in",
      status: "active",
      createdAt: new Date().toISOString(),
    },
  },
  {
    id: "chal-2",
    partnerId: "part-2",
    title: "Zero-Knowledge Proof Verification for Student Credentials on Polygon",
    problemStatement:
      "Construct a privacy-preserving zk-SNARK verification pipeline to validate university degree transcripts without disclosing underlying grades or personal identity.",
    domain: "Cryptography & Web3",
    requiredSkills: ["Solidity", "Circom", "TypeScript", "Applied Cryptography"],
    expectedOutcomes: "Audited smart contracts and client verification SDK with gas optimization report.",
    bountyOrGrant: "₹3,00,000 Innovation Bounty",
    deadline: new Date(Date.now() + 45 * 86400000).toISOString(),
    status: "open",
    createdAt: new Date().toISOString(),
    partner: {
      id: "part-2",
      name: "PolyLedger Technologies",
      contactName: "Ananya Roy",
      contactEmail: "partnerships@polyledger.io",
      website: "https://polyledger.io",
      status: "active",
      createdAt: new Date().toISOString(),
    },
  },
];

export async function fetchIndustryChallenges(): Promise<IndustryChallenge[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from("industry_challenges").select("*, industry_partners(*)");
      if (!error && data && data.length > 0) {
        return data.map((c: any) => ({
          id: c.id,
          partnerId: c.partner_id,
          title: c.title,
          problemStatement: c.problem_statement,
          domain: c.domain,
          requiredSkills: c.required_skills ?? [],
          expectedOutcomes: c.expected_outcomes,
          bountyOrGrant: c.bounty_or_grant,
          deadline: c.deadline,
          status: c.status,
          createdAt: c.created_at,
          partner: c.industry_partners,
        }));
      }
    } catch {}
  }
  return SAMPLE_CHALLENGES;
}

// =============================================================================
// 5. FUTURE FEATURE 2: CURRICULUM EVOLUTION INTELLIGENCE
// =============================================================================

export const SAMPLE_CURRICULUM_REPORTS: CurriculumGapReport[] = [
  {
    id: "gap-1",
    collegeId: "col-1",
    department: "Computer Science & Engineering",
    coveragePercentage: 78.5,
    practicalEvidenceScore: 64.2,
    industryAlignmentScore: 71.0,
    gapsIdentified: [
      {
        topic: "Asynchronous Microservices & Distributed Tracing",
        gapType: "low_practical_evidence",
        impactSeverity: "high",
        explanation: "Syllabus covers theoretical queuing, but student GitHub repositories lack telemetry or containerized microservice architectures.",
      },
      {
        topic: "Cloud-Native Infrastructure as Code (Terraform/Docker)",
        gapType: "missing_industry_alignment",
        impactSeverity: "medium",
        explanation: "Over 85% of campus hiring partner requisitions require Docker/K8s; course assessment primarily tests static VMs.",
      },
      {
        topic: "Prompt Engineering & RAG Systems for LLMs",
        gapType: "not_taught",
        impactSeverity: "medium",
        explanation: "Modern AI electives focus on traditional CNN/RNN modeling; generative search architectures are currently omitted.",
      },
    ],
    recommendations: [
      {
        action: "Introduce a mandatory 3-week microservice containerization milestone into CS302 Software Lab.",
        rationale: "Aligns student portfolios with industry-standard deployment pipelines.",
        priority: "high",
      },
      {
        action: "Partner with AWS/Google Cloud for free academic credits on Cloud Computing Lab (CS401).",
        rationale: "Provides students with live cloud testbeds rather than local simulation.",
        priority: "medium",
      },
    ],
    status: "published",
    generatedAt: new Date().toISOString(),
  },
];

export async function fetchCurriculumReports(): Promise<CurriculumGapReport[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from("curriculum_gap_reports").select("*");
      if (!error && data && data.length > 0) {
        return data.map((r: any) => ({
          id: r.id,
          collegeId: r.college_id,
          department: r.department,
          coveragePercentage: Number(r.coverage_percentage),
          practicalEvidenceScore: Number(r.practical_evidence_score),
          industryAlignmentScore: Number(r.industry_alignment_score),
          gapsIdentified: r.gaps_identified ?? [],
          recommendations: r.recommendations ?? [],
          status: r.status,
          generatedAt: r.generated_at,
        }));
      }
    } catch {}
  }
  return SAMPLE_CURRICULUM_REPORTS;
}

// =============================================================================
// 6. FUTURE FEATURE 3: PROJECT-DRIVEN KNOWLEDGE RECOVERY
// =============================================================================

export const SAMPLE_RECOVERY_PATHS: KnowledgeRecoveryPath[] = [
  {
    id: "rec-1",
    studentId: "student-1",
    conceptName: "JWT Authentication & Secure Token Storage",
    difficultyLevel: "intermediate",
    prerequisitePath: [
      {
        stepNumber: 1,
        title: "HTTP Request/Response Lifecycle & Header Mechanics",
        description: "Understand Authorization headers, Bearer schemas, and stateless authentication.",
        estimatedMinutes: 45,
        completed: true,
      },
      {
        stepNumber: 2,
        title: "Symmetric vs. Asymmetric Cryptographic Signatures",
        description: "Learn how HMAC-SHA256 signs payload tamper-proof tokens using secret keys.",
        estimatedMinutes: 60,
        completed: true,
      },
      {
        stepNumber: 3,
        title: "Token Expiry, Refresh Tokens & Secure Storage",
        description: "Avoid localStorage XSS vulnerabilities; implement httpOnly cookies and rotation.",
        estimatedMinutes: 75,
        completed: false,
      },
      {
        stepNumber: 4,
        title: "Project Task Verification: Protect Room REST Endpoint",
        description: "Apply token validation middleware to your project workspace API route.",
        estimatedMinutes: 60,
        completed: false,
      },
    ],
    learningResources: [
      {
        title: "RFC 7519 — JSON Web Token (JWT) Architectural Standard",
        url: "https://datatracker.ietf.org/doc/html/rfc7519",
        type: "documentation",
      },
      {
        title: "Interactive Token Debugger & Signature Playground",
        url: "https://jwt.io",
        type: "interactive_lab",
      },
    ],
    progressPercent: 50,
    status: "in_progress",
    facultyFeedback: "Good progress on cryptographic concepts; proceed to step 3 to complete endpoint defense.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function fetchStudentRecoveryPaths(studentId?: string): Promise<KnowledgeRecoveryPath[]> {
  if (isSupabaseConfigured && supabase && studentId) {
    try {
      const { data, error } = await supabase.from("knowledge_recovery_paths").select("*").eq("student_id", studentId);
      if (!error && data && data.length > 0) {
        return data.map((p: any) => ({
          id: p.id,
          studentId: p.student_id,
          projectId: p.project_id,
          taskId: p.task_id,
          conceptName: p.concept_name,
          difficultyLevel: p.difficulty_level,
          prerequisitePath: p.prerequisite_path ?? [],
          learningResources: p.learning_resources ?? [],
          progressPercent: p.progress_percent,
          status: p.status,
          facultyFeedback: p.faculty_feedback,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        }));
      }
    } catch {}
  }
  return SAMPLE_RECOVERY_PATHS;
}


// =============================================================================
// 7. INSTITUTIONAL SUBSCRIPTIONS, MEMBERSHIP & CHALLENGE APPLICATIONS
// =============================================================================

export async function createCollegeSubscription(sub: Omit<CollegeSubscription, "id">): Promise<CollegeSubscription> {
  const newSub: CollegeSubscription = {
    ...sub,
    id: `sub-${Date.now()}`,
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from("college_subscriptions").insert({
        college_id: newSub.collegeId,
        plan_id: newSub.planId,
        billing_cycle: newSub.billingCycle,
        status: newSub.status,
        student_seats_purchased: newSub.studentSeatsPurchased,
        faculty_seats_purchased: newSub.facultySeatsPurchased,
        additional_student_seats: newSub.additionalStudentSeats || 0,
        current_period_start: newSub.currentPeriodStart,
        current_period_end: newSub.currentPeriodEnd,
        auto_renew: newSub.autoRenew,
      }).select().single();
      if (!error && data) {
        newSub.id = data.id;
      }
    } catch (e) {
      console.warn("Using fallback local subscription store:", e);
    }
  }

  // Update in-memory cache
  _cachedSubscriptions = [newSub, ..._cachedSubscriptions.filter(s => s.collegeId !== newSub.collegeId)];
  return newSub;
}

export async function recordPaymentTransaction(tx: Omit<PaymentTransaction, "id" | "createdAt">): Promise<PaymentTransaction> {
  const newTx: PaymentTransaction = {
    ...tx,
    id: `pay-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from("payment_transactions").insert({
        college_id: newTx.collegeId,
        subscription_id: newTx.subscriptionId,
        order_id: newTx.orderId,
        payment_id: newTx.paymentId,
        amount_inr: newTx.amountInr,
        currency: newTx.currency || "INR",
        status: newTx.status,
        method: newTx.method,
        invoice_number: newTx.invoiceNumber,
      }).select().single();
      if (!error && data) {
        newTx.id = data.id;
      }
    } catch (e) {
      console.warn("Using fallback local payment store:", e);
    }
  }

  _cachedPayments = [newTx, ..._cachedPayments];
  return newTx;
}

let _cachedMemberships: CollegeMembership[] = [
  { id: "mem-1", collegeId: "col-1", userId: "usr-1", role: "student", isSeatActive: true, department: "Computer Science & Engineering", joinedAt: new Date(Date.now() - 30 * 86400000).toISOString() },
  { id: "mem-2", collegeId: "col-1", userId: "usr-2", role: "student", isSeatActive: true, department: "Electronics & Communication", joinedAt: new Date(Date.now() - 25 * 86400000).toISOString() },
  { id: "mem-3", collegeId: "col-1", userId: "usr-3", role: "faculty", isSeatActive: true, department: "Computer Science & Engineering", joinedAt: new Date(Date.now() - 60 * 86400000).toISOString() },
  { id: "mem-4", collegeId: "col-1", userId: "usr-4", role: "faculty", isSeatActive: true, department: "Artificial Intelligence", joinedAt: new Date(Date.now() - 40 * 86400000).toISOString() },
  { id: "mem-5", collegeId: "col-1", userId: "usr-5", role: "industry_partner", isSeatActive: true, department: "Industry Liaison / R&D", joinedAt: new Date(Date.now() - 10 * 86400000).toISOString() },
];

let _cachedInvitations: CollegeInvitation[] = [
  { id: "inv-1", collegeId: "col-1", email: "student.researcher@iitd.ac.in", role: "student", invitedBy: "admin@iitd.ac.in", token: "tok-1", status: "pending", expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(), createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: "inv-2", collegeId: "col-1", email: "dr.sharma@iitd.ac.in", role: "faculty", invitedBy: "admin@iitd.ac.in", token: "tok-2", status: "accepted", expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(), createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
];

export async function fetchCollegeMembers(collegeId?: string): Promise<CollegeMembership[]> {
  if (isSupabaseConfigured && supabase && collegeId) {
    try {
      const { data, error } = await supabase.from("college_memberships").select("*").eq("college_id", collegeId);
      if (!error && data && data.length > 0) {
        return data.map((m: any) => ({
          id: m.id,
          collegeId: m.college_id,
          userId: m.user_id,
          role: m.role,
          isSeatActive: m.is_seat_active,
          department: m.department,
          joinedAt: m.joined_at,
        }));
      }
    } catch {}
  }
  return collegeId ? _cachedMemberships.filter(m => m.collegeId === collegeId) : _cachedMemberships;
}

export async function addCollegeMember(membership: Omit<CollegeMembership, "id" | "joinedAt">): Promise<CollegeMembership> {
  const newMem: CollegeMembership = {
    ...membership,
    id: `mem-${Date.now()}`,
    joinedAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from("college_memberships").insert({
        college_id: newMem.collegeId,
        user_id: newMem.userId,
        role: newMem.role,
        is_seat_active: newMem.isSeatActive,
        department: newMem.department,
      }).select().single();
      if (!error && data) {
        newMem.id = data.id;
      }
    } catch {}
  }

  _cachedMemberships = [newMem, ..._cachedMemberships];
  return newMem;
}

export async function fetchCollegeInvitations(collegeId?: string): Promise<CollegeInvitation[]> {
  if (isSupabaseConfigured && supabase && collegeId) {
    try {
      const { data, error } = await supabase.from("college_invitations").select("*").eq("college_id", collegeId).order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map((i: any) => ({
          id: i.id,
          collegeId: i.college_id,
          email: i.email,
          role: i.role,
          invitedBy: i.invited_by,
          token: i.token,
          status: i.status,
          expiresAt: i.expires_at,
          createdAt: i.created_at,
        }));
      }
    } catch {}
  }
  return collegeId ? _cachedInvitations.filter(i => i.collegeId === collegeId) : _cachedInvitations;
}

export async function createCollegeInvitation(invitation: Omit<CollegeInvitation, "id" | "token" | "status" | "createdAt" | "expiresAt">): Promise<CollegeInvitation> {
  const newInv: CollegeInvitation = {
    ...invitation,
    id: `inv-${Date.now()}`,
    token: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `tok-${Date.now()}`,
    status: "pending",
    expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from("college_invitations").insert({
        college_id: newInv.collegeId,
        email: newInv.email,
        role: newInv.role,
        invited_by: newInv.invitedBy,
        token: newInv.token,
        status: newInv.status,
        expires_at: newInv.expiresAt,
      }).select().single();
      if (!error && data) {
        newInv.id = data.id;
      }
    } catch {}
  }

  _cachedInvitations = [newInv, ..._cachedInvitations];
  return newInv;
}

export async function revokeCollegeInvitation(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("college_invitations").update({ status: "revoked" }).eq("id", id);
    } catch {}
  }
  _cachedInvitations = _cachedInvitations.map(i => i.id === id ? { ...i, status: "revoked" } : i);
}

// ── Industry Challenge Creation & Applications ──

let _cachedChallengeApplications: ChallengeApplication[] = [
  {
    id: "app-1",
    challengeId: "chal-1",
    collegeId: "col-1",
    teamName: "IITD SolarEdge Research Group",
    leadStudentId: "usr-1",
    proposalSummary: "Proposed lightweight hybrid transformer running on ESP32 microcontrollers with integer quantization and sub-20ms inference latency.",
    aiMatchScore: 92,
    status: "submitted",
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: "app-2",
    challengeId: "chal-2",
    collegeId: "col-2",
    teamName: "BITS ZK-Crypto Lab",
    leadStudentId: "usr-2",
    proposalSummary: "Constructing Circom circuits with Plonk verifier contract deployed to Polygon testnet. Complete end-to-end transcript privacy benchmark.",
    aiMatchScore: 96,
    status: "accepted",
    feedback: "Exceptional architecture. Recommended for immediate ₹3,00,000 project sponsorship and university lab grant.",
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

export async function createIndustryChallenge(challenge: Omit<IndustryChallenge, "id" | "createdAt">): Promise<IndustryChallenge> {
  const newChal: IndustryChallenge = {
    ...challenge,
    id: `chal-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from("industry_challenges").insert({
        partner_id: newChal.partnerId,
        title: newChal.title,
        problem_statement: newChal.problemStatement,
        domain: newChal.domain,
        required_skills: newChal.requiredSkills,
        expected_outcomes: newChal.expectedOutcomes,
        bounty_or_grant: newChal.bountyOrGrant,
        target_college_id: newChal.targetCollegeId,
        deadline: newChal.deadline,
        status: newChal.status,
      }).select().single();
      if (!error && data) {
        newChal.id = data.id;
      }
    } catch {}
  }

  SAMPLE_CHALLENGES.unshift(newChal);
  return newChal;
}

export async function fetchChallengeApplications(challengeId?: string): Promise<ChallengeApplication[]> {
  if (isSupabaseConfigured && supabase && challengeId) {
    try {
      const { data, error } = await supabase.from("challenge_applications").select("*").eq("challenge_id", challengeId);
      if (!error && data && data.length > 0) {
        return data.map((a: any) => ({
          id: a.id,
          challengeId: a.challenge_id,
          projectId: a.project_id,
          collegeId: a.college_id,
          teamName: a.team_name,
          leadStudentId: a.lead_student_id,
          mentorFacultyId: a.mentor_faculty_id,
          proposalSummary: a.proposal_summary,
          aiMatchScore: Number(a.ai_match_score || 0),
          status: a.status,
          feedback: a.feedback,
          createdAt: a.created_at,
        }));
      }
    } catch {}
  }
  return challengeId ? _cachedChallengeApplications.filter(a => a.challengeId === challengeId) : _cachedChallengeApplications;
}

export async function submitChallengeApplication(app: Omit<ChallengeApplication, "id" | "createdAt">): Promise<ChallengeApplication> {
  const newApp: ChallengeApplication = {
    ...app,
    id: `capp-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from("challenge_applications").insert({
        challenge_id: newApp.challengeId,
        project_id: newApp.projectId,
        college_id: newApp.collegeId,
        team_name: newApp.teamName,
        lead_student_id: newApp.leadStudentId,
        mentor_faculty_id: newApp.mentorFacultyId,
        proposal_summary: newApp.proposalSummary,
        ai_match_score: newApp.aiMatchScore,
        status: newApp.status,
      }).select().single();
      if (!error && data) {
        newApp.id = data.id;
      }
    } catch {}
  }

  _cachedChallengeApplications = [newApp, ..._cachedChallengeApplications];
  return newApp;
}

export async function updateChallengeApplicationStatus(id: string, status: ChallengeApplication["status"], feedback?: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("challenge_applications").update({
        status,
        feedback: feedback ?? null,
      }).eq("id", id);
    } catch {}
  }

  _cachedChallengeApplications = _cachedChallengeApplications.map(a => 
    a.id === id ? { ...a, status, feedback: feedback !== undefined ? feedback : a.feedback } : a
  );
}


// =============================================================================
// 8. BACKWARD COMPATIBILITY HELPERS FOR ADMIN & REGISTRATION
// =============================================================================

export async function fetchCollegeById(id: string): Promise<College | null> {
  const colleges = await fetchColleges();
  return colleges.find((c) => c.id === id) || colleges[0] || null;
}

export async function updateCollegeBranding(id: string, branding: Partial<College>): Promise<College> {
  const cols = await fetchColleges();
  const c = cols.find((col) => col.id === id) || cols[0];
  Object.assign(c, branding);
  return c;
}

export async function fetchCollegeSubscription(collegeId: string): Promise<CollegeSubscription | null> {
  const subs = await fetchCollegeSubscriptions(collegeId);
  return subs.find((s) => s.status === 'active') || subs[0] || null;
}

export async function fetchInstitutionCapacityFromSubscription(collegeId: string) {
  const subs = await fetchCollegeSubscriptions(collegeId);
  const activeSub = subs.find((s) => s.status === 'active') || subs[0];
  const members = await fetchCollegeMembers(collegeId);
  const studentUsed = members.filter((m) => m.role === 'student').length;
  const facultyUsed = members.filter((m) => m.role === 'faculty').length;
  const industryUsed = members.filter((m) => m.role === 'industry_partner').length;
  const studentQuota = (activeSub?.studentSeatsPurchased || 100) + (activeSub?.additionalStudentSeats || 0);
  const facultyQuota = activeSub?.facultySeatsPurchased || 15;
  return {
    studentQuota,
    studentUsed,
    facultyQuota,
    facultyUsed,
    industryUsed,
    remainingStudents: Math.max(0, studentQuota - studentUsed),
    remainingFaculty: Math.max(0, facultyQuota - facultyUsed),
    status: activeSub?.status || 'active',
    planName: activeSub ? 'Campus Plan' : 'Starter Campus',
  };
}

export async function processCollegeSubscriptionPayment(data: any): Promise<PaymentTransaction> {
  return recordPaymentTransaction({
    collegeId: data.collegeId,
    subscriptionId: data.subscriptionId || 'sub-default',
    orderId: 'ord_' + Date.now(),
    paymentId: 'pay_' + Date.now(),
    amountInr: data.amountInr || 24999,
    currency: 'INR',
    status: 'captured' as const,
    method: data.method || 'Net Banking / UPI',
  });
}

export async function resetCollegeSubscriptionDemo(collegeId: string): Promise<void> {
  _cachedSubscriptions = _cachedSubscriptions.filter((s) => s.collegeId !== collegeId);
}

export async function selfLinkAdminToCollege(userId: string, collegeId: string): Promise<void> {
  await addCollegeMember({
    collegeId,
    userId,
    role: 'college_admin' as any,
    isSeatActive: true,
  });
}

let _cachedPartners: IndustryPartner[] = [
  { id: 'part-1', name: 'Solaria Clean Energy Systems', contactName: 'R&D Director', contactEmail: 'rnd@solaria.io', website: 'https://solaria.io', industryDomain: 'CleanTech & Energy', status: 'active', createdAt: new Date().toISOString() },
  { id: 'part-2', name: 'Neuromorphic AI Labs', contactName: 'Principal Scientist', contactEmail: 'careers@neuromorphic.ai', website: 'https://neuromorphic.ai', industryDomain: 'Artificial Intelligence', status: 'active', createdAt: new Date().toISOString() },
];

export async function fetchIndustryPartners(): Promise<IndustryPartner[]> {
  return _cachedPartners;
}

export async function createIndustryPartner(p: Partial<IndustryPartner>): Promise<IndustryPartner> {
  const newPart: IndustryPartner = {
    id: 'part-' + Date.now(),
    name: p.name || 'Industry Partner',
    contactName: p.contactName || 'Contact Lead',
    contactEmail: p.contactEmail || 'partner@enterprise.com',
    website: p.website || '',
    industryDomain: p.industryDomain || 'Enterprise Tech',
    status: 'active',
    createdAt: new Date().toISOString(),
  };
  _cachedPartners.push(newPart);
  return newPart;
}

export async function toggleUserAccessStatus(userId: string, newStatus: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('profiles').update({ status: newStatus }).eq('id', userId);
    } catch {}
  }
}

export async function acceptInvitation(email: string, userId: string): Promise<boolean> {
  const inv = _cachedInvitations.find((i) => i.email.toLowerCase() === email.toLowerCase());
  if (inv) {
    inv.status = 'accepted';
    await addCollegeMember({
      collegeId: inv.collegeId,
      userId,
      role: inv.role,
      isSeatActive: true,
    });
  }
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('college_invitations').update({ status: 'accepted' }).eq('email', email);
    } catch {}
  }
  return true;
}

export async function fetchCollegePayments(collegeId?: string): Promise<PaymentTransaction[]> {
  return fetchPaymentTransactions(collegeId);
}

export async function createPaymentOrder(planIdOrParams: any, billingCycle?: any, _collegeId?: any) {
  const isObj = typeof planIdOrParams === 'object' && planIdOrParams !== null;
  const cycle = isObj ? planIdOrParams.billingCycle : billingCycle;
  return {
    orderId: 'order_' + Date.now(),
    amountInr: cycle === 'annual' ? 239990 : 24999,
    currency: 'INR',
  };
}
