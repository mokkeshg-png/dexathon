import { type ReactNode } from "react";
import { Navigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { PlatformRole } from "@/types";
import { Lock, ShieldAlert, AlertTriangle, ArrowLeft } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: PlatformRole[];
  requireOwner?: boolean;
  requireAdmin?: boolean;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  requireOwner = false,
  requireAdmin = false,
}: ProtectedRouteProps) {
  const { ready, user, profile, isOwner, isAdmin, isSuspended } = useAuth();
  const location = useLocation();

  // 1. While auth state is restoring from Supabase session
  if (!ready) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#181B1F] border-t-[#FFC812]" />
        <p className="text-xs text-[#7B828A] font-medium">Verifying institutional credentials...</p>
      </div>
    );
  }

  // 2. Unauthenticated user -> redirect to Login with return path
  if (!user) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${returnUrl}`} replace />;
  }

  // 3. Suspended account -> prevent access to all protected resources
  if (isSuspended) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card className="max-w-md p-6 sm:p-8 text-center space-y-4 border-red-200 bg-white shadow-card rounded-3xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-200">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#181B1F]">Account Suspended</h2>
          <p className="text-xs sm:text-sm text-[#5E646A] leading-relaxed">
            Your university account has been suspended by your College Administrator or Platform Security. Please contact your campus IT administrator for resolution.
          </p>
          <div className="pt-2">
            <Link to="/login">
              <Button variant="outline" size="sm">
                Return to Login
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // 4. Platform Owner requirement
  if (requireOwner && !isOwner) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card className="max-w-md p-6 sm:p-8 text-center space-y-4 border-[#ECE5D8] bg-white shadow-card rounded-3xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF4D0] text-[#8C6000] border border-[#FFE785]">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#181B1F]">Platform Owner Access Required</h2>
          <p className="text-xs sm:text-sm text-[#5E646A] leading-relaxed">
            The requested workspace requires verified SaaS Platform Owner privileges. This administrative area is restricted from ordinary campus accounts.
          </p>
          <div className="pt-2 flex justify-center gap-2">
            <Link to="/dashboard">
              <Button variant="primary" size="sm">
                <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Campus Home
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // 5. Admin requirement (Platform Owner or College Admin)
  if (requireAdmin && !isAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card className="max-w-md p-6 sm:p-8 text-center space-y-4 border-[#ECE5D8] bg-white shadow-card rounded-3xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-700 border border-purple-200">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#181B1F]">Administrative Access Restricted</h2>
          <p className="text-xs sm:text-sm text-[#5E646A] leading-relaxed">
            This console is reserved exclusively for College Administrators and verified campus leadership.
          </p>
          <div className="pt-2 flex justify-center gap-2">
            <Link to="/dashboard">
              <Button variant="primary" size="sm">
                <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Return to Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // 6. Role-specific check if allowedRoles is provided
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = profile?.role || "student";
    const hasRole = allowedRoles.includes(userRole as PlatformRole) || isOwner;

    if (!hasRole) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center p-4">
          <Card className="max-w-md p-6 sm:p-8 text-center space-y-4 border-[#ECE5D8] bg-white shadow-card rounded-3xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 border border-amber-200">
              <Lock className="h-7 w-7" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#181B1F]">Role Authorization Required</h2>
            <p className="text-xs sm:text-sm text-[#5E646A] leading-relaxed">
              Your account role (<strong>{userRole}</strong>) does not have permission to view this module. Authorized roles: {allowedRoles.join(", ")}.
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <Link to="/dashboard">
                <Button variant="primary" size="sm">
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Return to Dashboard
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      );
    }
  }

  // Authorized -> render child tree
  return <>{children}</>;
}
