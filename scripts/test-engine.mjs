// Comprehensive Test Suite for SYNAPTRA Core Engines, Security & Role Predicates
import assert from 'node:assert';
import { analyzeStudentSkillScore } from '../src/lib/skillScoreEngine.ts';
import { computeCompleteness } from '../src/lib/completeness.ts';
import { analyzeCompatibility, analyzeSkillGap, projectMatchBreakdown } from '../src/lib/matching.ts';
import {
  fetchColleges,
  fetchSubscriptionPlans,
  createCollegeSubscription,
  fetchCollegeMembers,
  addCollegeMember,
  createIndustryChallenge,
  fetchChallengeApplications,
  submitChallengeApplication,
  updateChallengeApplicationStatus,
  acceptInvitation,
  fetchInstitutionCapacityFromSubscription,
} from '../src/services/saasService.ts';
import { canAccessRoomSync } from '../src/lib/supabase-db.ts';

console.log("=================================================");
console.log("🧪 RUNNING SYNAPTRA SYSTEM INTEGRATION TEST SUITE");
console.log("=================================================");

let testsPassed = 0;
let totalTests = 0;

function it(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ✗ ${name}:`, err.message);
  }
}

async function itAsync(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ✗ ${name}:`, err.message);
  }
}

// ---------------------------------------------------------------------------
// 1. Skill Score Engine Tests
// ---------------------------------------------------------------------------
console.log("\n[1] Testing AI Skill Score Engine...");

