import { useState } from "react";
import { Link } from "react-router-dom";
import type { PortfolioPost } from "@/types";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Heart,
  MessageSquare,
  Share2,
  Trash2,
  ExternalLink,
  Github,
  Award,
  Send,
  Check,
  FolderGit2,
} from "lucide-react";

interface PostCardProps {
  post: PortfolioPost;
  currentUserId?: string;
  onLike: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
  onDelete?: (postId: string) => void;
  onPreviewMedia?: (url: string) => void;
}

export function PostCard({
  post,
  currentUserId,
  onLike,
  onComment,
  onDelete,
  onPreviewMedia,
}: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [copied, setCopied] = useState(false);

  const isAuthor = currentUserId && post.authorId === currentUserId;
  const isLiked = currentUserId ? post.likedBy?.includes(currentUserId) : false;

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/profile/${post.authorId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onComment(post.id, commentText.trim());
    setCommentText("");
  };

  const formatRelativeTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(isoString).toLocaleDateString();
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "project_showcase":
        return <Badge tone="navy" className="text-[10px]">Project Showcase</Badge>;
      case "achievement":
        return <Badge tone="brass" className="text-[10px]">Achievement</Badge>;
      case "certificate":
        return <Badge tone="green" className="text-[10px]">Verified Certificate</Badge>;
      case "launch":
        return <Badge tone="amber" className="text-[10px]">Project Launch</Badge>;
      default:
        return <Badge tone="slate" className="text-[10px]">Research Update</Badge>;
    }
  };

  // Format text to highlight hashtags
  const renderFormattedContent = (text: string) => {
    const words = text.split(/(\s+)/);
    return words.map((word, i) => {
      if (word.startsWith("#") && word.length > 1) {
        return (
          <span key={i} className="font-semibold text-navy hover:underline cursor-pointer">
            {word}
          </span>
        );
      }
      return word;
    });
  };

  return (
    <Card className="shadow-xs hover:shadow-card transition-all border-ink-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Link to={`/profile/${post.authorId}`} className="group shrink-0">
            {post.authorAvatar ? (
              <img
                src={post.authorAvatar}
                alt={post.authorName}
                className="h-10 w-10 rounded-xl object-cover border border-ink-200 group-hover:ring-2 group-hover:ring-navy/30 transition-all"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-white font-serif font-bold text-sm shadow-2xs group-hover:bg-navy-600 transition-colors">
                {post.authorName.charAt(0).toUpperCase()}
              </div>
            )}
          </Link>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to={`/profile/${post.authorId}`}
                className="font-serif font-bold text-ink hover:text-navy hover:underline text-sm leading-tight"
              >
                {post.authorName}
              </Link>
              {getCategoryBadge(post.category)}
            </div>
            <p className="text-xs text-ink-500 line-clamp-1 mt-0.5">
              {post.authorRole} • {post.authorInstitution}
            </p>
            <span className="text-[10px] text-ink-400 block mt-0.5">
              {formatRelativeTime(post.createdAt)}
            </span>
          </div>
        </div>

        {isAuthor && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(post.id)}
            className="p-1.5 text-ink-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete post"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Body content */}
      <div className="mt-3.5 space-y-3">
        <p className="text-xs text-ink-700 leading-relaxed whitespace-pre-line">
          {renderFormattedContent(post.content)}
        </p>

        {/* Media Grid */}
        {post.mediaUrls && post.mediaUrls.length > 0 && (
          <div
            className={`mt-2 rounded-xl overflow-hidden border border-ink-100 bg-paper-50 ${
              post.mediaUrls.length === 1
                ? "grid grid-cols-1"
                : post.mediaUrls.length === 2
                ? "grid grid-cols-2 gap-1.5"
                : "grid grid-cols-3 gap-1.5"
            }`}
          >
            {post.mediaUrls.map((url, idx) => (
              <div
                key={idx}
                className="relative overflow-hidden cursor-pointer group bg-black/5"
                onClick={() => onPreviewMedia?.(url)}
              >
                <img
                  src={url}
                  alt={`Post media ${idx + 1}`}
                  className="w-full h-48 sm:h-60 object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        )}

        {/* Attached Project Card */}
        {post.projectRef && (
          <div className="rounded-xl border border-navy-100 bg-navy-50/40 p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy text-white shadow-2xs">
                <FolderGit2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-ink">{post.projectRef.title}</p>
                {post.projectRef.technologies && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {post.projectRef.technologies.slice(0, 3).map((tech) => (
                      <span
                        key={tech}
                        className="rounded bg-white px-1.5 py-0.5 text-[10px] font-medium text-ink-600 border border-ink-100"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {post.projectRef.githubUrl && (
                <a
                  href={post.projectRef.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg p-2 text-ink-600 hover:bg-white hover:text-navy border border-transparent hover:border-ink-200 transition-all"
                  title="GitHub Repository"
                >
                  <Github className="h-4 w-4" />
                </a>
              )}
              {post.projectRef.link && (
                <Link to={post.projectRef.link}>
                  <Button size="sm" variant="outline" className="text-xs h-8">
                    View Project
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Attached Certificate Card */}
        {post.certificateRef && (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-white shadow-2xs">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-ink">{post.certificateRef.title}</p>
                <p className="text-[11px] text-ink-500">{post.certificateRef.issuer}</p>
              </div>
            </div>

            {post.certificateRef.certUrl && (
              <a
                href={post.certificateRef.certUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="sm" variant="outline" className="text-xs h-8 flex items-center gap-1 border-emerald-200 text-emerald-800 hover:bg-emerald-100">
                  <ExternalLink className="h-3 w-3" />
                  Show Credential
                </Button>
              </a>
            )}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-ink-100 flex items-center justify-between text-xs text-ink-500">
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Like */}
          <button
            type="button"
            onClick={() => onLike(post.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              isLiked
                ? "text-red-600 bg-red-50 font-bold"
                : "text-ink-600 hover:bg-paper-100"
            }`}
          >
            <Heart className={`h-4 w-4 ${isLiked ? "fill-red-600" : ""}`} />
            <span>{post.likesCount || 0}</span>
            <span className="hidden sm:inline">Likes</span>
          </button>

          {/* Comment */}
          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-ink-600 hover:bg-paper-100 transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            <span>{post.comments?.length || 0}</span>
            <span className="hidden sm:inline">Comments</span>
          </button>
        </div>

        {/* Share */}
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-ink-600 hover:bg-paper-100 transition-colors"
          title="Share post"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />}
          <span>{copied ? "Link Copied" : "Share"}</span>
        </button>
      </div>

      {/* Expandable Comments Drawer */}
      {showComments && (
        <div className="mt-3 pt-3 border-t border-ink-100 bg-paper-50/70 -mx-5 -mb-5 p-4 sm:p-5 space-y-3">
          <form onSubmit={handleCommentSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Add a constructive thought or feedback..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs text-ink placeholder:text-ink-400 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
            />
            <Button size="sm" type="submit" disabled={!commentText.trim()} className="h-8 px-3 text-xs">
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>

          {post.comments && post.comments.length > 0 ? (
            <div className="space-y-2.5 max-h-60 overflow-y-auto divide-y divide-ink-100/60 pt-1">
              {post.comments.map((comm) => (
                <div key={comm.id} className="pt-2 first:pt-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-bold text-ink">{comm.authorName}</span>
                    <span className="text-[10px] text-ink-400">
                      {formatRelativeTime(comm.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-ink-600 mt-0.5 leading-relaxed">{comm.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-[11px] text-ink-400 py-2">
              No comments yet. Start the conversation!
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
