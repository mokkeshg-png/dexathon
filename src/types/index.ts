export type PlatformRole = "student" | "faculty" | "admin";
export type AccountStatus = "active" | "suspended" | "deleted";
export type Proficiency = "beginner" | "intermediate" | "advanced";
export type ProfileVisibility = "public" | "members" | "institution" | "private";
export type ProjectVisibility = "public" | "private" | "restricted";
export type ProjectStatus = "open" | "closed" | "completed" | "flagged" | "removed";
export type Difficulty = "beginner" | "intermediate" | "advanced";
export type JoinStatus = "pending" | "accepted" | "rejected" | "withdrawn";
export type InvitationStatus = "pending" | "accepted" | "declined" | "expired";
export type MemberStatus = "invited" | "active" | "left" | "removed" | "declined";
export type SystemRole = "owner" | "mentor" | "lead" | "member";
export type TaskStatus = "todo" | "in_progress" | "review" | "completed";
export type TaskPriority = "low" | "medium" | "high" | "critical";
export type AiConfidence = "high" | "medium" | "low";
export type NotificationType =
  | "join_request"
  | "application_accepted"
  | "application_rejected"
  | "project_invitation"
  | "task_assigned"
  | "task_deadline"
  | "new_team_member"
  | "project_update"
  | "ai_recommendation"
  | "github_activity"
  | "mentor_feedback"
  | "mention"
  | "details_request"
  | "mentorship_request"
  | "direct_collaboration_request"
  | "direct_collaboration_accepted"
  | "weekly_submission"
  | "consistency_alert";
export type ReportType =
  | "fake_profile"
  | "spam"
  | "harassment"
  | "misleading_project"
  | "inappropriate_content"
  | "suspicious_activity"
  | "other";
export type ReportStatus = "pending" | "resolved" | "dismissed";
export type ModerationAction = "warn" | "suspend" | "remove_content" | "escalate" | "dismiss";
export type NoteCategory = "literature" | "experiment" | "meeting" | "idea";
export type DocumentAccess = "members" | "owner_mentor";
export type ProjectType =
  | "Academic Project"
  | "Research Project"
  | "Final-Year Project"
  | "Hackathon"
  | "Innovation Project"
  | "Open-Source"
  | "Publication-Oriented"
  | "Faculty-Led Research"
  | "Interdisciplinary";

export const PROJECT_TYPES: ProjectType[] = [
  "Academic Project",
  "Research Project",
  "Final-Year Project",
  "Hackathon",
  "Innovation Project",
  "Open-Source",
  "Publication-Oriented",
  "Faculty-Led Research",
  "Interdisciplinary",
];

export const ROLE_TEMPLATES = [
  { name: "Frontend Developer", description: "Builds responsive, accessible, user-facing interfaces and components." },
  { name: "Backend Developer", description: "Designs RESTful APIs, database schemas, authentication, and core services." },
  { name: "Full Stack Developer", description: "Builds end-to-end web architectures, APIs, and client interfaces." },
  { name: "UI/UX Designer", description: "Designs intuitive user journeys, wireframes, and design systems." },
  { name: "AI/ML Developer", description: "Builds, trains, fine-tunes, and deploys machine learning models." },
  { name: "Cybersecurity Developer", description: "Implements security protocols, vulnerability testing, and audit logs." },
  { name: "Cloud Engineer", description: "Manages cloud infrastructure, containerization, and CI/CD pipelines." },
  { name: "Faculty Mentor", description: "Provides academic oversight, research direction, and milestone evaluation." },
  { name: "Project Lead", description: "Leads execution, timeline coordination, and deliverable handoffs." },
  { name: "Researcher", description: "Designs experimental studies, reviews literature, and analyzes findings." },
  { name: "Data Scientist", description: "Prepares datasets, cleans telemetry, and performs statistical analysis." },
  { name: "Research Writer", description: "Drafts academic paper manuscripts, methodology reports, and documentation." },
  { name: "Reviewer", description: "Reviews code, papers, and artifacts for quality and academic rigor." },
] as const;

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: PlatformRole;
  emailVerified: boolean;
  verificationToken?: string;
  resetToken?: string;
  status: AccountStatus;
  lastActiveAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSkill {
  skill: string;
  proficiency: Proficiency;
}

