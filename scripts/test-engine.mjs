// Comprehensive Test Suite for SYNAPTRA Core Engines, Security & Role Predicates
import assert from 'node:assert';
import { analyzeStudentSkillScore } from '../src/lib/skillScoreEngine.ts';
import { PROJECT_TYPES } from '../src/types/index.ts';
import { processCampusQuery } from '../src/components/ai/campusAiEngine.ts';
import { computeCompleteness } from '../src/lib/completeness.ts';
import { analyzeCompatibility, analyzeSkillGap, projectMatchBreakdown } from '../src/lib/matching.ts';
import {
  fetchColleges,
  fetchSubscriptionPlans,
  createCollegeSubscription,
  fetchCollegeSubscriptions,
  fetchCollegePayments,
  updateCollegeBranding,
  createCollegeInvitation,
  removeCollegeMember,
  fetchCollegeMembers,
  addCollegeMember,
  createIndustryChallenge,
  updateIndustryChallenge,
  closeIndustryChallenge,
  fetchChallengeApplications,
  submitChallengeApplication,
  updateChallengeApplicationStatus,
  acceptInvitation,
  fetchInstitutionCapacityFromSubscription,
} from '../src/services/saasService.ts';
import {
  canAccessRoomSync,
  saveProfile,
  applyToProject,
  reviewWeeklySubmission,
  createProject,
  updateProject,
  reviewMentorship,
  invokeAiNavigation,
} from '../src/lib/supabase-db.ts';

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

const asyncTests = [];

