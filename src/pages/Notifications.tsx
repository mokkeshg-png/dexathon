import { useState } from "react";
import { Link } from "react-router-dom";
import { useNotifications } from "@/context/NotificationContext";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Card";
import {
  Bell,
  CheckCircle2,
  Clock,
  ExternalLink,
  Inbox,
  UserPlus,
  Briefcase,
  GraduationCap,
  MessageSquare,
  CheckCheck
} from "lucide-react";

export function Notifications() {
  const { items, unread, markRead, markAll } = useNotifications();
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  const filteredItems = items.filter((item) => {
    if (filter === "unread") return !item.read;
    if (filter === "read") return item.read;
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "join_request":
      case "application":
        return <UserPlus className="h-5 w-5 text-indigo-600" />;
      case "application_accepted":
      case "application_approved":
        return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
      case "project_invitation":
        return <Briefcase className="h-5 w-5 text-purple-600" />;
      case "mentorship_request":
        return <GraduationCap className="h-5 w-5 text-amber-600" />;
      case "discussion_reply":
        return <MessageSquare className="h-5 w-5 text-sky-600" />;
      default:
        return <Bell className="h-5 w-5 text-slate-600" />;
    }
  };

  return (
    <div className="clay-page max-w-4xl space-y-6">
      <div className="clay-welcome-banner clay-neural-bg p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest border"
              style={{ background: "linear-gradient(135deg,#FFF8DC,#FFE680)", color: "#7A4D00", borderColor: "#FFD040" }}
            >
              <Bell className="h-3.5 w-3.5" /> Notifications Center
            </span>
          </div>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-extrabold tracking-tight text-[#181B1F] leading-tight">
            Notifications & Updates
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#5E646A] leading-relaxed">
            Stay updated with project invites, applications, team activity, and campus announcements.
          </p>
        </div>
        {unread > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAll()}
            className="flex items-center gap-1.5 self-start sm:self-auto text-xs"
          >
            <CheckCheck className="h-4 w-4 text-[#8C6000]" />
            Mark all as read
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`clay-btn text-xs px-4 py-2 ${
              filter === "all"
                ? "clay-btn-primary"
                : "clay-btn-outline"
            }`}
          >
            All ({items.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`clay-btn text-xs px-4 py-2 ${
              filter === "unread"
                ? "clay-btn-primary"
                : "clay-btn-outline"
            }`}
          >
            Unread ({unread})
          </button>
          <button
            onClick={() => setFilter("read")}
            className={`clay-btn text-xs px-4 py-2 ${
              filter === "read"
                ? "clay-btn-primary"
                : "clay-btn-outline"
            }`}
          >
            Read ({items.length - unread})
          </button>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No notifications"
          body={
            filter === "unread"
              ? "You have no unread notifications right now."
              : "You're all caught up! Important updates will appear here."
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredItems.map((n) => (
            <div
              key={n.id}
              className={`clay-card p-4 sm:p-5 flex flex-col sm:flex-row items-start justify-between gap-4 transition-all ${
                !n.read ? "border-l-4 border-l-[#FFC812] bg-[#FFFDF7]" : "opacity-90"
              }`}
            >
              <div className="flex items-start gap-3.5 flex-1">
                <div className="rounded-2xl bg-gradient-to-br from-[#FFF8DC] to-[#FFE680] border border-[#FFD040] p-2.5 mt-0.5 shrink-0 shadow-xs">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-[#181B1F]">{n.title}</h4>
                    {!n.read && (
                      <span className="clay-badge clay-badge-gold text-[10px] px-2 py-0.5">
                        New
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[#5E646A] leading-relaxed">{n.message}</p>
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-[#8C8372]">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(n.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {n.link && (
                  <Link
                    to={n.link}
                    onClick={() => {
                      if (!n.read) markRead(n.id);
                    }}
                  >
                    <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs">
                      View
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </Link>
                )}
                {!n.read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markRead(n.id)}
                    className="text-xs text-[#8C8372] hover:text-[#181B1F]"
                  >
                    Mark read
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