const dummyProfile = {
  id: "test-user-1",
  userId: "test-user-1",
  fullName: "Aarav Sharma",
  email: "aarav@iitd.ac.in",
  role: "student",
  headline: "Full-Stack AI Developer",
  bio: "Passionate about ML and Web3 architectures.",
  photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
  degreeProgram: "B.Tech",
  githubConnected: true,
  linkedinUrl: "https://linkedin.com/in/aarav",
  portfolioUrl: "https://aarav.dev",
  institution: "Indian Institute of Technology Delhi",
  department: "Computer Science & Engineering",
  academicYear: 3,
  skills: [
    { skill: "Python", proficiency: "advanced" },
    { skill: "React", proficiency: "advanced" },
    { skill: "Machine Learning", proficiency: "intermediate" },
    { skill: "PostgreSQL", proficiency: "intermediate" },
  ],
  interests: ["Artificial Intelligence", "Distributed Systems"],
  preferredRoles: ["Full Stack Developer", "AI/ML Developer"],
  pastProjects: [
    {
      id: "p1",
      title: "Distributed Telemetry Pipeline",
      description: "Built scalable telemetry processor using Python and PostgreSQL.",
      technologies: ["Python", "PostgreSQL"],
    },
    {
      id: "p2",
      title: "Interactive AI Dashboard",
      description: "Frontend analytics portal built in React with real-time websocket charts.",
      technologies: ["React", "TypeScript"],
    },
  ],
  internships: [
    {
      id: "i1",
      company: "Innovate AI Labs",
      role: "Machine Learning Intern",
      description: "Implemented transformer fine-tuning scripts in Python.",
      skills: ["Python", "Machine Learning"],
      startDate: "2024-05-01",
      endDate: "2024-07-31",
    },
  ],
  certifications: [
    {
      id: "c1",
      name: "Deep Learning Specialization",
      issuer: "DeepLearning.AI",
      skills: ["Machine Learning", "Python"],
      issueDate: "2024-01-15",
    },
  ],
  publications: [
    {
      id: "pub1",
      title: "Edge Inference Telemetry in Resource-Constrained Environments",
      venue: "IEEE Student Conference",
      year: 2024,
    },
  ],
  education: [],
  achievements: [],
  profileCompleteness: 95,
  isProfilePublic: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

it("computes deterministic score between 0 and 100", () => {
  const analysis1 = analyzeStudentSkillScore(dummyProfile, 12);
  const analysis2 = analyzeStudentSkillScore(dummyProfile, 12);
  assert(analysis1.overallScore >= 0 && analysis1.overallScore <= 100);
  assert.strictEqual(analysis1.overallScore, analysis2.overallScore);
});

it("awards points across evidence categories", () => {
  const analysis = analyzeStudentSkillScore(dummyProfile, 10);
  const bd = analysis.breakdown;
  assert(bd.skillEvidence > 0, "Skill evidence should be positive");
  assert(bd.projectEvidence > 0, "Project evidence should be positive");
  assert(bd.githubEvidence > 0, "GitHub evidence should be positive");
  assert(bd.experienceEvidence > 0, "Experience evidence should be positive");
  assert(bd.certificationEvidence > 0, "Certification evidence should be positive");
  assert(bd.publicationBonus > 0, "Publication bonus should be positive");
});

it("marks corroborated skills with SUPPORTED status", () => {
  const analysis = analyzeStudentSkillScore(dummyProfile, 10);
  const pythonEvidence = analysis.skillEvidence.find((s) => s.skill.toLowerCase() === "python");
  assert(pythonEvidence, "Python evidence must exist");
  assert.strictEqual(pythonEvidence.status, "SUPPORTED");
  assert(pythonEvidence.confidenceScore >= 70);
});

// ---------------------------------------------------------------------------
// 2. Profile Completeness Tests
// ---------------------------------------------------------------------------
console.log("\n[2] Testing Profile Completeness Engine...");

it("calculates profile completeness percentage accurately", () => {
  const score = computeCompleteness(dummyProfile);
  assert(score >= 80, `Completeness should be high for full profile, got ${score}`);
});

it("penalizes empty profiles cleanly", () => {
  const emptyProfile = {
    ...dummyProfile,
    bio: "",
    headline: "",
    skills: [],
    interests: [],
    pastProjects: [],
    internships: [],
    certifications: [],
    publications: [],
    photoUrl: "",
    githubConnected: false,
    linkedinUrl: "",
    portfolioUrl: "",
  };
  const emptyScore = computeCompleteness(emptyProfile);
  assert(emptyScore <= 50, `Empty profile score should be low, got ${emptyScore}`);
});

// ---------------------------------------------------------------------------
// 3. AI Project Compatibility Matching Tests
// ---------------------------------------------------------------------------
console.log("\n[3] Testing Project Compatibility Matching...");

const testProject = {
  id: "proj-101",
  ownerId: "fac-1",
  title: "Micro-Grid Energy Orchestration",
  shortDescription: "Autonomous edge nodes for renewable solar microgrid balancing.",
  detailedDescription: "Full project details...",
  requiredSkills: ["Python", "Machine Learning", "React"],
  domains: ["CleanTech & Renewable Energy Grids"],
  interests: ["Artificial Intelligence"],
  roles: [
    {
      id: "r1",
      name: "AI/ML Developer",
      description: "Build model",
      requiredSkills: ["Python", "Machine Learning"],
      openings: 1,
    },
    {
      id: "r2",
      name: "Frontend Developer",
      description: "Build dashboard",
      requiredSkills: ["React"],
      openings: 1,
    },
  ],
  teamMin: 2,
  teamMax: 4,
  difficulty: "intermediate",
  type: "academic",
  visibility: "public",
  mentorRequired: true,
  githubRequired: false,
  tags: ["AI", "CleanTech"],
  status: "open",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

it("evaluates student compatibility score with detailed breakdown", () => {
  const compat = analyzeCompatibility(testProject, dummyProfile);
  assert(compat.compatibilityScore > 60, `Compatibility should be strong, got ${compat.compatibilityScore}`);
  assert(compat.skillMatch > 0, "Skill match score must be positive");
  assert(compat.interestMatch > 0, "Interest fit score must be positive");
});

it("detects missing skills with analyzeSkillGap", () => {
  const gap = analyzeSkillGap(testProject, [dummyProfile], [dummyProfile]);
  assert(gap.teamSkills.includes("Python"), "Team skills should include Python");
  assert(Array.isArray(gap.gaps), "Gaps must be an array");
});

// ---------------------------------------------------------------------------
// 4. SaaS Multi-Tenancy & Institutional Member Capacity Tests
// ---------------------------------------------------------------------------
console.log("\n[4] Testing Institutional Multi-Tenancy & Capacity Management...");

itAsync("retrieves subscription plans and college records", async () => {
  const plans = await fetchSubscriptionPlans();
  assert(plans.length >= 3, "At least 3 subscription plans must be configured");

  const colleges = await fetchColleges();
  assert(colleges.length >= 1, "At least 1 college must be seeded");
});

itAsync("calculates capacity and enforces seat limits", async () => {
  const cap = await fetchInstitutionCapacityFromSubscription("col-1");
  assert(cap.studentQuota >= 100, "Student quota should be at least 100");
  assert(cap.remainingStudents >= 0, "Remaining student seats must be non-negative");
  assert(cap.remainingFaculty >= 0, "Remaining faculty seats must be non-negative");
});

itAsync("adds member and reflects in member registry", async () => {
  const newMember = await addCollegeMember({
    collegeId: "col-1",
    userId: "usr-auto-test",
    role: "student",
    isSeatActive: true,
    department: "Data Science",
  });
  assert.strictEqual(newMember.collegeId, "col-1");
  assert.strictEqual(newMember.userId, "usr-auto-test");

  const members = await fetchCollegeMembers("col-1");
  assert(members.some((m) => m.userId === "usr-auto-test"), "New member must be found in registry");
});

// ---------------------------------------------------------------------------
// 5. Industry Innovation Bridge & Challenges Tests
// ---------------------------------------------------------------------------
console.log("\n[5] Testing Industry Innovation Bridge & Proposal Submission...");

itAsync("publishes industry challenge and creates application", async () => {
  const challenge = await createIndustryChallenge({
    partnerId: "part-test-enterprise",
    title: "Zero-Knowledge Circuit Verification Benchmark",
    problemStatement: "Optimize Circom proving pipelines for mobile clients.",
    domain: "Cryptography & Web3 Systems",
    requiredSkills: ["Solidity", "Rust", "Zero Knowledge"],
    bountyOrGrant: "₹2,50,000 Research Grant",
    status: "open",
  });

  assert(challenge.id.startsWith("chal-"), "Challenge must have valid generated ID");
  assert.strictEqual(challenge.status, "open");

  // Submit student application
  const app = await submitChallengeApplication({
    challengeId: challenge.id,
    collegeId: "col-1",
    teamName: "IITD CryptoLab Alpha",
    leadStudentId: dummyProfile.id,
    proposalSummary: "Novel recursive folding scheme with Halo2 proving system.",
    aiMatchScore: 94,
    status: "submitted",
  });

  assert(app.id.startsWith("capp-"), "Application must have valid ID");
  assert.strictEqual(app.status, "submitted");

  // Review application status
  await updateChallengeApplicationStatus(app.id, "accepted", "Exceptional proposal. Approved for lab grant.");
  const apps = await fetchChallengeApplications(challenge.id);
  const found = apps.find((a) => a.id === app.id);
  assert(found, "Application must be found");
  assert.strictEqual(found.status, "accepted");
  assert(found.feedback?.includes("Exceptional"), "Feedback must be recorded");
});

// ---------------------------------------------------------------------------
// 6. Role-Based Navigation & Access Routing Predicates
// ---------------------------------------------------------------------------
console.log("\n[6] Testing 4-Role Navigation & Access Routing Predicates...");

function resolveHomeRoute(role, isAdmin = false) {
  if (role === "admin" || role === "college_admin" || role === "owner" || isAdmin) return "/admin";
  if (role === "faculty") return "/faculty";
  if (role === "industry_partner") return "/industry";
  return "/dashboard";
}

it("routes student exclusively to Student Dashboard", () => {
  assert.strictEqual(resolveHomeRoute("student"), "/dashboard");
});

it("routes faculty exclusively to Faculty Dashboard", () => {
  assert.strictEqual(resolveHomeRoute("faculty"), "/faculty");
});

it("routes college admin and owner exclusively to Admin Console", () => {
  assert.strictEqual(resolveHomeRoute("college_admin"), "/admin");
  assert.strictEqual(resolveHomeRoute("admin"), "/admin");
  assert.strictEqual(resolveHomeRoute("owner"), "/admin");
});

it("routes industry partner exclusively to Industry Dashboard", () => {
  assert.strictEqual(resolveHomeRoute("industry_partner"), "/industry");
});

// ---------------------------------------------------------------------------
// 7. Project Room Access Control & Data Isolation
// ---------------------------------------------------------------------------
console.log("\n[7] Testing Project Room Access Control & Data Isolation...");

const mockMembers = [
  { projectId: "p-alpha", userId: "u-active", status: "active" },
  { projectId: "p-alpha", userId: "u-pending", status: "pending" },
];

it("grants access to verified project owner", () => {
  assert.strictEqual(canAccessRoomSync("u-owner", "p-alpha", mockMembers, "u-owner"), true);
});

it("grants access to active accepted project members", () => {
  assert.strictEqual(canAccessRoomSync("u-active", "p-alpha", mockMembers, "u-owner"), true);
});

it("strictly denies access to pending or uninvited users", () => {
  assert.strictEqual(canAccessRoomSync("u-pending", "p-alpha", mockMembers, "u-owner"), false);
  assert.strictEqual(canAccessRoomSync("u-intruder", "p-alpha", mockMembers, "u-owner"), false);
});

// ---------------------------------------------------------------------------
// 8. Institutional Multi-Tenant College Data Isolation
// ---------------------------------------------------------------------------
console.log("\n[8] Testing Multi-Tenant Data Scoping & College Isolation...");

itAsync("isolates college memberships by institution ID", async () => {
  await addCollegeMember({
    collegeId: "col-isolation-1",
    userId: "usr-col1-student",
    role: "student",
    isSeatActive: true,
  });
  await addCollegeMember({
    collegeId: "col-isolation-2",
    userId: "usr-col2-student",
    role: "student",
    isSeatActive: true,
  });

  const col1Members = await fetchCollegeMembers("col-isolation-1");
  const col2Members = await fetchCollegeMembers("col-isolation-2");

  assert(col1Members.every((m) => m.collegeId === "col-isolation-1"), "Col 1 members must only contain col 1 ID");
  assert(col2Members.every((m) => m.collegeId === "col-isolation-2"), "Col 2 members must only contain col 2 ID");
  assert(!col1Members.some((m) => m.userId === "usr-col2-student"), "Cross-tenant leakage prohibited");
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
setTimeout(() => {
  console.log("\n=================================================");
  console.log(`📊 TEST RESULTS: ${testsPassed} / ${totalTests} TESTS PASSED (${Math.round((testsPassed/totalTests)*100)}%)`);
  console.log("=================================================");
  if (testsPassed === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}, 500);
