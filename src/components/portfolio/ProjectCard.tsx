import type { PastProject } from "@/types";
import { Card, Badge } from "@/components/ui/Card";
import {
  Github,
  Edit2,
  Trash2,
  FolderGit2,
  Calendar,
  Globe,
} from "lucide-react";

interface ProjectCardProps {
  project: PastProject;
  isOwner?: boolean;
  onEdit?: (project: PastProject) => void;
  onDelete?: (projectId: string) => void;
  onPreviewMedia?: (url: string, title?: string) => void;
}

export function ProjectCard({
  project,
  isOwner,
  onEdit,
  onDelete,
  onPreviewMedia,
}: ProjectCardProps) {
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "deployed":
        return <Badge tone="green" className="text-[10px]">Live Production</Badge>;
      case "in_progress":
        return <Badge tone="brass" className="text-[10px]">In Active Development</Badge>;
      case "open_source":
        return <Badge tone="navy" className="text-[10px]">Open Source</Badge>;
      case "archived":
        return <Badge tone="slate" className="text-[10px]">Archived</Badge>;
      default:
        return <Badge tone="navy" className="text-[10px]">Completed</Badge>;
    }
  };

  return (
    <Card className="flex flex-col justify-between rounded-3xl border-[#ECE5D8] hover:border-[#DFD7C7] hover:shadow-clay transition-all group overflow-hidden bg-white p-5">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF4D0] text-[#8C6000] shadow-2xs group-hover:scale-105 transition-transform border border-[#FFE785]">
              <FolderGit2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-serif text-base font-bold text-[#181B1F] group-hover:text-[#8C6000] transition-colors">
                  {project.title}
                </h4>
                {getStatusBadge(project.status)}
              </div>
              <div className="mt-1 flex items-center gap-3 text-[11px] text-[#5E646A] flex-wrap">
                {project.role && (
                  <span className="font-bold text-[#8C6000] bg-[#FFF4D0] px-2.5 py-0.5 rounded-lg border border-[#FFE785]">
                    {project.role}
                  </span>
                )}
                {project.year && (
                  <span className="flex items-center gap-1 text-[#7B828A] font-medium">
                    <Calendar className="h-3 w-3 text-[#8C6000]" />
                    {project.year}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Owner actions */}
          {isOwner && (
            <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(project)}
                  className="rounded-xl p-1.5 text-[#7B828A] hover:text-[#181B1F] hover:bg-[#F6F2EA] transition-colors"
                  title="Edit project"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(project.id)}
                  className="rounded-xl p-1.5 text-[#7B828A] hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Delete project"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <p className="mt-3 text-xs text-[#52575C] leading-relaxed line-clamp-3">
          {project.description}
        </p>

        {/* Screenshot / Image Gallery */}
        {project.images && project.images.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {project.images.map((imgUrl, i) => (
              <div
                key={i}
                className="relative h-20 w-32 shrink-0 overflow-hidden rounded-xl border border-[#ECE5D8] cursor-pointer hover:opacity-90 transition-opacity bg-black/5 shadow-2xs"
                onClick={() => onPreviewMedia?.(imgUrl, `${project.title} - Preview ${i + 1}`)}
              >
                <img src={imgUrl} alt={`Screenshot ${i + 1}`} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* Tech Stack Tags (GitHub style) */}
        {project.technologies && project.technologies.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5 pt-2.5 border-t border-[#F2ECE1]">
            {project.technologies.map((tech) => (
              <span
                key={tech}
                className="rounded-lg bg-[#FAF7EE] border border-[#ECE5D8] px-2.5 py-0.5 text-[11px] font-bold text-[#33383F] hover:border-[#DFD7C7] transition-colors"
              >
                {tech}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Links Footer (GitHub repo & Live Demo) */}
      <div className="mt-4 pt-3 border-t border-[#ECE5D8] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#ECE5D8] bg-white px-2.5 py-1 text-xs font-bold text-[#181B1F] hover:border-[#DFD7C7] hover:bg-[#FAF7EE] transition-all shadow-2xs"
            >
              <Github className="h-3.5 w-3.5" />
              <span>Repository</span>
            </a>
          )}
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#FFE785] bg-[#FFF4D0] px-2.5 py-1 text-xs font-bold text-[#8C6000] hover:bg-[#FFEAA0] transition-all shadow-2xs"
            >
              <Globe className="h-3.5 w-3.5 text-[#8C6000]" />
              <span>Live Demo</span>
            </a>
          )}
        </div>

        {(!project.githubUrl && !project.liveUrl) && (
          <span className="text-[11px] text-[#7B828A] italic">Academic Portfolio Project</span>
        )}
      </div>
    </Card>
  );
}
