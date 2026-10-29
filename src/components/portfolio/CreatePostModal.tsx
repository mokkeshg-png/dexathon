import { useState } from "react";
import type { PostCategory, Project } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Textarea, Input, Select } from "@/components/ui/Field";
import { MediaUploadZone } from "./MediaUploadZone";
import { Sparkles, Award, Rocket, FolderGit2, X } from "lucide-react";

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userRole: string;
  userInstitution: string;
  userAvatar?: string;
  projects?: Project[];
  onSubmit: (post: {
    category: PostCategory;
    content: string;
    mediaUrls: string[];
    projectRef?: { title: string; link?: string; githubUrl?: string };
    certificateRef?: { title: string; issuer: string; certUrl?: string };
  }) => Promise<void>;
}

export function CreatePostModal({
  open,
  onClose,
  userId,
  userName,
  userRole,
  userInstitution,
  userAvatar,
  projects = [],
  onSubmit,
}: CreatePostModalProps) {
  const [category, setCategory] = useState<PostCategory>("update");
  const [content, setContent] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [customProjectTitle, setCustomProjectTitle] = useState("");
  const [projectGithub, setProjectGithub] = useState("");
  const [certTitle, setCertTitle] = useState("");
  const [certIssuer, setCertIssuer] = useState("");
  const [certUrl, setCertUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError("Please write some content for your post.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      let projectRef: { title: string; link?: string; githubUrl?: string } | undefined;
      if (category === "project_showcase" || category === "launch") {
        if (selectedProjectId) {
          const p = projects.find((proj) => proj.id === selectedProjectId);
          if (p) {
            projectRef = {
              title: p.title,
              link: `/projects/${p.id}`,
              githubUrl: p.githubRepo,
            };
          }
        } else if (customProjectTitle.trim()) {
          projectRef = {
            title: customProjectTitle.trim(),
            githubUrl: projectGithub.trim() || undefined,
          };
        }
      }

      let certificateRef: { title: string; issuer: string; certUrl?: string } | undefined;
      if (category === "certificate" && certTitle.trim()) {
        certificateRef = {
          title: certTitle.trim(),
          issuer: certIssuer.trim() || "Verified Authority",
          certUrl: certUrl.trim() || undefined,
        };
      }

      await onSubmit({
        category,
        content: content.trim(),
        mediaUrls,
        projectRef,
        certificateRef,
      });

      // Reset
      setContent("");
      setMediaUrls([]);
      setSelectedProjectId("");
      setCustomProjectTitle("");
      setProjectGithub("");
      setCertTitle("");
      setCertIssuer("");
      setCertUrl("");
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to publish post.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedia = (url: string) => {
    if (url && !mediaUrls.includes(url)) {
      setMediaUrls([...mediaUrls, url]);
    }
  };

  const handleRemoveMedia = (index: number) => {
    setMediaUrls(mediaUrls.filter((_, i) => i !== index));
  };

  const categoryOptions = [
    { id: "update", label: "Research Update", icon: Sparkles },
    { id: "project_showcase", label: "Project Showcase", icon: FolderGit2 },
    { id: "achievement", label: "Achievement & Award", icon: Award },
    { id: "launch", label: "Project Launch", icon: Rocket },
    { id: "certificate", label: "Certification", icon: Award },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Create Professional Post" wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
            {error}
          </div>
        )}

        {/* Author badge preview */}
        <div className="flex items-center gap-3 pb-2 border-b border-ink-100">
          {userAvatar ? (
            <img src={userAvatar} alt={userName} className="h-10 w-10 rounded-xl object-cover border border-ink-200" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-white font-serif font-bold text-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-xs font-bold text-ink">{userName}</p>
            <p className="text-[11px] text-ink-500">{userRole} • {userInstitution}</p>
          </div>
        </div>

        {/* Category Pills */}
        <Field label="Post Category">
          <div className="flex flex-wrap gap-2 pt-1">
            {categoryOptions.map((opt) => {
              const active = category === opt.id;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setCategory(opt.id as PostCategory)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    active
                      ? "bg-navy text-white shadow-xs"
                      : "bg-paper-100 text-ink-600 hover:bg-paper-200"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </Field>

        {/* Project Selector (for showcase & launch) */}
        {(category === "project_showcase" || category === "launch") && (
          <div className="rounded-xl border border-navy-100 bg-navy-50/30 p-3.5 space-y-3">
            <p className="text-xs font-bold text-navy-900 flex items-center gap-1.5">
              <FolderGit2 className="h-4 w-4 text-navy" />
              Link an Academic or Research Project
            </p>
            {projects.length > 0 ? (
              <Field label="Select from your projects" hint="Or choose 'Other project' to type manually">
                <Select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                >
                  <option value="">-- Choose a platform project --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.status})
                    </option>
                  ))}
                  <option value="__other__">Other / External Project</option>
                </Select>
              </Field>
            ) : null}

            {(!projects.length || selectedProjectId === "__other__") && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <Field label="Project Name">
                  <Input
                    placeholder="e.g. Distributed Consensus Engine"
                    value={customProjectTitle}
                    onChange={(e) => setCustomProjectTitle(e.target.value)}
                  />
                </Field>
                <Field label="GitHub Repository (Optional)">
                  <Input
                    placeholder="https://github.com/..."
                    value={projectGithub}
                    onChange={(e) => setProjectGithub(e.target.value)}
                  />
                </Field>
              </div>
            )}
          </div>
        )}

        {/* Certificate details (for certificate) */}
        {category === "certificate" && (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-3.5 space-y-3">
            <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <Award className="h-4 w-4 text-emerald-700" />
              Certificate Highlights
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Certificate Title">
                <Input
                  placeholder="e.g. AWS Certified Solutions Architect"
                  value={certTitle}
                  onChange={(e) => setCertTitle(e.target.value)}
                />
              </Field>
              <Field label="Issuing Authority">
                <Input
                  placeholder="e.g. Amazon Web Services, Coursera"
                  value={certIssuer}
                  onChange={(e) => setCertIssuer(e.target.value)}
                />
              </Field>
            </div>
            <Field label="Verification URL (Optional)">
              <Input
                placeholder="https://credly.com/..."
                value={certUrl}
                onChange={(e) => setCertUrl(e.target.value)}
              />
            </Field>
          </div>
        )}

        {/* Text Content */}
        <Field label="What would you like to share?" hint="Support hashtags (e.g. #Research #MachineLearning)">
          <Textarea
            rows={5}
            required
            placeholder="Share a project launch, experimental results, team milestone, or lessons learned..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="text-xs leading-relaxed"
          />
        </Field>

        {/* Media Attachments */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-ink-700">Attach Images or Screenshots</label>
          {mediaUrls.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
              {mediaUrls.map((url, idx) => (
                <div key={idx} className="relative group rounded-lg overflow-hidden border border-ink-200 h-20 bg-black/5">
                  <img src={url} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveMedia(idx)}
                    className="absolute top-1 right-1 rounded-full bg-red-600 text-white p-1 shadow-sm opacity-90 hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {mediaUrls.length < 4 && (
            <MediaUploadZone
              label=""
              hint="Attach up to 4 project screenshots or certificates (PNG, JPG, WebP)"
              userId={userId}
              folder="posts"
              onChange={handleAddMedia}
              allowedTypes={["image/jpeg", "image/png", "image/webp", "image/gif"]}
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-ink-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="px-6">
            Publish Post
          </Button>
        </div>
      </form>
    </Modal>
  );
}