export type ProjectStatusType = "completed" | "in_progress" | "open_source" | "deployed" | "archived";

export interface PastProject {
  id: string;
  title: string;
  description: string;
  year?: number;
  role?: string;
  technologies?: string[];
  images?: string[];
  githubUrl?: string;
  liveUrl?: string;
  status?: ProjectStatusType;
  featured?: boolean;
  startDate?: string;
  endDate?: string;
}

export type EmploymentType = "Internship" | "Full-time" | "Part-time" | "Research Fellow" | "Contract" | "Apprenticeship";

export interface Internship {
  id: string;
  organization: string;
  role: string;
  description: string;
  employmentType?: EmploymentType;
  duration?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  location?: string;
  technologies?: string[];
  mediaUrl?: string;
  mediaCaption?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  year?: number;
  issueDate?: string;
  expirationDate?: string;
  credentialId?: string;
  verificationUrl?: string;
  certificateUrl?: string;
  mediaType?: "image" | "pdf";
}

export interface Publication {
  id: string;
  title: string;
  venue: string;
  year: number;
  link?: string;
}

export interface UserEducation {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  startYear?: number;
  endYear?: number;
  grade?: string;
  activities?: string;
  description?: string;
}

export type AchievementCategory = "hackathon" | "award" | "scholarship" | "competition" | "honor";

export interface UserAchievement {
  id: string;
  title: string;
  category: AchievementCategory;
  issuer: string;
  date: string;
  rank?: string;
  description: string;
  projectLink?: string;
  proofUrl?: string;
}

export type PostCategory = "update" | "project_showcase" | "achievement" | "launch" | "certificate";

export interface PostComment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
}

export interface PortfolioPost {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  authorAvatar?: string;
  authorInstitution: string;
  authorDepartment?: string;
  category: PostCategory;
  content: string;
  mediaUrls?: string[];
  projectRef?: {
    id?: string;
    title: string;
    technologies?: string[];
    link?: string;
    githubUrl?: string;
  };
  certificateRef?: {
    title: string;
    issuer: string;
    certUrl?: string;
  };
  likesCount: number;
  likedBy: string[];
  comments: PostComment[];
  createdAt: string;
  pinned?: boolean;
}

