import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signUp } from "@/lib/supabase-db";
import { acceptInvitation, fetchColleges } from "@/services/saasService";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import {
  INSTITUTIONS,
  DEPARTMENTS,
  DEGREE_PROGRAMS,
  DESIGNATIONS,
  POPULAR_RECOMMENDED_SKILLS,
  RESEARCH_DOMAINS,
} from "@/lib/taxonomies";
import {
  GraduationCap,
  Sparkles,
  Building2,
  Shield,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
} from "lucide-react";

type RoleTab = "student" | "faculty" | "industry" | "admin";

const INDUSTRY_SECTORS = [
  "Artificial Intelligence & Machine Learning",
  "Software, SaaS & Cloud Computing",
  "FinTech & Digital Banking",
  "HealthTech, Pharma & Biotechnology",
  "Automotive, EV & Aerospace",
  "Robotics & Industrial Automation",
  "Cybersecurity & Information Security",
  "Semiconductor & Hardware Systems",
  "CleanTech & Renewable Energy",
  "Data Analytics & Big Data",
  "Telecommunications & 5G",
  "Other / Emerging Industry Sector",
];

const ADMIN_DESIGNATIONS = [
  "Dean of Academic Affairs",
  "Principal / Campus Director",
  "Dean of Research & Innovation",
  "Head of Department / Academic Chair",
  "Registrar / Campus Administrator",
  "Placement & Industry Relations Officer",
  "Other Campus Administrative Officer",
];

const SEMESTERS = [
  "Semester 1",
  "Semester 2",
  "Semester 3",
  "Semester 4",
  "Semester 5",
  "Semester 6",
  "Semester 7",
  "Semester 8",
  "Postgraduate / Research Semester",
];