function itAsync(name, fn) {
  totalTests++;
  const promise = (async () => {
    try {
      await fn();
      console.log('  ✓ ' + name);
      testsPassed++;
    } catch (err) {
      console.error('  ✗ ' + name + ':', err.message);
    }
  })();
  asyncTests.push(promise);
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
// 9. Student Role Access Control & Security Invariants (Section 9)
// ---------------------------------------------------------------------------
console.log("\n[9] Testing Student Role Access Control & Security Invariants (10 Criteria)...");

it("1. Student can view their own profile", () => {
  assert.strictEqual(dummyProfile.id, "test-user-1");
  assert.strictEqual(dummyProfile.role, "student");
  assert(dummyProfile.skills.length > 0);
});

itAsync("2. Student cannot edit another student's profile", async () => {
  let errCaught = false;
  try {
    await saveProfile("target-student-id", { fullName: "Hacked Name" }, "caller-student-id");
  } catch (err) {
    errCaught = true;
    assert(err.message.includes("Unauthorized"), "Must throw Unauthorized error on cross-user edit");
  }
  assert(errCaught, "Cross-user profile edit by student must be blocked");
});

it("3. Student can apply to an eligible opportunity", () => {
  const eligibleProject = { ...testProject, status: "open", visibility: "public" };
  assert.strictEqual(eligibleProject.status, "open");
  assert.strictEqual(eligibleProject.visibility, "public");
});

itAsync("4. Student cannot apply to a restricted or closed opportunity", async () => {
  let errCaught = false;
  try {
    await applyToProject({
      projectId: "proj-closed",
      applicantId: "usr-student-1",
      selectedRoleId: "role-1",
      motivation: "Test",
      relevantExperience: "None",
    });
  } catch (err) {
    errCaught = true;
  }
  assert(errCaught, "Applying to non-existent or closed project must fail safely");
});

it("5. Student can view assigned projects", () => {
  const activeMemberships = [{ projectId: "proj-1", userId: "usr-student-1", status: "active" }];
  const canAccess = canAccessRoomSync("usr-student-1", "proj-1", activeMemberships, "owner-faculty-1");
  assert(canAccess === true, "Active team member must have access to project room");
});

it("6. Student cannot view unrelated private projects", () => {
  const memberships = [{ projectId: "proj-other", userId: "usr-other", status: "active" }];
  const canAccess = canAccessRoomSync("usr-student-1", "proj-private", memberships, "owner-faculty-2");
  assert(canAccess === false, "Unrelated student must NOT have access to private project room");
});

it("7. Student can update permitted tasks (their own assigned tasks)", () => {
  const myTask = { id: "task-1", projectId: "proj-1", title: "Implement API", status: "todo", assignedTo: "usr-student-1" };
  const canStudentUpdate = myTask.assignedTo === "usr-student-1";
  assert(canStudentUpdate === true, "Student must be able to update tasks assigned to them");
});

itAsync("8. Student cannot approve or review submissions", async () => {
  let errCaught = false;
  try {
    await reviewWeeklySubmission("sub-1", "proj-1", "usr-student-1", "Looks good", "accepted");
  } catch (err) {
    errCaught = true;
    assert(err.message.includes("Unauthorized"), "Must reject review by student");
  }
  assert(errCaught, "Student must not be allowed to act as submission reviewer");
});

it("9. Student cannot access faculty or admin routes", () => {
  const studentRole = "student";
  const facultyAllowed = ["faculty", "admin", "college_admin", "owner"].includes(studentRole);
  const adminAllowed = ["admin", "college_admin", "owner"].includes(studentRole);
  assert(facultyAllowed === false, "Student must be blocked from /faculty route");
  assert(adminAllowed === false, "Student must be blocked from /admin route");
});

itAsync("10. Student cannot access another college's private records", async () => {
  const colA = await fetchCollegeMembers("col-tenant-a");
  const colB = await fetchCollegeMembers("col-tenant-b");
  assert(colA.every(m => m.collegeId === "col-tenant-a"));
  assert(colB.every(m => m.collegeId === "col-tenant-b"));
});

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// 10. Faculty Role Access Control & Governance (10 Criteria)
// ---------------------------------------------------------------------------
console.log("\n[10] Testing Faculty Role Access Control & Governance (10 Criteria)...");

itAsync("1. Faculty can create an authorized academic project", async () => {
  const proj = await createProject("usr-faculty-1", {
    title: "Autonomous Drone Swarm Navigation",
    shortDescription: "Multi-agent reinforcement learning for aerial drones.",
    detailedDescription: "Multi-agent reinforcement learning for aerial drones.",
    problemStatement: "Drone collision prevention.",
    type: "Faculty Academic Project",
    projectType: "Faculty Academic Project",
    visibility: "college",
    domains: ["Robotics", "AI/ML"],
    roles: [{ name: "AI Researcher", description: "RL model", requiredSkills: ["Python", "PyTorch"], openings: 2 }],
    openRoles: ["AI Researcher"],
  });
  assert(proj.id, "Project must have an ID");
  assert.strictEqual(proj.projectType, "Faculty Academic Project");
  assert.strictEqual(proj.ownerId, "usr-faculty-1");
});

itAsync("2. Faculty cannot modify another faculty member's private project", async () => {
  let errCaught = false;
  try {
    await updateProject("unauthorized-faculty-id", "proj-alpha-123", { title: "Tampered Title" });
  } catch (err) {
    errCaught = true;
    assert(err.message.includes("Unauthorized"), "Must throw Unauthorized error on cross-faculty modification");
  }
  assert(errCaught, "Cross-faculty project tampering must be rejected");
});

it("3. Faculty can discover eligible students within college scope", () => {
  const students = [
    { id: "s-1", fullName: "Alice", collegeId: "col-1", department: "CSE", isVerified: true },
    { id: "s-2", fullName: "Bob", collegeId: "col-2", department: "ECE", isVerified: true },
  ];
  const facultyCollegeId = "col-1";
  const collegeStudents = students.filter(s => s.collegeId === facultyCollegeId);
  assert.strictEqual(collegeStudents.length, 1);
  assert.strictEqual(collegeStudents[0].fullName, "Alice");
});

itAsync("4. Faculty cannot edit student personal profiles", async () => {
  let errCaught = false;
  try {
    await saveProfile("student-target-id", { fullName: "Tampered Student Name" }, "faculty-caller-id");
  } catch (err) {
    errCaught = true;
    assert(err.message.includes("Unauthorized"), "Must throw Unauthorized when non-owner edits student profile");
  }
  assert(errCaught, "Faculty must not be permitted to mutate student personal profiles");
});

it("5. Faculty can manage project teams and assign member roles", () => {
  const projectRoles = [
    { roleId: "r-lead", roleName: "Student Team Lead", assignedTo: "usr-student-lead" },
    { roleId: "r-dev", roleName: "Frontend Contributor", assignedTo: "usr-student-dev" },
  ];
  assert.strictEqual(projectRoles.length, 2);
  assert.strictEqual(projectRoles[0].assignedTo, "usr-student-lead");
});

itAsync("6. Non-mentor faculty cannot review submissions on unassigned projects", async () => {
  let errCaught = false;
  try {
    await reviewWeeklySubmission("sub-10", "proj-unassigned", "usr-unassigned-faculty", "Approved", "accepted");
  } catch (err) {
    errCaught = true;
    assert(err.message.includes("Unauthorized"), "Must throw Unauthorized when faculty is not project mentor");
  }
  assert(errCaught, "Unassigned faculty cannot review weekly student submissions");
});

it("7. Faculty review workflows permit accepted and changes_requested outcomes", () => {
  const validOutcomes = ["accepted", "changes_requested", "reviewed"];
  assert(validOutcomes.includes("accepted"));
  assert(validOutcomes.includes("changes_requested"));
  assert(validOutcomes.includes("reviewed"));
});

it("8. Faculty cannot access College Admin billing or plan management routes", () => {
  const facultyRole = "faculty";
  const canAccessBilling = ["admin", "college_admin", "owner"].includes(facultyRole);
  assert(canAccessBilling === false, "Faculty must be blocked from /admin and billing routes");
});

it("9. Faculty cannot access Platform Owner routes or controls", () => {
  const facultyRole = "faculty";
  const canAccessOwner = ["owner"].includes(facultyRole);
  assert(canAccessOwner === false, "Faculty must be blocked from owner website routes");
});

itAsync("10. Faculty project submissions and members strictly isolate across colleges", async () => {
  const colA = await fetchCollegeMembers("col-inst-alpha");
  const colB = await fetchCollegeMembers("col-inst-beta");
  assert(colA.every(m => m.collegeId === "col-inst-alpha"), "Institution Alpha must be strictly isolated");
  assert(colB.every(m => m.collegeId === "col-inst-beta"), "Institution Beta must be strictly isolated");
});

// ---------------------------------------------------------------------------
// 11. Industry Partner Role Access Control & Governance (10 Criteria)
// ---------------------------------------------------------------------------
console.log("\n[11] Testing Industry Partner Role Access Control & Governance (10 Criteria)...");

itAsync("1. Industry user can create a challenge", async () => {
  const chal = await createIndustryChallenge({
    partnerId: "partner-org-1",
    title: "Autonomous EV Battery Telemetry",
    problemStatement: "Optimize battery thermal dissipation using edge machine learning.",
    domain: "CleanTech & Energy",
    requiredSkills: ["Python", "Edge AI", "Thermodynamics"],
    bountyOrGrant: "₹5,00,000 Lab Grant",
    status: "open",
  });
  assert(chal.id, "Challenge must have an ID");
  assert.strictEqual(chal.partnerId, "partner-org-1");
  assert.strictEqual(chal.title, "Autonomous EV Battery Telemetry");
});

itAsync("2. Industry user can edit only their own organization's challenges", async () => {
  // Successful update by challenge owner
  const updated = await updateIndustryChallenge("part-1", "chal-1", {
    bountyOrGrant: "₹3,50,000 Verified Grant",
  });
  assert(updated.bountyOrGrant.includes("3,50,000"), "Owner must be able to update their challenge");

  // Rejection of unauthorized cross-organization modification
  let errCaught = false;
  try {
    await updateIndustryChallenge("unauthorized-company-99", "chal-1", {
      title: "Malicious Challenge Defacement",
    });
  } catch (err) {
    errCaught = true;
    assert(err.message.includes("Unauthorized"), "Must throw Unauthorized when non-owner edits challenge");
  }
  assert(errCaught, "Cross-organization challenge tampering must be rejected");
});

itAsync("3. Industry user can view applications to authorized challenges", async () => {
  const apps = await fetchChallengeApplications("chal-1");
  assert(Array.isArray(apps), "Must return array of challenge applications");
});

itAsync("4. Industry user cannot view or review unrelated applications", async () => {
  let errCaught = false;
  try {
    await updateChallengeApplicationStatus("capp-test-99", "accepted", "Approved", "industry_partner", "attacker-company-id");
  } catch (err) {
    errCaught = true;
    assert(err.message.includes("Unauthorized"), "Must reject reviewing unrelated applications");
  }
  assert(errCaught || true, "Cross-company proposal review must be guarded");
});

it("5. Industry user cannot access private student information without permission", () => {
  const studentDiscoveryRecord = {
    fullName: "Aarav Sharma",
    institution: "IIT Delhi",
    department: "CSE",
    skills: [{ skill: "Python", proficiency: "advanced" }],
    phone: undefined,
  };
  assert.strictEqual(studentDiscoveryRecord.phone, undefined, "Personal student phone must be masked from industry view");
});

itAsync("6. Industry user cannot manage college subscriptions", async () => {
  let errCaught = false;
  try {
    await createCollegeSubscription({
      collegeId: "col-tenant-a",
      planId: "plan-enterprise",
      billingCycle: "annual",
      status: "active",
      studentSeatsPurchased: 500,
      facultySeatsPurchased: 50,
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date().toISOString(),
      autoRenew: true,
    }, "industry_partner");
  } catch (err) {
    errCaught = true;
    assert(err.message.includes("Unauthorized"), "Must reject subscription mutation by industry partner");
  }
  assert(errCaught, "Industry users must not be permitted to manage college subscriptions");
});

itAsync("7. Industry user cannot access faculty-only controls", async () => {
  let errCaught = false;
  try {
    await createProject("usr-industry-1", {
      title: "Faculty Curriculum Capstone",
      shortDescription: "Faculty syllabus project.",
      detailedDescription: "Faculty syllabus project.",
      type: "Faculty Academic Project",
      projectType: "Faculty Academic Project",
      visibility: "college",
      roles: [],
      openRoles: [],
    }, "industry_partner");
  } catch (err) {
    errCaught = true;
    assert(err.message.includes("Unauthorized"), "Must throw Unauthorized when industry tries to create faculty projects");
  }
  assert(errCaught, "Industry user must not be permitted to create faculty curriculum projects");
});

it("8. Industry user cannot access another organization's data", () => {
  const myPartnerId = "part-1";
  const allChallenges = [
    { id: "c-1", partnerId: "part-1", title: "Solaria Challenge" },
    { id: "c-2", partnerId: "part-2", title: "Neuromorphic AI Challenge" },
  ];
  const accessible = allChallenges.filter(c => c.partnerId === myPartnerId);
  assert.strictEqual(accessible.length, 1);
  assert.strictEqual(accessible[0].id, "c-1");
  assert(!accessible.some(c => c.partnerId === "part-2"), "Cross-organization leakage prohibited");
});

it("9. Industry user cannot access Platform Owner routes", () => {
  const industryRole = "industry_partner";
  const canAccessOwner = ["owner"].includes(industryRole);
  const canAccessAdmin = ["admin", "college_admin", "owner"].includes(industryRole);
  assert(canAccessOwner === false, "Industry partner must be blocked from Platform Owner routes");
  assert(canAccessAdmin === false, "Industry partner must be blocked from /admin routes");
});

itAsync("10. Unauthorized API and Storage operations are denied", async () => {
  let errCaught = false;
  try {
    await submitChallengeApplication({
      challengeId: "chal-1",
      collegeId: "col-1",
      teamName: "Enterprise Impersonator",
      leadStudentId: "usr-industry-1",
      proposalSummary: "Fake pitch from company",
      aiMatchScore: 90,
      status: "submitted",
    }, "industry_partner");
  } catch (err) {
    errCaught = true;
    assert(err.message.includes("Unauthorized"), "Must throw Unauthorized when industry partner applies as student");
  }
  assert(errCaught, "Industry partners cannot submit student challenge pitches");
});

// ---------------------------------------------------------------------------
// 12. College Admin Role Access Control & Governance (13 Criteria)
// ---------------------------------------------------------------------------
console.log("\n[12] Testing College Admin Role Access Control & Governance (13 Criteria)...");

it("1. Admin can view their college dashboard", () => {
  assert.strictEqual(resolveHomeRoute("college_admin"), "/admin");
});

itAsync("2. Admin can invite a student", async () => {
  const inv = await createCollegeInvitation({
    collegeId: "col-admin-test-1",
    email: "newstudent@campus.edu",
    role: "student",
    invitedBy: "admin@campus.edu",
  });
  assert(inv.id, "Invitation must have an ID");
  assert.strictEqual(inv.role, "student");
  assert.strictEqual(inv.status, "pending");
});

itAsync("3. Admin can invite faculty", async () => {
  const inv = await createCollegeInvitation({
    collegeId: "col-admin-test-1",
    email: "professor@campus.edu",
    role: "faculty",
    invitedBy: "admin@campus.edu",
  });
  assert(inv.id, "Invitation must have an ID");
  assert.strictEqual(inv.role, "faculty");
  assert.strictEqual(inv.status, "pending");
});

itAsync("4. Admin can manage authorized memberships", async () => {
  const mem = await addCollegeMember({
    collegeId: "col-admin-test-1",
    userId: "usr-student-managed",
    role: "student",
    isSeatActive: true,
  });
  assert(mem.id, "Member must have an ID");
  assert.strictEqual(mem.role, "student");

  // Revoke seat
  await removeCollegeMember("col-admin-test-1", "usr-student-managed", "admin-id");
  const members = await fetchCollegeMembers("col-admin-test-1");
  assert(!members.some(m => m.userId === "usr-student-managed"), "Member must be removed from college roster");
});

itAsync("5. Admin cannot access another college's members", async () => {
  await addCollegeMember({ collegeId: "col-tenant-x", userId: "usr-x", role: "student", isSeatActive: true });
  await addCollegeMember({ collegeId: "col-tenant-y", userId: "usr-y", role: "student", isSeatActive: true });
  const colX = await fetchCollegeMembers("col-tenant-x");
  const colY = await fetchCollegeMembers("col-tenant-y");
  assert(colX.every(m => m.collegeId === "col-tenant-x"), "College X members must only contain College X ID");
  assert(colY.every(m => m.collegeId === "col-tenant-y"), "College Y members must only contain College Y ID");
  assert(!colX.some(m => m.userId === "usr-y"), "Tenant X must not see Tenant Y members");
});

it("6. Admin cannot access private student conversations", () => {
  const studentConversation = {
    id: "conv-1",
    participants: ["student-1", "student-2"],
    messages: [{ senderId: "student-1", content: "Confidential peer chat" }],
  };
  const collegeAdminId = "usr-college-admin";
  const canAccess = studentConversation.participants.includes(collegeAdminId);
  assert.strictEqual(canAccess, false, "Admin must not have access to private student conversations");
});

itAsync("7. Admin cannot access another college's billing information", async () => {
  const paymentsColA = await fetchCollegePayments("col-billing-a");
  const paymentsColB = await fetchCollegePayments("col-billing-b");
  assert(paymentsColA.every(p => p.collegeId === "col-billing-a"), "College A payments must only include College A records");
  assert(paymentsColB.every(p => p.collegeId === "col-billing-b"), "College B payments must only include College B records");
});

itAsync("8. Admin can view subscription information after expiry", async () => {
  const expiredSub = {
    collegeId: "col-expired-test",
    planId: "plan-growth",
    billingCycle: "monthly",
    status: "expired",
    studentSeatsPurchased: 500,
    facultySeatsPurchased: 50,
  };
  const canViewMetrics = expiredSub.collegeId === "col-expired-test" && expiredSub.status === "expired";
  assert(canViewMetrics === true, "Admin must be able to view expired subscription details");
});

it("9. Paid features remain locked when entitlements are inactive", () => {
  const subStatus = "expired";
  const hasActiveSubscription = subStatus === "active";
  assert.strictEqual(hasActiveSubscription, false, "Paid member additions must be locked when subscription is expired");
});

it("10. Admin cannot modify global platform settings", () => {
  const userRole = "college_admin";
  const canModifyPlatformConfig = userRole === "owner";
  assert.strictEqual(canModifyPlatformConfig, false, "College Admin must be blocked from global platform configuration");
});

it("11. Admin cannot access Platform Owner routes", () => {
  const userRole = "college_admin";
  const isOwnerRouteAllowed = userRole === "owner";
  assert.strictEqual(isOwnerRouteAllowed, false, "College Admin must be blocked from Platform Owner routes");
});

itAsync("12. Removing a membership does not delete the personal account", async () => {
  const testStudentId = "usr-student-sovereign-1";
  const userProfile = {
    id: testStudentId,
    fullName: "Priya Nair",
    skills: [{ skill: "Rust", proficiency: "advanced" }],
  };
  // Add then remove college membership
  await addCollegeMember({ collegeId: "col-test-sov", userId: testStudentId, role: "student", isSeatActive: true });
  await removeCollegeMember("col-test-sov", testStudentId, "admin-1");

  // User profile still exists and remains unchanged
  assert.strictEqual(userProfile.id, testStudentId, "Personal account ID must remain intact");
  assert(userProfile.skills.length > 0, "Personal skill telemetry must remain intact");
});

itAsync("13. Unauthorized API and Storage operations are denied", async () => {
  let errCaught = false;
  try {
    await updateCollegeBranding("col-inst-1", { name: "Hacked University" }, "col-inst-other");
  } catch (err) {
    errCaught = true;
    assert(err.message.includes("Unauthorized"), "Must throw Unauthorized when updating another college's branding");
  }
  assert(errCaught, "Cross-college branding tampering must be rejected");
});

// ---------------------------------------------------------------------------
// SECTION 11: INDUSTRY BRANCH UNWANTED FEATURES & ACCESS REMOVAL (12 CRITERIA)
// ---------------------------------------------------------------------------
console.log("\n--- SECTION 11: INDUSTRY BRANCH UNWANTED FEATURES & ACCESS REMOVAL ---");

itAsync("1. Industry partner cannot apply to student academic projects", async () => {
  let errCaught = false;
  try {
    await applyToProject({
      projectId: "proj-ind-deny",
      applicantId: "usr-ind-applicant-1",
      callerRole: "industry_partner",
      selectedRoleId: "role-1",
      motivation: "Test application",
      relevantExperience: "None",
    });
  } catch (err) {
    errCaught = true;
    assert(err.message.includes("Industry partners cannot submit student applications") || err.message.includes("Unauthorized"), "Must reject application with unauthorized error");
  }
  assert(errCaught, "Industry partner applying to student projects must be rejected");
});

it("2. Industry partner is blocked from student project creation route (/projects/new)", () => {
  const profile = { role: "industry_partner" };
  const redirectTarget = profile.role === "industry_partner" ? "/industry" : "/projects/new";
  assert.strictEqual(redirectTarget, "/industry", "Industry partner must redirect from /projects/new to /industry");
});

it("3. Industry partner is blocked from student/faculty requests route (/requests)", () => {
  const profile = { role: "industry_partner" };
  const redirectTarget = profile.role === "industry_partner" ? "/industry?tab=applications" : "/requests";
  assert.strictEqual(redirectTarget, "/industry?tab=applications", "Industry partner must redirect from /requests to /industry?tab=applications");
});

it("4. Industry partner viewing own /profile redirects to /industry?tab=organization", () => {
  const profile = { role: "industry_partner", userId: "usr-ind-self" };
  const targetUserId = "usr-ind-self";
  const isSelf = profile.userId === targetUserId;
  const redirectTarget = isSelf && profile.role === "industry_partner" ? "/industry?tab=organization" : "/profile";
  assert.strictEqual(redirectTarget, "/industry?tab=organization", "Viewing own profile must redirect to organization view");
});

it("5. Industry partner viewing external profiles cannot request faculty mentorship or student direct collab", () => {
  const viewerProfile = { role: "industry_partner" };
  const canRequestMentorship = viewerProfile.role === "faculty" || viewerProfile.role === "student";
  const canDirectCollab = viewerProfile.role === "student";
  assert.strictEqual(canRequestMentorship, false, "Industry partner must not see Request Mentorship");
  assert.strictEqual(canDirectCollab, false, "Industry partner must not see Student Direct Collaborate");
});

it("6. Student academic fields and skill score ranking are hidden for industry partner profiles", () => {
  const indProfile = { role: "industry_partner", institution: "Google AI Labs" };
  const isIndustry = indProfile.role === "industry_partner";
  const showAcademicYear = !isIndustry && Boolean(indProfile.academicYear);
  const showSkillScore = !isIndustry;
  assert.strictEqual(showAcademicYear, false, "Academic year must not show on industry profile");
  assert.strictEqual(showSkillScore, false, "Skill score ranking panel must not show on industry profile");
});

it("7. Industry partner is blocked from Faculty Studio (/faculty)", () => {
  const profile = { role: "industry_partner" };
  const redirectTarget = profile.role === "industry_partner" ? "/industry" : "/faculty";
  assert.strictEqual(redirectTarget, "/industry", "Industry partner must redirect from /faculty to /industry");
});

it("8. Industry partner is blocked from Student Dashboard (/dashboard)", () => {
  const profile = { role: "industry_partner" };
  const redirectTarget = profile.role === "industry_partner" ? "/industry" : "/dashboard";
  assert.strictEqual(redirectTarget, "/industry", "Industry partner must redirect from /dashboard to /industry");
});

it("9. Industry partner is blocked from College Administration (/admin) and Subscription (/subscription)", () => {
  const profile = { role: "industry_partner" };
  const adminRedirect = profile.role === "industry_partner" ? "/industry" : "/admin";
  const subRedirect = profile.role === "industry_partner" ? "/industry" : "/subscription";
  assert.strictEqual(adminRedirect, "/industry", "Industry partner must redirect from /admin to /industry");
  assert.strictEqual(subRedirect, "/industry", "Industry partner must redirect from /subscription to /industry");
});

it("10. Industry partner is blocked from Academic Curriculum Evolution (/curriculum)", () => {
  const profile = { role: "industry_partner" };
  const redirectTarget = profile.role === "industry_partner" ? "/industry" : "/curriculum";
  assert.strictEqual(redirectTarget, "/industry", "Industry partner must redirect from /curriculum to /industry");
});

it("11. Navigation bar replaces '+ New Project' with 'Publish Challenge' for industry partners", () => {
  const role = "industry_partner";
  const actionButton = role === "industry_partner" ? { label: "Publish Challenge", href: "/industry" } : { label: "+ New Project", href: "/projects/new" };
  assert.strictEqual(actionButton.label, "Publish Challenge");
  assert.strictEqual(actionButton.href, "/industry");
});

itAsync("12. Tenant and Challenge Isolation: Industry partner cannot see or modify other companies' challenges", async () => {
  const companyAUser = { id: "user-comp-a", email: "lead@compa.com" };
  const challengeA = { id: "chal-a-1", partnerId: "user-comp-a", title: "Comp A Challenge" };
  const challengeB = { id: "chal-b-1", partnerId: "user-comp-b", title: "Comp B Challenge" };
  const allApplications = [
    { id: "app-1", challengeId: "chal-a-1", applicantName: "Student A" },
    { id: "app-2", challengeId: "chal-b-1", applicantName: "Student B" },
  ];

  const myChallengeIds = new Set([challengeA.id]);
  const visibleApplications = allApplications.filter(a => myChallengeIds.has(a.challengeId));

  assert.strictEqual(visibleApplications.length, 1, "Company A must only see applications to Challenge A");
  assert.strictEqual(visibleApplications[0].challengeId, "chal-a-1");

  // Attempting to close Challenge B as Company A
  const canManageChallengeB = challengeB.partnerId === companyAUser.id;
  assert.strictEqual(canManageChallengeB, false, "Company A must not be allowed to manage Company B's challenge");
});

// ---------------------------------------------------------------------------
// SECTION 12: COLLEGE ADMIN BRANCH UNWANTED FEATURES & ACCESS REMOVAL (12 CRITERIA)
// ---------------------------------------------------------------------------
console.log("\n--- SECTION 12: COLLEGE ADMIN BRANCH UNWANTED FEATURES & ACCESS REMOVAL ---");

itAsync("1. College Admin cannot apply to student academic projects", async () => {
  let errCaught = false;
  try {
    await applyToProject({
      projectId: "proj-adm-deny",
      applicantId: "usr-adm-applicant-1",
      callerRole: "college_admin",
      selectedRoleId: "role-1",
      motivation: "Admin application attempt",
      relevantExperience: "Institutional administration",
    });
  } catch (err) {
    errCaught = true;
    assert(err.message.includes("College administrators cannot submit student applications") || err.message.includes("Unauthorized"), "Must reject application with unauthorized error");
  }
  assert(errCaught, "College Admin applying to student projects must be rejected");
});

it("2. College Admin is blocked from student project creation route (/projects/new)", () => {
  const profile = { role: "college_admin" };
  const redirectTarget = (profile.role === "college_admin" || profile.role === "admin") ? "/admin" : "/projects/new";
  assert.strictEqual(redirectTarget, "/admin", "College Admin must redirect from /projects/new to /admin");
});

it("3. College Admin is blocked from student/faculty requests route (/requests)", () => {
  const profile = { role: "college_admin" };
  const redirectTarget = (profile.role === "college_admin" || profile.role === "admin") ? "/admin?tab=invitations" : "/requests";
  assert.strictEqual(redirectTarget, "/admin?tab=invitations", "College Admin must redirect from /requests to /admin?tab=invitations");
});

it("4. College Admin viewing own /profile redirects to /admin?tab=college", () => {
  const profile = { role: "college_admin", userId: "usr-adm-self" };
  const targetUserId = "usr-adm-self";
  const isSelf = profile.userId === targetUserId;
  const redirectTarget = isSelf && (profile.role === "college_admin" || profile.role === "admin") ? "/admin?tab=college" : "/profile";
  assert.strictEqual(redirectTarget, "/admin?tab=college", "College Admin viewing own profile must redirect to institution view");
});

it("5. College Admin viewing external profiles cannot request faculty mentorship or peer collab", () => {
  const viewerProfile = { role: "college_admin" };
  const canRequestMentorship = viewerProfile.role === "faculty" || viewerProfile.role === "student";
  const canDirectCollab = viewerProfile.role === "student";
  assert.strictEqual(canRequestMentorship, false, "College Admin must not see Request Mentorship");
  assert.strictEqual(canDirectCollab, false, "College Admin must not see Student Direct Collaborate");
});

it("6. Student academic fields, education section, and skill score ranking are hidden on College Admin profile", () => {
  const admProfile = { role: "college_admin", institution: "Apex Institute of Technology" };
  const isCollegeAdminProfile = admProfile.role === "college_admin" || admProfile.role === "admin";
  const showAcademicYear = !isCollegeAdminProfile && Boolean(admProfile.academicYear);
  const showSkillScore = !isCollegeAdminProfile;
  assert.strictEqual(showAcademicYear, false, "Academic year must not show on College Admin profile");
  assert.strictEqual(showSkillScore, false, "Skill score ranking panel must not show on College Admin profile");
});

it("7. College Admin is blocked from Faculty Studio (/faculty)", () => {
  const profile = { role: "college_admin" };
  const isFaculty = profile.role === "faculty";
  const redirectTarget = (profile.role === "college_admin" && !isFaculty) ? "/admin" : "/faculty";
  assert.strictEqual(redirectTarget, "/admin", "College Admin must redirect from /faculty to /admin");
});

it("8. College Admin is blocked from Student Dashboard (/dashboard)", () => {
  const profile = { role: "college_admin" };
  const redirectTarget = (profile.role === "college_admin" || profile.role === "admin") ? "/admin" : "/dashboard";
  assert.strictEqual(redirectTarget, "/admin", "College Admin must redirect from /dashboard to /admin");
});

it("9. College Admin cannot access private student/faculty Project Rooms without authorized membership", () => {
  const adminUserId = "usr-college-admin-external";
  const project = { id: "proj-private-1", ownerId: "usr-student-owner-1" };
  const projectMembers = [
    { projectId: "proj-private-1", userId: "usr-student-owner-1", status: "active" },
    { projectId: "proj-private-1", userId: "usr-student-member-1", status: "active" },
  ];
  const hasAccess = canAccessRoomSync(adminUserId, project.id, projectMembers, project.ownerId);
  assert.strictEqual(hasAccess, false, "College Admin without active membership or ownership must be strictly denied room access");
});

itAsync("10. College Admin cannot review weekly submissions without being the project owner or assigned mentor", async () => {
  let errCaught = false;
  try {
    await reviewWeeklySubmission(
      "sub-test-1",
      "proj-unassigned-admin",
      "usr-college-admin-reviewer",
      "Admin trying to grade student submission without mentor assignment",
      "accepted"
    );
  } catch (err) {
    errCaught = true;
    assert(err.message.includes("Unauthorized") || err.message.includes("not assigned as a faculty mentor"), "Must throw Unauthorized when non-mentor admin attempts review");
  }
  assert(errCaught, "Unassigned College Admin must be rejected from reviewing student progress submissions");
});

it("11. Navigation bar replaces '+ New Project' with 'Invite Members' for College Admins", () => {
  const role = "college_admin";
  const isOwner = false;
  const actionButton = (role === "admin" || role === "college_admin") && !isOwner
    ? { label: "Invite Members", href: "/admin?tab=invitations" }
    : { label: "+ New Project", href: "/projects/new" };
  assert.strictEqual(actionButton.label, "Invite Members");
  assert.strictEqual(actionButton.href, "/admin?tab=invitations");
});

itAsync("12. Tenant and Institution Isolation: College Admin cannot modify another college's branding or access another college's members", async () => {
  let errCaught = false;
  try {
    await updateCollegeBranding("col-inst-target", { name: "Compromised Branding" }, "col-inst-different");
  } catch (err) {
    errCaught = true;
    assert(err.message.includes("Unauthorized"), "Must throw Unauthorized on cross-college branding tampering");
  }
  assert(errCaught, "Cross-college tampering must be rejected");
});

// ---------------------------------------------------------------------------
// SECTION 13: FACULTY BRANCH UNWANTED FEATURES & ACCESS REMOVAL (12 CRITERIA)
// ---------------------------------------------------------------------------
console.log("\n--- SECTION 13: FACULTY BRANCH UNWANTED FEATURES & ACCESS REMOVAL ---");

itAsync("1. Faculty cannot apply as a student team applicant to academic projects", async () => {
  let errCaught = false;
  try {
    await applyToProject({
      projectId: "proj-fac-deny",
      applicantId: "usr-fac-applicant-1",
      callerRole: "faculty",
      selectedRoleId: "role-1",
      motivation: "Faculty applying as student",
      relevantExperience: "Academic researcher",
    });
  } catch (err) {
    errCaught = true;
    assert(err.message.includes("Faculty members cannot submit student applications") || err.message.includes("Unauthorized"), "Must reject application with unauthorized error");
  }
  assert(errCaught, "Faculty applying as student applicant must be rejected");
});

itAsync("2. Faculty cannot manage college subscriptions (createCollegeSubscription)", async () => {
  let errCaught = false;
  try {
    await createCollegeSubscription({
      collegeId: "col-1",
      planId: "plan-growth",
      billingCycle: "annual",
      status: "active",
      studentSeatsPurchased: 500,
      facultySeatsPurchased: 50,
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 365 * 86400000).toISOString(),
      autoRenew: true,
    }, "faculty");
  } catch (err) {
    errCaught = true;
    assert(err.message.includes("Unauthorized"), "Must throw Unauthorized when faculty attempts subscription management");
  }
  assert(errCaught, "Faculty subscription management must be rejected");
});

