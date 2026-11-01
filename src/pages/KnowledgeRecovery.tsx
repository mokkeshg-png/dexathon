import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { fetchStudentRecoveryPaths } from "@/services/saasService";
import type { KnowledgeRecoveryPath } from "@/types";
import { useToast } from "@/context/ToastContext";
import {
  Compass,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export function KnowledgeRecovery() {
  const toast = useToast();
  const [paths, setPaths] = useState<KnowledgeRecoveryPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchStudentRecoveryPaths();
        setPaths(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const toggleStep = (stepKey: string, stepTitle: string) => {
    const next = !completedSteps[stepKey];
    setCompletedSteps({ ...completedSteps, [stepKey]: next });
    if (next) {
      toast.success("Milestone Completed", `Progress recorded for: "${stepTitle}".`);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Hero Header */}
      <div className="clay-card p-6 sm:p-8 bg-gradient-to-br from-white via-[#FFFDF8] to-[#FFF9E6] border border-[#ECE5D8]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF4D0] border border-[#FFE785] text-[11px] font-bold uppercase tracking-wider text-[#8C6000]">
              <Sparkles className="h-3.5 w-3.5" /> Project-Driven Knowledge Recovery
            </div>
            <h1 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#181B1F] tracking-tight">
              Bridge Missing Technical Prerequisites. Accelerate Research.
            </h1>
            <p className="text-xs sm:text-sm text-[#5E646A] leading-relaxed">
              When researchers attempt cutting-edge laboratory projects beyond their coursework, SYNAPTRA automatically deconstructs the prerequisite gap into targeted micro-milestones with curated open-access resources.
            </p>
          </div>

          <div className="bg-[#FAF7EE] p-4 rounded-2xl border border-[#ECE5D8] min-w-[200px] text-center">
            <span className="text-[10px] uppercase font-mono text-[#7B828A]">Active Recovery Paths</span>
            <div className="text-2xl font-bold font-serif text-[#181B1F] mt-1">{paths.length} Available</div>
            <span className="text-[11px] text-emerald-700 font-semibold block mt-1">Self-Paced Verification</span>
          </div>
        </div>
      </div>

      {/* Pathways Grid */}
      {loading ? (
        <div className="text-center py-16 text-xs text-[#7B828A]">Loading research prerequisite roadmaps...</div>
      ) : paths.length === 0 ? (
        <Card className="text-center py-16 bg-white border-[#ECE5D8] rounded-2xl">
          <Compass className="h-10 w-10 text-[#7B828A] mx-auto mb-2 opacity-50" />
          <h3 className="font-serif text-base font-bold text-[#181B1F]">No Recovery Pathways Generated</h3>
          <p className="text-xs text-[#7B828A] mt-1">Select a research project from your campus dashboard to generate a custom roadmap.</p>
        </Card>
      ) : (
        <div className="space-y-8">
          {paths.map((p) => {
            const steps = p.prerequisitePath || [];
            const completedCount = steps.filter((_, idx: number) => completedSteps[`${p.id}-${idx}`]).length;
            const progressPercent = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : p.progressPercent;

            return (
              <Card
                key={p.id}
                className="clay-card p-6 bg-white border-[#ECE5D8] rounded-2xl space-y-6"
              >
                {/* Pathway Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ECE5D8] pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold uppercase text-[#8C6000] bg-[#FFF4D0] px-2 py-0.5 rounded-md border border-[#FFE785]">
                        Level: {p.difficultyLevel}
                      </span>
                      <span className="text-xs text-[#7B828A] flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Status: {p.status}
                      </span>
                    </div>
                    <h2 className="font-serif text-xl font-bold text-[#181B1F] mt-1">
                      Target Competency: {p.conceptName}
                    </h2>
                  </div>

                  {/* Progress Indicator */}
                  <div className="min-w-[180px] space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-[#52575C]">Recovery Progress</span>
                      <span className="font-bold font-mono text-[#181B1F]">{progressPercent}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#FAF7EE] border border-[#ECE5D8] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#FFC812] to-[#FAB23D] transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Steps Timeline */}
                <div className="space-y-4">
                  <span className="text-xs font-bold uppercase font-mono text-[#7B828A] block">
                    Step-by-Step Acquisition Milestones
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {steps.map((step, idx: number) => {
                      const stepKey = `${p.id}-${idx}`;
                      const isDone = !!completedSteps[stepKey] || step.completed;

                      return (
                        <div
                          key={idx}
                          className={`p-4 rounded-xl border transition-all ${
                            isDone
                              ? "bg-emerald-50/40 border-emerald-200"
                              : "bg-[#FAF7EE]/60 border-[#ECE5D8] hover:bg-[#FAF7EE]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-mono text-[10px] font-bold text-[#7B828A] uppercase">
                              Phase 0{step.stepNumber || idx + 1}
                            </span>
                            <button
                              onClick={() => toggleStep(stepKey, step.title)}
                              className="text-xs"
                            >
                              {isDone ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                              ) : (
                                <Circle className="h-5 w-5 text-[#B0A798] hover:text-[#181B1F]" />
                              )}
                            </button>
                          </div>

                          <h4
                            className={`font-serif text-sm font-bold mt-2 ${
                              isDone ? "text-emerald-900 line-through opacity-80" : "text-[#181B1F]"
                            }`}
                          >
                            {step.title}
                          </h4>

                          <p className="text-[11px] text-[#5E646A] mt-1.5 leading-relaxed">
                            {step.description}
                          </p>

                          <div className="mt-3 pt-2 border-t border-[#ECE5D8]/70 flex items-center justify-between text-[11px]">
                            <span className="font-mono text-[#8C6000]">~{step.estimatedMinutes} mins</span>
                            <span className="text-[10px] text-[#7B828A] font-semibold">Self-Check</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Resources */}
                {p.learningResources && p.learningResources.length > 0 && (
                  <div className="pt-2">
                    <span className="text-xs font-bold uppercase font-mono text-[#7B828A] block mb-2">
                      Curated Open-Access References
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {p.learningResources.map((res, idx) => (
                        <a
                          key={idx}
                          href={res.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF7EE] border border-[#ECE5D8] text-xs font-medium text-[#181B1F] hover:bg-[#F3ECE0] transition-colors"
                        >
                          <ExternalLink className="h-3 w-3 text-[#8C6000]" />
                          <span>{res.title}</span>
                          <span className="text-[10px] text-[#7B828A] uppercase font-mono">({res.type})</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
