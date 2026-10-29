import { useState, useMemo } from "react";
import type { Profile } from "@/types";
import { ROLE_TEMPLATES } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Badge, Card } from "@/components/ui/Card";
import { INSTITUTIONS } from "@/lib/taxonomies";
import { Search, Download } from "lucide-react";

export function FacultyStudentDirectory({ profiles }: { profiles: Profile[] }) {
  const [query, setQuery] = useState("");
  const [selectedInstitution, setSelectedInstitution] = useState<string>("all");
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [selectedRole, setSelectedTechnicalRole] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");

  // Only student researchers for academic cohort monitoring
  const studentProfiles = useMemo(() => {
    return profiles.filter((p) => !p.designation && p.role !== "faculty");
  }, [profiles]);

  // Unique departments
  const departments = useMemo(() => {
    return Array.from(new Set(studentProfiles.map((p) => p.department).filter(Boolean))).sort();
  }, [studentProfiles]);

  const filteredStudents = useMemo(() => {
    return studentProfiles.filter((p) => {
      if (query.trim()) {
        const q = query.toLowerCase();
        const match =
          p.fullName.toLowerCase().includes(q) ||
          p.department.toLowerCase().includes(q) ||
          p.institution.toLowerCase().includes(q) ||
          (p.classSection && p.classSection.toLowerCase().includes(q)) ||
          p.skills.some((s) => s.skill.toLowerCase().includes(q)) ||
          p.interests.some((i) => i.toLowerCase().includes(q)) ||
          p.preferredRoles.some((r) => r.toLowerCase().includes(q));
        if (!match) return false;
      }
      if (selectedInstitution !== "all" && p.institution !== selectedInstitution) return false;
      if (selectedDept !== "all" && p.department !== selectedDept) return false;
      if (selectedYear !== "all" && String(p.academicYear) !== selectedYear) return false;

      if (selectedRole !== "all") {
        const tr = selectedRole.toLowerCase();
        const matchesRole =
          p.preferredRoles.some((r) => r.toLowerCase().includes(tr)) ||
          (p.headline && p.headline.toLowerCase().includes(tr)) ||
          (tr.includes("frontend") && p.skills.some((s) => ["react", "vue", "angular", "css", "html", "tailwind"].some((k) => s.skill.toLowerCase().includes(k)))) ||
          (tr.includes("backend") && p.skills.some((s) => ["node", "express", "django", "fastapi", "spring", "go", "python"].some((k) => s.skill.toLowerCase().includes(k)))) ||
          (tr.includes("ai") && p.skills.some((s) => ["python", "pytorch", "tensorflow", "ml", "nlp"].some((k) => s.skill.toLowerCase().includes(k)))) ||
          (tr.includes("database") && p.skills.some((s) => ["sql", "postgres", "mongodb"].some((k) => s.skill.toLowerCase().includes(k))));
        if (!matchesRole) return false;
      }

      return true;
    });
  }, [studentProfiles, query, selectedInstitution, selectedDept, selectedYear, selectedRole]);

  // Export Permitted Student Info to CSV (Req 2)
  const handleExportCsv = () => {
    const headers = [
      "Student ID",
      "Full Name",
      "Institution",
      "Department",
      "Academic Year",
      "Class / Section",
      "Preferred Roles",
      "Verified Skills",
      "Research Interests",
      "GitHub Connected",
      "Profile Completeness",
    ];

    const rows = filteredStudents.map((s) => [
      `"STU-${s.userId.substring(0, 6).toUpperCase()}"`,
      `"${s.fullName.replace(/"/g, '""')}"`,
      `"${s.institution.replace(/"/g, '""')}"`,
      `"${s.department.replace(/"/g, '""')}"`,
      s.academicYear ? `"${s.academicYear} Year"` : `"N/A"`,
      `"${(s.classSection || "General").replace(/"/g, '""')}"`,
      `"${s.preferredRoles.join(", ").replace(/"/g, '""')}"`,
      `"${s.skills.map((sk) => sk.skill).join("; ").replace(/"/g, '""')}"`,
      `"${s.interests.join("; ").replace(/"/g, '""')}"`,
      s.githubConnected ? `"Yes"` : `"No"`,
      `"${s.profileCompleteness}%"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `faculty_student_directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <Card className="p-4 space-y-3 border-ink-100 bg-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Input
              placeholder="Search student by name, department, class, section, skill, or role..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 text-xs"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-400" />
          </div>
          <Button onClick={handleExportCsv} size="sm" variant="outline" className="text-xs shrink-0 flex items-center gap-1.5">
            <Download className="h-3.5 w-3.5" /> Export to CSV
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          <Select value={selectedInstitution} onChange={(e) => setSelectedInstitution(e.target.value)} className="text-xs">
            <option value="all">All Colleges / Institutions</option>
            {INSTITUTIONS.map((inst) => (
              <option key={inst} value={inst}>
                {inst}
              </option>
            ))}
          </Select>

          <Select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="text-xs">
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>

          <Select value={selectedRole} onChange={(e) => setSelectedTechnicalRole(e.target.value)} className="text-xs">
            <option value="all">All Target Roles</option>
            {ROLE_TEMPLATES.map((r) => (
              <option key={r.name} value={r.name}>
                {r.name}
              </option>
            ))}
          </Select>

          <Select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="text-xs">
            <option value="all">All Academic Years</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </Select>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-ink-50 text-[11px] text-ink-500">
          <span>Found {filteredStudents.length} eligible registered students</span>
          {(query || selectedInstitution !== "all" || selectedDept !== "all" || selectedRole !== "all" || selectedYear !== "all") && (
            <button
              onClick={() => {
                setQuery("");
                setSelectedInstitution("all");
                setSelectedDept("all");
                setSelectedTechnicalRole("all");
                setSelectedYear("all");
              }}
              className="text-navy font-semibold hover:underline"
            >
              Reset filters
            </button>
          )}
        </div>
      </Card>

      {/* Student Roster Table */}
      <div className="rounded-xl border border-ink-100 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-paper-50 text-ink-500 uppercase tracking-wider font-semibold border-b border-ink-100 text-[10px]">
              <tr>
                <th className="p-3.5 pl-4">Student</th>
                <th className="p-3.5">Department & Year</th>
                <th className="p-3.5">Specialties & Preferred Roles</th>
                <th className="p-3.5">Demonstrated Skills</th>
                <th className="p-3.5 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 text-ink-700">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-ink-400">
                    No registered students found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-paper-50/60 transition">
                    <td className="p-3.5 pl-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-navy-50 text-navy font-bold flex items-center justify-center shrink-0 text-xs">
                          {s.fullName.charAt(0)}
                        </div>
                        <div>
                          <a href={`/profile/${s.userId}`} className="font-semibold text-ink hover:text-navy hover:underline">
                            {s.fullName}
                          </a>
                          <p className="text-[10px] text-ink-400">STU-{s.userId.substring(0, 6).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <p className="font-medium text-ink">{s.department}</p>
                      <p className="text-[10px] text-ink-400">
                        {s.academicYear ? `${s.academicYear} Year` : "Enrolled"} • {s.classSection || "Sec A"}
                      </p>
                    </td>
                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1">
                        {s.preferredRoles.slice(0, 2).map((r) => (
                          <Badge key={r} tone="navy">
                            {r}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1">
                        {s.skills.slice(0, 3).map((sk) => (
                          <Badge key={sk.skill} tone="slate">
                            {sk.skill}
                          </Badge>
                        ))}
                        {s.skills.length > 3 && (
                          <span className="text-[10px] text-ink-400 self-center">+{s.skills.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 pr-4 text-right">
                      <a href={`/profile/${s.userId}`} className="text-navy font-semibold hover:underline">
                        View Portfolio →
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