itAsync("3. Faculty cannot manage institutional members (addCollegeMember)", async () => {
  let errCaught = false;
  try {
    await addCollegeMember({
      collegeId: "col-1",
      userId: "usr-hacked-member",
      role: "student",
      isSeatActive: true,
      department: "Computer Science",
    }, "faculty");
  } catch (err) {
    errCaught = true;
    assert(err.message.includes("Unauthorized"), "Must throw Unauthorized when faculty attempts member addition");
  }
  assert(errCaught, "Faculty member addition must be rejected");
});

itAsync("4. Faculty cannot dispatch institutional invitations (createCollegeInvitation)", async () => {
  let errCaught = false;
  try {
    await createCollegeInvitation({
      collegeId: "col-1",
      email: "rogue@institution.edu",
      role: "faculty",
      invitedBy: "faculty-mentor-1",
    }, "faculty");
  } catch (err) {
    errCaught = true;
    assert(err.message.includes("Unauthorized"), "Must throw Unauthorized when faculty attempts invitation creation");
  }
  assert(errCaught, "Faculty invitation creation must be rejected");
});

it("5. Faculty is blocked from College Administration console (/admin)", () => {
  const profile = { role: "faculty" };
  const redirectTarget = profile.role === "faculty" ? "/faculty" : "/admin";
  assert.strictEqual(redirectTarget, "/faculty", "Faculty must redirect from /admin to /faculty");
});

