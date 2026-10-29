import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { updatePassword } from "@/lib/supabase-db";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Bell,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

export function Settings() {
  const { user, profile } = useAuth();

  const [notifEmail, setNotifEmail] = useState(true);
  const [notifInApp, setNotifInApp] = useState(true);
  const [notifMatch, setNotifMatch] = useState(true);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  if (!user) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-ink-500">Please sign in to configure account settings.</p>
        <Link to="/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (newPassword.length < 8) {
      setPwMsg({ type: "err", text: "Password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: "err", text: "Passwords do not match." });
      return;
    }
    setPwLoading(true);
    try {
      await updatePassword(newPassword);
      setPwMsg({ type: "ok", text: "Password updated successfully." });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPwMsg({ type: "err", text: err?.message || "Failed to update password." });
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="clay-page max-w-4xl space-y-6">
      {/* Header */}
      <div className="clay-welcome-banner clay-neural-bg p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest border"
              style={{ background: "linear-gradient(135deg,#FFF8DC,#FFE680)", color: "#7A4D00", borderColor: "#FFD040" }}
            >
              <SettingsIcon className="h-3.5 w-3.5 text-[#8C6000]" /> Account Preferences
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#181B1F] tracking-tight leading-tight">Settings & Preferences</h1>
          <p className="mt-2 text-xs sm:text-sm text-[#5E646A] leading-relaxed">
            Manage your account credentials and notification preferences
          </p>
        </div>
      </div>

      {/* Account Info */}
      <div className="clay-card p-6 sm:p-7 space-y-5">
        <h2 className="font-serif text-lg font-bold text-[#181B1F] border-b border-[#ECE5D8] pb-3">
          Academic Account Information
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[#8C8372] block mb-1 uppercase font-bold text-[10px]">Registered Email</span>
            <Input disabled value={user.email ?? ""} className="bg-[#FAF7EE] text-[#181B1F] font-semibold" />
          </div>
          <div>
            <span className="text-[#8C8372] block mb-1 uppercase font-bold text-[10px]">Platform Role</span>
            <div className="flex items-center gap-2 pt-2">
              <span className="clay-badge clay-badge-gold">
                {(profile?.role ?? "student").toUpperCase()}
              </span>
              <span className="text-[#8C8372] text-xs font-semibold">• Status: {profile ? "active" : "loading"}</span>
            </div>
          </div>
        </div>

        <div className="pt-3 flex justify-between items-center border-t border-[#ECE5D8]">
          <Link to={`/profile/${user.id}`}>
            <Button size="sm" variant="outline" className="text-xs">
              <User className="h-4 w-4 mr-1 text-[#8C6000]" /> View Public Profile
            </Button>
          </Link>
          <span className="text-[11px] text-[#8C8372] font-semibold">ID: {user.id.slice(0, 8)}…</span>
        </div>
      </div>

      {/* Change Password */}
      <div className="clay-card p-6 sm:p-7 space-y-5">
        <h2 className="font-serif text-lg font-bold text-[#181B1F] border-b border-[#ECE5D8] pb-3 flex items-center gap-2">
          <Shield className="h-4 w-4 text-[#8C6000]" />
          Change Password
        </h2>

        {pwMsg && (
          <div className={`rounded-xl p-3 text-xs border ${pwMsg.type === "ok" ? "bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold" : "bg-red-50 text-red-700 border-red-200"}`}>
            {pwMsg.text}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="New Password" hint="Min 8 characters">
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field>
            <Field label="Confirm New Password">
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field>
          </div>
          <Button type="submit" variant="primary" loading={pwLoading} size="sm">
            Update Password
          </Button>
        </form>
      </div>

      {/* Notifications Preferences */}
      <div className="clay-card p-6 space-y-4">
        <h2 className="font-serif text-lg font-bold text-[#181B1F] border-b border-[#ECE5D8] pb-2 flex items-center gap-2">
          <Bell className="h-4 w-4 text-[#8C6000]" />
          Notification Channels
        </h2>

        <div className="space-y-3 text-xs">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="font-bold text-[#181B1F] block">In-App Notification Alerts</span>
              <span className="text-[#5E646A]">Notify on join request decisions, task assignments, and discussions</span>
            </div>
            <input
              type="checkbox"
              checked={notifInApp}
              onChange={(e) => setNotifInApp(e.target.checked)}
              className="rounded text-[#FFC812] focus:ring-[#FFC812] h-4 w-4"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer border-t border-[#ECE5D8] pt-3">
            <div>
              <span className="font-bold text-[#181B1F] block">Email Digest & Updates</span>
              <span className="text-[#5E646A]">Receive milestone deadlines and faculty mentorship alerts via email</span>
            </div>
            <input
              type="checkbox"
              checked={notifEmail}
              onChange={(e) => setNotifEmail(e.target.checked)}
              className="rounded text-[#FFC812] focus:ring-[#FFC812] h-4 w-4"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer border-t border-[#ECE5D8] pt-3">
            <div>
              <span className="font-bold text-[#181B1F] block">AI Project Recommendations</span>
              <span className="text-[#5E646A]">Notify when new high-compatibility research initiatives are published</span>
            </div>
            <input
              type="checkbox"
              checked={notifMatch}
              onChange={(e) => setNotifMatch(e.target.checked)}
              className="rounded text-[#FFC812] focus:ring-[#FFC812] h-4 w-4"
            />
          </label>
        </div>
      </div>

      {/* Danger zone info */}
      <div className="clay-card p-6 space-y-3 border border-red-200 bg-gradient-to-br from-red-50/50 to-white">
        <div className="flex items-center gap-2 text-red-900 font-bold text-sm">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          Account Management
        </div>
        <p className="text-xs text-[#5E646A] leading-relaxed">
          To deactivate or delete your account, contact your institution administrator or the platform support team.
        </p>
        <div className="flex items-center gap-2 text-xs text-[#2E7D32] font-semibold">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Your data is stored securely in Supabase with row-level security.
        </div>
      </div>
    </div>
  );
}
