import { Link } from "react-router-dom";
import type { Profile, Project } from "@/types";
import { Progress } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { deadlineCountdown } from "@/lib/utils";
import { projectMatchBreakdown } from "@/lib/matching";

export function ProjectCard({
  project,
  viewer,
  match,
  memberCount,
}: {
  project: Project;
  viewer?: Profile | null;
  match?: number;
  memberCount?: number;
}) {
  const score = match ?? (viewer ? projectMatchBreakdown(viewer, project).score : undefined);
  const fill = memberCount !== undefined
    ? Math.min(100, Math.round((memberCount / project.teamMax) * 100))
    : 0;
  return (
    <div className="clay-card p-6 flex h-full flex-col justify-between group transition-all duration-200">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="clay-badge clay-badge-gold">
              {project.domains[0]}
            </span>
            <h3 className="mt-2.5 font-serif text-xl font-bold text-[#181B1F] group-hover:text-[#8C6000] transition-colors leading-snug">
              <Link to={`/projects/${project.id}`}>
                {project.title}
              </Link>
            </h3>
          </div>
          {typeof score === "number" ? (
            <span className="clay-badge clay-badge-brass shrink-0 font-extrabold text-xs">
              {score}% match
            </span>
          ) : null}
        </div>
        <p className="mt-3 line-clamp-3 text-xs sm:text-sm leading-relaxed text-[#5E646A]">{project.shortDescription}</p>
        
        {/* Required skills chips */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.requiredSkills.slice(0, 4).map((s) => (
            <span
              key={s}
              className="clay-chip text-[11px]"
            >
              {s}
            </span>
          ))}
          {project.requiredSkills.length > 4 && (
            <span className="clay-chip text-[11px] text-[#8C8372]">
              +{project.requiredSkills.length - 4}
            </span>
          )}
        </div>

        {/* Info stats in a clay inset container */}
        <div className="mt-4 clay-inset p-3 grid grid-cols-2 gap-2 text-xs font-medium text-[#7B828A]">
          <span className="capitalize font-semibold text-[#181B1F]">{project.difficulty} level</span>
          <span className="text-right font-bold text-[#8C6000]">{deadlineCountdown(project.deadline)}</span>
          <span className="truncate text-[#5E646A]">{project.roles.map((r) => r.name).slice(0, 2).join(", ")}</span>
          <span className="text-right font-bold text-[#181B1F]">
            Team {project.teamMin}–{project.teamMax}
          </span>
        </div>

        <div className="mt-3">
          <Progress value={fill} />
        </div>
      </div>

      <div className="mt-5 flex gap-2.5 pt-3 border-t border-[#ECE5D8]">
        <Link to={`/projects/${project.id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full text-xs">
            View details
          </Button>
        </Link>
        <Link to={`/projects/${project.id}?apply=1`} className="flex-1">
          <Button variant="primary" size="sm" className="w-full text-xs">Apply</Button>
        </Link>
      </div>
    </div>
  );
}

export function PersonCard({
  profile,
  score,
  reason,
  action,
}: {
  profile: Profile;
  score?: number;
  reason?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="clay-card p-6 flex flex-col justify-between h-full group transition-all duration-200">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {profile.photoUrl ? (
              <img
                src={profile.photoUrl}
                alt={profile.fullName}
                className="h-12 w-12 rounded-2xl object-cover border-2 border-white shadow-[0_4px_12px_rgba(215,195,160,0.3)] group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFF8DC] to-[#FFE680] text-[#7A4D00] font-serif font-extrabold text-base border border-[#FFD040] shadow-[0_4px_12px_rgba(255,200,18,0.25),inset_0_1px_1px_rgba(255,255,255,0.8)]">
                {profile.fullName.charAt(0)}
              </div>
            )}
            <div>
              <h3 className="font-serif text-base font-bold text-[#181B1F] group-hover:text-[#8C6000] transition-colors leading-snug">
                <Link to={`/profile/${profile.userId}`}>
                  {profile.fullName}
                </Link>
              </h3>
              <p className="text-xs text-[#5E646A] mt-0.5">
                {profile.designation ? `${profile.designation} · ` : ""}
                {profile.department}
              </p>
              <p className="text-[11px] text-[#7B828A]">{profile.institution}</p>
            </div>
          </div>
          {typeof score === "number" ? (
            <span className="clay-badge clay-badge-brass shrink-0 font-extrabold text-xs">
              {score}% match
            </span>
          ) : null}
        </div>
        {profile.headline && (
          <p className="mt-3 text-xs text-[#5E646A] leading-relaxed line-clamp-2">{profile.headline}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {profile.skills.slice(0, 4).map((s) => (
            <span
              key={s.skill}
              className="clay-chip text-[11px]"
            >
              {s.skill}
            </span>
          ))}
          {profile.skills.length > 4 && (
            <span className="clay-chip text-[11px] text-[#8C8372]">
              +{profile.skills.length - 4}
            </span>
          )}
        </div>
        {reason ? (
          <div className="mt-3 text-xs text-[#8C6000] font-medium italic bg-[#FFFBEA] p-2.5 rounded-xl border border-[#FFE785] shadow-xs">
            {reason}
          </div>
        ) : null}
      </div>
      <div className="mt-5 flex items-center justify-between gap-2 pt-3 border-t border-[#ECE5D8]">
        <Link to={`/profile/${profile.userId}`}>
          <Button variant="outline" size="sm" className="text-xs">
            View profile
          </Button>
        </Link>
        {action}
      </div>
    </div>
  );
}