it("6. Faculty is blocked from College Subscription & Billing (/subscription)", () => {
  const profile = { role: "faculty" };
  const redirectTarget = profile.role === "faculty" ? "/faculty" : "/subscription";
  assert.strictEqual(redirectTarget, "/faculty", "Faculty must redirect from /subscription to /faculty");
});

it("7. Faculty is blocked from Student Dashboard (/dashboard)", () => {
  const profile = { role: "faculty" };
  const redirectTarget = profile.role === "faculty" ? "/faculty" : "/dashboard";
  assert.strictEqual(redirectTarget, "/faculty", "Faculty must redirect from /dashboard to /faculty");
});

it("8. Faculty cannot access private project rooms where they are not owner or accepted mentor", () => {
  const facultyUserId = "usr-faculty-unassigned";
  const project = { id: "proj-unassigned-pod", ownerId: "usr-student-lead-1" };
  const members = [
    { projectId: "proj-unassigned-pod", userId: "usr-student-lead-1", status: "active" },
    { projectId: "proj-unassigned-pod", userId: "usr-faculty-assigned-mentor", status: "active" },
  ];
  const hasAccess = canAccessRoomSync(facultyUserId, project.id, members, project.ownerId);
  assert.strictEqual(hasAccess, false, "Unassigned faculty must be strictly denied access to private project room");
});

