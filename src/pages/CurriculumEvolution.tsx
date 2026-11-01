import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { fetchCurriculumReports } from "@/services/saasService";
import type { CurriculumGapReport } from "@/types";
import { useToast } from "@/context/ToastContext";
import {
  GraduationCap,
  TrendingDown,
  TrendingUp,
  BookOpen,
  Download,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export function CurriculumEvolution() {
  const toast = useToast();
  const [reports, setReports] = useState<CurriculumGapReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState<string>("ALL");

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchCurriculumReports();
        setReports(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const departments = ["ALL", "Computer Science & Engineering", "Electrical & Electronics"];

  const filtered = reports.filter((r) => {
    if (selectedDept === "ALL") return true;
    return r.department === selectedDept;
  });

  const handleApprove = (recommendation: string) => {
    toast.success(
      "Syllabus Revision Endorsed",
      `Faculty board recommendation logged: "${recommendation.slice(0, 50)}..."`
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Hero Header */}
      <div className="clay-card p-6 sm:p-8 bg-gradient-to-br from-white via-[#FFFDF8] to-[#FFF9E6] border border-[#ECE5D8]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF4D0] border border-[#FFE785] text-[11px] font-bold uppercase tracking-wider text-[#8C6000]">
              <Sparkles className="h-3.5 w-3.5" /> Curriculum Evolution Intelligence
            </div>
            <h1 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#181B1F] tracking-tight">
              Evidence-Based Syllabus Adaptation & Gap Telemetry
            </h1>
            <p className="text-xs sm:text-sm text-[#5E646A] leading-relaxed">
              Dynamically compare your academic course outcomes against real-world campus research projects, Git repositories, and corporate challenge requirements. Empower Board of Studies to close skill gaps before graduation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info("Report Exported", "Generated PDF syllabus gap matrix for Accreditation Board.")}
              className="text-xs"
            >
              <Download className="h-3.5 w-3.5 mr-1" /> Export Audit Report
            </Button>
          </div>
        </div>
      </div>

      {/* Department Filter Bar */}
      <div className="flex items-center gap-2 border-b border-[#ECE5D8] pb-3">
        <span className="text-xs font-bold text-[#7B828A] uppercase font-mono mr-2">Department:</span>
        {departments.map((dept) => (
          <button
            key={dept}
            onClick={() => setSelectedDept(dept)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedDept === dept
                ? "bg-[#181B1F] text-white shadow-xs"
                : "bg-white text-[#52575C] border border-[#ECE5D8] hover:bg-[#FAF7EE]"
            }`}
          >
            {dept}
          </button>
        ))}
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div className="text-center py-16 text-xs text-[#7B828A]">Analyzing academic gap telemetry...</div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-16 bg-white border-[#ECE5D8] rounded-2xl">
          <BookOpen className="h-10 w-10 text-[#7B828A] mx-auto mb-2 opacity-50" />
          <h3 className="font-serif text-base font-bold text-[#181B1F]">No Gap Analysis Found</h3>
          <p className="text-xs text-[#7B828A] mt-1">Select another department or trigger a new syllabus ingestion scan.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {filtered.map((rpt) => (
            <Card
              key={rpt.id}
              className="clay-card p-6 bg-white border-[#ECE5D8] rounded-2xl space-y-6"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ECE5D8] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold uppercase text-[#8C6000] bg-[#FFF4D0] px-2 py-0.5 rounded-md border border-[#FFE785]">
                      {rpt.department || "Engineering"}
                    </span>
                    <span className="text-xs text-[#7B828A]">
                      Audit Period: {rpt.generatedAt ? new Date(rpt.generatedAt).toLocaleDateString() : "Current"}
                    </span>
                  </div>
                  <h2 className="font-serif text-xl font-bold text-[#181B1F] mt-1">
                    {rpt.department} Curriculum Framework
                  </h2>
                </div>

                <div className="flex items-center gap-4">
                  <div className="bg-[#FAF7EE] p-3 rounded-2xl border border-[#ECE5D8] text-right">
                    <span className="text-[10px] uppercase font-mono text-[#7B828A] block">Practical Alignment</span>
                    <div className="font-bold font-serif text-xl text-[#181B1F] mt-0.5">
                      {rpt.practicalEvidenceScore}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills Analysis Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Outdated / High Overlap */}
                <div className="bg-red-50/50 p-4 rounded-xl border border-red-200/60 space-y-2">
                  <span className="text-xs font-bold text-red-800 flex items-center gap-1.5">
                    <TrendingDown className="h-4 w-4 text-red-600" /> Syllabus Gaps Identified
                  </span>
                  <p className="text-[11px] text-red-700/80">
                    Topics that show low industry alignment or missing practical labs:
                  </p>
                  <div className="space-y-2 pt-1">
                    {rpt.gapsIdentified.map((gap, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-white border border-red-200 text-xs"
                      >
                        <div className="font-bold text-red-900">{gap.topic}</div>
                        <p className="text-[11px] text-red-700 mt-0.5">{gap.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Missing / High Demand */}
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200/60 space-y-2">
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-emerald-600" /> Syllabus Recommendations
                  </span>
                  <p className="text-[11px] text-emerald-700/80">
                    Action items for the Board of Studies to close technical debt:
                  </p>
                  <div className="space-y-2 pt-1">
                    {rpt.recommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-white border border-emerald-200 text-xs"
                      >
                        <div className="font-bold text-emerald-900">{rec.action}</div>
                        <p className="text-[11px] text-emerald-700 mt-0.5">{rec.rationale}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Plan */}
              <div className="bg-[#FAF7EE] p-4 rounded-xl border border-[#ECE5D8] flex items-center justify-between">
                <span className="text-xs font-bold uppercase font-mono text-[#8C6000] flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4" /> Board of Studies Action Plan
                </span>
                <Button
                  onClick={() => handleApprove(rpt.recommendations[0]?.action || "Curriculum update")}
                  size="sm"
                  variant="outline"
                  className="text-xs text-[#8C6000] border-[#FFE785] bg-white hover:bg-[#FFF9E6]"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Endorse Revision Plan
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
