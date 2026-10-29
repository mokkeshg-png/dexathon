import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  fetchProfile,
  fetchProjects,
  saveProfile,
  inviteUser,
  fileReport,
  fetchUserPosts,
  createPortfolioPost,
  deletePortfolioPost,
  togglePostLike,
  addPostComment,
  sendDirectCollaborationRequest,
  requestMentorship,
} from "@/lib/supabase-db";
import { uploadMedia } from "@/lib/storage";
import { Button } from "@/components/ui/Button";
import { Card, Badge, EmptyState } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Textarea, Select } from "@/components/ui/Field";
import { SkillSelector } from "@/components/ui/SkillSelector";
import { TagSelector } from "@/components/ui/TagSelector";
import { RESEARCH_DOMAINS } from "@/lib/taxonomies";
import type {
  Profile as ProfileType,
  Project,
  ReportType,
  ProfileVisibility,
  UserSkill,
  PastProject,
  Internship,
  Certification,
  UserEducation,
  UserAchievement,
  PortfolioPost,
  PostCategory,
  ProjectStatusType,
  EmploymentType,
} from "@/types";
import { ROLE_TEMPLATES } from "@/types";
import {
  Building2,
  Globe,
  Mail,
  Edit,
  ShieldCheck,
  Flag,
  Lock,
  Loader2,
  Award,
  BookOpen,
  GraduationCap,
  Trash2,
  Plus,
  FileText,
  Share2,
  ExternalLink,
  Github,
  Linkedin,
  Sparkles,
  UserCheck,
  Sliders,
  Camera,
  FolderGit2,
  Trophy,
  Layers,
  MapPin,
  Clock,
  Search,
  Filter,
  Eye,
  UserPlus,
  Star,
  Bell,
  Target,
} from "lucide-react";
import { SkillScorePanel } from "@/components/ai/SkillScorePanel";
import { MediaUploadZone } from "@/components/portfolio/MediaUploadZone";
import { MediaViewerModal } from "@/components/portfolio/MediaViewerModal";
import { PostCard } from "@/components/portfolio/PostCard";
import { CreatePostModal } from "@/components/portfolio/CreatePostModal";
import { ProjectCard } from "@/components/portfolio/ProjectCard";

type ActiveTab = "overview" | "projects" | "experience" | "certifications" | "activity";

