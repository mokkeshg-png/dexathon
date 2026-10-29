import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signUp } from "@/lib/supabase-db";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Field";
import { INSTITUTIONS, DEPARTMENTS, DESIGNATIONS } from "@/lib/taxonomies";
import { GraduationCap, Building2, AlertCircle, CheckCircle2 } from "lucide-react";

export function Register() {
  const navigate = useNavigate();

  const [role, setRole] = useState<"student" | "faculty">("student");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [institution, setInstitution] = useState(INSTITUTIONS[0]);
  const [customInstitution, setCustomInstitution] = useState("");
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [academicYear, setAcademicYear] = useState<number>(3);
  const [designation, setDesignation] = useState(DESIGNATIONS[0]);
  const [termsAgreed, setTermsAgreed] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError("Password must contain at least 1 uppercase letter and 1 number.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!termsAgreed) {
      setError("You must agree to the academic platform terms & ethics policy.");
      return;
    }

    setLoading(true);
    try {
      const finalInstitution = institution === "Other / Type your institution"
        ? (customInstitution.trim() || "Independent Institution")
        : institution;

      await signUp({
        email,
        password,
        fullName,
        role,
        institution: finalInstitution,
        department,
        academicYear: role === "student" ? Number(academicYear) : undefined,
        designation: role === "faculty" ? designation : undefined,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please verify your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFC812] to-[#FAB23D] text-[#181B1F] font-serif font-extrabold text-2xl shadow-clay border border-[#FFE785]">
            S
          </div>
          <h2 className="mt-5 font-serif text-3xl font-extrabold tracking-tight text-[#181B1F]">
            Create Academic Account
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#5E646A]">
            Join the verified academic collaboration network for researchers and mentors
          </p>
        </div>

        {success ? (
          <Card className="p-8 text-center space-y-4 border-[#FFE785] bg-gradient-to-br from-[#FFFBEA] to-white rounded-3xl shadow-card">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF4D0] text-[#8C6000] border border-[#FFE785]">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="font-serif text-2xl font-extrabold text-[#181B1F]">Registration Successful!</h3>
            <p className="text-xs sm:text-sm text-[#5E646A] max-w-md mx-auto">
              Check your email to confirm your account, then sign in to complete your profile setup.
            </p>
            <div className="pt-2">
              <Button onClick={() => navigate("/login")} variant="primary" size="lg" className="w-full sm:w-auto shadow-clay">
                Go to Sign In →
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="shadow-card border-[#ECE5D8] rounded-3xl p-6 sm:p-8 bg-white">
            {/* Role Selection Tabs */}
            <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-[#F6F2EA] p-1 border border-[#ECE5D8]">
              <button
                type="button"
                onClick={() => setRole("student")}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
                  role === "student"
                    ? "bg-[#FFC812] text-[#181B1F] shadow-xs border border-[#E6B30E]"
                    : "text-[#5E646A] hover:text-[#181B1F]"
                }`}
              >
                <GraduationCap className="h-4 w-4" />
                <span>Student / Researcher</span>
              </button>
              <button
                type="button"
                onClick={() => setRole("faculty")}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
                  role === "faculty"
                    ? "bg-[#FFC812] text-[#181B1F] shadow-xs border border-[#E6B30E]"
                    : "text-[#5E646A] hover:text-[#181B1F]"
                }`}
              >
                <Building2 className="h-4 w-4" />
                <span>Faculty / Mentor</span>
              </button>
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Full Name">
                  <Input
                    required
                    placeholder="e.g. Rahul Mehta"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </Field>

                <Field label="Institutional Email" hint="University domain preferred">
                  <Input
                    type="email"
                    required
                    placeholder="name@university.ac.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Password" hint="Min 8 chars, 1 uppercase, 1 number">
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Field>

                <Field label="Confirm Password">
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </Field>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="showPassword"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="rounded border-[#ECE5D8] text-[#8C6000] focus:ring-[#FFC812]"
                />
                <label htmlFor="showPassword" className="text-sm text-[#52575C] cursor-pointer">
                  Show Password
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Institution / University">
                  <Select
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                  >
                    {INSTITUTIONS.map((inst) => (
                      <option key={inst} value={inst}>{inst}</option>
                    ))}
                  </Select>
                </Field>

                <Field label="Academic Department">
                  <Select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </Select>
                </Field>
              </div>

              {institution === "Other / Type your institution" && (
                <Field label="Custom Institution Name">
                  <Input
                    required
                    placeholder="e.g. Indian Institute of Information Technology"
                    value={customInstitution}
                    onChange={(e) => setCustomInstitution(e.target.value)}
                  />
                </Field>
              )}

              {role === "student" ? (
                <Field label="Current Academic Year (1-6)">
                  <Select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(Number(e.target.value))}
                  >
                    <option value={1}>1st Year (Freshman)</option>
                    <option value={2}>2nd Year (Sophomore)</option>
                    <option value={3}>3rd Year (Junior)</option>
                    <option value={4}>4th Year (Senior)</option>
                    <option value={5}>5th Year (Postgraduate / M.Tech / M.Sc)</option>
                    <option value={6}>PhD Scholar / Doctoral Fellow</option>
                  </Select>
                </Field>
              ) : (
                <Field label="Academic Designation">
                  <Select
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                  >
                    {DESIGNATIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </Select>
                </Field>
              )}

              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#52575C]">
                  <input
                    type="checkbox"
                    checked={termsAgreed}
                    onChange={(e) => setTermsAgreed(e.target.checked)}
                    className="mt-0.5 rounded border-[#ECE5D8] text-[#8C6000] focus:ring-[#FFC812]"
                  />
                  <span>
                    I confirm that the academic credentials provided are accurate, and I agree to the platform's{" "}
                    <strong className="text-[#181B1F]">Research Ethics & Academic Conduct Guidelines</strong>.
                  </span>
                </label>
              </div>

              <Button type="submit" variant="primary" loading={loading} className="w-full mt-2 shadow-clay">
                Register as {role === "student" ? "Student" : "Faculty"}
              </Button>
            </form>
          </Card>
        )}

        <p className="text-center text-xs text-[#5E646A]">
          Already registered?{" "}
          <Link to="/login" className="font-bold text-[#8C6000] hover:text-[#6E4B00] hover:underline">
            Sign in to existing account
          </Link>
        </p>
      </div>
    </div>
  );
}