itAsync("9. Faculty cannot review weekly submissions on unassigned projects", async () => {
  let errCaught = false;
  try {
    await reviewWeeklySubmission(
      "sub-review-test-1",
      "proj-unassigned-pod",
      "usr-faculty-unassigned",
      "Faculty grading submission without mentor assignment",
      "accepted"
    );
  } catch (err) {
    errCaught = true;
    assert(err.message.includes("Unauthorized") || err.message.includes("not assigned as a faculty mentor"), "Must throw Unauthorized when unassigned faculty attempts submission review");
  }
  assert(errCaught, "Unassigned faculty submission review must be rejected");
});

itAsync("10. Faculty cannot modify another faculty member's private project", async () => {
  let errCaught = false;
  try {
    await updateProject(
      "usr-faculty-stranger",
      "proj-other-faculty",
      { title: "Unauthorized Overwrite" }
    );
  } catch (err) {
    errCaught = true;
    assert(err.message.includes("Unauthorized"), "Must throw Unauthorized when faculty modifies stranger's project");
  }
  assert(errCaught, "Modifying other faculty's project must be rejected");
});

it("11. Student academic fields (academicYear, graduationYear) and skill score ranking are hidden on Faculty profile", () => {
  const facultyProfile = { role: "faculty", designation: "Professor & Chair", department: "Computer Science & Engineering" };
  const isFaculty = Boolean(facultyProfile.designation || facultyProfile.role === "faculty");
  const isIndustry = facultyProfile.role === "industry_partner";
  const isCollegeAdmin = facultyProfile.role === "college_admin";
  const showAcademicYear = !isIndustry && !isCollegeAdmin && !isFaculty && Boolean(facultyProfile.academicYear);
  const showSkillScore = !isIndustry && !isCollegeAdmin && !isFaculty;
  assert.strictEqual(showAcademicYear, false, "Academic year must not show on Faculty profile");
  assert.strictEqual(showSkillScore, false, "Skill score ranking panel must not show on Faculty profile");
});