export function Register() {
  const navigate = useNavigate();

  // Active Role Tab
  const [activeTab, setActiveTab] = useState<RoleTab>("student");

  // Common Authentication States
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ==========================================
  // A. STUDENT REGISTRATION FORM STATE
  // ==========================================
  const [studentFullName, setStudentFullName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentInstitution, setStudentInstitution] = useState("");
  const [studentDepartment, setStudentDepartment] = useState(DEPARTMENTS[0]);
  const [studentDegree, setStudentDegree] = useState(DEGREE_PROGRAMS[0]);
  const [studentYear, setStudentYear] = useState<number>(3);
  const [studentSemester, setStudentSemester] = useState(SEMESTERS[4]);
  const [studentId, setStudentId] = useState("");
  const [studentSkills, setStudentSkills] = useState<string[]>([
    "Python",
    "Machine Learning",
    "React",
  ]);
  const [customSkillInput, setCustomSkillInput] = useState("");
  const [studentInterests, setStudentInterests] = useState<string[]>([
    "Artificial Intelligence",
    "Data Science & Analytics",
  ]);
  const [customInterestInput, setCustomInterestInput] = useState("");

  // ==========================================
  // B. FACULTY REGISTRATION FORM STATE
  // ==========================================
  const [facultyFullName, setFacultyFullName] = useState("");
  const [facultyEmail, setFacultyEmail] = useState("");
  const [facultyInstitution, setFacultyInstitution] = useState("");
  const [facultyDepartment, setFacultyDepartment] = useState(DEPARTMENTS[0]);
  const [facultyDesignation, setFacultyDesignation] = useState(DESIGNATIONS[0]);
  const [facultyId, setFacultyId] = useState("");
  const [facultyExpertise, setFacultyExpertise] = useState<string[]>([
    "Machine Learning & Deep Learning",
    "Artificial Intelligence",
  ]);
  const [customExpertiseInput, setCustomExpertiseInput] = useState("");
  const [facultySubjects, setFacultySubjects] = useState<string[]>([
    "Data Structures & Algorithms",
    "Advanced Machine Learning",
  ]);
  const [customSubjectInput, setCustomSubjectInput] = useState("");

  // ==========================================
  // C. INDUSTRY REGISTRATION FORM STATE
  // ==========================================
  const [industryContactPerson, setIndustryContactPerson] = useState("");
  const [industryEmail, setIndustryEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industrySector, setIndustrySector] = useState(INDUSTRY_SECTORS[0]);
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [jobDesignation, setJobDesignation] = useState("");
  const [companyLocation, setCompanyLocation] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [technologies, setTechnologies] = useState<string[]>([
    "Cloud Computing",
    "Large Language Models (LLMs)",
    "Distributed Systems",
  ]);
  const [customTechInput, setCustomTechInput] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");

  // ==========================================
  // D. ADMIN REGISTRATION STATE (DIRECT SELF-REGISTRATION)
  // ==========================================
  const [adminEmail, setAdminEmail] = useState("");
  const [adminFullName, setAdminFullName] = useState("");
  const [adminInstitution, setAdminInstitution] = useState("");
  const [adminDesignation, setAdminDesignation] = useState(ADMIN_DESIGNATIONS[0]);
  const [adminPhone, setAdminPhone] = useState("");

  // Tag list helper: Add / Remove
  const toggleStudentSkill = (skill: string) => {
    if (studentSkills.includes(skill)) {
      setStudentSkills(studentSkills.filter((s) => s !== skill));
    } else {
      setStudentSkills([...studentSkills, skill]);
    }
  };

  const addCustomSkill = () => {
    const val = customSkillInput.trim();
    if (val && !studentSkills.includes(val)) {
      setStudentSkills([...studentSkills, val]);
      setCustomSkillInput("");
    }
  };

  const toggleStudentInterest = (interest: string) => {
    if (studentInterests.includes(interest)) {
      setStudentInterests(studentInterests.filter((i) => i !== interest));
    } else {
      setStudentInterests([...studentInterests, interest]);
    }
  };

  const addCustomInterest = () => {
    const val = customInterestInput.trim();
    if (val && !studentInterests.includes(val)) {
      setStudentInterests([...studentInterests, val]);
      setCustomInterestInput("");
    }
  };

  const addFacultyExpertise = () => {
    const val = customExpertiseInput.trim();
    if (val && !facultyExpertise.includes(val)) {
      setFacultyExpertise([...facultyExpertise, val]);
      setCustomExpertiseInput("");
    }
  };

  const addFacultySubject = () => {
    const val = customSubjectInput.trim();
    if (val && !facultySubjects.includes(val)) {
      setFacultySubjects([...facultySubjects, val]);
      setCustomSubjectInput("");
    }
  };

  const addTechnology = () => {
    const val = customTechInput.trim();
    if (val && !technologies.includes(val)) {
      setTechnologies([...technologies, val]);
      setCustomTechInput("");
    }
  };

  // Password validation helper
  const validatePasswordCommon = () => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long.";
    }
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return "Password must contain at least 1 uppercase letter and 1 number.";
    }
    if (password !== confirmPassword) {
      return "Passwords do not match.";
    }
    if (!termsAgreed) {
      return "Please accept the SYNAPTRA academic ethics and platform terms.";
    }
    return null;
  };

  // ==========================================
  // SUBMIT HANDLERS
  // ==========================================

  // 1. Submit Student Registration
  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const pwdErr = validatePasswordCommon();
    if (pwdErr) {
      setError(pwdErr);
      return;
    }

    if (!studentFullName.trim()) {
      setError("Please provide your full legal name.");
      return;
    }
    if (!studentEmail.trim() || !studentEmail.includes("@")) {
      setError("Please provide a valid institutional email address.");
      return;
    }
    if (!studentId.trim()) {
      setError("Please provide your Student Register Number / Student ID.");
      return;
    }

    const finalInstitution = studentInstitution.trim();

    const finalDegree = studentDegree;

    setLoading(true);
    try {
      const authUser = await signUp({
        email: studentEmail.trim().toLowerCase(),
        password,
        fullName: studentFullName.trim(),
        role: "student",
        institution: finalInstitution,
        department: studentDepartment,
        degreeProgram: finalDegree,
        academicYear: Number(studentYear),
        semester: studentSemester,
        studentId: studentId.trim(),
        skills: studentSkills,
        interests: studentInterests,
      });

      if (authUser?.id) {
        await acceptInvitation(studentEmail, authUser.id).catch(() => {});
      }

      setSuccessMessage(
        `Welcome to SYNAPTRA, ${studentFullName}! Your Student Research Account has been successfully activated.`
      );
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Submit Faculty Registration
  const handleFacultySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const pwdErr = validatePasswordCommon();
    if (pwdErr) {
      setError(pwdErr);
      return;
    }

    if (!facultyFullName.trim()) {
      setError("Please provide your full name.");
      return;
    }
    if (!facultyEmail.trim() || !facultyEmail.includes("@")) {
      setError("Please provide your official institutional email address.");
      return;
    }
    if (!facultyId.trim()) {
      setError("Please provide your official Faculty ID / Employee ID.");
      return;
    }

    const finalInstitution = facultyInstitution.trim();

    setLoading(true);
    try {
      const authUser = await signUp({
        email: facultyEmail.trim().toLowerCase(),
        password,
        fullName: facultyFullName.trim(),
        role: "faculty",
        institution: finalInstitution,
        department: facultyDepartment,
        designation: facultyDesignation,
        facultyId: facultyId.trim(),
        expertise: facultyExpertise,
        subjectsTaught: facultySubjects,
      });

      if (authUser?.id) {
        await acceptInvitation(facultyEmail, authUser.id).catch(() => {});
      }

      setSuccessMessage(
        `Welcome Prof. ${facultyFullName}! Your Faculty Mentor Account has been successfully registered.`
      );
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Submit Industry Registration
  const handleIndustrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const pwdErr = validatePasswordCommon();
    if (pwdErr) {
      setError(pwdErr);
      return;
    }

    if (!industryContactPerson.trim()) {
      setError("Please provide the primary contact person's name.");
      return;
    }
    if (!industryEmail.trim() || !industryEmail.includes("@")) {
      setError("Please provide your official business email address.");
      return;
    }
    if (!companyName.trim()) {
      setError("Please provide your Company / Organization name.");
      return;
    }
    if (!companyWebsite.trim()) {
      setError("Please provide your company official website.");
      return;
    }
    if (!jobDesignation.trim()) {
      setError("Please specify your professional job designation.");
      return;
    }
    if (!companyLocation.trim()) {
      setError("Please provide your company location (City, State / Country).");
      return;
    }
    if (!contactNumber.trim()) {
      setError("Please provide a valid contact telephone number.");
      return;
    }

    setLoading(true);
    try {
      const authUser = await signUp({
        email: industryEmail.trim().toLowerCase(),
        password,
        fullName: industryContactPerson.trim(),
        role: "industry_partner",
        companyName: companyName.trim(),
        industrySector: industrySector,
        website: companyWebsite.trim(),
        jobTitle: jobDesignation.trim(),
        location: companyLocation.trim(),
        phone: contactNumber.trim(),
        technologies: technologies,
        companyDescription: companyDescription.trim(),
      });

      if (authUser?.id) {
        await acceptInvitation(industryEmail, authUser.id).catch(() => {});
      }

      setSuccessMessage(
        `Welcome ${industryContactPerson}! Your Industry Partner Account for ${companyName} has been created.`
      );
    } catch (err: any) {
      setError(err?.message || "Industry registration failed. Please verify your details.");
    } finally {
      setLoading(false);
    }
  };

  // 4. College Admin Direct Registration Handler
  const handleAdminRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const pwdErr = validatePasswordCommon();
    if (pwdErr) {
      setError(pwdErr);
      return;
    }
    if (!adminFullName.trim()) {
      setError("Please provide your full administrator name.");
      return;
    }
    if (!adminEmail.trim() || !adminEmail.includes("@")) {
      setError("Please provide a valid official college email address.");
      return;
    }

    const institution = adminInstitution.trim();

    if (!institution) {
      setError("Please specify your college or university institution.");
      return;
    }

    setLoading(true);
    try {
      // Find matching college if exists in multi-tenant registry
      const cols = await fetchColleges();
      const emailDomain = adminEmail.trim().split("@")[1]?.toLowerCase();
      const matchedCol =
        cols.find((c) => c.name.toLowerCase() === institution.toLowerCase()) ||
        cols.find((c) => c.domain && emailDomain && c.domain.toLowerCase() === emailDomain) ||
        cols[0];

      await signUp({
        email: adminEmail.trim().toLowerCase(),
        password,
        fullName: adminFullName.trim(),
        role: "college_admin",
        institution,
        department: adminDesignation || "Campus Administration",
        phone: adminPhone || "",
        collegeId: matchedCol?.id,
      });

      setSuccessMessage(
        `College Administrator account created for ${institution}! You may now sign in using your official email to access the Campus Admin Console.`
      );
    } catch (err: any) {
      setError(err?.message || "Admin registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFC812] to-[#FAB23D] text-[#181B1F] font-serif font-extrabold text-2xl shadow-clay border border-[#FFE785]">
            S
          </div>
          <h2 className="mt-3 font-serif text-3xl font-extrabold tracking-tight text-[#181B1F]">
            Create Your SYNAPTRA Account
          </h2>
          <p className="text-xs sm:text-sm text-[#5E646A] max-w-md mx-auto">
            Select your academic or professional role to access personalized research workspaces and campus networks.
          </p>
        </div>

        {/* 4 Claymorphic Role Tabs */}
        <div className="clay-tabs p-1.5 grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-white border border-[#ECE5D8] rounded-2xl shadow-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab("student");
              setError(null);
            }}
            className={`clay-tab flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === "student" ? "clay-tab-active" : ""
            }`}
          >
            <GraduationCap className="h-4 w-4 shrink-0" />
            <span>Student</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("faculty");
              setError(null);
            }}
            className={`clay-tab flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === "faculty" ? "clay-tab-active" : ""
            }`}
          >
            <Sparkles className="h-4 w-4 shrink-0" />
            <span>Faculty</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("industry");
              setError(null);
            }}
            className={`clay-tab flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === "industry" ? "clay-tab-active" : ""
            }`}
          >
            <Building2 className="h-4 w-4 shrink-0" />
            <span>Industry</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("admin");
              setError(null);
            }}
            className={`clay-tab flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === "admin" ? "clay-tab-active" : ""
            }`}
          >
            <Shield className="h-4 w-4 shrink-0" />
            <span>Admin</span>
          </button>
        </div>

        {/* Registration Card / Success Screen */}
        {successMessage ? (
          <Card className="p-8 text-center space-y-4 border-[#FFE785] bg-gradient-to-br from-[#FFFBEA] to-white rounded-3xl shadow-card animate-scale-in">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF4D0] text-[#8C6000] border border-[#FFE785]">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="font-serif text-2xl font-extrabold text-[#181B1F]">
              Registration Complete!
            </h3>
            <p className="text-xs sm:text-sm text-[#5E646A] max-w-md mx-auto leading-relaxed">
              {successMessage}
            </p>
            <div className="pt-2">
              <Button
                onClick={() => navigate("/login")}
                variant="primary"
                size="lg"
                className="w-full sm:w-auto shadow-clay"
              >
                Proceed to Sign In →
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="shadow-card border-[#ECE5D8] rounded-3xl p-6 sm:p-8 bg-white">
            {/* Banner heading for the selected role */}
            <div className="mb-5 pb-3 border-b border-[#ECE5D8] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#8C6000] block">
                  Registration Category
                </span>
                <h3 className="font-serif text-lg font-bold text-[#181B1F]">
                  {activeTab === "student" && "Student Research Registration"}
                  {activeTab === "faculty" && "Faculty Mentor Registration"}
                  {activeTab === "industry" && "Industry Partner Registration"}
                  {activeTab === "admin" && "Institutional Administrator Access"}
                </h3>
              </div>
              <span className="clay-badge clay-badge-gold text-[10px] uppercase font-bold">
                {activeTab}
              </span>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-red-50 p-3.5 text-xs text-red-800 border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* ========================================================= */}
            {/* FORM A: STUDENT REGISTRATION FORM                         */}
            {/* ========================================================= */}
            {activeTab === "student" && (
              <form onSubmit={handleStudentSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Full Legal Name" required hint="As registered in your academic records">
                    <Input
                      required
                      placeholder="e.g. Ananya Sharma"
                      value={studentFullName}
                      onChange={(e) => setStudentFullName(e.target.value)}
                    />
                  </Field>

                  <Field label="Institutional / Student Email" required hint="Used for campus login">
                    <Input
                      required
                      type="email"
                      placeholder="student@institution.ac.in"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="College / University"
                    required
                    hint="Type your institution name or choose from suggestions"
                  >
                    <Input
                      list="student-institutions-list"
                      required
                      placeholder="Type your college or university name..."
                      value={studentInstitution}
                      onChange={(e) => setStudentInstitution(e.target.value)}
                      className="w-full font-medium"
                    />
                    <datalist id="student-institutions-list">
                      {INSTITUTIONS.filter((i) => !i.includes("Other")).map((inst) => (
                        <option key={inst} value={inst} />
                      ))}
                    </datalist>
                  </Field>

                  <Field label="Department" required>
                    <select
                      value={studentDepartment}
                      onChange={(e) => setStudentDepartment(e.target.value)}
                      className="w-full rounded-2xl border border-[#ECE5D8] bg-[#FFFDF8] px-3.5 py-2.5 text-xs text-[#181B1F] focus:border-[#FFC812] focus:outline-none"
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label="Degree / Course" required>
                    <select
                      value={studentDegree}
                      onChange={(e) => setStudentDegree(e.target.value)}
                      className="w-full rounded-2xl border border-[#ECE5D8] bg-[#FFFDF8] px-3.5 py-2.5 text-xs text-[#181B1F] focus:border-[#FFC812] focus:outline-none"
                    >
                      {DEGREE_PROGRAMS.map((prog) => (
                        <option key={prog} value={prog}>
                          {prog}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Year of Study" required>
                    <select
                      value={studentYear}
                      onChange={(e) => setStudentYear(Number(e.target.value))}
                      className="w-full rounded-2xl border border-[#ECE5D8] bg-[#FFFDF8] px-3.5 py-2.5 text-xs text-[#181B1F] focus:border-[#FFC812] focus:outline-none"
                    >
                      <option value={1}>1st Year (Freshman)</option>
                      <option value={2}>2nd Year (Sophomore)</option>
                      <option value={3}>3rd Year (Junior)</option>
                      <option value={4}>4th Year (Senior)</option>
                      <option value={5}>Postgraduate / Research</option>
                    </select>
                  </Field>

                  <Field label="Current Semester" required>
                    <select
                      value={studentSemester}
                      onChange={(e) => setStudentSemester(e.target.value)}
                      className="w-full rounded-2xl border border-[#ECE5D8] bg-[#FFFDF8] px-3.5 py-2.5 text-xs text-[#181B1F] focus:border-[#FFC812] focus:outline-none"
                    >
                      {SEMESTERS.map((sem) => (
                        <option key={sem} value={sem}>
                          {sem}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field
                  label="Student Register Number / Student ID"
                  required
                  hint="University Roll / Registration Number (e.g. RA2211003010123)"
                >
                  <Input
                    required
                    placeholder="e.g. 2024CS0142 / RA2211003010123"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                  />
                </Field>

                {/* Skills Selector */}
                <div className="space-y-2 p-3.5 rounded-2xl bg-[#FAF8F4] border border-[#ECE5D8]">
                  <label className="block text-[11px] font-bold text-[#5E4800] uppercase tracking-[0.14em]">
                    Skills & Technical proficiencies
                  </label>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {POPULAR_RECOMMENDED_SKILLS.slice(0, 10).map((skill) => {
                      const selected = studentSkills.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleStudentSkill(skill)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                            selected
                              ? "bg-[#FFC812] text-[#181B1F] shadow-xs border border-[#E6B000]"
                              : "bg-white text-[#52575C] border border-[#ECE5D8] hover:border-[#FFC812]"
                          }`}
                        >
                          {selected ? "✓ " : "+ "}
                          {skill}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Input
                      placeholder="Add custom skill (e.g. Rust, PyTorch, Docker)"
                      value={customSkillInput}
                      onChange={(e) => setCustomSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustomSkill();
                        }
                      }}
                      className="text-xs"
                    />
                    <Button type="button" size="sm" variant="secondary" onClick={addCustomSkill}>
                      <Plus className="h-3.5 w-3.5" /> Add
                    </Button>
                  </div>

                  {studentSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {studentSkills.map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFF4D0] border border-[#FFE785] text-[#8C6000] text-[11px] font-bold"
                        >
                          {s}
                          <button
                            type="button"
                            onClick={() => toggleStudentSkill(s)}
                            className="hover:text-red-700 p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Technical Interests */}
                <div className="space-y-2 p-3.5 rounded-2xl bg-[#FAF8F4] border border-[#ECE5D8]">
                  <label className="block text-[11px] font-bold text-[#5E4800] uppercase tracking-[0.14em]">
                    Research Interests & Focus Domains
                  </label>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {RESEARCH_DOMAINS.slice(0, 6).map((domain) => {
                      const selected = studentInterests.includes(domain);
                      return (
                        <button
                          key={domain}
                          type="button"
                          onClick={() => toggleStudentInterest(domain)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                            selected
                              ? "bg-[#FAB23D] text-[#181B1F] shadow-xs border border-[#BD7D14]"
                              : "bg-white text-[#52575C] border border-[#ECE5D8] hover:border-[#FAB23D]"
                          }`}
                        >
                          {selected ? "✓ " : "+ "}
                          {domain}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Input
                      placeholder="Add custom interest domain"
                      value={customInterestInput}
                      onChange={(e) => setCustomInterestInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustomInterest();
                        }
                      }}
                      className="text-xs"
                    />
                    <Button type="button" size="sm" variant="secondary" onClick={addCustomInterest}>
                      <Plus className="h-3.5 w-3.5" /> Add
                    </Button>
                  </div>
                </div>

                {/* Password Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Password" required hint="Min. 8 chars, 1 uppercase, 1 number">
                    <Input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </Field>

                  <Field label="Confirm Password" required>
                    <Input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </Field>
                </div>

                <div className="flex items-center justify-between text-xs text-[#5E646A]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={(e) => setShowPassword(e.target.checked)}
                      className="rounded text-[#FFC812]"
                    />
                    <span>Show Passwords</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={termsAgreed}
                      onChange={(e) => setTermsAgreed(e.target.checked)}
                      className="rounded text-[#FFC812]"
                    />
                    <span>Agree to Academic Conduct & Ethics</span>
                  </label>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  className="w-full mt-2 shadow-clay font-bold"
                >
                  Create Student Account
                </Button>
              </form>
            )}

            {/* ========================================================= */}
            {/* FORM B: FACULTY REGISTRATION FORM                         */}
            {/* ========================================================= */}
            {activeTab === "faculty" && (
              <form onSubmit={handleFacultySubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Faculty Full Name" required hint="e.g. Dr. Ramesh Sundaram">
                    <Input
                      required
                      placeholder="Dr. Ramesh Sundaram"
                      value={facultyFullName}
                      onChange={(e) => setFacultyFullName(e.target.value)}
                    />
                  </Field>

                  <Field label="Official Campus Email" required hint="Official .edu or .ac.in address">
                    <Input
                      required
                      type="email"
                      placeholder="professor@institution.ac.in"
                      value={facultyEmail}
                      onChange={(e) => setFacultyEmail(e.target.value)}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="College / Institution"
                    required
                    hint="Type your institution name or choose from suggestions"
                  >
                    <Input
                      list="faculty-institutions-list"
                      required
                      placeholder="Type your college or university name..."
                      value={facultyInstitution}
                      onChange={(e) => setFacultyInstitution(e.target.value)}
                      className="w-full font-medium"
                    />
                    <datalist id="faculty-institutions-list">
                      {INSTITUTIONS.filter((i) => !i.includes("Other")).map((inst) => (
                        <option key={inst} value={inst} />
                      ))}
                    </datalist>
                  </Field>

                  <Field label="Department" required>
                    <select
                      value={facultyDepartment}
                      onChange={(e) => setFacultyDepartment(e.target.value)}
                      className="w-full rounded-2xl border border-[#ECE5D8] bg-[#FFFDF8] px-3.5 py-2.5 text-xs text-[#181B1F] focus:border-[#FFC812] focus:outline-none"
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Academic Designation" required>
                    <select
                      value={facultyDesignation}
                      onChange={(e) => setFacultyDesignation(e.target.value)}
                      className="w-full rounded-2xl border border-[#ECE5D8] bg-[#FFFDF8] px-3.5 py-2.5 text-xs text-[#181B1F] focus:border-[#FFC812] focus:outline-none"
                    >
                      {DESIGNATIONS.map((desig) => (
                        <option key={desig} value={desig}>
                          {desig}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Faculty ID / Employee ID" required hint="Official campus identification code">
                    <Input
                      required
                      placeholder="e.g. FAC-2021-089"
                      value={facultyId}
                      onChange={(e) => setFacultyId(e.target.value)}
                    />
                  </Field>
                </div>

                {/* Areas of Expertise */}
                <div className="space-y-2 p-3.5 rounded-2xl bg-[#FAF8F4] border border-[#ECE5D8]">
                  <label className="block text-[11px] font-bold text-[#5E4800] uppercase tracking-[0.14em]">
                    Areas of Research Expertise
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add research domain (e.g. Distributed Computing, Computer Vision)"
                      value={customExpertiseInput}
                      onChange={(e) => setCustomExpertiseInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addFacultyExpertise();
                        }
                      }}
                      className="text-xs"
                    />
                    <Button type="button" size="sm" variant="secondary" onClick={addFacultyExpertise}>
                      <Plus className="h-3.5 w-3.5" /> Add
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {facultyExpertise.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E8F7EE] border border-[#B8E6C8] text-[#1B7339] text-[11px] font-bold"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => setFacultyExpertise(facultyExpertise.filter((x) => x !== item))}
                          className="hover:text-red-700 p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Subjects & Technical Interests */}
                <div className="space-y-2 p-3.5 rounded-2xl bg-[#FAF8F4] border border-[#ECE5D8]">
                  <label className="block text-[11px] font-bold text-[#5E4800] uppercase tracking-[0.14em]">
                    Subjects Taught & Technical Interests
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add subject (e.g. Neural Networks, Advanced Operating Systems)"
                      value={customSubjectInput}
                      onChange={(e) => setCustomSubjectInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addFacultySubject();
                        }
                      }}
                      className="text-xs"
                    />
                    <Button type="button" size="sm" variant="secondary" onClick={addFacultySubject}>
                      <Plus className="h-3.5 w-3.5" /> Add
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {facultySubjects.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFF4D0] border border-[#FFE785] text-[#8C6000] text-[11px] font-bold"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => setFacultySubjects(facultySubjects.filter((x) => x !== item))}
                          className="hover:text-red-700 p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Passwords */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Password" required hint="Min. 8 chars, 1 uppercase, 1 number">
                    <Input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </Field>

                  <Field label="Confirm Password" required>
                    <Input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </Field>
                </div>

                <div className="flex items-center justify-between text-xs text-[#5E646A]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={(e) => setShowPassword(e.target.checked)}
                      className="rounded text-[#FFC812]"
                    />
                    <span>Show Passwords</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={termsAgreed}
                      onChange={(e) => setTermsAgreed(e.target.checked)}
                      className="rounded text-[#FFC812]"
                    />
                    <span>Agree to Mentorship & Academic Integrity Terms</span>
                  </label>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  className="w-full mt-2 shadow-clay font-bold"
                >
                  Create Faculty Mentor Account
                </Button>
              </form>
            )}

            {/* ========================================================= */}
            {/* FORM C: INDUSTRY REGISTRATION FORM                        */}
            {/* ========================================================= */}
            {activeTab === "industry" && (
              <form onSubmit={handleIndustrySubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Primary Contact Person Name" required hint="Authorized representative">
                    <Input
                      required
                      placeholder="e.g. Priya Venkatesh"
                      value={industryContactPerson}
                      onChange={(e) => setIndustryContactPerson(e.target.value)}
                    />
                  </Field>

                  <Field label="Official Business Email" required hint="Company domain email">
                    <Input
                      required
                      type="email"
                      placeholder="contact@company.com"
                      value={industryEmail}
                      onChange={(e) => setIndustryEmail(e.target.value)}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Company / Organization Name" required>
                    <Input
                      required
                      placeholder="e.g. NeuralX Technologies Pvt Ltd"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </Field>

                  <Field label="Industry Sector / Domain" required>
                    <select
                      value={industrySector}
                      onChange={(e) => setIndustrySector(e.target.value)}
                      className="w-full rounded-2xl border border-[#ECE5D8] bg-[#FFFDF8] px-3.5 py-2.5 text-xs text-[#181B1F] focus:border-[#FFC812] focus:outline-none"
                    >
                      {INDUSTRY_SECTORS.map((sec) => (
                        <option key={sec} value={sec}>
                          {sec}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Company Official Website" required hint="e.g. https://neuralx.ai">
                    <Input
                      required
                      placeholder="https://company.com"
                      value={companyWebsite}
                      onChange={(e) => setCompanyWebsite(e.target.value)}
                    />
                  </Field>

                  <Field label="Your Job Designation" required hint="e.g. CTO, Head of AI Research, HR Lead">
                    <Input
                      required
                      placeholder="e.g. Director of Innovation"
                      value={jobDesignation}
                      onChange={(e) => setJobDesignation(e.target.value)}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Company Location / Office" required hint="City, State / Country">
                    <Input
                      required
                      placeholder="Bengaluru, Karnataka, India"
                      value={companyLocation}
                      onChange={(e) => setCompanyLocation(e.target.value)}
                    />
                  </Field>

                  <Field label="Contact Phone Number" required hint="Direct phone or mobile">
                    <Input
                      required
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                    />
                  </Field>
                </div>

                {/* Technologies & Expertise */}
                <div className="space-y-2 p-3.5 rounded-2xl bg-[#FAF8F4] border border-[#ECE5D8]">
                  <label className="block text-[11px] font-bold text-[#5E4800] uppercase tracking-[0.14em]">
                    Core Technologies & Areas of Collaboration
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add technology (e.g. LLMs, Cloud Infrastructure, Robotics)"
                      value={customTechInput}
                      onChange={(e) => setCustomTechInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTechnology();
                        }
                      }}
                      className="text-xs"
                    />
                    <Button type="button" size="sm" variant="secondary" onClick={addTechnology}>
                      <Plus className="h-3.5 w-3.5" /> Add
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {technologies.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F3EEFF] border border-[#C4B5FD] text-[#5B21B6] text-[11px] font-bold"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => setTechnologies(technologies.filter((x) => x !== item))}
                          className="hover:text-red-700 p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Company Description */}
                <Field
                  label="Company Overview & Campus Collaboration Objectives"
                  hint="Brief summary of company focus and types of student research projects you want to sponsor"
                >
                  <textarea
                    rows={3}
                    placeholder="Describe your organization, research interests, and innovation problem statements..."
                    value={companyDescription}
                    onChange={(e) => setCompanyDescription(e.target.value)}
                    className="clay-input text-xs"
                  />
                </Field>

                {/* Passwords */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Password" required hint="Min. 8 chars, 1 uppercase, 1 number">
                    <Input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </Field>

                  <Field label="Confirm Password" required>
                    <Input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </Field>
                </div>

                <div className="flex items-center justify-between text-xs text-[#5E646A]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={(e) => setShowPassword(e.target.checked)}
                      className="rounded text-[#FFC812]"
                    />
                    <span>Show Passwords</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={termsAgreed}
                      onChange={(e) => setTermsAgreed(e.target.checked)}
                      className="rounded text-[#FFC812]"
                    />
                    <span>Agree to Industry Partnership Terms</span>
                  </label>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  className="w-full mt-2 shadow-clay font-bold"
                >
                  Register Industry Partner Account
                </Button>
              </form>
            )}

            {/* ========================================================= */}
            {/* FORM D: SECURE ADMIN ONBOARDING / AUTHORIZATION           */}
            {/* ========================================================= */}
            {activeTab === "admin" && (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-[#FFFBEA] border border-[#FFE785] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#8C6000]">
                    <Shield className="h-4 w-4" />
                    <span>College Administrator Self-Registration</span>
                  </div>
                  <p className="text-xs text-[#7A5200] leading-relaxed">
                    Direct institutional onboarding for Deans, Principals, Directors, and Authorized Campus Leadership. After registration, you can access your Campus Admin Dashboard immediately. Authorizing campus members (Students, Faculty, Industry) will require an active institutional subscription plan.
                  </p>
                </div>

                <form onSubmit={handleAdminRegistrationSubmit} className="space-y-4">
                  <Field label="Administrator Full Name" required>
                    <Input
                      required
                      placeholder="Dr. R. Ramanathan"
                      value={adminFullName}
                      onChange={(e) => setAdminFullName(e.target.value)}
                    />
                  </Field>

                  <Field
                    label="Official College / Institutional Email"
                    required
                    hint="Must be your campus administration or official university domain"
                  >
                    <Input
                      type="email"
                      required
                      placeholder="admin@institution.edu"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                    />
                  </Field>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field
                      label="College / University"
                      required
                      hint="Type your institution name or choose from suggestions"
                    >
                      <Input
                        list="admin-institutions-list"
                        required
                        placeholder="Type your college or university name..."
                        value={adminInstitution}
                        onChange={(e) => setAdminInstitution(e.target.value)}
                        className="w-full font-medium"
                      />
                      <datalist id="admin-institutions-list">
                        {INSTITUTIONS.filter((i) => !i.includes("Other")).map((inst) => (
                          <option key={inst} value={inst} />
                        ))}
                      </datalist>
                    </Field>

                    <Field label="Administrative Designation" required>
                      <select
                        value={adminDesignation}
                        onChange={(e) => setAdminDesignation(e.target.value)}
                        className="w-full rounded-2xl border border-[#ECE5D8] bg-[#FFFDF8] px-3.5 py-2.5 text-xs text-[#181B1F] focus:border-[#FFC812] focus:outline-none"
                      >
                        {ADMIN_DESIGNATIONS.map((desig) => (
                          <option key={desig} value={desig}>
                            {desig}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <Field label="Official Contact Phone" hint="Optional campus direct line or office contact">
                    <Input
                      type="tel"
                      placeholder="+91 44 2257 8000"
                      value={adminPhone}
                      onChange={(e) => setAdminPhone(e.target.value)}
                    />
                  </Field>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Password" required hint="Min. 8 chars, 1 uppercase, 1 number">
                      <Input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </Field>

                    <Field label="Confirm Password" required>
                      <Input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </Field>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#5E646A]">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showPassword}
                        onChange={(e) => setShowPassword(e.target.checked)}
                        className="rounded text-[#FFC812]"
                      />
                      <span>Show Passwords</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        required
                        checked={termsAgreed}
                        onChange={(e) => setTermsAgreed(e.target.checked)}
                        className="rounded text-[#FFC812]"
                      />
                      <span>Confirm Institutional Authority</span>
                    </label>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={loading}
                    className="w-full mt-2 shadow-clay font-bold"
                  >
                    Register as College Administrator
                  </Button>
                </form>
              </div>
            )}
          </Card>
        )}

        {/* Footer Navigation */}
        <div className="text-center space-y-2">
          <p className="text-xs text-[#5E646A]">
            Already have an active account?{" "}
            <Link to="/login" className="font-bold text-[#8C6000] hover:underline">
              Sign in here →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
