/**
 * Student role access control.
 * Frontend visibility is not sufficient — every mutation must re-check these rules.
 */

import type {
  IndustryChallenge,
  JoinRequest,
  PlatformRole,
  Profile,
  Project,
  ProjectType,
  Task,
} from "@/types";

export const STUDENT_CREATABLE_PROJECT_TYPES: ProjectType[] = [
  "Personal Project",
  "Independent Team Project",
  "Research Project",
  "Academic Project",
  "Final-Year Project",
  "Hackathon",
  "Innovation Project",
  "Open-Source",
  "Publication-Oriented",
  "Interdisciplinary",
];

export const FACULTY_MANAGED_PROJECT_TYPES: ProjectType[] = [
  "Faculty Academic Project",
  "Faculty-Led Research",
  "College Innovation Project",
];

export const INDUSTRY_PROJECT_TYPES: ProjectType[] = [
  "Industry Challenge",
  "Joint Industry Project",
];

export const STUDENT_RESTRICTED_ROUTES = [
  "/faculty",
  "/admin",
  "/subscription",
  "/curriculum",
] as const;

export function isStudentRole(role?: PlatformRole | string | null): boolean {
  return !role || role === "student";
}

export function studentHomeRoute(): string {
  return "/dashboard";
}

export function canStudentAccessRoute(pathname: string): boolean {
  return !STUDENT_RESTRICTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export function sameCollege(a?: Profile | null, b?: Profile | null): boolean {
  if (!a || !b) return false;
  if (a.collegeId && b.collegeId && a.collegeId === b.collegeId) return true;
  if (a.institution && b.institution && a.institution.trim().toLowerCase() === b.institution.trim().toLowerCase()) {
    return true;
  }
  return false;
}

export function canViewerSeeProfile(viewer: Profile | null | undefined, target: Profile): {
  allowed: boolean;
  reason: string;
} {
  if (!target) return { allowed: false, reason: "Profile not found." };
  if (viewer?.userId && viewer.userId === target.userId) {
    return { allowed: true, reason: "You can view your own profile." };
  }
  if (target.visibility === "private") {
    return { allowed: false, reason: "This student has set their profile to private." };
  }
  if (target.visibility === "institution") {
    if (sameCollege(viewer ?? null, target)) {
      return { allowed: true, reason: "Shared with your college membership." };
    }
    return { allowed: false, reason: "This profile is visible only within the student's college." };
  }
  if (target.visibility === "members") {
    if (viewer) return { allowed: true, reason: "Visible to signed-in campus members." };
    return { allowed: false, reason: "Sign in to view member-only student profiles." };
  }
  return { allowed: true, reason: "Public student profile." };
}

export function redactPrivateContact(profile: Profile, viewerId?: string | null): Profile {
  if (viewerId && profile.userId === viewerId) return profile;
  return {
    ...profile,
    email: "",
    phone: undefined,
  };
}

export function canStudentEditProfile(actorId: string | undefined, targetUserId: string | undefined): boolean {
  return Boolean(actorId && targetUserId && actorId === targetUserId);
}

export type ApplicationGate = {
  eligible: boolean;
  reason: string;
};

export function evaluateStudentProjectApplication(input: {
  role?: PlatformRole | string | null;
  userId?: string | null;
  project: Project;
  existingApplication?: JoinRequest | null;
  isMember: boolean;
}): ApplicationGate {
  const { role, userId, project, existingApplication, isMember } = input;

  if (!userId) {
    return { eligible: false, reason: "Sign in with a student account to apply." };
  }
  if (!isStudentRole(role)) {
    return { eligible: true, reason: "Non-student application rules are handled separately." };
  }
  if (isMember) {
    return { eligible: false, reason: "You already belong to this project team." };
  }
  if (project.ownerId === userId) {
    return { eligible: false, reason: "You own this project and cannot apply to it." };
  }
  if (existingApplication && existingApplication.status === "pending") {
    return { eligible: false, reason: "You already have a pending application." };
  }
  if (existingApplication && existingApplication.status === "accepted") {
    return { eligible: false, reason: "Your application was already accepted." };
  }
  if (project.visibility === "private") {
    return {
      eligible: false,
      reason: "This private project is invitation-only. You cannot apply without an invite.",
    };
  }
  if (project.status !== "open" && project.status !== "published" && project.status !== "candidate_discovery" && project.status !== "team_formation") {
    return { eligible: false, reason: "This project is not currently accepting applications." };
  }
  return { eligible: true, reason: "You can apply to this eligible opportunity." };
}

export function canStudentCreateProjectType(type: ProjectType, role?: PlatformRole | string | null): boolean {
  if (!isStudentRole(role)) return true;
  return STUDENT_CREATABLE_PROJECT_TYPES.includes(type);
}

export function canStudentReviewJoinRequest(input: {
  actorId: string;
  actorRole?: PlatformRole | string | null;
  isProjectOwner: boolean;
  applicantId: string;
  projectType: ProjectType;
}): { allowed: boolean; reason: string } {
  const { actorId, actorRole, isProjectOwner, applicantId, projectType } = input;
  if (actorId === applicantId) {
    return { allowed: false, reason: "You cannot approve your own application." };
  }
  if (isStudentRole(actorRole) && FACULTY_MANAGED_PROJECT_TYPES.includes(projectType)) {
    return { allowed: false, reason: "Students cannot approve applications on faculty-managed projects." };
  }
  if (isStudentRole(actorRole) && INDUSTRY_PROJECT_TYPES.includes(projectType)) {
    return { allowed: false, reason: "Students cannot approve industry challenge applications." };
  }
  if (isProjectOwner) {
    return { allowed: true, reason: "Independent project owners may review join requests for their own team." };
  }
  return { allowed: false, reason: "Only the project owner or authorized faculty can review applications." };
}

export function canStudentReviewSubmission(input: {
  actorId: string;
  actorRole?: PlatformRole | string | null;
  submissionStudentId: string;
  systemRole?: string | null;
}): { allowed: boolean; reason: string } {
  const { actorId, actorRole, submissionStudentId, systemRole } = input;
  if (actorId === submissionStudentId) {
    return { allowed: false, reason: "You cannot approve or faculty-review your own submission." };
  }
  if (isStudentRole(actorRole) && systemRole !== "mentor") {
    return { allowed: false, reason: "Students cannot approve submissions. Faculty mentors review student work." };
  }
  if (actorRole === "faculty" || systemRole === "mentor") {
    return { allowed: true, reason: "Faculty or assigned mentors may review submissions." };
  }
  return { allowed: false, reason: "You are not authorized to review this submission." };
}

export function canStudentUpdateTask(input: {
  actorId: string;
  actorRole?: PlatformRole | string | null;
  isProjectOwner: boolean;
  task: Pick<Task, "assignedTo" | "createdBy">;
  changingAssignee?: boolean;
}): { allowed: boolean; reason: string } {
  const { actorId, actorRole, isProjectOwner, task, changingAssignee } = input;
  if (isProjectOwner) {
    return { allowed: true, reason: "Project owners may coordinate team tasks." };
  }
  if (isStudentRole(actorRole)) {
    if (changingAssignee) {
      return { allowed: false, reason: "Students cannot reassign another student's tasks." };
    }
    if (task.assignedTo && task.assignedTo !== actorId && task.createdBy !== actorId) {
      return { allowed: false, reason: "You can only update your own assigned tasks." };
    }
    return { allowed: true, reason: "You may update the status of your assigned work." };
  }
  return { allowed: true, reason: "Authorized team coordinator." };
}

export function evaluateStudentChallengeApplication(input: {
  role?: PlatformRole | string | null;
  userId?: string | null;
  collegeId?: string | null;
  challenge: IndustryChallenge;
  alreadyApplied: boolean;
}): ApplicationGate {
  const { role, userId, collegeId, challenge, alreadyApplied } = input;
  if (!userId) return { eligible: false, reason: "Sign in as a student to apply." };
  if (!isStudentRole(role)) {
    return { eligible: false, reason: "Only students may submit team pitches to industry challenges." };
  }
  if (challenge.status !== "open") {
    return { eligible: false, reason: "This challenge is not open for applications." };
  }
  if (challenge.targetCollegeId && collegeId && challenge.targetCollegeId !== collegeId) {
    return { eligible: false, reason: "This challenge is restricted to another college's students." };
  }
  if (alreadyApplied) {
    return { eligible: false, reason: "You already submitted a pitch for this challenge." };
  }
  return { eligible: true, reason: "You can apply to this industry opportunity." };
}

export function studentCannotChangeRole(): { allowed: false; reason: string } {
  return {
    allowed: false,
    reason: "Students cannot change their role to Faculty, Industry, College Admin, or Platform Owner.",
  };
}

export const STUDENT_GUIDELINES_PATH = "/student-guidelines";
