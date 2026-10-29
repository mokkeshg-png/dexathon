/**
 * projectDocumentIntelligence.ts
 *
 * AI Document Intelligence for Project Creation — PRD Requirement Section 4.
 * Enables faculty and students to upload project documents (PRD, PPT, Proposal, Problem Statement)
 * and automatically extract structured project requirements, domains, skills, roles, and dependencies.
 *
 * Deterministic, transparent, and completely offline-capable (no external paid APIs).
 */

import type { Difficulty, ProjectRole, ProjectType } from "@/types";
import { newRole } from "./store";

export type DocumentPurpose =
  | "prd"
  | "presentation"
  | "problem_statement"
  | "proposal"
  | "technical_doc"
  | "supporting_ref";

export const DOCUMENT_PURPOSE_LABELS: Record<DocumentPurpose, string> = {
  prd: "Project Requirements Document (PRD)",
  presentation: "Project Presentation / PPT",
  problem_statement: "Problem Statement Document",
  proposal: "Project Proposal",
  technical_doc: "Technical Specification Document",
  supporting_ref: "Supporting Reference Material",
};

export interface ExtractedProjectRequirements {
  title: string;
  shortDescription: string;
  detailedDescription: string;
  problemStatement: string;
  objectives: string[];
  expectedOutcomes: string;
  domains: string[];
  requiredSkills: string[];
  suggestedRoles: ProjectRole[];
  roleDependencies: Array<{ role: string; dependsOnRole: string; reason: string }>;
  detectedTechStack: string[];
  missingOrAmbiguous: string[];
  difficulty: Difficulty;
  suggestedType: ProjectType;
  teamSizeMin: number;
  teamSizeMax: number;
  confidence: "high" | "medium" | "low";
  documentName: string;
  documentPurpose: DocumentPurpose;
  analyzedAt: string;
}

// Technical keyword dictionary mapped to skills, domains, and roles
const TECH_TAXONOMY: Record<
  string,
  { skill: string; domain: string; role: string; roleDesc: string }
