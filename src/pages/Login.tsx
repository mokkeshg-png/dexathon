import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { resetPasswordEmail } from "@/lib/supabase-db";
import { Lock, Mail, AlertCircle, Eye, EyeOff } from "lucide-react";

export function Login() {
  const { login, logout, user, profile, ready } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const explicitRedirect = params.get("redirect");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  // Route purely by DB-verified role — no frontend input ever used
  const routeForRole = (role: string): string => {
    if (explicitRedirect) return explicitRedirect;
    switch (role) {
      case "owner":
      case "admin":
      case "college_admin": return "/admin";
      case "faculty":       return "/faculty";
      case "industry_partner": return "/industry";
      default:              return "/dashboard";
    }
  };

  // If already signed in, redirect immediately
  useEffect(() => {
    if (ready && user && profile) {
      navigate(routeForRole(profile.role ?? "student"), { replace: true });
    }
  }, [user, profile, ready]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const authUser = await login(email, password);
      const { fetchProfile } = await import("@/lib/supabase-db");
      const p = await fetchProfile(authUser.id);

      if (p?.status === "suspended") {
        await logout();
        setError("Your account has been suspended. Please contact your administrator.");
        return;
      }

      navigate(routeForRole(p?.role ?? "student"), { replace: true });
    } catch (err: any) {
      setError(err?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      await resetPasswordEmail(forgotEmail);
      setForgotMsg("Reset link sent — check your inbox.");
    } catch (err: any) {
      setForgotMsg(err?.message || "Could not send reset email.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo + title */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFC812] to-[#FAB23D] text-[#181B1F] font-serif font-extrabold text-2xl shadow-clay border border-[#FFE785]">
            S
          </div>
          <h2 className="mt-5 font-serif text-3xl font-extrabold tracking-tight text-[#181B1F]">
            Sign in to SYNAPTRA
          </h2>
          <p className="mt-2 text-sm text-[#5E646A]">
            Use your institutional email and password.
          </p>
        </div>

        {/* Login form */}
        <Card className="shadow-card border-[#ECE5D8] rounded-3xl p-6 sm:p-8 bg-white">
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Email">
              <div className="relative">
                <Input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@institution.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                />
                <Mail className="absolute left-3 top-3 h-4 w-4 text-[#7B828A] pointer-events-none" />
              </div>
            </Field>

            <Field label="Password">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-10"
                />
                <Lock className="absolute left-3 top-3 h-4 w-4 text-[#7B828A] pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-3 top-3 text-[#7B828A] hover:text-[#181B1F] transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => { setForgotOpen(true); setForgotEmail(email); setForgotMsg(""); }}
                className="text-xs font-bold text-[#8C6000] hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <Button type="submit" variant="primary" loading={loading} className="w-full shadow-clay font-bold">
              Sign In
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-[#5E646A]">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-bold text-[#8C6000] hover:underline">
            Create account
          </Link>
        </p>
      </div>

      {/* Forgot password modal */}
      <Modal open={forgotOpen} onClose={() => setForgotOpen(false)} title="Reset Password">
        <form onSubmit={handleForgot} className="space-y-4">
          <p className="text-xs text-[#5E646A]">
            Enter your email and we&apos;ll send you a reset link.
          </p>
          {forgotMsg && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl">
              {forgotMsg}
            </div>
          )}
          <Field label="Email">
            <Input
              type="email"
              required
              placeholder="you@institution.ac.in"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-3 border-t border-[#ECE5D8]">
            <Button type="button" variant="outline" onClick={() => setForgotOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={forgotLoading} className="shadow-clay">
              Send Reset Link
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
