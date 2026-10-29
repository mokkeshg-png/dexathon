import React from "react";
import { Card, Badge, Progress } from "@/components/ui/Card";
import type { ProjectMonitoringAnalysis } from "@/types";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  MessageSquare,
  FileCheck,
  Share2,
  ShieldAlert,
  Lightbulb,
} from "lucide-react";

interface ProjectMonitoringPanelProps {
  analysis: ProjectMonitoringAnalysis;
}

export const ProjectMonitoringPanel: React.FC<ProjectMonitoringPanelProps> = ({ analysis }) => {
  const {
    healthScore,
    phase,
    progressPercentage,
    roleProgress,
    collaborationGaps,
    discussionAnalysis,
    memberContributions,
    knowledgeExchange,
    documentConsistency,
    collectiveSummary,
  } = analysis;

  const healthColor =
    healthScore >= 75 ? "text-emerald-700 bg-emerald-50 border-emerald-200" :
    healthScore >= 50 ? "text-amber-700 bg-amber-50 border-amber-200" :
    "text-red-700 bg-red-50 border-red-200";

  return (
    <div className="space-y-6">
      {/* 1. Header Overview & Health KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={`p-5 border ${healthColor} flex items-center justify-between`}>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider block opacity-80">
              Team Health Score
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-serif text-3xl font-bold">{healthScore}</span>
              <span className="text-xs opacity-75">/ 100</span>
            </div>
            <span className="text-[11px] font-medium mt-1 block">
              {healthScore >= 75 ? "Optimal Team Synchronization" : healthScore >= 50 ? "Moderate Collaboration Friction" : "High Risk — Intervention Needed"}
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-white/70 flex items-center justify-center shadow-xs">
            <Activity className="h-6 w-6" />
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-400 block">
              Current Project Phase
            </span>
            <span className="font-serif text-lg font-bold text-ink mt-1 block">
              {phase}
            </span>
          </div>
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs text-ink-500">
              <span>Overall Progress</span>
              <span className="font-semibold text-ink">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} />
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-400 block">
              Active Collaboration Gaps
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-serif text-3xl font-bold text-ink">
                {collaborationGaps.length}
              </span>
              <span className="text-xs text-ink-400">detected</span>
            </div>
          </div>
          <div className="text-xs text-ink-500 pt-2 flex items-center gap-1.5">
            {collaborationGaps.some((g) => g.severity === "critical") ? (
              <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                <AlertTriangle className="h-3.5 w-3.5" /> Critical dependencies pending
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" /> No blocking bottlenecks
              </span>
            )}
          </div>
        </Card>
      </div>

      {/* 2. Critical Collaboration Gaps & Dependency Alerts (PRD 1 Module 9) */}
      {collaborationGaps.length > 0 && (
        <Card className="p-6 space-y-4 border-amber-200 bg-amber-50/20">
          <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-700" />
              <h3 className="font-serif text-lg font-bold text-ink">
                Proactive Collaboration Gap Detection
              </h3>
            </div>
            <Badge tone="amber">{collaborationGaps.length} Action Items</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {collaborationGaps.map((gap) => (
              <div
                key={gap.id}
                className={`p-4 rounded-xl border bg-white space-y-2 shadow-2xs ${
                  gap.severity === "critical" ? "border-red-200 bg-red-50/30" : "border-amber-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-serif font-bold text-sm text-ink flex items-center gap-1.5">
                    {gap.severity === "critical" ? (
                      <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                    ) : (
                      <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                    )}
                    {gap.title}
                  </h4>
                  <Badge tone={gap.severity === "critical" ? "red" : "amber"} className="text-[10px] uppercase">
                    {gap.severity}
                  </Badge>
                </div>
                <p className="text-xs text-ink-600 leading-relaxed">{gap.description}</p>
                <div className="text-[11px] text-ink-500 pt-1 border-t border-ink-100">
                  <span className="font-semibold text-ink">Impact:</span> {gap.impact}
                </div>
                <div className="text-[11px] text-[#8C6000] font-medium flex items-center gap-1.5 bg-[#FFF4D0] border border-[#FFE785] p-2.5 rounded-xl">
                  <Lightbulb className="h-3.5 w-3.5 text-[#BD7D14] shrink-0" />
                  <span>Recommendation: {gap.recommendation}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 3. Role-Based Progress Breakdown (PRD 1 Module 7) */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#ECE5D8] pb-3">
          <div>
            <h3 className="font-serif text-lg font-bold text-ink">Role-Based Execution Progress</h3>
            <p className="text-xs text-ink-500">Track deliverable completion across assigned project roles</p>
          </div>
          <span className="clay-badge-gold text-[10px]">Module 7 Analytics</span>
        </div>

        {roleProgress.length === 0 ? (
          <p className="text-xs text-ink-400 italic py-2">No tasks assigned to roles yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {roleProgress.map((rp) => (
              <div key={rp.roleName} className="clay-card-cream p-4 space-y-2 border border-[#FFE785]">
                <div className="flex justify-between items-start">
                  <span className="font-serif font-bold text-sm text-ink line-clamp-1">{rp.roleName}</span>
                  <span className="text-xs font-bold text-[#8C6000]">{rp.percentage}%</span>
                </div>
                <Progress value={rp.percentage} />
                <div className="flex justify-between text-[11px] text-ink-500 pt-1">
                  <span>{rp.completedTasks} completed</span>
                  <span>{rp.inProgressTasks} in progress</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 4. Individual Contribution Timeline & Member Activity (PRD 1 Module 4) */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#ECE5D8] pb-3">
          <div>
            <h3 className="font-serif text-lg font-bold text-ink">Individual Contribution Analysis</h3>
            <p className="text-xs text-ink-500">Transparent work tracking across tasks, discussions, and document submissions</p>
          </div>
          <Badge tone="slate">PRD Module 4</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#ECE5D8] text-ink-400 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">Team Member</th>
                <th className="py-2.5 px-3">Assigned Role</th>
                <th className="py-2.5 px-3 text-center">Tasks Done</th>
                <th className="py-2.5 px-3 text-center">Discussions</th>
                <th className="py-2.5 px-3 text-center">Uploads</th>
                <th className="py-2.5 px-3 text-center">Activity Level</th>
                <th className="py-2.5 px-3 text-center">Trend</th>
                <th className="py-2.5 px-3 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4EFE4]">
              {memberContributions.map((mc) => (
                <tr key={mc.userId} className="hover:bg-[#FAF7EE] transition">
                  <td className="py-3 px-3 font-medium text-ink">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-[#FFF4D0] text-[#8C6000] font-bold flex items-center justify-center text-xs">
                        {mc.fullName.charAt(0)}
                      </div>
                      <div>
                        <span>{mc.fullName}</span>
                        {mc.alert && (
                          <span className="block text-[10px] text-red-600 font-semibold">{mc.alert}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-ink-600">{mc.roleName}</td>
                  <td className="py-3 px-3 text-center font-medium text-ink">
                    {mc.tasksCompleted} / {mc.tasksTotal}
                  </td>
                  <td className="py-3 px-3 text-center text-ink-500">
                    {mc.repliesSent + mc.discussionsStarted}
                  </td>
                  <td className="py-3 px-3 text-center text-ink-500">
                    {mc.documentsUploaded + mc.notesAuthored}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <Badge
                      tone={
                        mc.activityLevel === "High" ? "green" :
                        mc.activityLevel === "Medium" ? "navy" :
                        mc.activityLevel === "Low" ? "amber" : "red"
                      }
                      className="text-[10px]"
                    >
                      {mc.activityLevel}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-center">
                    {mc.trend === "increasing" ? (
                      <span className="inline-flex items-center text-emerald-600 text-xs font-semibold gap-0.5">
                        <TrendingUp className="h-3.5 w-3.5" /> High
                      </span>
                    ) : mc.trend === "decreasing" ? (
                      <span className="inline-flex items-center text-red-600 text-xs font-semibold gap-0.5">
                        <TrendingDown className="h-3.5 w-3.5" /> Drop
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-ink-400 text-xs gap-0.5">
                        <Minus className="h-3.5 w-3.5" /> Steady
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-serif font-bold text-ink">
                    {mc.contributionScore}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 5. Collaborative Discussion Analysis & Knowledge Exchange (PRD 1 Modules 3 & 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Discussion Intelligence */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-ink-100 pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-navy" />
              <h3 className="font-serif text-lg font-bold text-ink">Discussion Intelligence</h3>
            </div>
            <Badge tone="navy">PRD Module 3</Badge>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-xs font-semibold text-ink-400 uppercase tracking-wider block mb-1.5">
                Key Topics Discussed
              </span>
              <div className="flex flex-wrap gap-1.5">
                {discussionAnalysis.topicsDiscussed.length > 0 ? (
                  discussionAnalysis.topicsDiscussed.map((t) => (
                    <Badge key={t.topic} tone="slate">
                      {t.topic} ({t.messageCount})
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-ink-400 italic">No topics analyzed yet</span>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-ink-50">
              <span className="text-xs font-semibold text-ink-400 uppercase tracking-wider block mb-1.5">
                Decisions Made ({discussionAnalysis.decisionsMade.length})
              </span>
              {discussionAnalysis.decisionsMade.length > 0 ? (
                <ul className="space-y-1 text-xs text-ink-700">
                  {discussionAnalysis.decisionsMade.map((d, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-xs text-ink-400 italic">No explicit architectural decisions marked</span>
              )}
            </div>

            <div className="pt-2 border-t border-ink-50">
              <span className="text-xs font-semibold text-ink-400 uppercase tracking-wider block mb-1.5">
                Unresolved Discussions ({discussionAnalysis.unresolvedDiscussions.length})
              </span>
              {discussionAnalysis.unresolvedDiscussions.length > 0 ? (
                <div className="space-y-1.5">
                  {discussionAnalysis.unresolvedDiscussions.map((ud) => (
                    <div key={ud.id} className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs space-y-0.5">
                      <div className="flex justify-between font-medium text-amber-900">
                        <span>{ud.title}</span>
                        <span className="text-[10px] text-amber-700">{ud.ageDays}d old</span>
                      </div>
                      <p className="text-[11px] text-amber-800">{ud.reason}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> All discussions resolved!
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* Knowledge Exchange Flow */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-ink-100 pb-3">
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4 text-brass-700" />
              <h3 className="font-serif text-lg font-bold text-ink">Knowledge Exchange Map</h3>
            </div>
            <Badge tone="brass">PRD Module 5</Badge>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-semibold text-ink-400 uppercase tracking-wider block mb-1.5">
              Cross-Role Communication Channels
            </span>

            {knowledgeExchange.exchanges.length > 0 ? (
              <div className="space-y-2">
                {knowledgeExchange.exchanges.map((ex, i) => (
                  <div key={i} className="clay-card-cream p-3 border border-[#FFE785] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#8C6000]">{ex.fromRole}</span>
                      <ArrowRight className="h-3 w-3 text-ink-400" />
                      <span className="font-semibold text-ink-700">{ex.toRole}</span>
                    </div>
                    <span className="clay-badge-gold text-[10px] font-bold">{ex.count} exchanges</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-ink-400 italic">
                Team discussions will populate cross-role exchange flows automatically.
              </p>
            )}

            {/* Isolation Alerts */}
            {knowledgeExchange.isolatedMembers.length > 0 && (
              <div className="pt-2 border-t border-[#ECE5D8]">
                <span className="text-xs font-semibold text-red-700 uppercase tracking-wider block mb-1">
                  Isolated Member Alert
                </span>
                {knowledgeExchange.isolatedMembers.map((im) => (
                  <div key={im.userId} className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
                    <strong>{im.fullName}</strong> ({im.roleName}) has not exchanged messages with other team roles yet.
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* 6. Document & Deliverable Scope Consistency (PRD 1 Module 6) */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#ECE5D8] pb-3">
          <div className="flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-emerald-600" />
            <h3 className="font-serif text-lg font-bold text-ink">Document & Scope Consistency Engine</h3>
          </div>
          <Badge tone="green">PRD Module 6</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="clay-card-cream p-4 space-y-2 border border-[#FFE785]">
            <span className="font-bold text-ink block">Problem Statement Keyword Alignment</span>
            <div className="flex flex-wrap gap-1.5">
              {documentConsistency.problemStatementCoverage.coveredKeywords.map((kw) => (
                <span key={kw} className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-medium">
                  ✓ {kw}
                </span>
              ))}
            </div>
          </div>

          <div className="clay-card-cream p-4 space-y-2 border border-[#FFE785]">
            <span className="font-bold text-ink block">Consistency & Scope Issues</span>
            {documentConsistency.consistencyIssues.length > 0 ? (
              <div className="space-y-1.5">
                {documentConsistency.consistencyIssues.map((ci, idx) => (
                  <p key={idx} className="text-ink-700 flex items-start gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>{ci.issue}</span>
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> All documentation aligned with stated objectives.
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* 7. Weekly Collective Summary (PRD 1 Module 8) */}
      <Card className="p-6 space-y-4 border-navy-200 bg-navy-50/20">
        <div className="flex items-center justify-between border-b border-navy-100 pb-3">
          <div>
            <h3 className="font-serif text-lg font-bold text-ink">Weekly Team Summary & Insights</h3>
            <p className="text-xs text-ink-500">Aggregated progress report for Faculty Mentors & Coordinators</p>
          </div>
          <Badge tone="navy">PRD Module 8</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-white border border-ink-100 space-y-1.5">
            <span className="font-bold text-ink uppercase tracking-wider text-[10px] text-emerald-700">What Completed</span>
            <ul className="space-y-1 text-ink-700">
              {collectiveSummary.whatCompleted.map((wc, i) => (
                <li key={i} className="flex items-start gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{wc}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-ink-100 space-y-1.5">
            <span className="font-bold text-ink uppercase tracking-wider text-[10px] text-navy">What Discussed</span>
            <ul className="space-y-1 text-ink-700">
              {collectiveSummary.whatDiscussed.map((wd, i) => (
                <li key={i}>• {wd}</li>
              ))}
            </ul>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-ink-100 space-y-1.5">
            <span className="font-bold text-ink uppercase tracking-wider text-[10px] text-brass-800">What Learned</span>
            <ul className="space-y-1 text-ink-700">
              {collectiveSummary.whatLearned.map((wl, i) => (
                <li key={i}>✓ {wl}</li>
              ))}
            </ul>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-ink-100 space-y-1.5">
            <span className="font-bold text-ink uppercase tracking-wider text-[10px] text-amber-700">What Remains</span>
            <ul className="space-y-1 text-ink-700">
              {collectiveSummary.whatRemains.map((wr, i) => (
                <li key={i}>⏳ {wr}</li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};
