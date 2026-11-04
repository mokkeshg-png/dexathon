import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Onboarding } from "./pages/Onboarding";
import { Dashboard } from "./pages/Dashboard";
import { FacultyDashboard } from "./pages/FacultyDashboard";
import { Projects } from "./pages/Projects";
import { ProjectCreate } from "./pages/ProjectCreate";
import { ProjectDetail } from "./pages/ProjectDetail";
import { ProjectRoom } from "./pages/ProjectRoom";
import { Collaborators } from "./pages/Collaborators";
import { Profile } from "./pages/Profile";
import { Admin } from "./pages/Admin";
import { Settings } from "./pages/Settings";
import { Search } from "./pages/Search";
import { Notifications } from "./pages/Notifications";
import { Requests } from "./pages/Requests";
import { Messages } from "./pages/Messages";
import { IndustryBridge } from "./pages/IndustryBridge";
import { CurriculumEvolution } from "./pages/CurriculumEvolution";
import { KnowledgeRecovery } from "./pages/KnowledgeRecovery";
import { Subscription } from "./pages/Subscription";
import { StudentGuidelines } from "./pages/StudentGuidelines";
import { AiAssistant } from "./components/ai/AiAssistant";
import { Button } from "./components/ui/Button";
import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center px-4">
      <div className="rounded-full bg-navy-50 p-4 text-navy">
        <span className="font-serif text-3xl font-bold">404</span>
      </div>
      <h2 className="font-serif text-2xl font-bold text-ink">Page Not Found</h2>
      <p className="text-sm text-ink-500 max-w-md">
        The requested university catalog page or research room does not exist.
      </p>
      <Link to="/">
        <Button>Return to Campus Home</Button>
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="relative min-h-screen bg-[#FAF7EE] font-sans text-ink overflow-x-hidden">
        {/* Subtle 3D/Claymorphic Ambient Background Accents */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden="true">
          {/* Top-left ambient orb */}
          <div className="absolute -top-16 -left-16 h-72 w-72 rounded-full bg-gradient-to-br from-[#FFE58F]/30 via-[#FAB23D]/20 to-transparent blur-3xl" />
          {/* Top-right floating orb */}
          <div className="absolute top-24 -right-12 h-64 w-64 rounded-full bg-gradient-to-bl from-[#FFC812]/25 via-[#FAB23D]/15 to-transparent blur-2xl" />
          {/* Floating subtle 3D clay sphere decoration (left) */}
          <div className="absolute top-72 -left-10 h-28 w-28 rounded-full bg-gradient-to-br from-white/80 via-[#F3EAD7] to-[#E2D5BE] shadow-[0_16px_32px_rgba(215,195,160,0.35),inset_-4px_-4px_8px_rgba(200,180,150,0.3),inset_4px_4px_8px_rgba(255,255,255,0.9)] opacity-70 hidden xl:block" />
          {/* Floating small clay bead (left) */}
          <div className="absolute top-[480px] left-8 h-8 w-8 rounded-full bg-gradient-to-br from-[#FFE799] to-[#FAB23D] shadow-[0_8px_16px_rgba(255,184,0,0.3),inset_-2px_-2px_4px_rgba(210,130,0,0.4),inset_2px_2px_4px_rgba(255,255,255,0.8)] opacity-80 hidden xl:block" />
          {/* Floating small clay bead (right) */}
          <div className="absolute top-44 right-10 h-9 w-9 rounded-full bg-gradient-to-br from-[#FFE799] to-[#FAB23D] shadow-[0_8px_16px_rgba(255,184,0,0.3),inset_-2px_-2px_4px_rgba(210,130,0,0.4),inset_2px_2px_4px_rgba(255,255,255,0.8)] opacity-80 hidden xl:block" />
          {/* Bottom-right ambient glow */}
          <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-gradient-to-tl from-[#FFC812]/20 via-[#FAB23D]/15 to-transparent blur-3xl" />
        </div>

        <div className="relative z-10 flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Discovery Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/collaborators" element={<Collaborators />} />
              <Route path="/search" element={<Search />} />
              <Route path="/profile/:id" element={<Profile />} />
              <Route path="/student-guidelines" element={<StudentGuidelines />} />

              {/* Authenticated Workspace Routes */}
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/faculty" element={<ProtectedRoute allowedRoles={["faculty", "admin", "college_admin", "owner"]}><FacultyDashboard /></ProtectedRoute>} />
              <Route path="/projects/new" element={<ProtectedRoute allowedRoles={["student", "faculty", "admin", "college_admin"]}><ProjectCreate /></ProtectedRoute>} />
              <Route path="/projects/:id/room" element={<ProtectedRoute><ProjectRoom /></ProtectedRoute>} />
              <Route path="/requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/industry" element={<ProtectedRoute allowedRoles={["student", "faculty", "industry_partner", "admin", "college_admin", "owner"]}><IndustryBridge /></ProtectedRoute>} />
              <Route path="/curriculum" element={<ProtectedRoute allowedRoles={["faculty", "college_admin", "admin"]}><CurriculumEvolution /></ProtectedRoute>} />
              <Route path="/recovery" element={<ProtectedRoute allowedRoles={["student", "faculty", "admin", "college_admin"]}><KnowledgeRecovery /></ProtectedRoute>} />

              {/* College Admin Console */}
              <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
              <Route path="/subscription" element={<ProtectedRoute requireAdmin><Subscription /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <AiAssistant />
          <Footer />
        </div>
      </div>
    </BrowserRouter>
  );
}
