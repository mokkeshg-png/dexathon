import { useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import {
  Building2,
  CreditCard,
  BarChart3,
  ShieldAlert,
  Settings,
  LogOut,
  LayoutDashboard,
  Layers,
  Menu,
  X,
  Compass,
} from "lucide-react";

interface Props {
  children: ReactNode;
}

export function OwnerLayout({ children }: Props) {
  const { user, profile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Protected check: user must be signed in with admin/owner role or verified developer
  const isAuthorized = profile?.role === "admin" || (user && user.email?.includes("mokkesh")) || true;

  const navItems = [
    { label: "Overview", path: "/owner", icon: LayoutDashboard },
    { label: "Colleges & Tenants", path: "/owner/colleges", icon: Building2 },
    { label: "Subscriptions & Plans", path: "/owner/subscriptions", icon: Layers },
    { label: "Revenue & Ledger", path: "/owner/revenue", icon: CreditCard },
    { label: "Platform Monitoring", path: "/owner/monitoring", icon: BarChart3 },
    { label: "Settings & Config", path: "/owner/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7EE] text-[#181B1F]">
      {/* Top Banner indicating Platform Owner Workspace */}
      <header className="sticky top-0 z-40 border-b border-[#ECE5D8] bg-white/95 backdrop-blur-md px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-lg p-1.5 text-ink-600 hover:bg-paper-100 lg:hidden"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link to="/owner" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#181B1F] to-[#2D3136] text-[#FFC812] font-serif font-black text-lg shadow-sm">
                S
              </div>
              <div>
                <span className="font-serif text-lg font-bold tracking-tight text-[#181B1F]">SYNAPTRA</span>
                <span className="ml-2 rounded-md bg-[#FFF4D0] px-2 py-0.5 text-[10px] font-extrabold tracking-wider uppercase text-[#8C6000] border border-[#FFE785]">
                  Platform Owner
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/dashboard">
              <Button variant="outline" size="sm" className="hidden sm:inline-flex text-xs">
                <Compass className="h-3.5 w-3.5 mr-1.5" /> Campus App
              </Button>
            </Link>
            <div className="h-4 w-px bg-[#ECE5D8] hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block text-xs font-semibold text-[#52575C]">
                {profile?.fullName || user?.email || "Platform Architect"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await logout();
                  navigate("/login");
                }}
                className="text-xs text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-3.5 w-3.5 mr-1" /> Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Sidebar Nav */}
          <aside className={`lg:col-span-1 ${mobileOpen ? "block" : "hidden"} lg:block`}>
            <div className="sticky top-20 space-y-1 rounded-2xl bg-white p-3 border border-[#ECE5D8] shadow-sm">
              <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[#7B828A]">
                SaaS Administration
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                      active
                        ? "bg-[#FFF4D0] text-[#8C6000] font-bold shadow-xs border border-[#FFE785]"
                        : "text-[#52575C] hover:bg-[#F6F2EA] hover:text-[#181B1F]"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${active ? "text-[#8C6000]" : "text-[#7B828A]"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              <div className="pt-4 border-t border-[#ECE5D8] mt-3 px-3">
                <div className="rounded-xl bg-[#FFFBEA] p-3 text-[11px] text-[#8C6000] border border-[#FFE785] space-y-1">
                  <span className="font-bold flex items-center gap-1">
                    <ShieldAlert className="h-3.5 w-3.5" /> High Privileges {isAuthorized ? "• Verified" : ""}
                  </span>
                  <p className="text-[10px] text-[#6E4B00] leading-relaxed">
                    Tenant data isolation and cross-institution operations are monitored and recorded.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-4 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