> = {
  react: { skill: "React", domain: "Web Development", role: "Frontend Developer", roleDesc: "Develops interactive client interfaces, routing, and UI components." },
  vue: { skill: "Vue.js", domain: "Web Development", role: "Frontend Developer", roleDesc: "Develops responsive client application views." },
  angular: { skill: "Angular", domain: "Web Development", role: "Frontend Developer", roleDesc: "Builds enterprise frontend application modules." },
  tailwind: { skill: "Tailwind CSS", domain: "Web Development", role: "Frontend Developer", roleDesc: "Designs responsive component styling and design systems." },
  typescript: { skill: "TypeScript", domain: "Full-Stack Development", role: "Frontend Developer", roleDesc: "Implements type-safe frontend and backend workflows." },
  javascript: { skill: "JavaScript", domain: "Web Development", role: "Frontend Developer", roleDesc: "Implements interactive web application features." },
  node: { skill: "Node.js", domain: "Backend Development", role: "Backend Developer", roleDesc: "Builds scalable backend services and asynchronous APIs." },
  express: { skill: "Express.js", domain: "Backend Development", role: "Backend Developer", roleDesc: "Designs RESTful routing and middleware pipeline." },
  fastapi: { skill: "FastAPI", domain: "Backend Development", role: "Backend Developer", roleDesc: "Implements high-performance Python microservices." },
  django: { skill: "Django", domain: "Backend Development", role: "Backend Developer", roleDesc: "Engineers backend application services and database models." },
  python: { skill: "Python", domain: "Artificial Intelligence", role: "Machine Learning Engineer", roleDesc: "Develops algorithmic pipelines and data processing scripts." },
  pytorch: { skill: "PyTorch", domain: "Artificial Intelligence", role: "Machine Learning Engineer", roleDesc: "Designs, trains, and evaluates deep neural network architectures." },
  tensorflow: { skill: "TensorFlow", domain: "Artificial Intelligence", role: "Machine Learning Engineer", roleDesc: "Implements model training and inference pipelines." },
  keras: { skill: "Keras", domain: "Artificial Intelligence", role: "Machine Learning Engineer", roleDesc: "Prototypes deep learning model architectures." },
  opencv: { skill: "OpenCV", domain: "Computer Vision", role: "Computer Vision Specialist", roleDesc: "Processes image matrices, segmentation, and visual feature extraction." },
  spacy: { skill: "NLP (spaCy)", domain: "Natural Language Processing", role: "NLP Specialist", roleDesc: "Tokenizes, tags, and extracts semantic entities from text." },
  bert: { skill: "BERT / Transformers", domain: "Natural Language Processing", role: "NLP Specialist", roleDesc: "Fine-tunes transformer architectures for language understanding." },
  postgres: { skill: "PostgreSQL", domain: "Database Systems", role: "Database Developer", roleDesc: "Designs relational schemas, indexes, and queries." },
  sql: { skill: "SQL", domain: "Database Systems", role: "Database Developer", roleDesc: "Optimizes queries, joins, and data consistency." },
  mongodb: { skill: "MongoDB", domain: "Database Systems", role: "Database Developer", roleDesc: "Manages document store schemas and aggregation pipelines." },
  redis: { skill: "Redis", domain: "Database Systems", role: "Backend Developer", roleDesc: "Integrates low-latency caching and pub/sub pipelines." },
  docker: { skill: "Docker", domain: "Cloud & DevOps", role: "DevOps Engineer", roleDesc: "Containerizes microservices and manages deploy environments." },
  kubernetes: { skill: "Kubernetes", domain: "Cloud & DevOps", role: "DevOps Engineer", roleDesc: "Orchestrates microservices clusters and auto-scaling." },
  aws: { skill: "AWS", domain: "Cloud & DevOps", role: "DevOps Engineer", roleDesc: "Manages cloud computing, object storage, and compute instances." },
  cybersecurity: { skill: "Cybersecurity", domain: "Cybersecurity & Privacy", role: "Cybersecurity Specialist", roleDesc: "Audits vulnerability vectors, auth security, and encryption." },
  security: { skill: "Cybersecurity", domain: "Cybersecurity & Privacy", role: "Cybersecurity Specialist", roleDesc: "Hardens endpoint access control and token encryption." },
  cryptography: { skill: "Cryptography", domain: "Cybersecurity & Privacy", role: "Cybersecurity Specialist", roleDesc: "Applies cryptographic primitives and data protection standards." },
  iot: { skill: "IoT & Embedded", domain: "Internet of Things", role: "Embedded Systems Engineer", roleDesc: "Programs microcontrollers, sensor arrays, and hardware interfaces." },
  arduino: { skill: "Embedded Systems", domain: "Internet of Things", role: "Embedded Systems Engineer", roleDesc: "Interfaces analog sensors and actuators." },
  raspberry: { skill: "Embedded Systems", domain: "Internet of Things", role: "Embedded Systems Engineer", roleDesc: "Configures edge compute nodes and sensor telemetry." },
  robotics: { skill: "Robotics", domain: "Robotics", role: "Robotics Engineer", roleDesc: "Integrates kinematics, motion planning, and hardware drivers." },
  latex: { skill: "LaTeX", domain: "Academic Research", role: "Research Writer", roleDesc: "Drafts formal manuscripts, bibliography references, and methodology." },
  publication: { skill: "Research Writing", domain: "Academic Research", role: "Research Writer", roleDesc: "Compiles literature reviews, empirical results, and paper sections." },
};

/**
 * Extracts text from an uploaded document buffer or string.
 * Supports plaintext, markdown, JSON, and decodes binary text streams (PDF/DOCX strings).
 */
export async function extractTextFromDocument(file: File): Promise<string> {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";

  // Plain text, markdown, or json
  if (["txt", "md", "json", "csv"].includes(extension) || file.type.startsWith("text/")) {
    return await file.text();
  }

  // Binary files (PDF, DOCX, PPTX)
  // Safely extract ASCII / UTF-8 strings from the binary buffer
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let text = "";
  let currentWord = "";

  for (let i = 0; i < bytes.length && text.length < 50000; i++) {
    const charCode = bytes[i];
    // Printable ASCII or newline/space
    if ((charCode >= 32 && charCode <= 126) || charCode === 10 || charCode === 13 || charCode === 9) {
      currentWord += String.fromCharCode(charCode);
    } else {
      if (currentWord.length >= 3) {
        text += currentWord + " ";
      }
      currentWord = "";
    }
  }

  // Clean redundant whitespace
  const sanitized = text.replace(/[\x00-\x09\x0B-\x1F\x7F-\x9F]/g, " ").replace(/\s+/g, " ").trim();
  return sanitized.length > 50 ? sanitized : `Document ${file.name} uploaded successfully.`;
}

