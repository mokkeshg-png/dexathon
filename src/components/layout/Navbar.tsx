import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import {
  Bell,
  Menu,
  X,
  User,
  LogOut,
  Settings,
  Shield,
  Briefcase,
  Users,
  Compass,
  LayoutDashboard,
  CheckCheck,
  ChevronDown,
  Search,
  Inbox,
  MessageSquare,
  PlusCircle,
  Zap,
} from "lucide-react";

export function Navbar() {
  const { user, profile, logout } = useAuth();
  const { items, unread, markRead, markAll } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const role = profile?.role ?? "student";

  const navLinks = useMemo(() => {
    if (!user) {
      return [
        { name: "Explore Projects", href: "/projects", icon: Compass },
        { name: "Find Collaborators", href: "/collaborators", icon: Users },
        { name: "Global Search", href: "/search", icon: Search },
      ];
    }

    if (role === "admin") {
      return [
        { name: "Admin Console", href: "/admin", icon: Shield },
        { name: "Projects Directory", href: "/projects", icon: Briefcase },
        { name: "Student Directory", href: "/collaborators", icon: Users },
        { name: "System Messages", href: "/messages", icon: MessageSquare },
        { name: "Search", href: "/search", icon: Search },
      ];
    }

    if (role === "faculty") {
      return [
        { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
        { name: "Research Projects", href: "/projects", icon: Briefcase },
        { name: "Student Talent", href: "/collaborators", icon: Users },
        { name: "Applications & Teams", href: "/requests", icon: Inbox },
        { name: "Messages", href: "/messages", icon: MessageSquare },
      ];
    }

    return [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Discover Projects", href: "/projects", icon: Compass },
      { name: "Collaborators", href: "/collaborators", icon: Users },
      { name: "My Teams & Requests", href: "/requests", icon: Inbox },
      { name: "Messages", href: "/messages", icon: MessageSquare },
    ];
  }, [user, role]);

  const isActiveRoute = (path: string) => {
    if (path === "/projects" && location.pathname.startsWith("/projects") && location.pathname !== "/projects/new") {
      return true;
    }
    if (path === "/collaborators" && location.pathname === "/collaborators") {
      return true;
    }
    return location.pathname === path;
  };

  const initials = profile?.fullName
    ? profile.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <header
      className="sticky top-0 z-40"
      style={{
        background: "rgba(255,252,244,0.94)",
        backdropFilter: "blur(16px) saturate(180%)",
        WebkitBackdropFilter: "blur(16px) saturate(180%)",
        borderBottom: "1px solid rgba(236,229,216,0.8)",
        boxShadow: "0 4px 20px rgba(215,195,160,0.14), inset 0 -1px 0 rgba(255,255,255,0.6)",
      }}
    >
      <div className="mx-auto flex h-[60px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-5">
          <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2.5 group flex-shrink-0">
            {/* Logo mark */}
            <div
              className="flex h-10 w-10 items-center justify-center rounded-[14px] font-serif font-black text-xl text-[#181B1F] transition-transform duration-200 group-hover:scale-105"
              style={{
                background: "linear-gradient(145deg, #FFD333 0%, #FFC812 45%, #F5BA00 100%)",
                boxShadow: "0 4px 14px rgba(255,184,0,0.38), inset 0 1px 2px rgba(255,255,255,0.75), inset 0 -1px 1px rgba(0,0,0,0.06)",
              }}
            >
              <Zap className="h-5 w-5" fill="currentColor" />
            </div>
            <div className="hidden sm:block">
              <span className="font-serif text-[1.15rem] font-extrabold tracking-tight text-[#181B1F] group-hover:text-[#8C6000] transition-colors">
                SYNAPTRA
              </span>
              <span className="block text-[8.5px] uppercase tracking-[0.22em] text-[#BD7D14] font-bold">
                Academic Collaboration
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = isActiveRoute(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`clay-nav-item ${active ? "clay-nav-item-active" : ""}`}
                >
                  <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${active ? "text-[#8C6000]" : "text-[#A09488]"}`} />
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* Search shortcut */}
              <Link
                to="/search"
                className="clay-search hidden sm:flex w-44 xl:w-56 cursor-pointer"
                title="Search projects, students, skills"
              >
                <Search className="h-3.5 w-3.5 text-[#A09488] flex-shrink-0" />
                <span className="text-[0.78rem] text-[#A09488] hidden xl:inline">Search platform...</span>
                <span className="text-[0.78rem] text-[#A09488] xl:hidden">Search...</span>
              </Link>

              {/* Create Project CTA */}
              <Link
                to="/projects/new"
                className="clay-btn clay-btn-primary hidden sm:inline-flex h-9 px-4 text-xs"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>{role === "faculty" ? "Create Project" : "New Project"}</span>
              </Link>

              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative flex h-9 w-9 items-center justify-center rounded-2xl border border-[#ECE5D8] bg-white text-[#7B828A] hover:text-[#181B1F] hover:border-[#FAB23D] transition-all cursor-pointer"
                  style={{ boxShadow: "0 2px 8px rgba(215,195,160,0.14), inset 0 1px 0 rgba(255,255,255,0.9)" }}
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {unread > 0 && (
                    <span className="clay-notif-dot absolute -top-1 -right-1 text-[9px]">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div
                    className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-3xl border border-[#ECE5D8] bg-white p-4 z-50 animate-scale-in"
                    style={{ boxShadow: "0 20px 56px rgba(215,195,160,0.32), inset 0 1px 2px rgba(255,255,255,0.95)" }}
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-[#F4EFE4]">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-[#181B1F] text-sm">Notifications</span>
                        <span className="clay-badge clay-badge-gold text-[10px]">{unread} new</span>
                      </div>
                      {unread > 0 && (
                        <button
                          type="button"
                          onClick={markAll}
                          className="flex items-center gap-1 text-xs text-[#8C6000] hover:underline font-bold cursor-pointer"
                        >
                          <CheckCheck className="h-3.5 w-3.5" />
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="mt-2 max-h-72 overflow-y-auto space-y-0.5">
                      {items.length === 0 ? (
                        <div className="py-8 text-center text-xs text-[#A09488]">
                          You're completely up to date!
                        </div>
                      ) : (
                        items.slice(0, 10).map((n) => (
                          <div
                            key={n.id}
                            className={`rounded-xl p-2.5 transition-colors cursor-pointer ${
                              !n.read ? "bg-[#FFF9EA] border border-[#FFE785]" : "hover:bg-[#FAF6ED]"
                            }`}
                            onClick={() => {
                              markRead(n.id);
                              setNotifOpen(false);
                              if (n.link) navigate(n.link);
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-semibold text-[#181B1F] leading-tight">{n.title}</p>
                              {!n.read && (
                                <span className="h-2 w-2 shrink-0 rounded-full bg-[#FFC812] mt-1 shadow-sm" />
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-[#7B828A] line-clamp-2 leading-relaxed">{n.message}</p>
                            <span className="mt-1 block text-[10px] text-[#A09488]">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="mt-2 pt-2 border-t border-[#F4EFE4] text-center">
                      <Link
                        to="/notifications"
                        onClick={() => setNotifOpen(false)}
                        className="text-xs font-bold text-[#8C6000] hover:underline"
                      >
                        View all activity & updates →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar Menu */}
              <div className="relative" ref={userRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-2xl p-1.5 border border-transparent hover:border-[#ECE5D8] transition-all focus:outline-none cursor-pointer hover:bg-[#FAF4E6]"
                >
                  {profile?.photoUrl ? (
                    <img
                      src={profile.photoUrl}
                      alt={profile.fullName}
                      className="h-8 w-8 rounded-full object-cover"
                      style={{ boxShadow: "0 0 0 2.5px #FFC812, 0 3px 10px rgba(255,184,0,0.3)" }}
                    />
                  ) : (
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full text-[#181B1F] font-bold text-xs"
                      style={{
                        background: "linear-gradient(145deg, #FFD333, #FFC812, #F5BA00)",
                        boxShadow: "0 0 0 2.5px rgba(255,200,18,0.3), 0 3px 10px rgba(255,184,0,0.3)",
                      }}
                    >
                      {initials}
                    </div>
                  )}
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-xs font-bold text-[#181B1F] max-w-[100px] truncate leading-tight">
                      {profile?.fullName?.split(" ")[0] || "User"}
                    </span>
                    <span className="text-[9px] text-[#BD7D14] font-bold uppercase tracking-wider">
                      {role}
                    </span>
                  </div>
                  <ChevronDown className="hidden md:block h-3 w-3 text-[#A09488]" />
                </button>

                {userMenuOpen && (
                  <div
                    className="absolute right-0 mt-2.5 w-64 rounded-3xl border border-[#ECE5D8] bg-white overflow-hidden z-50 animate-scale-in"
                    style={{ boxShadow: "0 20px 56px rgba(215,195,160,0.32), inset 0 1px 2px rgba(255,255,255,0.95)" }}
                  >
                    {/* User info header */}
                    <div
                      className="px-4 py-3.5"
                      style={{ background: "linear-gradient(135deg, #FFFEF5 0%, #FFF8D0 100%)", borderBottom: "1px solid #F4EFE4" }}
                    >
                      <div className="flex items-center gap-2.5">
                        {profile?.photoUrl ? (
                          <img src={profile.photoUrl} alt="" className="h-10 w-10 rounded-full object-cover border-2 border-[#FFC812]" />
                        ) : (
                          <div
                            className="h-10 w-10 rounded-full flex items-center justify-center text-[#181B1F] font-bold text-sm"
                            style={{ background: "linear-gradient(145deg, #FFD333, #FFC812, #F5BA00)" }}
                          >
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#181B1F] truncate">{profile?.fullName}</p>
                          <p className="text-[11px] text-[#7B828A] truncate">{user.email}</p>
                          <span className="mt-0.5 inline-flex clay-badge clay-badge-gold text-[9px]">{role.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="py-1.5 px-1.5 space-y-0.5">
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#2E2A23] hover:bg-[#FAF4E6] rounded-2xl transition-colors"
                      >
                        <User className="h-4 w-4 text-[#A09488]" />
                        My Portfolio & Profile
                      </Link>

                      <Link
                        to="/requests"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#2E2A23] hover:bg-[#FAF4E6] rounded-2xl transition-colors"
                      >
                        <Inbox className="h-4 w-4 text-[#A09488]" />
                        Invitations & Applications
                      </Link>

                      <Link
                        to="/messages"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#2E2A23] hover:bg-[#FAF4E6] rounded-2xl transition-colors"
                      >
                        <MessageSquare className="h-4 w-4 text-[#A09488]" />
                        Messages & Discussions
                      </Link>

                      {role === "admin" && (
                        <Link
                          to="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50 rounded-2xl transition-colors"
                        >
                          <Shield className="h-4 w-4 text-purple-500" />
                          Admin Console
                        </Link>
                      )}

                      <Link
                        to="/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#2E2A23] hover:bg-[#FAF4E6] rounded-2xl transition-colors"
                      >
                        <Settings className="h-4 w-4 text-[#A09488]" />
                        Account Settings
                      </Link>
                    </div>

                    <div className="px-1.5 pb-1.5 border-t border-[#F4EFE4]">
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                          navigate("/");
                        }}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 rounded-2xl transition-colors mt-1"
                      >
                        <LogOut className="h-4 w-4 text-red-400" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="clay-btn clay-btn-ghost h-9 px-4 text-xs text-[#181B1F]"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="clay-btn clay-btn-primary h-9 px-4 text-xs"
              >
                Join Platform
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden flex h-9 w-9 items-center justify-center rounded-2xl border border-[#ECE5D8] bg-white text-[#7B828A] hover:text-[#181B1F] hover:border-[#FAB23D] transition-all cursor-pointer"
            style={{ boxShadow: "0 2px 8px rgba(215,195,160,0.14)" }}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className="border-t border-[#ECE5D8] bg-white/96 backdrop-blur-md px-4 py-4 lg:hidden animate-fade-up"
          style={{ boxShadow: "0 8px 24px rgba(215,195,160,0.16)" }}
        >
          <div className="space-y-0.5">
            {navLinks.map((link) => {
              const active = isActiveRoute(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`clay-nav-item w-full ${active ? "clay-nav-item-active" : ""}`}
                >
                  <Icon className={`h-4 w-4 flex-shrink-0 ${active ? "text-[#8C6000]" : "text-[#A09488]"}`} />
                  {link.name}
                </Link>
              );
            })}
          </div>

          {user && (
            <div className="mt-4 pt-3 border-t border-[#F4EFE4] space-y-1.5">
              <Link
                to="/projects/new"
                onClick={() => setMobileMenuOpen(false)}
                className="clay-btn clay-btn-primary w-full h-10 text-xs"
              >
                <PlusCircle className="h-4 w-4" />
                {role === "faculty" ? "Create Research Project" : "New Project"}
              </Link>

              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="clay-nav-item w-full"
              >
                <User className="h-4 w-4 text-[#A09488]" />
                My Profile & Portfolio
              </Link>

              <button
                type="button"
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                  navigate("/");
                }}
                className="clay-nav-item w-full text-left text-rose-700 hover:bg-rose-50 hover:border-rose-200 cursor-pointer"
              >
                <LogOut className="h-4 w-4 text-rose-400" />
                Sign Out
              </button>
            </div>
          )}

          {!user && (
            <div className="mt-4 pt-3 border-t border-[#F4EFE4] grid grid-cols-2 gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="clay-btn clay-btn-outline h-10 text-xs w-full"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="clay-btn clay-btn-primary h-10 text-xs w-full"
              >
                Join Platform
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
