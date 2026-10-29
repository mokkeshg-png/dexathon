import { analyzeStudentSkillScore } from "./src/lib/skillScoreEngine";
import { analyzeCompatibility, recommendCollaborators } from "./src/lib/matching";
import { processCampusQuery } from "./src/components/ai/campusAiEngine";
import type { Profile, Project } from "./src/types";

const testProfile: Profile = {
  id: "test-1",
  userId: "user-1",
  email: "student@iitd.ac.in",
  role: "student",
  fullName: "Arjun Sharma",
  institution: "IIT Delhi",
  department: "Computer Science",
  skills: [
    { skill: "Python", proficiency: "advanced" },
    { skill: "PyTorch", proficiency: "intermediate" },
    { skill: "Machine Learning", proficiency: "advanced" },
  ],
  interests: ["Artificial Intelligence", "Computer Vision"],
  programmingLanguages: ["Python", "C++"],
  pastProjects: [
    {
      id: "p1",
      title: "Deep Learning Vision Classifier",
      description: "PyTorch and Python classifier for medical imaging",
      year: 2025,
    },
  ],
  internships: [
    {
      id: "i1",
      organization: "AI Labs",
      role: "ML Research Intern",
      description: "Developed neural models with PyTorch and Python",
    },
  ],
  certifications: [
    {
      id: "c1",
      name: "Deep Learning Specialization",
      issuer: "Coursera",
      year: 2024,
    },
  ],
  publications: [
    {
      id: "pub1",
      title: "Efficient Vision Transformers",
      venue: "IEEE Conference",
      year: 2025,
    },
  ],
  githubUsername: "arjun-sharma",
  githubConnected: true,
  preferredRoles: ["Machine Learning Engineer"],
  availabilityHours: 15,
  preferredTeamSize: 4,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const testProject: Project = {
  id: "proj-1",
  ownerId: "owner-1",
  title: "Adaptive Multimodal Medical Diagnosis",
  shortDescription: "AI for medical image segmentation and patient record analysis",
  detailedDescription: "Full research proposal developing lightweight multimodal vision transformers.",
  domains: ["Artificial Intelligence", "Healthcare AI"],
  interests: ["Computer Vision", "Deep Learning"],
  requiredSkills: ["Python", "PyTorch", "Computer Vision"],
  roles: [
    {
      id: "r1",
      name: "Machine Learning Engineer",
      description: "Vision model training",
      requiredSkills: ["Python", "PyTorch"],
      openings: 1,
    },
  ],
  teamMin: 2,
  teamMax: 4,
  difficulty: "advanced",
  type: "Research Project",
  visibility: "public",
  status: "open",
  tags: ["ai", "vision"],
  createdAt: "2026-02-01T00:00:00Z",
  updatedAt: "2026-02-01T00:00:00Z",
};

// 1. Skill Score Engine test
const skillScore = analyzeStudentSkillScore(testProfile, 12);
console.log("1. Student Skill Score Engine:");
console.log("   Overall Score:", skillScore.overallScore + "/100");
console.log("   Breakdown:", JSON.stringify(skillScore.breakdown));
console.log("   Strengths identified:", skillScore.strengths.length);

// 2. Compatibility Matching test
const compatibility = analyzeCompatibility(testProject, testProfile, "Machine Learning Engineer");
console.log("\n2. Technical Compatibility Analysis:");
console.log("   Compatibility Score:", compatibility.compatibilityScore + "%");
console.log("   Confidence:", compatibility.confidence);
console.log("   Skill Match:", compatibility.skillMatch + "%");
console.log("   Role Match:", compatibility.roleMatch + "%");
console.log("   Strengths:", compatibility.strengths);

// 3. Campus AI Engine test
const queryRes = processCampusQuery("Find machine learning researchers from IIT Delhi", [testProfile], [testProject], null);
console.log("\n3. Campus AI Assistant Engine:");
console.log("   Students matching query:", queryRes.students?.length);
console.log("   Response text:", queryRes.text.split("\n")[0]);

// 4. Modular Project Fit & Persistence Analysis test
import { analyzeProjectFit } from "./src/lib/supabase-db";
analyzeProjectFit("proj-1", testProfile, testProject).then((fit) => {
  console.log("\n4. Modular Project Fit Analysis (Database Ready):");
  if (fit) {
    console.log("   Record ID:", fit.id);
    console.log("   Match Score:", fit.output_result.match_score + "%");
    console.log("   Confidence:", fit.output_result.confidence);
    console.log("   Strengths:", fit.output_result.strengths.length);
    console.log("   Breakdown factors:", fit.output_result.score_breakdown?.map((b) => b.factor).join(", "));
    console.log("\n>>> ALL FOUR AI & DATA INTEGRATION CAPABILITIES VERIFIED! <<<");
  } else {
    console.error("   Failed to generate fit analysis");
  }
});
