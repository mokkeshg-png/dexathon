import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { fetchAllProfiles, fetchProjects } from "@/lib/supabase-db";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Field";
import type { Profile, Project } from "@/types";
import { Search as SearchIcon, Loader2, X } from "lucide-react";

type Tab = "students" | "faculty" | "projects";

function uniqueId(p: Profile) {
  const prefix = p.designation ? "FAC" : "STU";
  return `${prefix}-${p.userId.substring(0, 6).toUpperCase()}`;
}

export function Search() {
  const { profile: authProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab) || "students";
  const initialQuery = searchParams.get("q") || searchParams.get("domain") || "";

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>(["students", "faculty", "projects"].includes(initialTab) ? initialTab : "students");
  const [query, setQuery] = useState(initialQuery);
  const [skillFilter, setSkillFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [profs, projs] = await Promise.all([fetchAllProfiles(), fetchProjects()]);
      if (!cancelled) {
        setProfiles(profs);
        setProjects(projs);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const students = useMemo(() => profiles.filter(p => !p.designation && p.role !== "admin"), [profiles]);
  const faculty = useMemo(() => profiles.filter(p => !!p.designation), [profiles]);

  const allSkills = useMemo(() => {
    const set = new Set<string>();
    profiles.forEach(p => p.skills.forEach(s => set.add(s.skill)));
    return Array.from(set).sort();
  }, [profiles]);

  const allDepartments = useMemo(() => {
    const set = new Set<string>();
    profiles.forEach(p => { if (p.department) set.add(p.department); });
    return Array.from(set).sort();
  }, [profiles]);

  const q = query.toLowerCase().trim();

  const filteredStudents = useMemo(() => students.filter(p => {
    if (q && !p.fullName.toLowerCase().includes(q) && !p.department.toLowerCase().includes(q) && !p.skills.some(s => s.skill.toLowerCase().includes(q))) return false;
    if (skillFilter !== "all" && !p.skills.some(s => s.skill === skillFilter)) return false;
    if (deptFilter !== "all" && p.department !== deptFilter) return false;
    return true;
  }), [students, q, skillFilter, deptFilter]);

  const filteredFaculty = useMemo(() => faculty.filter(p => {
    if (q && !p.fullName.toLowerCase().includes(q) && !p.department.toLowerCase().includes(q) && !p.expertise.some(e => e.toLowerCase().includes(q))) return false;
    if (deptFilter !== "all" && p.department !== deptFilter) return false;
    return true;
  }), [faculty, q, deptFilter]);

  const filteredProjects = useMemo(() => projects.filter(p => {
    if (p.status === "removed") return false;
    if (p.visibility === "private" && p.ownerId !== authProfile?.id) return false;
    if (q && !p.title.toLowerCase().includes(q) && !p.requiredSkills.some(s => s.toLowerCase().includes(q)) && !p.tags.some(t => t.toLowerCase().includes(q))) return false;
    if (skillFilter !== "all" && !p.requiredSkills.includes(skillFilter)) return false;
    return true;
  }), [projects, q, skillFilter, authProfile]);

  const clearFilters = () => { setQuery(""); setSkillFilter("all"); setDeptFilter("all"); };
  const hasFilters = q || skillFilter !== "all" || deptFilter !== "all";

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "students", label: "Students", count: filteredStudents.length },
    { id: "faculty", label: "Faculty", count: filteredFaculty.length },
    { id: "projects", label: "Projects", count: filteredProjects.length },
  ];

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-navy" />
      </div>
    );
  }

  return (
    <div className="clay-page space-y-6">
      {/* Header Banner */}
      <div className="clay-welcome-banner clay-neural-bg p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span
            className="inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest border"
            style={{ background: "linear-gradient(135deg,#FFF8DC,#FFE680)", color: "#7A4D00", borderColor: "#FFD040" }}
          >
            <SearchIcon className="h-3.5 w-3.5" /> Campus Directory
          </span>
          <h1 className="mt-3 font-serif text-3xl sm:text-4xl font-extrabold tracking-tight text-[#181B1F] leading-tight">
            Search Campus Platform
          </h1>
          <p className="mt-2 text-sm text-[#5E646A] max-w-xl leading-relaxed">
            Find students, research faculty, active projects, technical competencies, and publications across all university departments.
          </p>
        </div>
      </div>

      {/* Search Bar Panel */}
      <div className="clay-panel p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Input
              placeholder="Search by name, skill, department, technology..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
            <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-[#A09488]" />
          </div>
          <Select value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)} className="sm:w-48">
            <option value="all">All Skills</option>
            {allSkills.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="sm:w-48">
            <option value="all">All Departments</option>
            {allDepartments.map(d => <option key={d} value={d}>{d}</option>)}
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
              <X className="h-3.5 w-3.5" /> Clear
            </Button>
          )}
        </div>

        {/* Clay Tabs */}
        <div className="flex gap-2 pt-2 border-t border-[#ECE5D8]">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`clay-btn text-xs px-4 py-2 ${
                tab === t.id
                  ? "clay-btn-primary"
                  : "clay-btn-outline"
              }`}
            >
              <span>{t.label}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                tab === t.id ? "bg-black/10 text-[#181B1F]" : "bg-[#ECE5D8] text-[#5E646A]"
              }`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {tab === "students" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.length === 0 ? (
            <div className="col-span-3 py-8">
              <EmptyState title="No Students Found" body="No students match your current search criteria. Try a different query." />
            </div>
          ) : filteredStudents.map(p => (
            <div key={p.id} className="clay-card p-5 space-y-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFF8DC] to-[#FFE680] text-[#7A4D00] border border-[#FFD040] shadow-xs font-serif font-bold text-lg overflow-hidden">
                    {p.photoUrl ? <img src={p.photoUrl} alt="" className="h-full w-full object-cover" /> : p.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-serif font-bold text-[#181B1F] truncate text-base leading-snug">{p.fullName}</h3>
                    <p className="text-xs text-[#5E646A] truncate">{p.department}</p>
                    <p className="text-[11px] text-[#8C8372]">{uniqueId(p)} • Year {p.academicYear ?? "—"}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.skills.slice(0, 4).map(s => (
                    <span key={s.skill} className="clay-chip text-[11px]">{s.skill}</span>
                  ))}
                  {p.skills.length > 4 && <span className="clay-chip text-[11px] text-[#8C8372]">+{p.skills.length - 4}</span>}
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-[#ECE5D8]">
                <span className="text-[11px] text-[#8C8372] font-medium">{p.pastProjects?.length || 0} projects</span>
                <Link to={`/profile/${p.userId}`}>
                  <Button size="sm" variant="outline" className="text-xs">View Profile</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "faculty" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFaculty.length === 0 ? (
            <div className="col-span-3 py-8">
              <EmptyState title="No Faculty Found" body="No faculty members match your search keywords or department filter." />
            </div>
          ) : filteredFaculty.map(p => (
            <div key={p.id} className="clay-card p-5 space-y-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FEF0D4] to-[#FAB23D]/30 text-[#8C6000] border border-[#FAB23D]/50 shadow-xs font-serif font-bold text-lg overflow-hidden">
                    {p.photoUrl ? <img src={p.photoUrl} alt="" className="h-full w-full object-cover" /> : p.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-serif font-bold text-[#181B1F] truncate text-base leading-snug">{p.fullName}</h3>
                    <p className="text-xs text-[#5E646A] truncate">{p.designation}</p>
                    <p className="text-[11px] text-[#8C8372]">{uniqueId(p)} • {p.department}</p>
                  </div>
                </div>
                {p.expertise.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.expertise.slice(0, 3).map(e => <span key={e} className="clay-badge clay-badge-brass">{e}</span>)}
                    {p.expertise.length > 3 && <span className="clay-chip text-[11px] text-[#8C8372]">+{p.expertise.length - 3}</span>}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-[#ECE5D8]">
                <div className="flex gap-2">
                  {p.openToMentoring && <span className="clay-badge clay-badge-green text-[10px]">Open to Mentor</span>}
                </div>
                <Link to={`/profile/${p.userId}`}>
                  <Button size="sm" variant="outline" className="text-xs">View Profile</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "projects" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.length === 0 ? (
            <div className="col-span-3 py-8">
              <EmptyState title="No Projects Found" body="No research projects match your search keywords or skill filter." />
            </div>
          ) : filteredProjects.map(proj => {
            const owner = profiles.find(p => p.userId === proj.ownerId);
            return (
              <div key={proj.id} className="clay-card p-5 space-y-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <Link to={`/projects/${proj.id}`} className="font-serif font-bold text-[#181B1F] hover:text-[#8C6000] text-base block truncate leading-snug">
                        {proj.title}
                      </Link>
                      <p className="text-xs text-[#5E646A] mt-1 line-clamp-2 leading-relaxed">{proj.shortDescription}</p>
                    </div>
                    <span className={`clay-badge shrink-0 text-[10px] ${proj.status === "open" ? "clay-badge-green" : "clay-badge-slate"}`}>
                      {proj.status}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {proj.requiredSkills.slice(0, 4).map(s => <span key={s} className="clay-chip text-[11px]">{s}</span>)}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#ECE5D8] text-[11px] text-[#8C8372]">
                  <span className="truncate max-w-[140px]">by {owner?.fullName ?? "Unknown"}</span>
                  <Link to={`/projects/${proj.id}`}>
                    <Button size="sm" variant="primary" className="text-xs">View Project</Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