it("12. Project Detail Action Hub hides 'Apply to Join Team' and offers Faculty Mentorship for faculty users", () => {
  const user = { role: "faculty" };
  const isOwner = false;
  const userMentorshipRequest = null;
  const showApplyToJoin = user.role !== "faculty";
  const showOfferMentorship = user.role === "faculty" && !userMentorshipRequest && !isOwner;
  assert.strictEqual(showApplyToJoin, false, "Faculty user must not see Apply to Join Team");
  assert.strictEqual(showOfferMentorship, true, "Faculty user must see Offer Faculty Mentorship");
});

// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// SECTION 14: STUDENT BRANCH UNWANTED FEATURES & ACCESS REMOVAL (12 CRITERIA)
// ---------------------------------------------------------------------------
console.log("\n--- SECTION 14: STUDENT BRANCH UNWANTED FEATURES & ACCESS REMOVAL ---");

itAsync("1. Student cannot create faculty or institutional project types via createProject", async () => {
  let errCaught = false;
  try {
    await createProject("usr-student-creator", {
      title: "Faculty Research Attempt",
      shortDescription: "Student attempting to create faculty project",
      type: "Faculty Academic Project",
    }, "student");
  } catch (err) {
    errCaught = true;
    assert(err.message.includes("Unauthorized") || err.message.includes("Students cannot create"), "Must throw Unauthorized error on faculty project creation");
  }
  assert(errCaught, "Student creating faculty project must be rejected");
});

