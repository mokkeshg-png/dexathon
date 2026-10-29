import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Loader2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import {
  fetchProjectMembers,
  fetchAllProfiles,
  fetchTasks,
  fetchTaskCommentsByProject,
  fetchDiscussions,
  fetchReplies,
  fetchDocuments,
  fetchResearchNotes,
} from "@/lib/supabase-db";
import { analyzeProjectMonitoring } from "@/lib/projectMonitoringEngine";
import { ProjectMonitoringPanel } from "@/components/projects/ProjectMonitoringPanel";
import type { Project } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  project: Project | null;
}

export function DetailedMonitoringModal({ open, onClose, project }: Props) {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<any>(null);

  useEffect(() => {
    if (!open || !project) return;
    let cancelled = false;

    async function loadTelemetry() {
      setLoading(true);
      try {
        const [mems, profiles, tasks, discs, docs, notes] = await Promise.all([
          fetchProjectMembers(project!.id),
          fetchAllProfiles(),
          fetchTasks(project!.id),
          fetchDiscussions(project!.id),
          fetchDocuments(project!.id),
          fetchResearchNotes(project!.id),
        ]);

        if (cancelled) return;

        const comments = tasks.length > 0
          ? await fetchTaskCommentsByProject(tasks.map((t) => t.id))
          : [];

        const replies = discs.length > 0
          ? (await Promise.all(discs.map((d) => fetchReplies(d.id)))).flat()
          : [];

        if (cancelled) return;

        const result = analyzeProjectMonitoring({
          project: project!,
          members: mems,
          memberProfiles: profiles,
          tasks,
          taskComments: comments,
          discussions: discs,
          discussionReplies: replies,
          documents: docs,
          researchNotes: notes,
        });

        setAnalysis(result);
      } catch (err) {
        console.error("Telemetry load error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTelemetry();
    return () => {
      cancelled = true;
    };
  }, [open, project]);

  if (!project) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`AI Telemetry & Multi-Metric Monitoring: ${project.title}`}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-ink-100">
          <p className="text-xs text-ink-500 max-w-xl">
            Detailed inspection of milestone progress, task dependencies, individual student contribution indices, knowledge exchange, and technical document consistency.
          </p>
          <Link to={`/projects/${project.id}/room?tab=monitoring`}>
            <Button size="sm" variant="outline" className="text-xs shrink-0">
              Open Full Room Workspace <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-navy" />
          </div>
        ) : analysis ? (
          <div className="max-h-[75vh] overflow-y-auto pr-1">
            <ProjectMonitoringPanel analysis={analysis} />
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-ink-400">
            No telemetry data available yet for this project.
          </div>
        )}
      </div>
    </Modal>
  );
}