/**
 * Core Document Intelligence Pipeline
 * Parses extracted document text and derives structured project requirements.
 */
export function analyzeProjectDocument(
  rawText: string,
  fileName: string,
  purpose: DocumentPurpose
): ExtractedProjectRequirements {
  const lowerText = rawText.toLowerCase();

  // 1. Title Extraction
  let extractedTitle = "";
  const titleMatch = rawText.match(/(?:title|project\s*name|project\s*title)[:\s]+([^\n\r.]+)/i);
  if (titleMatch && titleMatch[1].trim().length >= 5) {
    extractedTitle = titleMatch[1].trim().replace(/^["']|["']$/g, "").slice(0, 100);
  } else {
    // Clean filename as fallback
    const baseName = fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
    extractedTitle = baseName
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  // 2. Problem Statement Extraction
  let problemStatement = "";
  const problemMatch = rawText.match(/(?:problem\s*statement|problem\s*description|background|motivation)[:\s]+([^\n\r]+(?:\n[^\n\r]+){0,3})/i);
  if (problemMatch && problemMatch[1].trim().length >= 20) {
    problemStatement = problemMatch[1].trim().slice(0, 500);
  } else {
    problemStatement = `Investigating core challenges and engineering an evidence-based technical solution based on requirements in ${fileName}.`;
  }

  // 3. Objectives Extraction
  const objectives: string[] = [];
  const objSection = rawText.match(/(?:objectives|goals|deliverables|milestones)[:\s]+([\s\S]{30,800}?)(?:\n\s*\n|[A-Z]{3,}:|$)/i);
  if (objSection) {
    const lines = objSection[1].split(/\n|•|-|\d+\./);
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length >= 10 && trimmed.length <= 150) {
        objectives.push(trimmed);
      }
      if (objectives.length >= 4) break;
    }
  }

  if (objectives.length === 0) {
    objectives.push("Establish architectural baseline and literature specifications");
    objectives.push("Implement scalable core modules with unit and integration tests");
    objectives.push("Perform comprehensive benchmarks and prepare final documentation");
  }

  // 4. Technology & Skills Extraction
  const detectedSkills = new Set<string>();
  const detectedDomains = new Set<string>();
  const detectedTech = new Set<string>();
  const roleCandidates = new Map<string, { role: string; desc: string; skills: Set<string> }>();

  for (const [kw, info] of Object.entries(TECH_TAXONOMY)) {
    if (lowerText.includes(kw)) {
      detectedSkills.add(info.skill);
      detectedDomains.add(info.domain);
      detectedTech.add(info.skill);

      if (!roleCandidates.has(info.role)) {
        roleCandidates.set(info.role, {
          role: info.role,
          desc: info.roleDesc,
          skills: new Set([info.skill]),
        });
      } else {
        roleCandidates.get(info.role)!.skills.add(info.skill);
      }
    }
  }

  // Fallbacks if document is terse
  if (detectedSkills.size === 0) {
    detectedSkills.add("Python");
    detectedSkills.add("System Architecture");
    detectedDomains.add("Academic Research");
  }

  // 5. Synthesize Suggested Roles (PRD 1 Module 1 & PRD 2 Section 18.3)
  const suggestedRoles: ProjectRole[] = [];
  for (const [, cand] of roleCandidates.entries()) {
    suggestedRoles.push(
      newRole({
        name: cand.role,
        description: cand.desc,
        requiredSkills: Array.from(cand.skills),
        openings: 1,
      })
    );
    if (suggestedRoles.length >= 4) break;
  }

  // Ensure Project Lead role always exists
  if (!suggestedRoles.some((r) => r.name.toLowerCase().includes("lead"))) {
    suggestedRoles.unshift(
      newRole({
        name: "Project Lead",
        description: "Directs project roadmap, requirement alignment, and team coordination.",
        requiredSkills: Array.from(detectedSkills).slice(0, 2),
        openings: 1,
      })
    );
  }

  // 6. Role Dependency Analysis (PRD 1 Module 9 Section 4.9)
  const roleDependencies: Array<{ role: string; dependsOnRole: string; reason: string }> = [];
  const roleNames = suggestedRoles.map((r) => r.name);
  if (roleNames.includes("Frontend Developer") && roleNames.includes("Backend Developer")) {
    roleDependencies.push({
      role: "Frontend Developer",
      dependsOnRole: "Backend Developer",
      reason: "Client UI modules depend on verified REST endpoints and authentication tokens.",
    });
  }
  if (roleNames.includes("Backend Developer") && roleNames.includes("Database Developer")) {
    roleDependencies.push({
      role: "Backend Developer",
      dependsOnRole: "Database Developer",
      reason: "API controllers depend on finalized database schemas and foreign key constraints.",
    });
  }
  if (roleNames.includes("Machine Learning Engineer") && roleNames.includes("Backend Developer")) {
    roleDependencies.push({
      role: "Backend Developer",
      dependsOnRole: "Machine Learning Engineer",
      reason: "Inference microservices depend on exported model weights and input tensor shapes.",
    });
  }

  // 7. Ambiguity & Missing Requirements Check (PRD Section 4)
  const missingOrAmbiguous: string[] = [];
  if (!lowerText.includes("deadline") && !lowerText.includes("timeline") && !lowerText.includes("week")) {
    missingOrAmbiguous.push("Explicit delivery schedule or milestone due dates are not defined in the document.");
  }
  if (!lowerText.includes("test") && !lowerText.includes("benchmark") && !lowerText.includes("evaluation")) {
    missingOrAmbiguous.push("Verification criteria, unit tests, or performance benchmarks are not specified.");
  }
  if (!lowerText.includes("dataset") && lowerText.includes("model")) {
    missingOrAmbiguous.push("Model training is referenced without specifying the training dataset source or format.");
  }

  // 8. Difficulty & Type Estimation
  const difficulty: Difficulty =
    detectedSkills.size >= 5 || lowerText.includes("advanced") || lowerText.includes("distributed")
      ? "advanced"
      : detectedSkills.size >= 3
      ? "intermediate"
      : "beginner";

  const suggestedType: ProjectType =
    purpose === "presentation"
      ? "Innovation Project"
      : lowerText.includes("hackathon")
      ? "Hackathon"
      : lowerText.includes("paper") || lowerText.includes("research") || purpose === "prd"
      ? "Research Project"
      : "Academic Project";

  // Descriptions
  const shortDescription = `${extractedTitle} — ${problemStatement.slice(0, 160)}${problemStatement.length > 160 ? "..." : ""}`;
  const detailedDescription = `### Project Abstract & Objectives\n${problemStatement}\n\n### Primary Deliverables\n${objectives.map((o) => `• ${o}`).join("\n")}\n\n### Identified Tech Stack\n${Array.from(detectedTech).join(", ") || "Custom architectural stack"}\n\n*Extracted via AI Document Intelligence from uploaded file: ${fileName} (${DOCUMENT_PURPOSE_LABELS[purpose]})*`;

  return {
    title: extractedTitle,
    shortDescription,
    detailedDescription,
    problemStatement,
    objectives,
    expectedOutcomes: "Working implementation prototype and verified documentation",
    domains: Array.from(detectedDomains).slice(0, 3),
    requiredSkills: Array.from(detectedSkills),
    suggestedRoles,
    roleDependencies,
    detectedTechStack: Array.from(detectedTech),
    missingOrAmbiguous,
    difficulty,
    suggestedType,
    teamSizeMin: Math.max(2, suggestedRoles.length),
    teamSizeMax: Math.max(4, suggestedRoles.length + 2),
    confidence: detectedSkills.size >= 3 && objectives.length >= 2 ? "high" : "medium",
    documentName: fileName,
    documentPurpose: purpose,
    analyzedAt: new Date().toISOString(),
  };
}