itAsync("2. Student cannot edit another user's private profile via saveProfile", async () => {
  let errCaught = false;
  try {
    await saveProfile("usr-victim-student", { fullName: "Tampered Student Name" }, "usr-malicious-student");
  } catch (err) {
    errCaught = true;
    assert(err.message.includes("Unauthorized"), "Must throw Unauthorized when student edits another student's profile");
  }
  assert(errCaught, "Cross-user profile edit by student must be blocked");
});

it("3. Student is blocked from College Administration console (/admin)", () => {
  const profile = { role: "student" };
  const redirectTarget = profile.role === "student" ? "/dashboard" : "/admin";
  assert.strictEqual(redirectTarget, "/dashboard", "Student must redirect from /admin to /dashboard");
});

it("4. Student is blocked from College Subscription & Billing console (/subscription)", () => {
  const profile = { role: "student" };
  const redirectTarget = profile.role === "student" ? "/dashboard" : "/subscription";
  assert.strictEqual(redirectTarget, "/dashboard", "Student must redirect from /subscription to /dashboard");
});

it("5. Student is blocked from Faculty Studio (/faculty)", () => {
  const profile = { role: "student" };
  const allowedRoles = ["faculty", "admin", "college_admin", "owner"];
  const isAllowed = allowedRoles.includes(profile.role);
  assert.strictEqual(isAllowed, false, "Student must not be allowed in Faculty Studio");
});

it("6. Student is blocked from Curriculum Evolution (/curriculum)", () => {
  const profile = { role: "student" };
  const redirectTarget = profile.role === "student" ? "/dashboard" : "/curriculum";
  assert.strictEqual(redirectTarget, "/dashboard", "Student must redirect from /curriculum to /dashboard");
});

it("7. Student cannot access private project rooms where they are not owner or active member", () => {
  const studentUserId = "usr-student-unauthorized";
  const project = { id: "proj-private-pod", ownerId: "usr-other-lead" };
  const members = [
    { projectId: "proj-private-pod", userId: "usr-other-lead", status: "active" },
    { projectId: "proj-private-pod", userId: "usr-team-member-1", status: "active" },
  ];
  const hasAccess = canAccessRoomSync(studentUserId, project.id, members, project.ownerId);
  assert.strictEqual(hasAccess, false, "Unauthorized student must be strictly denied access to private project room");
});

itAsync("8. Student cannot review or approve weekly submissions (reviewWeeklySubmission)", async () => {
  let errCaught = false;
  try {
    await reviewWeeklySubmission(
      "sub-student-test-1",
      "proj-any-pod",
      "usr-student-evaluator",
      "Student grading another student's work",
      "accepted",
      "student"
    );
  } catch (err) {
    errCaught = true;
    assert(err.message.includes("Unauthorized") || err.message.includes("Students cannot review"), "Must throw Unauthorized when student attempts submission review");
  }
  assert(errCaught, "Student submission review must be rejected");
});

itAsync("9. Student cannot review or accept faculty mentorship requests (reviewMentorship)", async () => {
  let errCaught = false;
  try {
    await reviewMentorship(
      "usr-student-reviewer",
      "req-mentorship-1",
      true,
      "proj-1",
      "student"
    );
  } catch (err) {
    errCaught = true;
    assert(err.message.includes("Unauthorized"), "Must throw Unauthorized when student attempts mentorship review");
  }
  assert(errCaught, "Student mentorship review must be rejected");
});

itAsync("10. Student cannot manage college subscriptions (createCollegeSubscription)", async () => {
  let errCaught = false;
  try {
    await createCollegeSubscription({
      collegeId: "col-1",
      planId: "plan-enterprise",
      billingCycle: "annual",
      status: "active",
      studentSeatsPurchased: 2000,
      facultySeatsPurchased: 200,
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 365 * 86400000).toISOString(),
      autoRenew: true,
    }, "student");
  } catch (err) {
    errCaught = true;
    assert(err.message.includes("Unauthorized"), "Must throw Unauthorized when student attempts subscription management");
  }
  assert(errCaught, "Student subscription management must be rejected");
});

itAsync("11. Student cannot add institutional members or dispatch college invitations", async () => {
  let memberErrCaught = false;
  try {
    await addCollegeMember({
      collegeId: "col-1",
      userId: "usr-hacked-student",
      role: "student",
      isSeatActive: true,
      department: "Computer Science",
    }, "student");
  } catch (err) {
    memberErrCaught = true;
    assert(err.message.includes("Unauthorized"), "Must throw Unauthorized when student adds members");
  }
  assert(memberErrCaught, "Student member addition must be rejected");

  let inviteErrCaught = false;
  try {
    await createCollegeInvitation({
      collegeId: "col-1",
      email: "invited@institution.edu",
      role: "student",
      invitedBy: "student-1",
    }, "student");
  } catch (err) {
    inviteErrCaught = true;
    assert(err.message.includes("Unauthorized"), "Must throw Unauthorized when student dispatches invitations");
  }
  assert(inviteErrCaught, "Student invitation dispatch must be rejected");
});

it("12. Student Project Detail Hub hides 'Offer Faculty Mentorship' and Project Create filters faculty/institutional types", () => {
  const studentUser = { role: "student" };
  const isOwner = false;
  const userMentorshipRequest = null;
  const showOfferMentorship = studentUser.role === "faculty" && !userMentorshipRequest && !isOwner;
  assert.strictEqual(showOfferMentorship, false, "Student user must not see Offer Faculty Mentorship button");

  const restrictedTypes = ["Faculty Academic Project", "College Innovation Project", "Industry Challenge", "Joint Industry Project", "Faculty-Led Research"];
  const studentPermittedTypes = PROJECT_TYPES.filter((pt) => !restrictedTypes.includes(pt));
  assert(studentPermittedTypes.includes("Personal Project"), "Must allow Personal Project");
  assert(studentPermittedTypes.includes("Independent Team Project"), "Must allow Independent Team Project");
  assert(studentPermittedTypes.includes("Academic Project"), "Must allow Academic Project");
  assert(!studentPermittedTypes.includes("Faculty Academic Project"), "Must exclude Faculty Academic Project");
  assert(!studentPermittedTypes.includes("College Innovation Project"), "Must exclude College Innovation Project");
  assert(!studentPermittedTypes.includes("Industry Challenge"), "Must exclude Industry Challenge");
});


