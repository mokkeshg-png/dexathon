import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { resetPasswordEmail } from "@/lib/supabase-db";
import { Lock, Mail, AlertCircle, GraduationCap, BookOpen, Shield, Briefcase } from "lucide-react";

export type LoginRoleCategory = "student" | "faculty" | "admin" | "industry_partner";

export function Login() {
  const { login, logout, user, profile, isAdmin, ready } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const explicitRedirect = params.get("redirect");

  const [selectedRole, setSelectedRole] = useState<LoginRoleCategory>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine intelligent default home based on trusted role
  const getDefaultRoute = () => {
    if (explicitRedirect) return explicitRedirect;
    if (isAdmin) return "/admin"; // covers isOwner || isCollegeAdmin
    if (profile?.role === "industry_partner") return "/industry";
    if (profile?.role === "faculty") return "/faculty";
    return "/dashboard";
  };

  // Auto-redirect if user already has an active session
  useEffect(() => {
    if (ready && user && profile) {
      navigate(getDefaultRoute(), { replace: true });
    }
  }, [user, profile, ready, navigate]);

  // Forgot Password modal state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg, setForgotMsg] = useState<string>("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const authenticatedUser = await login(email, password);

      // Verify the user's actual database role against the selected interface tab
      const { fetchProfile } = await import("@/lib/supabase-db");
      const p = await fetchProfile(authenticatedUser.id);
      const actualRole = p?.role || "student";

      const roleMatches =
        (selectedRole === "admin" && (actualRole === "admin" || actualRole === "college_admin" || actualRole === "owner")) ||
        (selectedRole === "student" && actualRole === "student") ||
        (selectedRole === "faculty" && actualRole === "faculty") ||
        (selectedRole === "industry_partner" && actualRole === "industry_partner");

      if (!roleMatches) {
        await logout();
        setError(
          `Role Authorization Error: Your account is verified as "${actualRole.toUpperCase()}", but you attempted to sign in under "${selectedRole.toUpperCase().replace("_", " ")}". Please select the correct tab above.`
        );
        setLoading(false);
        return;
      }

      if (p?.status === "suspended") {
        await logout();
        setError("Account Suspended: Your university account has been deactivated by your College Administrator.");
        setLoading(false);
        return;
      }

      // Role confirmed -> route to designated destination
      if (explicitRedirect) {
        navigate(explicitRedirect);
      } else if (actualRole === "owner" || actualRole === "admin" || actualRole === "college_admin") {
        navigate("/admin");
      } else if (actualRole === "industry_partner") {
        navigate("/industry");
      } else if (actualRole === "faculty") {
        navigate("/faculty");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      setError(err?.message || "Invalid email or password. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      await resetPasswordEmail(forgotEmail);
      setForgotMsg("Password reset email sent. Check your inbox for instructions to reset your password.");
    } catch (err: any) {
      setForgotMsg(err?.message || "Failed to send reset email. Please verify your email address.");
    } finally {
      setForgotLoading(false);
    }
  };

  const roleTabInfo = {
    student: {
      label: "Student",
      icon: GraduationCap,
      description: "Sign in with your pre-authorized student institutional email",
    },
    faculty: {
      label: "Faculty",
      icon: BookOpen,
      description: "Access your supervisory workspace & academic courses",
    },
    admin: {
      label: "College Admin",
      icon: Shield,
      description: "Manage institutional users, student quotas, and campus branding",
    },
    industry_partner: {
      label: "Industry",
      icon: Briefcase,
      description: "Access corporate innovation challenges & campus partnerships",
    },
  };

  return (
    <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFC812] to-[#FAB23D] text-[#181B1F] font-serif font-extrabold text-2xl shadow-clay border border-[#FFE785]">
            S
          </div>
          <h2 className="mt-5 font-serif text-3xl font-extrabold tracking-tight text-[#181B1F]">
            Sign in to SYNAPTRA
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#5E646A]">
            Select your authorized institutional role to proceed
          </p>
        </div>

        {/* 4-Role Login Switcher */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#F3EEDF] p-1.5 rounded-2xl border border-[#ECE5D8] shadow-inner">
          {(["student", "faculty", "admin", "industry_partner"] as LoginRoleCategory[]).map((r) => {
            const active = selectedRole === r;
            const Icon = roleTabInfo[r].icon;
            return (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setSelectedRole(r);
                  setError(null);
                }}
                className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? "bg-white text-[#181B1F] shadow-clay border border-[#ECE5D8]"
                    : "text-[#7B828A] hover:text-[#181B1F] hover:bg-white/50"
                }`}
              >
                <Icon className={`h-4 w-4 mb-1 ${active ? "text-[#8C6000]" : "text-[#7B828A]"}`} />
                <span>{roleTabInfo[r].label}</span>
              </button>
            );
          })}
        </div>

        <Card className="shadow-card border-[#ECE5D8] rounded-3xl p-6 sm:p-8 bg-white">
          <div className="mb-5 pb-3 border-b border-[#F4EFE4] flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#BD7D14]">
                Logging In As:
              </span>
              <h3 className="font-serif text-lg font-bold text-[#181B1F] flex items-center gap-1.5 mt-0.5">
                {roleTabInfo[selectedRole].label}
              </h3>
            </div>
            <span className="text-[11px] text-[#7B828A] text-right max-w-[190px] leading-tight">
              {roleTabInfo[selectedRole].description}
            </span>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field
              label={
                selectedRole === "industry_partner"
                  ? "Authorized Corporate Email"
                  : selectedRole === "admin"
                  ? "College Administrator Email"
                  : "Authorized Institutional Email"
              }
              hint="Must match an authorized email assigned by your institution"
            >
              <div className="relative">
                <Input
                  type="email"
                  required
                  placeholder={
                    selectedRole === "industry_partner"
                      ? "lead@enterprise.com"
                      : selectedRole === "admin"
                      ? "admin@institution.ac.in"
                      : "name@institution.ac.in"
                  }
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                />
                <Mail className="absolute left-3 top-3 h-4 w-4 text-[#7B828A]" />
              </div>
            </Field>

            <Field label="Password">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                />
                <Lock className="absolute left-3 top-3 h-4 w-4 text-[#7B828A]" />
              </div>
            </Field>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="showPassword"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="rounded border-[#ECE5D8] text-[#8C6000] focus:ring-[#FFC812]"
              />
              <label htmlFor="showPassword" className="text-xs font-semibold text-[#52575C] cursor-pointer">
                Show Password
              </label>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => {
                  setForgotOpen(true);
                  setForgotEmail(email);
                  setForgotMsg("");
                }}
                className="font-bold text-[#8C6000] hover:text-[#6E4B00] hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <Button type="submit" variant="primary" loading={loading} className="w-full mt-2 shadow-clay">
              Sign In as {roleTabInfo[selectedRole].label}
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-[#5E646A]">
          Received an institutional invitation?{" "}
          <Link to="/register" className="font-bold text-[#8C6000] hover:underline">
            Activate your account →
          </Link>
        </p>
      </div>

      {/* Forgot Password Modal */}
      <Modal open={forgotOpen} onClose={() => setForgotOpen(false)} title="Reset Password">
        <form onSubmit={handleForgotSubmit} className="space-y-4">
          <p className="text-xs text-[#5E646A]">
            Enter your institutional email address and we will send you a secure link to reset your password.
          </p>
          {forgotMsg && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl">
              {forgotMsg}
            </div>
          )}
          <Field label="Institutional Email">
            <Input
              type="email"
              required
              placeholder="name@institution.ac.in"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-3 border-t border-[#ECE5D8]">
            <Button type="button" variant="outline" onClick={() => setForgotOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={forgotLoading} className="shadow-clay">
              Send Reset Link
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