export interface Profile {
  id: string;
  userId: string;
  email: string;
  role: PlatformRole;
  fullName: string;
  headline?: string;
  coverPhotoUrl?: string;
  photoUrl?: string;
  institution: string;
  department: string;
  phone?: string;
  location?: string;
  bio?: string;
  visibility: ProfileVisibility;
  profileCompleteness: number;
  skills: UserSkill[];
  interests: string[];
  programmingLanguages: string[];
  pastProjects: PastProject[];
  internships: Internship[];
  certifications: Certification[];
  publications: Publication[];
  education?: UserEducation[];
  achievements?: UserAchievement[];
  githubUsername?: string;
  githubConnected: boolean;
  linkedinUrl?: string;
  portfolioUrl?: string;
  resumeUrl?: string;
  availabilityHours?: number;
  preferredRoles: string[];
  preferredTeamSize?: number;
  degreeProgram?: string;
  academicYear?: number;
  graduationYear?: number;
  designation?: string;
  subjectsTaught: string[];
  teachingAreas: string[];
  academicExperience?: number;
  researchExperience?: number;
  researchDomains: string[];
  expertise: string[];
  googleScholar?: string;
  orcid?: string;
  researchgate?: string;
  openToCollaboration: boolean;
  openToMentoring: boolean;
  preferredProjectTypes: ProjectType[];
  classSection?: string;
  domain?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectRole {
  id: string;
  name: string;
  description: string;
  requiredSkills: string[];
  openings: number;
}

export interface Project {
  id: string;
  ownerId: string;
  title: string;
  shortDescription: string;
  detailedDescription: string;
  problemStatement?: string;
  objectives: string[];
  domains: string[];
  interests: string[];
  requiredSkills: string[];
  roles: ProjectRole[];
  teamMin: number;
  teamMax: number;
  duration?: string;
  difficulty: Difficulty;
  type: ProjectType;
  visibility: ProjectVisibility;
  deadline?: string;
  expectedOutcomes?: string;
  mentorRequired: boolean;
  githubRequired: boolean;
  tags: string[];
  status: ProjectStatus;
  githubRepo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  systemRole: SystemRole;
  roleId?: string;
  status: MemberStatus;
  createdAt: string;
}

export interface JoinRequest {
  id: string;
  projectId: string;
  applicantId: string;
  selectedRoleId: string;
  motivation: string;
  relevantExperience: string;
  message?: string;
  status: JoinStatus;
  rejectReason?: string;
  analysis?: CompatibilityAnalysis;
  createdAt: string;
  updatedAt: string;
}

export interface Invitation {
  id: string;
  projectId: string;
  inviterId: string;
  inviteeId: string;
  roleId?: string;
  message?: string;
  status: InvitationStatus;
  createdAt: string;
}

export interface DetailsRequest {
  id: string;
  projectId: string;
  userId: string;
  status: "pending" | "granted" | "denied";
  createdAt: string;
}

export interface MentorshipRequest {
  id: string;
  projectId?: string;
  studentId?: string;
  facultyId: string;
  message: string;
  topic?: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  updatedAt?: string;
}

export interface AiStrength {
  category: string;
  evidence: string;
  impact: string;
}

export interface AiGap {
  category: string;
  gap: string;
  severity: "low" | "medium" | "high";
  evidence: string;
}

export interface AiRecommendation {
  priority: "low" | "medium" | "high";
  action: string;
  reason: string;
}

export interface AiScoreBreakdown {
  factor: string;
  score: number;
  max_score: number;
  explanation: string;
}

export interface AiProjectFitResult {
  match_score: number;
  summary: string;
  confidence: "high" | "medium" | "low";
  strengths: AiStrength[];
  gaps: AiGap[];
  recommendations: AiRecommendation[];
  score_breakdown?: AiScoreBreakdown[];
}

export interface AiAnalysisRecord {
  id: string;
  type: "compatibility" | "team_recommendation" | "skill_gap" | "project_summary";
  project_id: string;
  user_id: string;
  input_context?: Record<string, unknown>;
  output_result: AiProjectFitResult;
  model_used?: string;
  confidence?: "high" | "medium" | "low";
  created_at: string;
  expires_at?: string | null;
}

export interface CompatibilityAnalysis {
  compatibilityScore: number;
  skillMatch: number;
  interestMatch: number;
  roleMatch: number;
  experienceMatch: number;
  strengths: string[];
  gaps: string[];
  reason: string;
  confidence: AiConfidence;
  evidence: string[];
  disclaimer: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  assignedTo?: string;
  roleId?: string;
  priority: TaskPriority;
  deadline?: string;
  status: TaskStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  body: string;
  createdAt: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  dueDate?: string;
  completed: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  projectId?: string;
  userId: string;
  type: string;
  message: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: string;
}

export interface ResearchNote {
  id: string;
  projectId: string;
  title: string;
  content: string;
  category: NoteCategory;
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReferenceItem {
  id: string;
  projectId: string;
  title: string;
  authors: string;
  year: number;
  venue: string;
  link?: string;
  notes?: string;
  tags: string[];
  addedBy: string;
  createdAt: string;
}

export interface ExperimentRecord {
  id: string;
  projectId: string;
  name: string;
  objective: string;
  method: string;
  results: string;
  conclusion: string;
  date: string;
  createdBy: string;
}

export interface MeetingNote {
  id: string;
  projectId: string;
  date: string;
  attendees: string[];
  agenda: string;
  decisions: string;
  actionItems: string;
  createdBy: string;
}

export interface DatasetInfo {
  id: string;
  projectId: string;
  name: string;
  description: string;
  source?: string;
  license?: string;
  createdBy: string;
}

export interface DocumentItem {
  id: string;
  projectId: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  access: DocumentAccess;
  uploadedBy: string;
  createdAt: string;
}

export interface Discussion {
  id: string;
  projectId: string;
  title: string;
  body: string;
  createdBy: string;
  createdAt: string;
}

export interface DiscussionReply {
  id: string;
  discussionId: string;
  userId: string;
  body: string;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  targetType: "user" | "project";
  targetId: string;
  type: ReportType;
  details: string;
  status: ReportStatus;
  action?: ModerationAction;
  createdAt: string;
  resolvedAt?: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  action: string;
  target: string;
  details: string;
  createdAt: string;
}

export interface AiCallLog {
  id: string;
  type: string;
  success: boolean;
  createdAt: string;
}

export interface TeamRecommendation {
  role: string;
  candidateId: string;
  candidateName: string;
  compatibilityScore: number;
  reason: string;
}

export interface AppState {
  users: User[];
  profiles: Profile[];
  projects: Project[];
  members: ProjectMember[];
  joinRequests: JoinRequest[];
  invitations: Invitation[];
  detailsRequests: DetailsRequest[];
  mentorshipRequests: MentorshipRequest[];
  tasks: Task[];
  taskComments: TaskComment[];
  milestones: Milestone[];
  activity: ActivityLog[];
  notifications: Notification[];
  notes: ResearchNote[];
  references: ReferenceItem[];
  experiments: ExperimentRecord[];
  meetings: MeetingNote[];
  datasets: DatasetInfo[];
  documents: DocumentItem[];
  discussions: Discussion[];
  replies: DiscussionReply[];
  reports: Report[];
  auditLogs: AuditLog[];
  aiLogs: AiCallLog[];
  sessionUserId: string | null;
}

export const AI_DISCLAIMER =
  "This is an AI-estimated compatibility score, not an objective measurement of ability. AI recommends; humans decide.";

/** Skill Score Engine Types */

export type SkillEvidenceStatus = "SUPPORTED" | "PARTIALLY_SUPPORTED" | "UNVERIFIED" | "INSUFFICIENT_EVIDENCE";

export interface SkillEvidenceItem {
  /** The claimed skill name */
  skill: string;
  /** Self-declared proficiency level */
  claimedLevel: Proficiency;
  /** 0–100 evidence confidence score */
  confidenceScore: number;
  /** Categorical evidence status */
  status: SkillEvidenceStatus;
  /** Human-readable evidence sources that support this skill */
  supportingEvidence: string[];
  /** Human-readable note about what is missing */
  gapNote?: string;
}

export interface SkillScoreBreakdown {
  /** Score for listed skills weighted by evidence: 0–20 */
  skillEvidence: number;
  /** Score from past projects matching skills: 0–25 */
  projectEvidence: number;
  /** Score from GitHub profile connectivity and activity: 0–20 */
  githubEvidence: number;
  /** Score from internships/experience descriptions: 0–15 */
  experienceEvidence: number;
  /** Score from certifications: 0–10 */
  certificationEvidence: number;
  /** Score for consistency across sources: 0–5 */
  consistencyScore: number;
  /** Bonus for academic publications: 0–5 */
  publicationBonus: number;
}

export interface SkillScoreAnalysis {
  /** Validated overall score 0–100 */
  overallScore: number;
  /** Category-level breakdown */
  breakdown: SkillScoreBreakdown;
  /** Per-skill evidence analysis */
  skillEvidence: SkillEvidenceItem[];
  /** Human-readable strengths */
  strengths: string[];
  /** Human-readable improvement areas */
  improvementAreas: string[];
  /** Narrative summary */
  summary: string;
  /** Evidence confidence label */
  confidence: AiConfidence;
  /** ISO timestamp of when this analysis was generated */
  analyzedAt: string;
  /** Model/engine version that generated this */
  modelVersion: string;
}

export interface SkillScoreRecord {
  id: string;
  profileId: string;
  overallScore: number;
  breakdown: SkillScoreBreakdown;
  skillEvidence: SkillEvidenceItem[];
  strengths: string[];
  improvementAreas: string[];
  summary: string;
  confidence: AiConfidence;
  analyzedAt: string;
  modelVersion: string;
}

export const SKILL_SCORE_DISCLAIMER =
  "This AI Skill Score is an evidence-based estimate using your profile data. It is not a certified assessment of your abilities. Self-reported data cannot be independently verified. The score reflects evidence consistency, not guaranteed real-world proficiency.";

export interface ProjectMonitoringAnalysis {
  healthScore: number;
  phase: string;
  progressPercentage: number;
  roleProgress: Array<{
    roleName: string;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    percentage: number;
  }>;
  collaborationGaps: Array<{
    id: string;
    type: "dependency" | "contribution" | "unresolved_discussion" | "knowledge_silo";
    severity: "critical" | "moderate" | "low";
    title: string;
    description: string;
    impact: string;
    recommendation: string;
  }>;
  discussionAnalysis: {
    topicsDiscussed: Array<{ topic: string; messageCount: number }>;
    decisionsMade: string[];
    problemsIdentified: string[];
    unresolvedDiscussions: Array<{ id: string; title: string; ageDays: number; reason: string }>;
    nextActions: Array<{ action: string; assigneeRole?: string }>;
  };
  memberContributions: Array<{
    userId: string;
    fullName: string;
    roleName: string;
    systemRole: string;
    tasksTotal: number;
    tasksCompleted: number;
    discussionsStarted: number;
    repliesSent: number;
    documentsUploaded: number;
    notesAuthored: number;
    contributionScore: number;
    activityLevel: "High" | "Medium" | "Low" | "Missing Activity";
    trend: "increasing" | "steady" | "decreasing";
    alert?: string;
  }>;
  knowledgeExchange: {
    exchanges: Array<{ fromRole: string; toRole: string; count: number; topics: string[] }>;
    isolatedMembers: Array<{ userId: string; fullName: string; roleName: string }>;
  };
  documentConsistency: {
    problemStatementCoverage: {
      coveredKeywords: string[];
      uncoveredObjectives: string[];
    };
    consistencyIssues: Array<{
      issue: string;
      severity: "high" | "medium" | "low";
      recommendation: string;
    }>;
  };
  collectiveSummary: {
    whatCompleted: string[];
    whatDiscussed: string[];
    whatLearned: string[];
    whatRemains: string[];
    criticalAlerts: string[];
  };
}

/** Direct Student-to-Student Collaboration & Private 1-to-1 Messaging */
export type DirectCollaborationStatus = "pending" | "accepted" | "rejected" | "ended" | "cancelled";

export interface DirectCollaborationRequest {
  id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  receiverName: string;
  senderRole?: string;
  receiverRole?: string;
  roleRequested?: string;
  domain?: string;
  message: string;
  status: DirectCollaborationStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface DirectConversation {
  id: string;
  participantIds: [string, string];
  collaborationRequestId?: string;
  status: "active" | "closed" | "ended";
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
  lastMessageAt?: string;
}

/** Student Project Workspace Weekly Submissions */
export interface WeeklySubmission {
  id: string;
  projectId: string;
  studentId: string;
  studentName: string;
  roleName: string;
  weekNumber: number;
  title: string;
  summary: string;
  deliverables: Array<{
    title: string;
    type: "code" | "document" | "design" | "report";
    url: string;
  }>;
  blockers?: string;
  facultyQuestions?: string;
  facultyFeedback?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  submittedAt: string;
}

/** AI Technical Consistency Checks */
export interface TechnicalConsistencyFinding {
  id: string;
  projectId: string;
  category:
    | "api_mismatch"
    | "inconsistent_contract"
    | "missing_dependency"
    | "conflicting_requirements"
    | "missing_deliverable";
  severity: "critical" | "warning" | "advisory";
  title: string;
  evidence: string;
  affectedComponent: string;
  suggestedAction: string;
  isVerifiedFailure: boolean;
  detectedAt: string;
}

/** Faculty Academic Project Setup */
export interface FacultyTeamAssignment {
  teamName: string;
  students: Array<{
    userId: string;
    fullName: string;
    roleName: string;
    isLead: boolean;
  }>;
}