export function Profile() {
  const { id } = useParams<{ id: string }>();
  const { user, profile: authProfile, refresh } = useAuth();
  const toast = useToast();

  const targetUserId = id || user?.id;

  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [ownedProjects, setOwnedProjects] = useState<Project[]>([]);
  const [posts, setPosts] = useState<PortfolioPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");

  // Media Lightbox State
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerTitle, setViewerTitle] = useState<string>("Document Preview");

  const openViewer = (url: string, title = "Media Preview") => {
    setViewerUrl(url);
    setViewerTitle(title);
    setViewerOpen(true);
  };

  // Avatar and Cover Photo inline uploads
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Edit Profile Modal
  const [editOpen, setEditOpen] = useState(false);
  const [editTab, setEditTab] = useState<"about" | "academic" | "links" | "preferences">("about");
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [coverPhotoUrl, setCoverPhotoUrl] = useState("");
  const [department, setDepartment] = useState("");
  const [degreeProgram, setDegreeProgram] = useState("");
  const [academicYear, setAcademicYear] = useState<number | undefined>(undefined);
  const [graduationYear, setGraduationYear] = useState<number | undefined>(undefined);
  const [resumeUrl, setResumeUrl] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [availabilityHours, setAvailabilityHours] = useState(15);
  const [openToCollaboration, setOpenToCollaboration] = useState(true);
  const [openToMentoring, setOpenToMentoring] = useState(false);
  const [visibility, setVisibility] = useState<ProfileVisibility>("public");
  const [designation, setDesignation] = useState("");
  const [researchExperience, setResearchExperience] = useState<number | undefined>(undefined);
  const [academicExperience, setAcademicExperience] = useState<number | undefined>(undefined);
  const [googleScholar, setGoogleScholar] = useState("");
  const [orcid, setOrcid] = useState("");
  const [researchgate, setResearchgate] = useState("");
  const [saving, setSaving] = useState(false);

  // Skills & Interests Modals
  const [manageSkillsOpen, setManageSkillsOpen] = useState(false);
  const [tempSkills, setTempSkills] = useState<UserSkill[]>([]);
  const [savingSkills, setSavingSkills] = useState(false);

  const [manageInterestsOpen, setManageInterestsOpen] = useState(false);
  const [tempInterests, setTempInterests] = useState<string[]>([]);
  const [savingInterests, setSavingInterests] = useState(false);

  // Add / Edit Project Modal
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projTitle, setProjTitle] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projRole, setProjRole] = useState("");
  const [projTechInput, setProjTechInput] = useState("");
  const [projTechList, setProjTechList] = useState<string[]>([]);
  const [projStatus, setProjStatus] = useState<ProjectStatusType>("completed");
  const [projYear, setProjYear] = useState<number>(new Date().getFullYear());
  const [projGithub, setProjGithub] = useState("");
  const [projLive, setProjLive] = useState("");
  const [projImages, setProjImages] = useState<string[]>([]);
  const [savingProject, setSavingProject] = useState(false);

  // Add / Edit Certificate Modal
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [editingCertId, setEditingCertId] = useState<string | null>(null);
  const [certName, setCertName] = useState("");
  const [certIssuer, setCertIssuer] = useState("");
  const [certIssueDate, setCertIssueDate] = useState("");
  const [certCredentialId, setCertCredentialId] = useState("");
  const [certVerifyUrl, setCertVerifyUrl] = useState("");
  const [certMediaUrl, setCertMediaUrl] = useState("");
  const [savingCert, setSavingCert] = useState(false);

  // Add / Edit Experience Modal
  const [expModalOpen, setExpModalOpen] = useState(false);
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [expOrg, setExpOrg] = useState("");
  const [expRole, setExpRole] = useState("");
  const [expType, setExpType] = useState<EmploymentType>("Internship");
  const [expDuration, setExpDuration] = useState("");
  const [expLocation, setExpLocation] = useState("");
  const [expDesc, setExpDesc] = useState("");
  const [expTechList, setExpTechList] = useState<string[]>([]);
  const [expMediaUrl, setExpMediaUrl] = useState("");
  const [savingExp, setSavingExp] = useState(false);

  // Add / Edit Education Modal
  const [eduModalOpen, setEduModalOpen] = useState(false);
  const [editingEduId, setEditingEduId] = useState<string | null>(null);
  const [eduInst, setEduInst] = useState("");
  const [eduDegree, setEduDegree] = useState("");
  const [eduField, setEduField] = useState("");
  const [eduStartYear, setEduStartYear] = useState<number>(2023);
  const [eduEndYear, setEduEndYear] = useState<number>(2027);
  const [eduGrade, setEduGrade] = useState("");
  const [eduActivities, setEduActivities] = useState("");
  const [savingEdu, setSavingEdu] = useState(false);

  // Add / Edit Achievement Modal
  const [achieveModalOpen, setAchieveModalOpen] = useState(false);
  const [achieveTitle, setAchieveTitle] = useState("");
  const [achieveCategory, setAchieveCategory] = useState<UserAchievement["category"]>("hackathon");
  const [achieveIssuer, setAchieveIssuer] = useState("");
  const [achieveDate, setAchieveDate] = useState("");
  const [achieveRank, setAchieveRank] = useState("");
  const [achieveDesc, setAchieveDesc] = useState("");
  const [achieveLink, setAchieveLink] = useState("");
  const [savingAchieve, setSavingAchieve] = useState(false);

  // Create Post Modal
  const [createPostOpen, setCreatePostOpen] = useState(false);

  // Invite & Report Modals
  const [inviteOpen, setInviteOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [inviteMsg, setInviteMsg] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportType, setReportType] = useState<ReportType>("fake_profile");
  const [reportDetails, setReportDetails] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

  // Direct Collaboration & Mentorship Modals (Req 1 & 7)
  const [directCollabOpen, setDirectCollabOpen] = useState(false);
  const [directCollabRole, setDirectCollabRole] = useState("Frontend Developer");
  const [directCollabMsg, setDirectCollabMsg] = useState("");
  const [sendingDirectCollab, setSendingDirectCollab] = useState(false);

  const [mentorshipOpen, setMentorshipOpen] = useState(false);
  const [mentorTopic, setMentorTopic] = useState("");
  const [mentorMsg, setMentorMsg] = useState("");
  const [sendingMentorship, setSendingMentorship] = useState(false);

  // Search & Filter state for Projects tab
  const [projectSearch, setProjectSearch] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState<string>("all");

  // Load Profile & Posts
  useEffect(() => {
    if (!targetUserId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      const [prof, projs, userPosts] = await Promise.all([
        fetchProfile(targetUserId!),
        user ? fetchProjects() : Promise.resolve([]),
        fetchUserPosts(targetUserId!),
      ]);

      if (cancelled) return;
      setProfile(prof);
      setPosts(userPosts);

      if (user && projs) {
        setOwnedProjects(projs.filter((p) => p.ownerId === user.id && p.status === "open"));
      }

      if (prof) {
        setFullName(prof.fullName || "");
        setHeadline(prof.headline || "");
        setBio(prof.bio ?? "");
        setPhotoUrl(prof.photoUrl ?? "");
        setCoverPhotoUrl(prof.coverPhotoUrl ?? "");
        setDepartment(prof.department ?? "");
        setDegreeProgram(prof.degreeProgram ?? "");
        setAcademicYear(prof.academicYear);
        setGraduationYear(prof.graduationYear);
        setResumeUrl(prof.resumeUrl ?? "");
        setGithubUsername(prof.githubUsername ?? "");
        setLinkedinUrl(prof.linkedinUrl ?? "");
        setPortfolioUrl(prof.portfolioUrl ?? "");
        setAvailabilityHours(prof.availabilityHours ?? 15);
        setOpenToCollaboration(prof.openToCollaboration ?? true);
        setOpenToMentoring(prof.openToMentoring ?? false);
        setVisibility((prof.visibility as ProfileVisibility) || "public");

        setDesignation(prof.designation ?? "");
        setResearchExperience(prof.researchExperience);
        setAcademicExperience(prof.academicExperience);
        setGoogleScholar(prof.googleScholar ?? "");
        setOrcid(prof.orcid ?? "");
        setResearchgate(prof.researchgate ?? "");
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [targetUserId, user]);

  const isSelf = user?.id === profile?.userId;
  const isAdmin = authProfile?.role === "admin";

  // Quick Avatar Upload
  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || !e.target.files[0]) return;
    setUploadingAvatar(true);
    try {
      const res = await uploadMedia(e.target.files[0], user.id, {
        bucket: "avatars",
        folder: "avatars",
        allowedTypes: ["image/jpeg", "image/png", "image/webp"],
      });
      await saveProfile(user.id, { photoUrl: res.url });
      setProfile((prev) => (prev ? { ...prev, photoUrl: res.url } : null));
      await refresh();
      toast.success("Profile photo updated", "Your new avatar is live across SYNAPTRA.");
    } catch (err: any) {
      toast.error("Avatar upload failed", err?.message);
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  // Quick Cover Photo Upload
  const handleCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || !e.target.files[0]) return;
    setUploadingCover(true);
    try {
      const res = await uploadMedia(e.target.files[0], user.id, {
        bucket: "documents",
        folder: `${user.id}/cover`,
        allowedTypes: ["image/jpeg", "image/png", "image/webp"],
      });
      await saveProfile(user.id, { coverPhotoUrl: res.url });
      setProfile((prev) => (prev ? { ...prev, coverPhotoUrl: res.url } : null));
      await refresh();
      toast.success("Cover banner updated", "Your portfolio header banner was saved.");
    } catch (err: any) {
      toast.error("Cover banner upload failed", err?.message);
    } finally {
      setUploadingCover(false);
      e.target.value = "";
    }
  };

  // Remove Profile Photo with confirmation
  const handleRemoveAvatar = async () => {
    if (!user) return;
    const confirmed = window.confirm(
      "Are you sure you want to remove your profile photo? The default institutional placeholder will be displayed."
    );
    if (!confirmed) return;

    setUploadingAvatar(true);
    try {
      await saveProfile(user.id, { photoUrl: "" });
      setProfile((prev) => (prev ? { ...prev, photoUrl: undefined } : null));
      setPhotoUrl("");
      await refresh();
      toast.info("Profile photo removed", "Your profile now displays the default avatar placeholder.");
    } catch (err: any) {
      toast.error("Failed to remove profile photo", err?.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Remove Cover Banner with confirmation
  const handleRemoveCover = async () => {
    if (!user) return;
    const confirmed = window.confirm(
      "Are you sure you want to remove your cover banner? The default institutional gradient will be restored."
    );
    if (!confirmed) return;

    setUploadingCover(true);
    try {
      await saveProfile(user.id, { coverPhotoUrl: "" });
      setProfile((prev) => (prev ? { ...prev, coverPhotoUrl: undefined } : null));
      setCoverPhotoUrl("");
      await refresh();
      toast.info("Cover banner removed", "Default header gradient is now displayed.");
    } catch (err: any) {
      toast.error("Failed to remove cover banner", err?.message);
    } finally {
      setUploadingCover(false);
    }
  };

  // Save General Profile Details
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const updatePayload: Partial<ProfileType> = {
        fullName: fullName.trim() || profile?.fullName,
        headline: headline.trim(),
        bio: bio.trim(),
        photoUrl: photoUrl.trim() || undefined,
        coverPhotoUrl: coverPhotoUrl.trim() || undefined,
        department: department.trim() || profile?.department,
        degreeProgram: degreeProgram.trim() || undefined,
        academicYear: academicYear ? Number(academicYear) : undefined,
        graduationYear: graduationYear ? Number(graduationYear) : undefined,
        resumeUrl: resumeUrl.trim() || undefined,
        githubUsername: githubUsername.trim() || undefined,
        githubConnected: !!githubUsername.trim(),
        linkedinUrl: linkedinUrl.trim() || undefined,
        portfolioUrl: portfolioUrl.trim() || undefined,
        availabilityHours: Number(availabilityHours),
        openToCollaboration,
        openToMentoring,
        visibility,
      };

      if (profile?.role === "faculty") {
        updatePayload.designation = designation.trim() || undefined;
        updatePayload.researchExperience = researchExperience ? Number(researchExperience) : undefined;
        updatePayload.academicExperience = academicExperience ? Number(academicExperience) : undefined;
        updatePayload.googleScholar = googleScholar.trim() || undefined;
        updatePayload.orcid = orcid.trim() || undefined;
        updatePayload.researchgate = researchgate.trim() || undefined;
      }

      await saveProfile(user.id, updatePayload);
      await refresh();
      const updated = await fetchProfile(user.id);
      if (updated) setProfile(updated);
      setEditOpen(false);
      toast.success("Profile updated successfully", "Your public portfolio details are now saved.");
    } catch (err: any) {
      toast.error("Failed to save profile", err?.message);
    } finally {
      setSaving(false);
    }
  };

  // Save Skills
  const handleSaveSkills = async () => {
    if (!user || !profile) return;
    setSavingSkills(true);
    try {
      await saveProfile(user.id, { skills: tempSkills });
      setProfile({ ...profile, skills: tempSkills });
      await refresh();
      setManageSkillsOpen(false);
      toast.success("Skills updated", `${tempSkills.length} skills saved to your portfolio.`);
    } catch (err: any) {
      toast.error("Failed to save skills", err?.message);
    } finally {
      setSavingSkills(false);
    }
  };

  // Save Interests
  const handleSaveInterests = async () => {
    if (!user || !profile) return;
    setSavingInterests(true);
    try {
      await saveProfile(user.id, { interests: tempInterests });
      setProfile({ ...profile, interests: tempInterests });
      await refresh();
      setManageInterestsOpen(false);
      toast.success("Interests updated", "Your research focus areas have been refreshed.");
    } catch (err: any) {
      toast.error("Failed to save interests", err?.message);
    } finally {
      setSavingInterests(false);
    }
  };

  // Project Add / Edit Handlers
  const openAddProject = () => {
    setEditingProjectId(null);
    setProjTitle("");
    setProjDesc("");
    setProjRole("");
    setProjTechList([]);
    setProjTechInput("");
    setProjStatus("completed");
    setProjYear(new Date().getFullYear());
    setProjGithub("");
    setProjLive("");
    setProjImages([]);
    setProjectModalOpen(true);
  };

  const openEditProject = (proj: PastProject) => {
    setEditingProjectId(proj.id);
    setProjTitle(proj.title);
    setProjDesc(proj.description || "");
    setProjRole(proj.role || "");
    setProjTechList(proj.technologies || []);
    setProjTechInput("");
    setProjStatus(proj.status || "completed");
    setProjYear(proj.year || new Date().getFullYear());
    setProjGithub(proj.githubUrl || "");
    setProjLive(proj.liveUrl || "");
    setProjImages(proj.images || []);
    setProjectModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !projTitle.trim()) return;
    setSavingProject(true);
    try {
      const currentProjects = profile.pastProjects || [];
      const newOrUpdated: PastProject = {
        id: editingProjectId || `proj-${Date.now()}`,
        title: projTitle.trim(),
        description: projDesc.trim(),
        role: projRole.trim() || undefined,
        technologies: projTechList,
        status: projStatus,
        year: Number(projYear),
        githubUrl: projGithub.trim() || undefined,
        liveUrl: projLive.trim() || undefined,
        images: projImages,
      };

      const updated = editingProjectId
        ? currentProjects.map((p) => (p.id === editingProjectId ? newOrUpdated : p))
        : [newOrUpdated, ...currentProjects];

      await saveProfile(user.id, { pastProjects: updated });
      setProfile({ ...profile, pastProjects: updated });
      await refresh();
      setProjectModalOpen(false);
      toast.success(
        editingProjectId ? "Project updated" : "Project added to portfolio",
        `"${newOrUpdated.title}" is saved.`
      );
    } catch (err: any) {
      toast.error("Could not save project", err?.message);
    } finally {
      setSavingProject(false);
    }
  };

  const handleDeleteProject = async (projId: string) => {
    if (!user || !profile) return;
    try {
      const updated = (profile.pastProjects || []).filter((p) => p.id !== projId);
      await saveProfile(user.id, { pastProjects: updated });
      setProfile({ ...profile, pastProjects: updated });
      await refresh();
      toast.info("Project removed", "Item was removed from your portfolio.");
    } catch (err: any) {
      toast.error("Failed to remove project", err?.message);
    }
  };

  // Certificate Add / Edit Handlers
  const openAddCertificate = () => {
    setEditingCertId(null);
    setCertName("");
    setCertIssuer("");
    setCertIssueDate(new Date().getFullYear().toString());
    setCertCredentialId("");
    setCertVerifyUrl("");
    setCertMediaUrl("");
    setCertModalOpen(true);
  };

  const openEditCertificate = (cert: Certification) => {
    setEditingCertId(cert.id);
    setCertName(cert.name);
    setCertIssuer(cert.issuer);
    setCertIssueDate(cert.issueDate || cert.year?.toString() || "");
    setCertCredentialId(cert.credentialId || "");
    setCertVerifyUrl(cert.verificationUrl || "");
    setCertMediaUrl(cert.certificateUrl || "");
    setCertModalOpen(true);
  };

  const handleSaveCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !certName.trim() || !certIssuer.trim()) return;
    setSavingCert(true);
    try {
      const currentCerts = profile.certifications || [];
      const newOrUpdated: Certification = {
        id: editingCertId || `cert-${Date.now()}`,
        name: certName.trim(),
        issuer: certIssuer.trim(),
        issueDate: certIssueDate.trim() || undefined,
        year: parseInt(certIssueDate) || new Date().getFullYear(),
        credentialId: certCredentialId.trim() || undefined,
        verificationUrl: certVerifyUrl.trim() || undefined,
        certificateUrl: certMediaUrl.trim() || undefined,
        mediaType: certMediaUrl.toLowerCase().includes(".pdf") ? "pdf" : "image",
      };

      const updated = editingCertId
        ? currentCerts.map((c) => (c.id === editingCertId ? newOrUpdated : c))
        : [newOrUpdated, ...currentCerts];

      await saveProfile(user.id, { certifications: updated });
      setProfile({ ...profile, certifications: updated });
      await refresh();
      setCertModalOpen(false);
      toast.success(
        editingCertId ? "Certification updated" : "Certification added",
        `Verified credential "${newOrUpdated.name}" saved.`
      );
    } catch (err: any) {
      toast.error("Could not save certification", err?.message);
    } finally {
      setSavingCert(false);
    }
  };

  const handleDeleteCertificate = async (certId: string) => {
    if (!user || !profile) return;
    try {
      const updated = (profile.certifications || []).filter((c) => c.id !== certId);
      await saveProfile(user.id, { certifications: updated });
      setProfile({ ...profile, certifications: updated });
      await refresh();
      toast.info("Certification removed");
    } catch (err: any) {
      toast.error("Failed to delete certification", err?.message);
    }
  };

  // Experience Add / Edit Handlers
  const openAddExperience = () => {
    setEditingExpId(null);
    setExpOrg("");
    setExpRole("");
    setExpType("Internship");
    setExpDuration("");
    setExpLocation("");
    setExpDesc("");
    setExpTechList([]);
    setExpMediaUrl("");
    setExpModalOpen(true);
  };

  const openEditExperience = (exp: Internship) => {
    setEditingExpId(exp.id);
    setExpOrg(exp.organization);
    setExpRole(exp.role);
    setExpType(exp.employmentType || "Internship");
    setExpDuration(exp.duration || "");
    setExpLocation(exp.location || "");
    setExpDesc(exp.description || "");
    setExpTechList(exp.technologies || []);
    setExpMediaUrl(exp.mediaUrl || "");
    setExpModalOpen(true);
  };

  const handleSaveExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !expOrg.trim() || !expRole.trim()) return;
    setSavingExp(true);
    try {
      const currentExp = profile.internships || [];
      const newOrUpdated: Internship = {
        id: editingExpId || `exp-${Date.now()}`,
        organization: expOrg.trim(),
        role: expRole.trim(),
        employmentType: expType,
        duration: expDuration.trim() || undefined,
        location: expLocation.trim() || undefined,
        description: expDesc.trim(),
        technologies: expTechList,
        mediaUrl: expMediaUrl.trim() || undefined,
      };

      const updated = editingExpId
        ? currentExp.map((i) => (i.id === editingExpId ? newOrUpdated : i))
        : [newOrUpdated, ...currentExp];

      await saveProfile(user.id, { internships: updated });
      setProfile({ ...profile, internships: updated });
      await refresh();
      setExpModalOpen(false);
      toast.success(
        editingExpId ? "Experience updated" : "Experience added",
        `Saved ${newOrUpdated.role} at ${newOrUpdated.organization}.`
      );
    } catch (err: any) {
      toast.error("Failed to save experience", err?.message);
    } finally {
      setSavingExp(false);
    }
  };

  const handleDeleteExperience = async (expId: string) => {
    if (!user || !profile) return;
    try {
      const updated = (profile.internships || []).filter((i) => i.id !== expId);
      await saveProfile(user.id, { internships: updated });
      setProfile({ ...profile, internships: updated });
      await refresh();
      toast.info("Experience removed");
    } catch (err: any) {
      toast.error("Failed to remove experience", err?.message);
    }
  };

  // Education Handlers
  const handleSaveEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !eduInst.trim() || !eduDegree.trim()) return;
    setSavingEdu(true);
    try {
      const currentEdu = profile.education || [];
      const newEdu: UserEducation = {
        id: editingEduId || `edu-${Date.now()}`,
        institution: eduInst.trim(),
        degree: eduDegree.trim(),
        fieldOfStudy: eduField.trim() || undefined,
        startYear: Number(eduStartYear),
        endYear: Number(eduEndYear),
        grade: eduGrade.trim() || undefined,
        activities: eduActivities.trim() || undefined,
      };

      const updated = editingEduId
        ? currentEdu.map((ed) => (ed.id === editingEduId ? newEdu : ed))
        : [newEdu, ...currentEdu];

      await saveProfile(user.id, { education: updated });
      setProfile({ ...profile, education: updated });
      await refresh();
      setEduModalOpen(false);
      toast.success("Education updated", `Saved ${newEdu.degree} at ${newEdu.institution}.`);
    } catch (err: any) {
      toast.error("Failed to save education", err?.message);
    } finally {
      setSavingEdu(false);
    }
  };

  const handleDeleteEducation = async (eduId: string) => {
    if (!user || !profile) return;
    try {
      const updated = (profile.education || []).filter((ed) => ed.id !== eduId);
      await saveProfile(user.id, { education: updated });
      setProfile({ ...profile, education: updated });
      await refresh();
      toast.info("Education entry removed");
    } catch (err: any) {
      toast.error("Failed to remove education", err?.message);
    }
  };

  // Achievement Handlers
  const handleSaveAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !achieveTitle.trim()) return;
    setSavingAchieve(true);
    try {
      const currentAch = profile.achievements || [];
      const newAch: UserAchievement = {
        id: `ach-${Date.now()}`,
        title: achieveTitle.trim(),
        category: achieveCategory,
        issuer: achieveIssuer.trim() || "Academic Competition",
        date: achieveDate.trim() || new Date().getFullYear().toString(),
        rank: achieveRank.trim() || undefined,
        description: achieveDesc.trim(),
        proofUrl: achieveLink.trim() || undefined,
      };

      const updated = [newAch, ...currentAch];
      await saveProfile(user.id, { achievements: updated });
      setProfile({ ...profile, achievements: updated });
      await refresh();
      setAchieveModalOpen(false);
      toast.success("Achievement added", `Recorded "${newAch.title}".`);
    } catch (err: any) {
      toast.error("Failed to save achievement", err?.message);
    } finally {
      setSavingAchieve(false);
    }
  };

  const handleDeleteAchievement = async (achId: string) => {
    if (!user || !profile) return;
    try {
      const updated = (profile.achievements || []).filter((a) => a.id !== achId);
      await saveProfile(user.id, { achievements: updated });
      setProfile({ ...profile, achievements: updated });
      await refresh();
      toast.info("Achievement removed");
    } catch (err: any) {
      toast.error("Failed to remove achievement", err?.message);
    }
  };

  // Post Handlers
  const handleCreatePost = async (postData: {
    category: PostCategory;
    content: string;
    mediaUrls: string[];
    projectRef?: { title: string; link?: string; githubUrl?: string };
    certificateRef?: { title: string; issuer: string; certUrl?: string };
  }) => {
    if (!user || !profile) return;
    const newPost = await createPortfolioPost({
      authorId: user.id,
      authorName: profile.fullName,
      authorRole: profile.role === "faculty" ? "Faculty Mentor" : "Student Researcher",
      authorAvatar: profile.photoUrl,
      authorInstitution: profile.institution,
      authorDepartment: profile.department,
      ...postData,
    });
    setPosts([newPost, ...posts]);
    toast.success("Post published", "Your update is now live on your portfolio activity feed.");
  };

  const handleDeletePost = async (postId: string) => {
    if (!user) return;
    await deletePortfolioPost(postId, user.id);
    setPosts(posts.filter((p) => p.id !== postId));
    toast.info("Post deleted", "Your update was removed.");
  };

  const handleLikePost = async (postId: string) => {
    if (!user) {
      toast.info("Sign in required", "Please sign in to like posts.");
      return;
    }
    const updated = await togglePostLike(postId, user.id);
    if (updated) {
      setPosts(posts.map((p) => (p.id === postId ? updated : p)));
    }
  };

  const handleCommentPost = async (postId: string, commentContent: string) => {
    if (!user || !profile) {
      toast.info("Sign in required", "Please sign in to comment on posts.");
      return;
    }
    const comm = await addPostComment(postId, {
      authorId: user.id,
      authorName: profile.fullName,
      authorRole: profile.role === "faculty" ? "Faculty Mentor" : "Student Researcher",
      authorAvatar: profile.photoUrl,
      content: commentContent,
    });
    setPosts(
      posts.map((p) => (p.id === postId ? { ...p, comments: [...(p.comments || []), comm] } : p))
    );
    toast.success("Comment posted", "Your feedback was added.");
  };

  // Direct collaboration request handler (Req 1)
  const handleSendDirectCollab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    setSendingDirectCollab(true);
    try {
      await sendDirectCollaborationRequest(
        user.id,
        profile.userId,
        directCollabMsg,
        directCollabRole,
        profile.department
      );
      setDirectCollabOpen(false);
      setDirectCollabMsg("");
      toast.success(
        "Collaboration request sent!",
        `Once ${profile.fullName} accepts, a private 1-on-1 chat will activate in Messages.`
      );
    } catch (err: any) {
      toast.error("Could not send collaboration request", err?.message);
    } finally {
      setSendingDirectCollab(false);
    }
  };

  // Faculty mentorship request handler (Req 7)
  const handleSendMentorshipRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    setSendingMentorship(true);
    try {
      await requestMentorship(
        profile.userId,
        ownedProjects[0]?.id || undefined,
        mentorMsg,
        user.id,
        mentorTopic
      );
      setMentorshipOpen(false);
      setMentorMsg("");
      toast.success(
        "Mentorship request submitted!",
        `Prof. ${profile.fullName} has been notified and will review your request.`
      );
    } catch (err: any) {
      toast.error("Could not submit mentorship request", err?.message);
    } finally {
      setSendingMentorship(false);
    }
  };

  // Invite handler
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedProjectId || !profile) return;
    setSendingInvite(true);
    try {
      await inviteUser(selectedProjectId, profile.userId, "Research Contributor", inviteMsg);
      setInviteOpen(false);
      setInviteMsg("");
      toast.success("Invitation sent!", `Invited ${profile.fullName} to join your project team.`);
    } catch (err: any) {
      toast.error("Could not send invitation", err?.message);
    } finally {
      setSendingInvite(false);
    }
  };

  // Report handler
  const handleReportUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    setSubmittingReport(true);
    try {
      await fileReport(user.id, "user", profile.userId, reportType, reportDetails);
      setReportOpen(false);
      setReportDetails("");
      toast.warning("Report submitted", "Our academic review team will inspect this profile.");
    } catch (err: any) {
      toast.error("Failed to submit report", err?.message);
    } finally {
      setSubmittingReport(false);
    }
  };

  const copyProfileLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.info("Profile link copied", "Share your academic portfolio with recruiters & mentors.");
  };

  // Filtered projects
  const filteredProjects = useMemo(() => {
    if (!profile?.pastProjects) return [];
    return profile.pastProjects.filter((p) => {
      const matchSearch =
        !projectSearch ||
        p.title.toLowerCase().includes(projectSearch.toLowerCase()) ||
        p.description?.toLowerCase().includes(projectSearch.toLowerCase()) ||
        p.technologies?.some((t) => t.toLowerCase().includes(projectSearch.toLowerCase()));
      const matchStatus =
        projectStatusFilter === "all" || (p.status || "completed") === projectStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [profile?.pastProjects, projectSearch, projectStatusFilter]);

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-navy" />
        <p className="text-xs text-ink-500 font-medium">Loading verified researcher profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <EmptyState
          title="Researcher Profile Not Found"
          description="The requested profile does not exist or has been removed from the registry."
          icon={GraduationCap}
          action={
            <Link to="/collaborators">
              <Button variant="outline">Browse Talent Directory</Button>
            </Link>
          }
        />
      </div>
    );
  }

  // Privacy protection
  if (!isSelf && !isAdmin && profile.visibility === "private") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-paper-100 text-ink-500 shadow-xs">
          <Lock className="h-7 w-7 text-ink-400" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-ink">Private Portfolio</h2>
        <p className="mt-2 text-sm text-ink-500">
          This researcher has restricted their profile visibility to private members.
        </p>
        <div className="mt-6">
          <Link to="/collaborators">
            <Button variant="outline">Back to Talent Directory</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isFaculty = !!profile.designation || profile.role === "faculty";
  const uid = `${isFaculty ? "FAC" : "STU"}-${profile.userId.substring(0, 6).toUpperCase()}`;
  const completeness = profile.profileCompleteness ?? 50;

  return (
    <div className="clay-page space-y-6">
      {/* 1. HERO BANNER & PROFILE CARD */}
      <Card className="p-0 overflow-hidden" style={{ boxShadow: "0 14px 40px rgba(215,195,160,0.26), inset 0 1px 2px rgba(255,255,255,0.96)" }}>
        {/* Cover Photo */}
        <div className="relative h-52 sm:h-64 overflow-hidden" style={{ borderRadius: "1.75rem 1.75rem 0 0" }}>
          {profile.coverPhotoUrl ? (
            <img src={profile.coverPhotoUrl} alt="Cover Banner" className="w-full h-full object-cover" />
          ) : (
            <>
              {/* Premium clay gradient banner */}
              <div
                className="absolute inset-0 clay-profile-banner"
                style={{
                  background: "linear-gradient(135deg, #FFF9DC 0%, #FFE87A 25%, #FFC812 55%, #FAB23D 80%, #E59A20 100%)"
                }}
              />
              {/* Neural network pattern overlay */}
              <div className="absolute inset-0 clay-neural-bg opacity-40" />
              {/* Decorative tech orbs */}
              <div className="absolute left-6 top-6 h-16 w-16 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)" }} />
              <div className="absolute right-1/4 bottom-4 h-24 w-24 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)" }} />
              {/* AI chip illustration */}
              <div
                className="hidden lg:flex absolute right-10 top-1/2 -translate-y-1/2 items-center gap-3 p-4 rounded-3xl"
                style={{ background: "rgba(255,255,255,0.55)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.7)", boxShadow: "0 12px 28px rgba(215,195,160,0.25)" }}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 rounded-xl flex items-center justify-center text-sm" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,200,18,0.3)", color: "#7A4D00", boxShadow: "0 2px 6px rgba(215,195,160,0.2)" }}>☁️</div>
                  <div className="h-8 w-8 rounded-xl flex items-center justify-center text-sm" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,200,18,0.3)", color: "#7A4D00", boxShadow: "0 2px 6px rgba(215,195,160,0.2)" }}>🗄️</div>
                </div>
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl font-serif font-black text-xl text-[#181B1F]"
                  style={{ background: "linear-gradient(145deg, #FFD333, #FFC812, #F5BA00)", boxShadow: "0 8px 20px rgba(255,184,0,0.4), inset 0 1px 1px rgba(255,255,255,0.8)" }}
                >
                  AI
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 rounded-xl flex items-center justify-center text-xs font-bold" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,200,18,0.3)", color: "#7A4D00", boxShadow: "0 2px 6px rgba(215,195,160,0.2)" }}>&lt;/&gt;</div>
                  <div className="h-8 w-8 rounded-xl flex items-center justify-center text-sm" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,200,18,0.3)", color: "#7A4D00", boxShadow: "0 2px 6px rgba(215,195,160,0.2)" }}>⚙️</div>
                </div>
              </div>
            </>
          )}

          {/* Cover Photo Upload & Remove Controls (Owner only) */}
          {isSelf && (
            <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
                className="clay-btn clay-btn-outline h-8 px-3 text-xs shadow-md"
                style={{ backdropFilter: "blur(8px)", background: "rgba(255,255,255,0.85)" }}
                title={profile.coverPhotoUrl ? "Change cover banner" : "Upload cover banner"}
              >
                {uploadingCover ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                <span>{profile.coverPhotoUrl ? "Change Banner" : "Upload Banner"}</span>
              </button>
              {profile.coverPhotoUrl && (
                <button
                  type="button"
                  onClick={handleRemoveCover}
                  disabled={uploadingCover}
                  className="clay-btn clay-btn-danger h-8 px-3 text-xs"
                  style={{ backdropFilter: "blur(8px)" }}
                  title="Remove cover banner"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Remove</span>
                </button>
              )}
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleCoverFile}
              />
            </div>
          )}

          {/* Share & Report for visitors */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <button
              type="button"
              onClick={copyProfileLink}
              className="clay-btn clay-btn-outline h-8 px-3 text-xs"
              style={{ backdropFilter: "blur(8px)", background: "rgba(255,255,255,0.85)" }}
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Share Portfolio</span>
            </button>
            {!isSelf && (
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className="clay-btn-icon h-8 w-8"
                style={{ backdropFilter: "blur(8px)", background: "rgba(255,255,255,0.85)" }}
                title="Report profile"
              >
                <Flag className="h-3.5 w-3.5 text-[#7B828A]" />
              </button>
            )}
          </div>
        </div>

        {/* Profile Info Container */}
        <div className="px-6 pb-6 pt-0 sm:px-8 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-16 sm:-mt-20 mb-5">
            {/* Avatar & Photo Controls Column */}
            <div className="flex flex-col items-start shrink-0">
              <div className="relative group shrink-0">
                <div
                  className="relative flex h-28 w-28 sm:h-36 sm:w-36 items-center justify-center rounded-[20px] sm:rounded-3xl font-serif font-bold text-4xl sm:text-5xl overflow-hidden"
                  style={{
                    background: profile.photoUrl ? "transparent" : "linear-gradient(145deg, #FFD333 0%, #FFC812 45%, #FAB23D 100%)",
                    color: "#181B1F",
                    border: "4px solid white",
                    boxShadow: "0 0 0 3px rgba(255,200,18,0.25), 0 12px 32px rgba(215,195,160,0.35), inset 0 1px 1px rgba(255,255,255,0.9)",
                  }}
                >
                  {profile.photoUrl ? (
                    <img src={profile.photoUrl} alt={profile.fullName} className="h-full w-full object-cover" />
                  ) : (
                    profile.fullName.charAt(0).toUpperCase()
                  )}
                  {/* Online Indicator */}
                  <span className="absolute bottom-1.5 right-1.5 h-4 w-4 rounded-full bg-emerald-400 border-2 border-white shadow-sm" title="Active on SYNAPTRA" />
                </div>

                {isSelf && (
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute inset-0 flex flex-col items-center justify-center rounded-[20px] sm:rounded-3xl bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm cursor-pointer"
                    title="Change profile photo"
                  >
                    {uploadingAvatar ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
                    <span className="text-[10px] font-semibold mt-1">Change Photo</span>
                  </button>
                )}
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarFile}
                />
              </div>

              {/* Photo controls */}
              {isSelf && (
                <div className="flex items-center gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="clay-btn clay-btn-outline h-7 px-2.5 text-[11px]"
                    title="Change or replace profile photo"
                  >
                    {uploadingAvatar ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
                    <span>{profile.photoUrl ? "Change Photo" : "Upload Photo"}</span>
                  </button>
                  {profile.photoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      disabled={uploadingAvatar}
                      className="clay-btn clay-btn-danger h-7 px-2.5 text-[11px]"
                      title="Remove profile photo"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Main Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 sm:self-end sm:mb-2 pt-2 z-20 relative">
              {isSelf ? (
                <>
                  <Button onClick={() => setCreatePostOpen(true)}>
                    <Sparkles className="h-4 w-4" />
                    <span>Create Post</span>
                  </Button>
                  <Button variant="outline" onClick={() => setEditOpen(true)}>
                    <Edit className="h-4 w-4" /> Edit Profile
                  </Button>
                </>
              ) : (
                <>
                  {isFaculty ? (
                    <Button
                      onClick={() => {
                        setMentorTopic(profile.expertise[0] || profile.researchDomains[0] || "Technical Guidance");
                        setMentorMsg(`Respected Prof. ${profile.fullName.split(" ")[0]}, I am developing a project and would value your mentorship.`);
                        setMentorshipOpen(true);
                      }}
                      variant="secondary"
                    >
                      <GraduationCap className="h-4 w-4" /> Request Mentorship
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setDirectCollabRole(profile.preferredRoles[0] || "Frontend Developer");
                        setDirectCollabMsg(`Hi ${profile.fullName.split(" ")[0]}, let's connect and collaborate on technical projects and hackathons!`);
                        setDirectCollabOpen(true);
                      }}
                    >
                      <UserPlus className="h-4 w-4" /> Connect / Collaborate
                    </Button>
                  )}
                  {ownedProjects.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedProjectId(ownedProjects[0]?.id || "");
                        setInviteOpen(true);
                      }}
                    >
                      <UserCheck className="h-4 w-4" /> Invite to Project
                    </Button>
                  )}
                  <Link to={`/messages?userId=${profile.userId}`}>
                    <Button variant="ghost">
                      <Mail className="h-4 w-4" /> Message
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Details header */}
          <div className="space-y-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
                  {profile.fullName}
                </h1>
                <Badge tone="green">
                  <ShieldCheck className="h-3 w-3 mr-1" /> Institutional Verified
                </Badge>
                <Badge tone={isFaculty ? "brass" : "navy"}>
                  {isFaculty ? "FACULTY MENTOR" : "STUDENT RESEARCHER"}
                </Badge>
                {profile.visibility === "private" ? (
                  <Badge tone="amber">
                    <Lock className="h-3 w-3 mr-1" /> Private Profile
                  </Badge>
                ) : (
                  <Badge tone="slate">
                    <Globe className="h-3 w-3 mr-1" /> Public Portfolio
                  </Badge>
                )}
                <span className="font-mono text-xs text-ink-400">ID: {uid}</span>
              </div>

              {/* Dynamic Headline (LinkedIn style) */}
              <p className="mt-1 text-sm font-semibold text-navy-800">
                {profile.headline ||
                  `${profile.degreeProgram || "Undergraduate Scholar"} • ${profile.department}`}
              </p>

              {/* Institution & Location */}
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-ink-400" />
                  {profile.institution}
                </span>
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-ink-400" />
                    {profile.location}
                  </span>
                )}
                {profile.academicYear && (
                  <span className="flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5 text-ink-400" />
                    Class of {profile.graduationYear || (new Date().getFullYear() + 4 - profile.academicYear)}
                  </span>
                )}
              </div>
            </div>

            {/* Bio summary */}
            {profile.bio && (
              <p className="text-sm text-[#5E646A] max-w-3xl leading-relaxed whitespace-pre-line">
                {profile.bio}
              </p>
            )}

            {/* Social & external links row */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#ECE5D8]">
              {profile.githubUsername && (
                <a
                  href={`https://github.com/${profile.githubUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="clay-btn clay-btn-outline h-8 px-3 text-xs gap-1.5"
                >
                  <Github className="h-3.5 w-3.5" />
                  <span>GitHub</span>
                </a>
              )}

              {profile.linkedinUrl && (
                <a
                  href={profile.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="clay-btn clay-btn-outline h-8 px-3 text-xs gap-1.5"
                >
                  <Linkedin className="h-3.5 w-3.5 text-blue-600" />
                  <span>LinkedIn</span>
                </a>
              )}

              {profile.portfolioUrl && (
                <a
                  href={profile.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="clay-btn clay-btn-outline h-8 px-3 text-xs gap-1.5"
                >
                  <Globe className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Website</span>
                </a>
              )}

              {profile.resumeUrl && (
                <button
                  type="button"
                  onClick={() => openViewer(profile.resumeUrl!, `${profile.fullName} - Resume / CV`)}
                  className="clay-btn clay-btn-outline h-8 px-3 text-xs gap-1.5"
                >
                  <FileText className="h-3.5 w-3.5 text-[#BD7D14]" />
                  <span>CV / Resume</span>
                </button>
              )}

              {/* Availability chip */}
              <div
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
                style={profile.openToCollaboration ? {
                  background: "linear-gradient(135deg,#E8F7EE,#C8EFD8)",
                  border: "1px solid #A3D9B8",
                  color: "#1B7339",
                } : {
                  background: "#F5F2EB",
                  border: "1px solid #DFD5C4",
                  color: "#5E5448",
                }}
              >
                <span className={`h-2 w-2 rounded-full ${profile.openToCollaboration ? "bg-emerald-400 animate-pulse" : "bg-[#A09488]"}`} />
                <span>
                  {profile.openToCollaboration
                    ? `Open to research (${profile.availabilityHours ?? 15} hrs/wk)`
                    : "Not currently open to new teams"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-[#ECE5D8] divide-x divide-[#ECE5D8] text-center">
          {[
            { icon: FolderGit2, count: (profile.pastProjects || []).length, label: "Projects", tab: "projects" as ActiveTab },
            { icon: Award, count: (profile.certifications || []).length, label: "Certifications", tab: "certifications" as ActiveTab },
            { icon: Star, count: (profile.internships || []).length, label: "Experiences", tab: "experience" as ActiveTab },
            { icon: Bell, count: posts.length, label: "Feed Updates", tab: "activity" as ActiveTab },
          ].map(({ icon: Icon, count, label, tab }) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`group p-4 flex flex-col items-center gap-1.5 transition-all hover:bg-[#FFF8E8] ${
                activeTab === tab ? "bg-[#FFF4D0]" : ""
              }`}
            >
              <div
                className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform"
                style={{
                  background: activeTab === tab
                    ? "linear-gradient(145deg,#FFD333,#FFC812)"
                    : "linear-gradient(145deg,#FFF8DC,#FFF0B0)",
                  border: `1px solid ${activeTab === tab ? "#F0C000" : "#FFE080"}`,
                  color: "#7A4D00",
                  boxShadow: "0 2px 8px rgba(255,200,18,0.18)",
                }}
              >
                <Icon className="h-4 w-4" />
              </div>
              <p className="font-serif text-xl font-extrabold text-[#181B1F]">{count}</p>
              <p className="text-[10px] font-bold text-[#8C8372] uppercase tracking-wider">{label}</p>
            </button>
          ))}
        </div>
      </Card>

      {/* Profile Completeness Recommendation Bar (Self only) */}
      {isSelf && completeness < 100 && (
        <Card className="p-4 sm:p-5 bg-gradient-to-r from-[#FFFBEA] via-white to-[#FFFDF5] border-[#ECE5D8] shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#FFF2B2] text-[#8C6000] flex items-center justify-center shrink-0 shadow-sm border border-[#FFE785]">
                <Target className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#181B1F]">
                    Portfolio Strength — {completeness}%
                  </span>
                </div>
                <p className="text-xs text-[#5E646A]">
                  Enhance your reach: Add certificates, link a GitHub repository, or add work experience.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="w-36 hidden md:block">
                <div className="h-3 w-full bg-[#EFE9DD] rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-[#FFC812] to-[#FAB23D] rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${completeness}%` }}
                  />
                </div>
              </div>
              <Button size="sm" variant="primary" onClick={() => setEditOpen(true)}>
                Complete Profile
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* 2. NAVIGATION TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: "overview", label: "Overview", icon: Layers, count: undefined },
          { id: "projects", label: "Projects", icon: FolderGit2, count: (profile.pastProjects || []).length },
          { id: "experience", label: "Experience", icon: Building2, count: (profile.internships || []).length },
          { id: "certifications", label: "Certifications", icon: Award, count: (profile.certifications || []).length + (profile.achievements || []).length },
          { id: "activity", label: "Activity", icon: Sparkles, count: posts.length },
        ].map((tab) => {
          const active = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold whitespace-nowrap rounded-2xl transition-all border ${
                active
                  ? "border-[#F0C000] text-[#181B1F] scale-[1.02]"
                  : "text-[#5E646A] hover:text-[#181B1F] border-[#ECE5D8] hover:border-[#DFD7C7]"
              }`}
              style={active ? {
                background: "linear-gradient(145deg,#FFD333,#FFC812,#F5BA00)",
                boxShadow: "0 4px 16px rgba(255,200,18,0.38), inset 0 1px 1px rgba(255,255,255,0.65)",
              } : {
                background: "rgba(255,255,255,0.85)",
                boxShadow: "0 2px 8px rgba(215,195,160,0.12), inset 0 1px 0 rgba(255,255,255,0.9)",
              }}
            >
              <Icon className={`h-3.5 w-3.5 ${active ? "text-[#181B1F]" : "text-[#A09488]"}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold ${
                    active ? "bg-[#181B1F] text-white" : "bg-[#FFF4D0] text-[#8C6000]"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. TAB PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Featured Projects Highlight */}
              <Card className="p-6 shadow-card space-y-5 relative overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-[#ECE5D8]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#FFF4D0] text-[#8C6000] flex items-center justify-center shadow-2xs">
                      <FolderGit2 className="h-4 w-4" />
                    </div>
                    <h3 className="font-serif text-lg font-bold text-[#181B1F]">
                      Featured Projects
                    </h3>
                  </div>
                  {isSelf && (
                    <Button size="sm" variant="primary" onClick={openAddProject}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Project
                    </Button>
                  )}
                </div>

                {(profile.pastProjects || []).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(profile.pastProjects || []).slice(0, 4).map((proj) => (
                      <ProjectCard
                        key={proj.id}
                        project={proj}
                        isOwner={isSelf}
                        onEdit={openEditProject}
                        onDelete={handleDeleteProject}
                        onPreviewMedia={openViewer}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-8 px-4 flex flex-col items-center text-center relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FFF8DE] to-[#FFF0B2] border border-[#FFE785] flex items-center justify-center text-[#8C6000] shadow-clay mb-3">
                      <FolderGit2 className="h-8 w-8" />
                    </div>
                    <h4 className="text-base font-bold text-[#181B1F]">No projects showcased yet</h4>
                    <p className="text-xs text-[#6B7280] max-w-sm mt-1 mb-4">
                      Add academic capstones, hackathon submissions, or GitHub repositories.
                    </p>
                    {isSelf && (
                      <Button size="sm" variant="primary" onClick={openAddProject}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add Your First Project
                      </Button>
                    )}
                    {/* Subtle warm corner glow */}
                    <div className="absolute -bottom-10 -right-10 w-36 h-36 rounded-full bg-gradient-to-tl from-[#FFC812]/15 to-transparent pointer-events-none" />
                  </div>
                )}

                {(profile.pastProjects || []).length > 4 && (
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("projects")}
                      className="text-xs font-bold text-[#8C6000] hover:text-[#6E4B00] hover:underline"
                    >
                      View all {(profile.pastProjects || []).length} projects →
                    </button>
                  </div>
                )}
              </Card>

              {/* Skills & AI Evaluation */}
              <Card className="p-6 shadow-card space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#ECE5D8]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#FFF4D0] text-[#8C6000] flex items-center justify-center shadow-2xs">
                      <Award className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-bold text-[#181B1F]">
                        Skills & Technical Competencies
                      </h3>
                      <p className="text-xs text-[#6B7280] mt-0.5">
                        Verified technical skills used for team compatibility scoring
                      </p>
                    </div>
                  </div>
                  {isSelf && (
                    <Button size="sm" variant="outline" onClick={() => { setTempSkills([...(profile.skills || [])]); setManageSkillsOpen(true); }}>
                      <Sliders className="h-3.5 w-3.5 mr-1" /> Manage Skills
                    </Button>
                  )}
                </div>

                {(profile.skills || []).length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {profile.skills.map((item) => {
                      const pct =
                        item.proficiency === "advanced"
                          ? 80
                          : item.proficiency === "intermediate"
                          ? 60
                          : 40;
                      return (
                        <div
                          key={item.skill}
                          className="flex flex-col gap-2 rounded-2xl border border-[#ECE5D8] bg-white p-3 shadow-xs hover:border-[#DFD7C7] hover:shadow-sm transition-all"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-6 h-6 rounded-lg bg-[#FFF4D0] text-[#8C6000] flex items-center justify-center shrink-0 text-xs font-bold">
                                📝
                              </div>
                              <span className="text-xs font-bold text-[#181B1F] truncate">
                                {item.skill}
                              </span>
                            </div>
                            <span className="text-[10px] font-extrabold text-[#6B7280]">{pct}%</span>
                          </div>
                          {/* Mini Progress Bar matching reference image */}
                          <div className="h-2 w-full bg-[#EFE9DD] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#FFC812] to-[#FAB23D] rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    title="No skills added yet"
                    description="List your programming languages, machine learning frameworks, or research tools."
                    icon={Award}
                  />
                )}
              </Card>

              {/* Recent Activity Highlight */}
              {posts.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-lg font-bold text-ink flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-navy" />
                      Recent Activity
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab("activity")}
                      className="text-xs font-semibold text-navy hover:underline"
                    >
                      View all activity →
                    </button>
                  </div>
                  <PostCard
                    post={posts[0]}
                    currentUserId={user?.id}
                    onLike={handleLikePost}
                    onComment={handleCommentPost}
                    onDelete={handleDeletePost}
                    onPreviewMedia={openViewer}
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PROJECTS */}
          {activeTab === "projects" && (
            <div className="space-y-6">
              <Card className="p-5 shadow-card space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-ink-100">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-ink flex items-center gap-2">
                      <FolderGit2 className="h-5 w-5 text-navy" />
                      Projects & Portfolio Showcase
                    </h3>
                    <p className="text-xs text-ink-500 mt-0.5">
                      Academic capstones, open-source repositories, and hackathon deliverables
                    </p>
                  </div>
                  {isSelf && (
                    <Button onClick={openAddProject} className="flex items-center gap-1.5 shadow-xs">
                      <Plus className="h-4 w-4" />
                      <span>Add Project</span>
                    </Button>
                  )}
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-400" />
                    <Input
                      placeholder="Search projects by title, keyword, or technology..."
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                      className="pl-9 text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Filter className="h-3.5 w-3.5 text-ink-400" />
                    <Select
                      value={projectStatusFilter}
                      onChange={(e) => setProjectStatusFilter(e.target.value)}
                      className="text-xs py-1.5 w-full sm:w-40"
                    >
                      <option value="all">All Statuses</option>
                      <option value="completed">Completed</option>
                      <option value="in_progress">In Progress</option>
                      <option value="deployed">Live Production</option>
                      <option value="open_source">Open Source</option>
                    </Select>
                  </div>
                </div>

                {/* Project Grid */}
                {filteredProjects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {filteredProjects.map((proj) => (
                      <ProjectCard
                        key={proj.id}
                        project={proj}
                        isOwner={isSelf}
                        onEdit={openEditProject}
                        onDelete={handleDeleteProject}
                        onPreviewMedia={openViewer}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title={projectSearch ? "No matching projects found" : "No projects added yet"}
                    description={
                      projectSearch
                        ? "Try clearing your search query or changing filters."
                        : "Showcase your past projects, GitHub repos, and individual contributions."
                    }
                    icon={FolderGit2}
                    action={
                      isSelf ? (
                        <Button size="sm" onClick={openAddProject}>
                          <Plus className="h-3.5 w-3.5 mr-1" /> Add Project
                        </Button>
                      ) : undefined
                    }
                  />
                )}
              </Card>
            </div>
          )}

          {/* TAB 3: EXPERIENCE */}
          {activeTab === "experience" && (
            <div className="space-y-6">
              <Card className="p-6 shadow-card space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-ink-100">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-ink flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-navy" />
                      Experience & Internships
                    </h3>
                    <p className="text-xs text-ink-500 mt-0.5">
                      Professional internships, research assistantships, and industry roles
                    </p>
                  </div>
                  {isSelf && (
                    <Button onClick={openAddExperience} className="flex items-center gap-1.5 shadow-xs">
                      <Plus className="h-4 w-4" />
                      <span>Add Experience</span>
                    </Button>
                  )}
                </div>

                {(profile.internships || []).length > 0 ? (
                  <div className="space-y-6 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-ink-100">
                    {profile.internships.map((exp) => (
                      <div key={exp.id} className="relative flex items-start gap-4 group">
                        {/* Timeline Node */}
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy text-white shadow-2xs font-serif font-bold text-sm z-10">
                          {exp.organization.charAt(0).toUpperCase()}
                        </div>

                        {/* Card Content */}
                        <div className="flex-1 rounded-xl border border-ink-100 bg-white p-4 shadow-xs hover:border-navy-200 transition-all">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="font-serif text-base font-bold text-ink">{exp.role}</h4>
                              <p className="text-xs font-semibold text-brass-700">{exp.organization}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-400">
                                {exp.employmentType && (
                                  <Badge tone="slate" className="text-[10px]">{exp.employmentType}</Badge>
                                )}
                                {exp.duration && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {exp.duration}
                                  </span>
                                )}
                                {exp.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {exp.location}
                                  </span>
                                )}
                              </div>
                            </div>

                            {isSelf && (
                              <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                                <button
                                  type="button"
                                  onClick={() => openEditExperience(exp)}
                                  className="p-1.5 text-ink-400 hover:text-navy hover:bg-paper-100 rounded-lg transition-colors"
                                  title="Edit experience"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteExperience(exp.id)}
                                  className="p-1.5 text-ink-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete experience"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </div>

                          {exp.description && (
                            <p className="mt-3 text-xs text-ink-600 leading-relaxed whitespace-pre-line">
                              {exp.description}
                            </p>
                          )}

                          {/* Attached Media / Completion Certificate */}
                          {exp.mediaUrl && (
                            <div className="mt-3 pt-3 border-t border-ink-50">
                              <button
                                type="button"
                                onClick={() => openViewer(exp.mediaUrl!, `${exp.role} @ ${exp.organization} - Proof / Letter`)}
                                className="inline-flex items-center gap-2 rounded-lg border border-ink-200 bg-paper-50 px-3 py-1.5 text-xs font-medium text-ink-700 hover:border-navy hover:text-navy transition-all"
                              >
                                <FileText className="h-3.5 w-3.5 text-navy" />
                                <span>View Experience Letter / Document</span>
                                <ExternalLink className="h-3 w-3 text-ink-400 ml-1" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No work experience listed"
                    description="Share engineering internships, academic labs, or research assistantships."
                    icon={Building2}
                    action={
                      isSelf ? (
                        <Button size="sm" onClick={openAddExperience}>
                          <Plus className="h-3.5 w-3.5 mr-1" /> Add Position
                        </Button>
                      ) : undefined
                    }
                  />
                )}
              </Card>
            </div>
          )}

          {/* TAB 4: CERTIFICATIONS & EDUCATION */}
          {activeTab === "certifications" && (
            <div className="space-y-6">
              {/* Certifications Section */}
              <Card className="p-6 shadow-card space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-ink-100">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-ink flex items-center gap-2">
                      <Award className="h-5 w-5 text-emerald-700" />
                      Licenses & Certifications
                    </h3>
                    <p className="text-xs text-ink-500 mt-0.5">
                      Verified technical and professional credentials
                    </p>
                  </div>
                  {isSelf && (
                    <Button onClick={openAddCertificate} className="flex items-center gap-1.5 shadow-xs">
                      <Plus className="h-4 w-4" />
                      <span>Add Certificate</span>
                    </Button>
                  )}
                </div>

                {(profile.certifications || []).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.certifications.map((cert) => (
                      <div
                        key={cert.id}
                        className="flex flex-col justify-between rounded-xl border border-ink-100 bg-white p-4 shadow-xs hover:border-emerald-200 hover:shadow-card transition-all group"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-2xs font-serif font-bold text-sm">
                                <Award className="h-5 w-5" />
                              </div>
                              <div>
                                <h4 className="font-serif text-base font-bold text-ink leading-tight">
                                  {cert.name}
                                </h4>
                                <p className="text-xs font-semibold text-emerald-800 mt-0.5">
                                  {cert.issuer}
                                </p>
                                <span className="text-[11px] text-ink-400 mt-0.5 block">
                                  Issued: {cert.issueDate || cert.year}
                                </span>
                              </div>
                            </div>

                            {isSelf && (
                              <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                                <button
                                  type="button"
                                  onClick={() => openEditCertificate(cert)}
                                  className="p-1.5 text-ink-400 hover:text-navy hover:bg-paper-100 rounded-lg transition-colors"
                                  title="Edit certificate"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCertificate(cert.id)}
                                  className="p-1.5 text-ink-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete certificate"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </div>

                          {cert.credentialId && (
                            <p className="mt-2.5 text-[11px] text-ink-500 font-mono">
                              Credential ID: {cert.credentialId}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="mt-4 pt-3 border-t border-ink-50 flex items-center justify-between gap-2">
                          {cert.verificationUrl ? (
                            <a
                              href={cert.verificationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:underline"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              <span>Verify Credential</span>
                            </a>
                          ) : (
                            <span className="text-[11px] text-ink-400">Verified Certificate</span>
                          )}

                          {cert.certificateUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openViewer(cert.certificateUrl!, `${cert.name} - Certificate`)}
                              className="text-xs h-7 px-2"
                            >
                              <Eye className="h-3 w-3 mr-1" /> View Document
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No certifications added"
                    description="Upload credentials from Coursera, AWS, Google, or academic conferences."
                    icon={Award}
                    action={
                      isSelf ? (
                        <Button size="sm" onClick={openAddCertificate}>
                          <Plus className="h-3.5 w-3.5 mr-1" /> Add Certificate
                        </Button>
                      ) : undefined
                    }
                  />
                )}
              </Card>

              {/* Education Section */}
              <Card className="p-6 shadow-card space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-ink-100">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-ink flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-navy" />
                      Education
                    </h3>
                    <p className="text-xs text-ink-500 mt-0.5">
                      Academic degrees, coursework, and institutions
                    </p>
                  </div>
                  {isSelf && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingEduId(null);
                        setEduInst(profile.institution || "");
                        setEduDegree(profile.degreeProgram || "");
                        setEduField(profile.department || "");
                        setEduStartYear(2023);
                        setEduEndYear(profile.graduationYear || 2027);
                        setEduGrade("");
                        setEduActivities("");
                        setEduModalOpen(true);
                      }}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Education
                    </Button>
                  )}
                </div>

                {(profile.education || []).length > 0 ? (
                  <div className="space-y-4">
                    {(profile.education || []).map((edu) => (
                      <div key={edu.id} className="rounded-xl border border-ink-100 p-4 bg-white space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-serif text-base font-bold text-ink">{edu.institution}</h4>
                            <p className="text-xs font-semibold text-navy mt-0.5">
                              {edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ""}
                            </p>
                            <span className="text-[11px] text-ink-400 mt-0.5 block">
                              {edu.startYear} – {edu.endYear} {edu.grade ? `• Grade: ${edu.grade}` : ""}
                            </span>
                          </div>
                          {isSelf && (
                            <button
                              type="button"
                              onClick={() => handleDeleteEducation(edu.id)}
                              className="p-1.5 text-ink-400 hover:text-red-600 rounded-lg"
                              title="Delete education"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        {edu.activities && (
                          <p className="text-xs text-ink-600 pt-1 border-t border-ink-50">
                            <strong>Activities & Societies:</strong> {edu.activities}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-ink-100 bg-paper-50 p-4 space-y-1">
                    <h4 className="font-serif text-base font-bold text-ink">{profile.institution}</h4>
                    <p className="text-xs font-semibold text-navy">
                      {profile.degreeProgram || "Undergraduate Degree"} • {profile.department}
                    </p>
                    <span className="text-[11px] text-ink-400 block">
                      Academic Year: {profile.academicYear || 3}
                    </span>
                  </div>
                )}
              </Card>

              {/* Hackathons, Awards & Accomplishments */}
              <Card className="p-6 shadow-card space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-ink-100">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-ink flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-brass-700" />
                      Hackathons, Honors & Awards
                    </h3>
                    <p className="text-xs text-ink-500 mt-0.5">
                      Competitive milestones, national awards, and hackathon wins
                    </p>
                  </div>
                  {isSelf && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAchieveTitle("");
                        setAchieveIssuer("");
                        setAchieveRank("");
                        setAchieveDesc("");
                        setAchieveLink("");
                        setAchieveModalOpen(true);
                      }}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Award
                    </Button>
                  )}
                </div>

                {(profile.achievements || []).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(profile.achievements || []).map((ach) => (
                      <div
                        key={ach.id}
                        className="rounded-xl border border-ink-100 bg-white p-4 shadow-xs space-y-2 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="rounded bg-brass-100 text-brass-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                                {ach.rank || ach.category}
                              </span>
                              <h4 className="font-serif text-base font-bold text-ink mt-1.5">
                                {ach.title}
                              </h4>
                              <p className="text-xs font-semibold text-ink-600">{ach.issuer} • {ach.date}</p>
                            </div>
                            {isSelf && (
                              <button
                                type="button"
                                onClick={() => handleDeleteAchievement(ach.id)}
                                className="p-1.5 text-ink-400 hover:text-red-600 rounded-lg"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          {ach.description && (
                            <p className="text-xs text-ink-600 mt-2 leading-relaxed">{ach.description}</p>
                          )}
                        </div>

                        {ach.proofUrl && (
                          <div className="pt-2 border-t border-ink-50">
                            <a
                              href={ach.proofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-navy hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                              View Submission / Project
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No awards or hackathons listed"
                    description="Highlight top hackathon placements, scholarships, or academic honor rolls."
                    icon={Trophy}
                  />
                )}
              </Card>
            </div>
          )}

          {/* TAB 5: ACTIVITY & POSTS (LinkedIn Feed Experience) */}
          {activeTab === "activity" && (
            <div className="space-y-6">
              {/* Post Composer Card */}
              {isSelf && (
                <Card className="p-4 shadow-card border-ink-100 space-y-3">
                  <div className="flex items-center gap-3">
                    {profile.photoUrl ? (
                      <img src={profile.photoUrl} alt="" className="h-10 w-10 rounded-xl object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-white font-bold text-sm">
                        {profile.fullName.charAt(0)}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setCreatePostOpen(true)}
                      className="flex-1 rounded-xl border border-ink-200 bg-paper-50 px-4 py-2.5 text-left text-xs text-ink-500 hover:border-navy hover:bg-paper-100 transition-all font-medium shadow-2xs"
                    >
                      Share a research milestone, project demo, or achievement...
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-ink-100">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setCreatePostOpen(true)}
                        className="text-xs text-ink-600 hover:text-navy flex items-center gap-1.5"
                      >
                        <FolderGit2 className="h-4 w-4 text-navy" />
                        <span>Project</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setCreatePostOpen(true)}
                        className="text-xs text-ink-600 hover:text-emerald-700 flex items-center gap-1.5"
                      >
                        <Award className="h-4 w-4 text-emerald-700" />
                        <span>Certificate</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setCreatePostOpen(true)}
                        className="text-xs text-ink-600 hover:text-brass flex items-center gap-1.5"
                      >
                        <Trophy className="h-4 w-4 text-brass" />
                        <span>Award</span>
                      </Button>
                    </div>

                    <Button size="sm" onClick={() => setCreatePostOpen(true)}>
                      Post Update
                    </Button>
                  </div>
                </Card>
              )}

              {/* Feed List */}
              {posts.length > 0 ? (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      currentUserId={user?.id}
                      onLike={handleLikePost}
                      onComment={handleCommentPost}
                      onDelete={handleDeletePost}
                      onPreviewMedia={openViewer}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No activity posts yet"
                  description="Publish updates about your code releases, research findings, and team achievements."
                  icon={Sparkles}
                  action={
                    isSelf ? (
                      <Button size="sm" onClick={() => setCreatePostOpen(true)}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Create First Post
                      </Button>
                    ) : undefined
                  }
                />
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar (1 Col): AI Telemetry & Contact Meta */}
        <div className="space-y-6">
          {/* AI Skill Score & Compatibility Engine */}
          <SkillScorePanel
            userId={profile.userId}
            profile={profile}
          />

          {/* Research Domains / Focus Areas */}
          <Card className="p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-ink-100">
              <h4 className="font-serif text-base font-bold text-ink flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-navy" />
                Research Interests
              </h4>
              {isSelf && (
                <Button size="sm" variant="ghost" onClick={() => { setTempInterests([...(profile.interests || [])]); setManageInterestsOpen(true); }}>
                  <Edit className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {(profile.interests || []).length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {profile.interests.map((interest) => (
                  <span
                    key={interest}
                    className="rounded-lg bg-navy-50 text-navy-800 px-2.5 py-1 text-xs font-semibold border border-navy-100"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-ink-400 italic">No research focus areas specified yet.</p>
            )}
          </Card>

          {/* GitHub Live Repository Telemetry */}
          <Card className="p-5 shadow-card space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-ink-100">
              <h4 className="font-serif text-base font-bold text-ink flex items-center gap-2">
                <Github className="h-4 w-4 text-ink" />
                Code Evidence
              </h4>
              <Badge tone={profile.githubConnected ? "green" : "slate"}>
                {profile.githubConnected ? "Verified" : "Unlinked"}
              </Badge>
            </div>

            {profile.githubUsername ? (
              <div className="space-y-3">
                <p className="text-xs text-ink-600">
                  Connected to <strong>@{profile.githubUsername}</strong>. Repository activity is verified for peer matching.
                </p>
                <a
                  href={`https://github.com/${profile.githubUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full"
                >
                  <Button variant="outline" size="sm" className="w-full flex items-center justify-center gap-1.5 text-xs">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open GitHub Profile
                  </Button>
                </a>
              </div>
            ) : isSelf ? (
              <div className="space-y-2">
                <p className="text-xs text-ink-500">
                  Link your GitHub username in profile settings to verify your commit history.
                </p>
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} className="w-full text-xs">
                  Link GitHub
                </Button>
              </div>
            ) : (
              <p className="text-xs text-ink-400 italic">No GitHub account linked by researcher.</p>
            )}
          </Card>
        </div>
      </div>

      {/* =========================================================================
          MODALS & DIALOGS
         ========================================================================= */}

      {/* 1. MEDIA VIEWER MODAL (LIGHTBOX) */}
      <MediaViewerModal
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        url={viewerUrl}
        title={viewerTitle}
      />

      {/* 2. CREATE POST MODAL */}
      <CreatePostModal
        open={createPostOpen}
        onClose={() => setCreatePostOpen(false)}
        userId={user?.id || ""}
        userName={profile.fullName}
        userRole={profile.role === "faculty" ? "Faculty Mentor" : "Student Researcher"}
        userInstitution={profile.institution}
        userAvatar={profile.photoUrl}
        projects={ownedProjects}
        onSubmit={handleCreatePost}
      />

      {/* 3. ADD / EDIT PROJECT MODAL */}
      <Modal
        open={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        title={editingProjectId ? "Edit Portfolio Project" : "Add Portfolio Project"}
        wide
      >
        <form onSubmit={handleSaveProject} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Project Title" required>
              <Input
                required
                placeholder="e.g. Autonomous Drone Navigation System"
                value={projTitle}
                onChange={(e) => setProjTitle(e.target.value)}
              />
            </Field>

            <Field label="Your Role in Project">
              <Input
                placeholder="e.g. Lead ML Engineer, Full Stack Architect"
                value={projRole}
                onChange={(e) => setProjRole(e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Project Status">
              <Select
                value={projStatus}
                onChange={(e) => setProjStatus(e.target.value as ProjectStatusType)}
              >
                <option value="completed">Completed</option>
                <option value="in_progress">In Active Development</option>
                <option value="deployed">Live Production</option>
                <option value="open_source">Open Source</option>
                <option value="archived">Archived</option>
              </Select>
            </Field>

            <Field label="Year">
              <Input
                type="number"
                min={2000}
                max={2030}
                value={projYear}
                onChange={(e) => setProjYear(Number(e.target.value))}
              />
            </Field>
          </div>

          <Field label="Technologies Used" hint="Type technology name and press Enter">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. React, PyTorch, Docker, Supabase"
                  value={projTechInput}
                  onChange={(e) => setProjTechInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && projTechInput.trim()) {
                      e.preventDefault();
                      if (!projTechList.includes(projTechInput.trim())) {
                        setProjTechList([...projTechList, projTechInput.trim()]);
                      }
                      setProjTechInput("");
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (projTechInput.trim() && !projTechList.includes(projTechInput.trim())) {
                      setProjTechList([...projTechList, projTechInput.trim()]);
                      setProjTechInput("");
                    }
                  }}
                >
                  Add
                </Button>
              </div>
              {projTechList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {projTechList.map((tech) => (
                    <span
                      key={tech}
                      className="inline-flex items-center gap-1 rounded-md bg-paper-100 px-2 py-1 text-xs font-semibold text-ink-800"
                    >
                      {tech}
                      <button
                        type="button"
                        onClick={() => setProjTechList(projTechList.filter((t) => t !== tech))}
                        className="text-ink-400 hover:text-red-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Field>

          <Field label="Project Description" required>
            <Textarea
              required
              rows={4}
              placeholder="Describe the problem, your architecture decisions, algorithms, and key measurable outcomes..."
              value={projDesc}
              onChange={(e) => setProjDesc(e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="GitHub Repository URL (Optional)">
              <Input
                placeholder="https://github.com/username/project"
                value={projGithub}
                onChange={(e) => setProjGithub(e.target.value)}
              />
            </Field>

            <Field label="Live Demo URL (Optional)">
              <Input
                placeholder="https://my-app.vercel.app"
                value={projLive}
                onChange={(e) => setProjLive(e.target.value)}
              />
            </Field>
          </div>

          {/* Project Screenshot / Media Upload */}
          <MediaUploadZone
            label="Project Screenshot / Banner"
            hint="Upload preview image (PNG, JPG, WebP up to 10MB)"
            userId={user?.id || ""}
            folder="projects"
            value={projImages[0] || ""}
            onChange={(url) => setProjImages(url ? [url] : [])}
            allowedTypes={["image/jpeg", "image/png", "image/webp"]}
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-ink-100">
            <Button type="button" variant="outline" onClick={() => setProjectModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={savingProject}>
              {editingProjectId ? "Save Changes" : "Add Project"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 4. ADD / EDIT CERTIFICATE MODAL */}
      <Modal
        open={certModalOpen}
        onClose={() => setCertModalOpen(false)}
        title={editingCertId ? "Edit Certification" : "Add Certificate / Credential"}
        wide
      >
        <form onSubmit={handleSaveCertificate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Certificate Name" required>
              <Input
                required
                placeholder="e.g. Deep Learning Specialization"
                value={certName}
                onChange={(e) => setCertName(e.target.value)}
              />
            </Field>

            <Field label="Issuing Organization" required>
              <Input
                required
                placeholder="e.g. DeepLearning.AI, Stanford Online, AWS"
                value={certIssuer}
                onChange={(e) => setCertIssuer(e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Issue Date / Year">
              <Input
                placeholder="e.g. 2026 or March 2026"
                value={certIssueDate}
                onChange={(e) => setCertIssueDate(e.target.value)}
              />
            </Field>

            <Field label="Credential ID (Optional)">
              <Input
                placeholder="e.g. AWS-SAA-294029"
                value={certCredentialId}
                onChange={(e) => setCertCredentialId(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Verification URL (Optional)">
            <Input
              placeholder="https://coursera.org/verify/..."
              value={certVerifyUrl}
              onChange={(e) => setCertVerifyUrl(e.target.value)}
            />
          </Field>

          {/* Certificate Media / PDF Upload */}
          <MediaUploadZone
            label="Certificate Document / Image Upload"
            hint="Upload image or PDF document for inline verification (up to 10MB)"
            userId={user?.id || ""}
            folder="certificates"
            value={certMediaUrl}
            onChange={setCertMediaUrl}
            onPreview={(url) => openViewer(url, certName || "Certificate Document")}
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-ink-100">
            <Button type="button" variant="outline" onClick={() => setCertModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={savingCert}>
              {editingCertId ? "Save Changes" : "Add Certificate"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 5. ADD / EDIT EXPERIENCE MODAL */}
      <Modal
        open={expModalOpen}
        onClose={() => setExpModalOpen(false)}
        title={editingExpId ? "Edit Experience" : "Add Work Experience / Internship"}
        wide
      >
        <form onSubmit={handleSaveExperience} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Organization / Company" required>
              <Input
                required
                placeholder="e.g. Google Research, Indian Institute of Science"
                value={expOrg}
                onChange={(e) => setExpOrg(e.target.value)}
              />
            </Field>

            <Field label="Role / Title" required>
              <Input
                required
                placeholder="e.g. Machine Learning Research Intern"
                value={expRole}
                onChange={(e) => setExpRole(e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Employment Type">
              <Select
                value={expType}
                onChange={(e) => setExpType(e.target.value as EmploymentType)}
              >
                <option value="Internship">Internship</option>
                <option value="Research Fellow">Research Fellow</option>
                <option value="Part-time">Part-time</option>
                <option value="Full-time">Full-time</option>
                <option value="Contract">Contract</option>
              </Select>
            </Field>

            <Field label="Duration">
              <Input
                placeholder="e.g. May 2025 - Aug 2025"
                value={expDuration}
                onChange={(e) => setExpDuration(e.target.value)}
              />
            </Field>

            <Field label="Location">
              <Input
                placeholder="e.g. Bangalore (Hybrid)"
                value={expLocation}
                onChange={(e) => setExpLocation(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Description & Key Responsibilities">
            <Textarea
              rows={4}
              placeholder="Detail your contributions, systems designed, metrics improved, and technologies leveraged..."
              value={expDesc}
              onChange={(e) => setExpDesc(e.target.value)}
            />
          </Field>

          {/* Supporting Document / Offer Letter / Proof */}
          <MediaUploadZone
            label="Supporting Document / Letter of Completion (Optional)"
            hint="Upload image or PDF proof (up to 10MB)"
            userId={user?.id || ""}
            folder="experience"
            value={expMediaUrl}
            onChange={setExpMediaUrl}
            onPreview={(url) => openViewer(url, `${expRole} @ ${expOrg} Document`)}
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-ink-100">
            <Button type="button" variant="outline" onClick={() => setExpModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={savingExp}>
              {editingExpId ? "Save Changes" : "Add Experience"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 6. ADD / EDIT EDUCATION MODAL */}
      <Modal
        open={eduModalOpen}
        onClose={() => setEduModalOpen(false)}
        title="Add Education Entry"
      >
        <form onSubmit={handleSaveEducation} className="space-y-4">
          <Field label="School / University" required>
            <Input
              required
              placeholder="e.g. Indian Institute of Technology Delhi"
              value={eduInst}
              onChange={(e) => setEduInst(e.target.value)}
            />
          </Field>

          <Field label="Degree" required>
            <Input
              required
              placeholder="e.g. Bachelor of Technology (B.Tech)"
              value={eduDegree}
              onChange={(e) => setEduDegree(e.target.value)}
            />
          </Field>

          <Field label="Field of Study / Major">
            <Input
              placeholder="e.g. Computer Science and Engineering"
              value={eduField}
              onChange={(e) => setEduField(e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Year">
              <Input
                type="number"
                value={eduStartYear}
                onChange={(e) => setEduStartYear(Number(e.target.value))}
              />
            </Field>
            <Field label="End Year (or Expected)">
              <Input
                type="number"
                value={eduEndYear}
                onChange={(e) => setEduEndYear(Number(e.target.value))}
              />
            </Field>
          </div>

          <Field label="Grade / CGPA (Optional)">
            <Input
              placeholder="e.g. 9.4 / 10 CGPA"
              value={eduGrade}
              onChange={(e) => setEduGrade(e.target.value)}
            />
          </Field>

          <Field label="Activities & Societies (Optional)">
            <Textarea
              rows={2}
              placeholder="e.g. Robotics Club Lead, ACM Student Chapter..."
              value={eduActivities}
              onChange={(e) => setEduActivities(e.target.value)}
            />
          </Field>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setEduModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={savingEdu}>
              Save Education
            </Button>
          </div>
        </form>
      </Modal>

      {/* 7. ADD ACHIEVEMENT MODAL */}
      <Modal
        open={achieveModalOpen}
        onClose={() => setAchieveModalOpen(false)}
        title="Add Honor, Award or Hackathon Win"
      >
        <form onSubmit={handleSaveAchievement} className="space-y-4">
          <Field label="Title / Award Name" required>
            <Input
              required
              placeholder="e.g. Smart India Hackathon Winner, Best Research Paper"
              value={achieveTitle}
              onChange={(e) => setAchieveTitle(e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Category">
              <Select
                value={achieveCategory}
                onChange={(e) => setAchieveCategory(e.target.value as any)}
              >
                <option value="hackathon">Hackathon</option>
                <option value="award">Academic Award</option>
                <option value="competition">Competition</option>
                <option value="scholarship">Scholarship</option>
                <option value="honor">Honor / Recognition</option>
              </Select>
            </Field>

            <Field label="Placement / Rank (Optional)">
              <Input
                placeholder="e.g. 1st Place Winner, Top 10"
                value={achieveRank}
                onChange={(e) => setAchieveRank(e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Issuer / Organization">
              <Input
                placeholder="e.g. Ministry of Education, IEEE"
                value={achieveIssuer}
                onChange={(e) => setAchieveIssuer(e.target.value)}
              />
            </Field>

            <Field label="Date / Year">
              <Input
                placeholder="e.g. 2026 or Nov 2025"
                value={achieveDate}
                onChange={(e) => setAchieveDate(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Brief Description">
            <Textarea
              rows={3}
              placeholder="What project or contribution earned this recognition?"
              value={achieveDesc}
              onChange={(e) => setAchieveDesc(e.target.value)}
            />
          </Field>

          <Field label="Project or Certificate URL (Optional)">
            <Input
              placeholder="https://..."
              value={achieveLink}
              onChange={(e) => setAchieveLink(e.target.value)}
            />
          </Field>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setAchieveModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={savingAchieve}>
              Save Achievement
            </Button>
          </div>
        </form>
      </Modal>

      {/* 8. EDIT PROFILE MODAL (Tabbed) */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Academic Profile" wide>
        <div className="flex items-center gap-1 border-b border-ink-200 mb-5 pb-px">
          {[
            { id: "about", label: "Identity & Headline" },
            { id: "academic", label: "Academic Standing" },
            { id: "links", label: "Social & Links" },
            { id: "preferences", label: "Teaming Settings" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setEditTab(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors ${
                editTab === tab.id
                  ? "bg-navy text-white"
                  : "text-ink-600 hover:bg-paper-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          {editTab === "about" && (
            <div className="space-y-4">
              <Field label="Full Name" required>
                <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </Field>

              <Field
                label="Professional Headline"
                hint="Summarize your academic focus, role, and skills (e.g. B.Tech Computer Science | ML Researcher)"
              >
                <Input value={headline} onChange={(e) => setHeadline(e.target.value)} />
              </Field>

              <Field label="Biography / Research Passions">
                <Textarea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Profile Photo URL">
                  <Input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} />
                </Field>
                <Field label="Cover Banner URL">
                  <Input value={coverPhotoUrl} onChange={(e) => setCoverPhotoUrl(e.target.value)} />
                </Field>
              </div>
            </div>
          )}

          {editTab === "academic" && (
            <div className="space-y-4">
              <Field label="Department">
                <Input value={department} onChange={(e) => setDepartment(e.target.value)} />
              </Field>

              <Field label="Degree Program">
                <Input value={degreeProgram} onChange={(e) => setDegreeProgram(e.target.value)} />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Academic Year (1-6)">
                  <Input
                    type="number"
                    min={1}
                    max={6}
                    value={academicYear || ""}
                    onChange={(e) => setAcademicYear(Number(e.target.value))}
                  />
                </Field>

                <Field label="Graduation Year">
                  <Input
                    type="number"
                    min={2020}
                    max={2035}
                    value={graduationYear || ""}
                    onChange={(e) => setGraduationYear(Number(e.target.value))}
                  />
                </Field>
              </div>
            </div>
          )}

          {editTab === "links" && (
            <div className="space-y-4">
              <Field label="GitHub Username" hint="Enter username only (e.g. torvalds)">
                <Input value={githubUsername} onChange={(e) => setGithubUsername(e.target.value)} />
              </Field>

              <Field label="LinkedIn Profile URL">
                <Input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} />
              </Field>

              <Field label="Personal Portfolio Website">
                <Input value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} />
              </Field>

              <Field label="Curriculum Vitae / Resume URL">
                <Input value={resumeUrl} onChange={(e) => setResumeUrl(e.target.value)} />
              </Field>
            </div>
          )}

          {editTab === "preferences" && (
            <div className="space-y-4">
              <Field label="Weekly Availability (Hours)">
                <Input
                  type="number"
                  min={0}
                  max={60}
                  value={availabilityHours}
                  onChange={(e) => setAvailabilityHours(Number(e.target.value))}
                />
              </Field>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="openToCollaboration"
                  checked={openToCollaboration}
                  onChange={(e) => setOpenToCollaboration(e.target.checked)}
                  className="rounded border-ink-300 text-navy"
                />
                <label htmlFor="openToCollaboration" className="text-xs font-semibold text-ink-700 cursor-pointer">
                  Open to new project invitations and team formation
                </label>
              </div>

              <Field label="Profile Visibility">
                <Select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as ProfileVisibility)}
                >
                  <option value="public">Public (Visible across university catalog)</option>
                  <option value="institution">Campus Only (Restricted to verified peers)</option>
                  <option value="private">Private (Only you and project teammates)</option>
                </Select>
              </Field>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-ink-100">
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save Profile
            </Button>
          </div>
        </form>
      </Modal>

      {/* 9. SKILLS MANAGER MODAL */}
      <Modal open={manageSkillsOpen} onClose={() => setManageSkillsOpen(false)} title="Manage Technical Skills" wide>
        <div className="space-y-4">
          <SkillSelector value={tempSkills} onChange={setTempSkills} />
          <div className="flex justify-end gap-2 pt-4 border-t border-ink-100">
            <Button variant="outline" onClick={() => setManageSkillsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSkills} loading={savingSkills}>
              Save Skills Catalog
            </Button>
          </div>
        </div>
      </Modal>

      {/* 10. INTERESTS MANAGER MODAL */}
      <Modal open={manageInterestsOpen} onClose={() => setManageInterestsOpen(false)} title="Research Interests">
        <div className="space-y-4">
          <TagSelector
            label="Focus Areas"
            availableOptions={RESEARCH_DOMAINS}
            value={tempInterests}
            onChange={setTempInterests}
          />
          <div className="flex justify-end gap-2 pt-4 border-t border-ink-100">
            <Button variant="outline" onClick={() => setManageInterestsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveInterests} loading={savingInterests}>
              Save Interests
            </Button>
          </div>
        </div>
      </Modal>

      {/* DIRECT PEER COLLABORATION MODAL (Req 1) */}
      <Modal
        open={directCollabOpen}
        onClose={() => setDirectCollabOpen(false)}
        title={`Connect & Collaborate with ${profile.fullName}`}
      >
        <form onSubmit={handleSendDirectCollab} className="space-y-4">
          <div className="rounded-lg bg-navy-50/60 p-3 text-xs text-navy-900 border border-navy-100">
            Connect directly to discuss project ideas, hackathons, team formation, and technical interests without needing to create a project first.
          </div>
          <Field label="Specialized Role / Area of Focus">
            <Select
              value={directCollabRole}
              onChange={(e) => setDirectCollabRole(e.target.value)}
            >
              {ROLE_TEMPLATES.map((r) => (
                <option key={r.name} value={r.name}>
                  {r.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Personalized Message" required>
            <Textarea
              rows={3}
              placeholder="Explain what topics, hackathons, or project domains you'd like to collaborate on..."
              value={directCollabMsg}
              onChange={(e) => setDirectCollabMsg(e.target.value)}
              required
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setDirectCollabOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={sendingDirectCollab}>
              <UserPlus className="h-4 w-4 mr-1.5" /> Send Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* FACULTY MENTORSHIP REQUEST MODAL (Req 7) */}
      <Modal
        open={mentorshipOpen}
        onClose={() => setMentorshipOpen(false)}
        title={`Request Academic Mentorship from Prof. ${profile.fullName}`}
      >
        <form onSubmit={handleSendMentorshipRequest} className="space-y-4">
          <div className="rounded-lg bg-brass-50 p-3 text-xs text-brass-900 border border-brass-200">
            Request faculty mentorship for an independent project, technical guidance, or hackathon team across departments within the academic institution.
          </div>
          <Field label="Guidance Domain / Research Topic" required>
            <Input
              value={mentorTopic}
              onChange={(e) => setMentorTopic(e.target.value)}
              placeholder="e.g. Distributed Computing, Deep Learning Models, Systems Security"
              required
            />
          </Field>
          <Field label="Explanation of Project & Support Required" required>
            <Textarea
              rows={4}
              value={mentorMsg}
              onChange={(e) => setMentorMsg(e.target.value)}
              placeholder="Describe your project, current milestone status, and the specific guidance or academic feedback you are seeking..."
              required
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setMentorshipOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={sendingMentorship}>
              <GraduationCap className="h-4 w-4 mr-1.5" /> Submit Mentorship Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* 11. INVITE TO PROJECT MODAL */}
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title={`Invite ${profile.fullName} to Team`}>
        <form onSubmit={handleSendInvite} className="space-y-4">
          <Field label="Select Research Project" required>
            <Select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} required>
              {ownedProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Invitation Message (Optional)">
            <Textarea
              rows={3}
              placeholder="Introduce your team and role expectations..."
              value={inviteMsg}
              onChange={(e) => setInviteMsg(e.target.value)}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={sendingInvite}>
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>

      {/* 12. REPORT MODAL */}
      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="Report Profile">
        <form onSubmit={handleReportUser} className="space-y-4">
          <Field label="Reason">
            <Select value={reportType} onChange={(e) => setReportType(e.target.value as ReportType)}>
              <option value="fake_profile">Impersonation or False Credentials</option>
              <option value="spam">Commercial Solicitation / Spam</option>
              <option value="inappropriate_content">Academic Misconduct or Inappropriate Content</option>
              <option value="other">Other Violation</option>
            </Select>
          </Field>
          <Field label="Details">
            <Textarea
              rows={3}
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              placeholder="Describe why this profile violates platform integrity..."
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setReportOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" type="submit" loading={submittingReport}>
              Submit Report
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