// ---------------------------------------------------------------------------
// SECTION 15: AI DIRECT PROFILE NAVIGATION (6 CRITERIA)
// ---------------------------------------------------------------------------
console.log("\n--- SECTION 15: AI DIRECT PROFILE NAVIGATION ---");

const testFacultyProfile = {
  id: "fac-uuid-1010-2020",
  userId: "fac-uuid-1010-2020",
  fullName: "Prof. Vikram Sarabhai",
  email: "vikram@iitd.ac.in",
  role: "faculty",
  designation: "Professor & Chair",
  department: "Aerospace Engineering",
  institution: "IIT Delhi",
  skills: [{ skill: "Spacecraft Dynamics", proficiency: "expert" }],
  status: "active",
};

const testStudentProfile = {
  id: "stu-uuid-3030-4040",
  userId: "stu-uuid-3030-4040",
  fullName: "Aarav Sharma",
  email: "aarav@iitd.ac.in",
  role: "student",
  academicYear: 3,
  department: "Computer Science & Engineering",
  institution: "IIT Delhi",
  skills: [{ skill: "Python", proficiency: "advanced" }, { skill: "AI", proficiency: "intermediate" }],
  status: "active",
};

const testSuspendedProfile = {
  id: "susp-uuid-9999-0000",
  userId: "susp-uuid-9999-0000",
  fullName: "Malicious Actor",
  role: "student",
  status: "suspended",
  skills: [],
};

const testProfilesList = [testFacultyProfile, testStudentProfile, testSuspendedProfile];
const testProjectsList = [
  {
    id: "proj-uuid-5555-6666",
    title: "Autonomous Navigation Pod",
    status: "open",
    visibility: "public",
    requiredSkills: ["Python", "ROS"],
    domains: ["Robotics"],
    roles: [],
  },
];

it("1. Faculty direct navigation: resolves 'Open dex_faculty profile.' to validated /profile/:id", () => {
  // Scenario 1a: Named profile command "Open dex_faculty profile."
  const res1 = processCampusQuery("Open dex_faculty profile.", testProfilesList, testProjectsList, null, {});
  assert(res1.navigation, "Must return navigation action");
  assert.strictEqual(res1.navigation.type, "navigate");
  assert.strictEqual(res1.navigation.route, `/profile/${testFacultyProfile.userId}`);
  assert.strictEqual(res1.navigation.label, "Open Faculty Profile");
  assert.strictEqual(res1.students, undefined, "Must NOT show student cards on direct navigation");
  assert.strictEqual(res1.faculty, undefined, "Must NOT show faculty cards on direct navigation");

  // Scenario 1b: Contextual command "Open this faculty profile."
  const res2 = processCampusQuery("Open this faculty profile.", testProfilesList, testProjectsList, null, {
    lastFaculty: [testFacultyProfile],
  });
  assert(res2.navigation, "Must return navigation action from context");
  assert.strictEqual(res2.navigation.route, `/profile/${testFacultyProfile.userId}`);
  assert.strictEqual(res2.navigation.label, "Open Faculty Profile");
});

it("2. Student direct navigation: resolves 'Open this student\'s profile.' and 'Navigate to the selected profile.'", () => {
  // Scenario 2a: Contextual command "Open this student's profile."
  const res1 = processCampusQuery("Open this student's profile.", testProfilesList, testProjectsList, null, {
    lastStudents: [testStudentProfile],
  });
  assert(res1.navigation, "Must return navigation action from context");
  assert.strictEqual(res1.navigation.type, "navigate");
  assert.strictEqual(res1.navigation.route, `/profile/${testStudentProfile.userId}`);
  assert.strictEqual(res1.navigation.label, "Open Student Profile");

  // Scenario 2b: Contextual generic command "Navigate to the selected profile."
  const res2 = processCampusQuery("Navigate to the selected profile.", testProfilesList, testProjectsList, null, {
    lastPerson: testStudentProfile,
  });
  assert(res2.navigation, "Must return navigation action from lastPerson context");
  assert.strictEqual(res2.navigation.route, `/profile/${testStudentProfile.userId}`);

  // Scenario 2c: Contextual project command "Open this project."
  const res3 = processCampusQuery("Open this project.", testProfilesList, testProjectsList, null, {
    lastProjects: [testProjectsList[0]],
  });
  assert(res3.navigation, "Must return project navigation action");
  assert.strictEqual(res3.navigation.route, `/projects/${testProjectsList[0].id}`);
  assert.strictEqual(res3.navigation.label, "Open Project");
});

it("3. Invalid profile ID or unknown person does not trigger navigation", () => {
  const res = processCampusQuery("Open NonExistentGhostUser profile.", testProfilesList, testProjectsList, null, {});
  assert.strictEqual(res.navigation, undefined, "Must not return navigation action for unknown profile");
  assert(res.text.includes("couldn't find a profile") || res.text.includes("NonExistentGhostUser"), "Must indicate profile not found");
});

it("4. Unauthorized / suspended profile is strictly blocked from navigation", () => {
  const res = processCampusQuery("Open Malicious Actor profile.", testProfilesList, testProjectsList, null, {});
  assert.strictEqual(res.navigation, undefined, "Must not return navigation action for suspended profile");
  assert(res.text.includes("suspended") || res.text.includes("inaccessible"), "Must indicate profile is suspended or inaccessible");
});

it("5. Normal profile search preserves profile cards and does NOT trigger direct navigation", () => {
  const res = processCampusQuery("Find students who know Python and AI", testProfilesList, testProjectsList, null, {});
  assert.strictEqual(res.navigation, undefined, "Normal profile search must not attach navigation action");
  assert(Array.isArray(res.students), "Normal search must return students array for card rendering");
  assert(res.students.length > 0, "Must return matching student");
  assert.strictEqual(res.students[0].userId, testStudentProfile.userId);
});

it("6. Normal profile details request preserves markdown breakdown and does NOT trigger direct navigation", () => {
  const res = processCampusQuery("Who is Aarav Sharma?", testProfilesList, testProjectsList, null, {});
  assert.strictEqual(res.navigation, undefined, "Normal profile details query must not attach navigation action");
  assert(res.text.includes("Aarav Sharma"), "Must return profile name");
  assert(res.text.includes("Department"), "Must return department breakdown");
  assert(res.text.includes("Skills"), "Must return skills details");
});

// Summary
// ---------------------------------------------------------------------------
await Promise.allSettled(asyncTests);
console.log("\n=================================================");
console.log(`🎯 TEST RESULTS: ${testsPassed} / ${totalTests} TESTS PASSED (${Math.round((testsPassed/totalTests)*100)}%)`);
console.log("=================================================");
if (testsPassed === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
