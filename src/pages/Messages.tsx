import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  fetchProjects,
  fetchMembershipsByUser,
  fetchDiscussions,
  fetchReplies,
  fetchAllProfiles,
  addDiscussion,
  addReply,
  fetchDirectConversations,
  fetchDirectMessages,
  sendDirectMessage,
  closeDirectConversation,
} from "@/lib/supabase-db";
import { Button } from "@/components/ui/Button";
import { Card, Badge, EmptyState } from "@/components/ui/Card";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import type {
  Project,
  Discussion,
  DiscussionReply,
  Profile,
  DirectConversation,
  DirectMessage,
} from "@/types";
import {
  MessageSquare,
  Send,
  Plus,
  Loader2,
  Users,
  FolderArchive,
  User,
  ShieldAlert,
} from "lucide-react";

export function Messages() {
  const { user } = useAuth();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  // Mode: "projects" or "direct" (1-on-1 peer/mentor)
  const [activeMode, setActiveMode] = useState<"projects" | "direct">("projects");

  // Project discussions state
  const [projects, setProjects] = useState<Project[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [replies, setReplies] = useState<DiscussionReply[]>([]);
  const [selectedDiscussionId, setSelectedDiscussionId] = useState<string | null>(null);
  const [newReplyText, setNewReplyText] = useState("");
  const [newDiscOpen, setNewDiscOpen] = useState(false);
  const [newDiscTitle, setNewDiscTitle] = useState("");
  const [newDiscBody, setNewDiscBody] = useState("");

  // Direct 1-on-1 messaging state (Req 1 & 7)
  const [directConversations, setDirectConversations] = useState<DirectConversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
  const [newDirectText, setNewDirectText] = useState("");
  const [sendingDirect, setSendingDirect] = useState(false);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const selectedProjectIdRef = useRef<string | null>(null);
  selectedProjectIdRef.current = selectedProjectId;

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [allProjs, memberships, profiles, convs] = await Promise.all([
        fetchProjects(),
        fetchMembershipsByUser(user.id),
        fetchAllProfiles(),
        fetchDirectConversations(user.id),
      ]);

      const memberProjectIds = new Set(memberships.map((m) => m.projectId));
      const activeProjs = allProjs.filter(
        (p) => p.ownerId === user.id || memberProjectIds.has(p.id)
      );

      setProjects(activeProjs);
      setAllProfiles(profiles);
      setDirectConversations(convs);

      // Check URL query param for direct chat or default mode
      const directTarget = searchParams.get("direct") || searchParams.get("userId");
      if (directTarget || (activeProjs.length === 0 && convs.length > 0)) {
        setActiveMode("direct");
        if (convs.length > 0) {
          const matched = directTarget
            ? convs.find((c) => c.participantIds.includes(directTarget) || c.id === directTarget)
            : convs[0];
          setSelectedConvId(matched?.id || convs[0].id);
        }
      } else if (activeProjs.length > 0 && !selectedProjectIdRef.current) {
        setSelectedProjectId(activeProjs[0].id);
      }
    } catch (err) {
      console.error("Messages load error:", err);
    } finally {
      setLoading(false);
    }
  }, [user, searchParams]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load project discussions
  useEffect(() => {
    if (!selectedProjectId) return;
    let cancelled = false;
    async function loadDisc() {
      const discs = await fetchDiscussions(selectedProjectId!);
      if (!cancelled) {
        setDiscussions(discs);
        const currentTargetId =
          selectedDiscussionId && discs.some((d) => d.id === selectedDiscussionId)
            ? selectedDiscussionId
            : discs.length > 0
            ? discs[0].id
            : null;
        setSelectedDiscussionId(currentTargetId);
      }
    }
    loadDisc();
    return () => {
      cancelled = true;
    };
  }, [selectedProjectId]);

  // Load project replies
  useEffect(() => {
    if (!selectedDiscussionId) {
      setReplies([]);
      return;
    }
    let cancelled = false;
    fetchReplies(selectedDiscussionId).then((reps) => {
      if (!cancelled) setReplies(reps);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedDiscussionId]);

  // Load direct messages when selected direct conversation changes
  useEffect(() => {
    if (!selectedConvId) {
      setDirectMessages([]);
      return;
    }
    let cancelled = false;
    fetchDirectMessages(selectedConvId).then((msgs) => {
      if (!cancelled) setDirectMessages(msgs);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedConvId]);

  if (!user) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-ink-500">You must be signed in to access collaboration messages.</p>
        <Link to="/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  // Active Project Context
  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const activeDiscussion = discussions.find((d) => d.id === selectedDiscussionId) || discussions[0];
  const activeReplies = activeDiscussion
    ? replies.filter((r) => r.discussionId === activeDiscussion.id)
    : [];

  // Active Direct Conversation Context
  const activeConv = directConversations.find((c) => c.id === selectedConvId) || directConversations[0];
  const otherParticipantId = activeConv?.participantIds.find((id) => id !== user.id);
  const otherProfile = allProfiles.find((p) => p.userId === otherParticipantId);
  const isConvEnded = activeConv?.status === "ended" || activeConv?.status === "closed";

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDiscussionId || !newReplyText.trim()) return;
    setSending(true);
    try {
      await addReply(user.id, selectedDiscussionId, newReplyText.trim());
      const reps = await fetchReplies(selectedDiscussionId);
      setReplies(reps);
      setNewReplyText("");
    } catch (err: any) {
      toast.error("Failed to send reply", err?.message);
    } finally {
      setSending(false);
    }
  };

  const handleCreateDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !newDiscTitle.trim() || !newDiscBody.trim()) return;
    try {
      await addDiscussion(user.id, selectedProjectId, newDiscTitle.trim(), newDiscBody.trim());
      const updated = await fetchDiscussions(selectedProjectId);
      setDiscussions(updated);
      if (updated.length > 0) {
        setSelectedDiscussionId(updated[0].id);
        const reps = await fetchReplies(updated[0].id);
        setReplies(reps);
      }
      setNewDiscOpen(false);
      setNewDiscTitle("");
      setNewDiscBody("");
      toast.success("Discussion started", `"${newDiscTitle.trim()}" published to team.`);
    } catch (err: any) {
      toast.error("Failed to start discussion", err?.message);
    }
  };

  const handleSendDirectMsg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv || !otherParticipantId || !newDirectText.trim() || isConvEnded) return;
    setSendingDirect(true);
    try {
      await sendDirectMessage(activeConv.id, user.id, otherParticipantId, newDirectText.trim());
      const updatedMsgs = await fetchDirectMessages(activeConv.id);
      setDirectMessages(updatedMsgs);
      setNewDirectText("");
      // Update local conversation preview
      setDirectConversations((prev) =>
        prev.map((c) =>
          c.id === activeConv.id
            ? { ...c, lastMessage: newDirectText.trim(), lastMessageAt: new Date().toISOString() }
            : c
        )
      );
    } catch (err: any) {
      toast.error("Failed to send message", err?.message);
    } finally {
      setSendingDirect(false);
    }
  };

  const handleEndDirectCollaboration = async () => {
    if (!activeConv || !otherParticipantId) return;
    if (confirm("Are you sure you want to conclude this 1-on-1 collaboration? Message history will be retained, but new messages will be disabled.")) {
      await closeDirectConversation(user.id, otherParticipantId, "ended");
      setDirectConversations((prev) =>
        prev.map((c) => (c.id === activeConv.id ? { ...c, status: "ended" } : c))
      );
      toast.info("Collaboration concluded", "1-on-1 conversation status set to ended.");
    }
  };

  return (
    <div className="clay-page space-y-6">
      {/* Header with Mode Switch */}
      <div className="clay-welcome-banner clay-neural-bg p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest border"
              style={{ background: "linear-gradient(135deg,#FFF8DC,#FFE680)", color: "#7A4D00", borderColor: "#FFD040" }}
            >
              <MessageSquare className="h-3.5 w-3.5" /> Academic Collaboration Hub
            </span>
            <span className="text-xs text-[#8C8372] font-semibold bg-white/60 rounded-full px-2.5 py-0.5 border border-[#ECE5D8]">
              Real-Time Workspace
            </span>
          </div>
          <h1 className="mt-3 font-serif text-3xl sm:text-4xl font-extrabold tracking-tight text-[#181B1F] leading-tight">
            Messages & Team Communications
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#5E646A] max-w-2xl leading-relaxed">
            Coordinate milestones with assigned project teams or engage in direct 1-on-1 peer and mentor conversations without needing an active project.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1.5 bg-white/70 rounded-2xl border border-[#ECE5D8] self-start sm:self-auto shadow-xs">
          <button
            onClick={() => setActiveMode("direct")}
            className={`clay-btn text-xs px-3.5 py-2 ${
              activeMode === "direct"
                ? "clay-btn-primary"
                : "clay-btn-ghost"
            }`}
          >
            <Users className="h-3.5 w-3.5 mr-1" />
            <span>1-on-1 Peer Chats</span>
            {directConversations.length > 0 && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${activeMode === "direct" ? "bg-black/15 text-[#181B1F]" : "bg-[#FFF4D0] text-[#8C6000]"}`}>
                {directConversations.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveMode("projects")}
            className={`clay-btn text-xs px-3.5 py-2 ${
              activeMode === "projects"
                ? "clay-btn-primary"
                : "clay-btn-ghost"
            }`}
          >
            <FolderArchive className="h-3.5 w-3.5 mr-1" />
            <span>Project Rooms</span>
            {projects.length > 0 && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${activeMode === "projects" ? "bg-black/15 text-[#181B1F]" : "bg-[#FFF4D0] text-[#8C6000]"}`}>
                {projects.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-navy" />
        </div>
      ) : activeMode === "direct" ? (
        /* MODE A: 1-ON-1 DIRECT COLLABORATION MESSAGING (REQ 1 & 7) */
        directConversations.length === 0 ? (
          <EmptyState
            title="No Direct 1-on-1 Collaborations Yet"
            body="You can collaborate independently with other students or request faculty mentorship without first creating a project."
            action={
              <div className="flex justify-center gap-3">
                <Link to="/collaborators">
                  <Button variant="outline">Find Researchers & Peers</Button>
                </Link>
                <Link to="/requests?tab=direct">
                  <Button>View Collaboration Desk</Button>
                </Link>
              </div>
            }
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Direct Conversations List Sidebar */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-ink-500">
                  Peer Conversations ({directConversations.length})
                </h3>
                <Link to="/collaborators" className="text-xs text-navy font-semibold hover:underline">
                  + Connect
                </Link>
              </div>

              <div className="space-y-2">
                {directConversations.map((conv) => {
                  const isSelected = conv.id === selectedConvId;
                  const otherId = conv.participantIds.find((id) => id !== user.id);
                  const prof = allProfiles.find((p) => p.userId === otherId);
                  const isFacultyPeer = !!prof?.designation || prof?.role === "faculty";

                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConvId(conv.id)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                        isSelected
                          ? "border-navy bg-navy text-white shadow-sm"
                          : "border-ink-100 bg-white hover:border-ink-200 text-ink"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : isFacultyPeer
                              ? "bg-brass-50 text-brass-800"
                              : "bg-navy-50 text-navy"
                          }`}
                        >
                          {prof?.fullName.charAt(0) || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="font-serif font-bold text-xs truncate">
                              {prof?.fullName || "Collaborator"}
                            </h4>
                            {conv.status === "ended" && (
                              <span className="text-[9px] uppercase px-1 rounded bg-ink-200 text-ink-700">
                                Ended
                              </span>
                            )}
                          </div>
                          <p
                            className={`text-[11px] truncate mt-0.5 ${
                              isSelected ? "text-white/80" : "text-ink-400"
                            }`}
                          >
                            {conv.lastMessage || `${prof?.department || "Academic Research"}`}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Direct Conversation Thread */}
            <div className="lg:col-span-3 space-y-4">
              {activeConv && otherProfile ? (
                <Card className="p-0 overflow-hidden border-ink-100 flex flex-col h-[650px] shadow-sm">
                  {/* Chat Top Banner */}
                  <div className="p-4 border-b border-ink-100 bg-paper-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-navy text-white flex items-center justify-center font-serif font-bold text-sm">
                        {otherProfile.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/profile/${otherProfile.userId}`}
                            className="font-serif font-bold text-ink text-sm hover:underline"
                          >
                            {otherProfile.fullName}
                          </Link>
                          <Badge tone={otherProfile.role === "faculty" ? "brass" : "navy"}>
                            {otherProfile.role === "faculty" ? "FACULTY MENTOR" : "STUDENT COLLABORATOR"}
                          </Badge>
                          {activeConv.status === "ended" && <Badge tone="slate">COLLABORATION ENDED</Badge>}
                        </div>
                        <p className="text-xs text-ink-500">
                          {otherProfile.department} • {otherProfile.institution}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link to={`/profile/${otherProfile.userId}`}>
                        <Button variant="outline" size="sm" className="text-xs">
                          <User className="h-3.5 w-3.5 mr-1" /> Profile
                        </Button>
                      </Link>
                      {activeConv.status === "active" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleEndDirectCollaboration}
                          className="text-xs text-ink-400 hover:text-red-700"
                        >
                          Conclude Collaboration
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Ended Collaboration Alert Banner */}
                  {isConvEnded && (
                    <div className="bg-amber-50 p-2.5 px-4 text-xs text-amber-900 border-b border-amber-200 flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-amber-700 shrink-0" />
                      <span>
                        This peer collaboration has been concluded. Message history is preserved under platform retention guidelines, but further messaging is disabled.
                      </span>
                    </div>
                  )}

                  {/* Messages Feed */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
                    {directMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-xs text-ink-400 space-y-2">
                        <MessageSquare className="h-8 w-8 text-ink-300" />
                        <p className="font-semibold text-ink">Collaboration Channel Activated!</p>
                        <p className="max-w-xs">
                          Discuss project ideas, hackathons, team formation, and technical interests directly with {otherProfile.fullName}.
                        </p>
                      </div>
                    ) : (
                      directMessages.map((msg) => {
                        const isMe = msg.senderId === user.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                          >
                            <div
                              className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-2xs ${
                                isMe
                                  ? "bg-navy text-white rounded-br-xs"
                                  : "bg-paper-100 text-ink rounded-bl-xs border border-ink-100"
                              }`}
                            >
                              <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            </div>
                            <span className="text-[10px] text-ink-400 mt-1 px-1">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Input form */}
                  <form
                    onSubmit={handleSendDirectMsg}
                    className="p-3 border-t border-ink-100 bg-white flex items-center gap-2"
                  >
                    <Input
                      placeholder={
                        isConvEnded
                          ? "Collaboration has ended. Messaging is disabled."
                          : `Message ${otherProfile.fullName.split(" ")[0]}...`
                      }
                      value={newDirectText}
                      onChange={(e) => setNewDirectText(e.target.value)}
                      disabled={isConvEnded || sendingDirect}
                      className="text-xs"
                    />
                    <Button type="submit" disabled={isConvEnded || sendingDirect || !newDirectText.trim()}>
                      {sendingDirect ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </form>
                </Card>
              ) : (
                <EmptyState
                  title="Select a Conversation"
                  body="Choose a peer or faculty mentor from the left sidebar to start chatting."
                />
              )}
            </div>
          </div>
        )
      ) : (
        /* MODE B: PROJECT ROOM DISCUSSIONS */
        projects.length === 0 ? (
          <EmptyState
            title="No Active Project Workspaces"
            body="You are not enrolled in any project teams yet. You can browse open projects or chat directly with peers in 1-on-1 Messages."
            action={
              <div className="flex justify-center gap-3">
                <Link to="/projects">
                  <Button variant="outline">Browse Projects</Button>
                </Link>
                <Link to="/collaborators">
                  <Button>Find 1-on-1 Collaborators</Button>
                </Link>
              </div>
            }
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Project List Sidebar */}
            <div className="space-y-4">
              <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-ink-500">
                Your Projects ({projects.length})
              </h3>
              <div className="space-y-2">
                {projects.map((proj) => {
                  const isSelected = proj.id === selectedProjectId;
                  const isOwner = proj.ownerId === user.id;

                  return (
                    <button
                      key={proj.id}
                      onClick={() => {
                        setSelectedProjectId(proj.id);
                        setSelectedDiscussionId(null);
                      }}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                        isSelected
                          ? "border-navy bg-navy text-white shadow-sm"
                          : "border-ink-100 bg-white hover:border-ink-200 text-ink"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-serif font-bold text-xs truncate">{proj.title}</h4>
                        <span
                          className={`text-[9px] uppercase tracking-wider font-semibold rounded px-1.5 py-0.2 ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : isOwner
                              ? "bg-brass-50 text-brass-800"
                              : "bg-navy-50 text-navy-800"
                          }`}
                        >
                          {isOwner ? "Owner" : "Member"}
                        </span>
                      </div>
                      <p
                        className={`text-[11px] truncate mt-1 ${
                          isSelected ? "text-white/80" : "text-ink-400"
                        }`}
                      >
                        {proj.domains[0] || "Academic Research"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Discussions & Replies Thread */}
            <div className="lg:col-span-3 space-y-4">
              {selectedProject && (
                <Card className="p-5 border-ink-100 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ink-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-serif text-xl font-bold text-ink">
                          {selectedProject.title}
                        </h2>
                        <Badge tone="navy">{discussions.length} Threads</Badge>
                      </div>
                      <p className="text-xs text-ink-500 mt-0.5">
                        Team workspace discussion room. All members can post updates and replies.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link to={`/projects/${selectedProject.id}/room`}>
                        <Button variant="outline" size="sm" className="text-xs">
                          Open Project Room →
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        onClick={() => setNewDiscOpen(true)}
                        className="text-xs flex items-center gap-1.5"
                      >
                        <Plus className="h-3.5 w-3.5" /> Start Discussion
                      </Button>
                    </div>
                  </div>

                  {/* Thread Picker */}
                  {discussions.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 border-b border-ink-50">
                      {discussions.map((d) => (
                        <button
                          key={d.id}
                          onClick={() => setSelectedDiscussionId(d.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                            selectedDiscussionId === d.id
                              ? "bg-navy text-white shadow-2xs"
                              : "bg-paper-100 text-ink-600 hover:bg-paper-200"
                          }`}
                        >
                          {d.title}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Active Discussion Content & Replies */}
                  {activeDiscussion ? (
                    <div className="space-y-4 pt-2">
                      <div className="rounded-xl border border-ink-100 bg-paper-50 p-4 space-y-2">
                        <h3 className="font-serif font-bold text-base text-ink">
                          {activeDiscussion.title}
                        </h3>
                        <p className="text-xs text-ink-700 leading-relaxed whitespace-pre-wrap">
                          {activeDiscussion.body}
                        </p>
                        <span className="text-[10px] text-ink-400 block pt-1">
                          Posted on {new Date(activeDiscussion.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Replies List */}
                      <div className="space-y-3 pl-2 sm:pl-4 border-l-2 border-ink-100">
                        {activeReplies.map((rep) => {
                          const author = allProfiles.find((p) => p.userId === rep.userId);
                          return (
                            <div key={rep.id} className="p-3 rounded-xl bg-white border border-ink-100 text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-ink">{author?.fullName || "Team Member"}</span>
                                <span className="text-[10px] text-ink-400">
                                  {new Date(rep.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                              <p className="text-ink-700 leading-relaxed">{rep.body}</p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Reply Form */}
                      <form onSubmit={handleSendReply} className="flex gap-2 pt-2">
                        <Input
                          placeholder="Reply to this technical discussion thread..."
                          value={newReplyText}
                          onChange={(e) => setNewReplyText(e.target.value)}
                          className="text-xs"
                        />
                        <Button type="submit" disabled={sending || !newReplyText.trim()}>
                          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                      </form>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-ink-400">
                      No discussions created yet in this project. Click "+ Start Discussion" above.
                    </div>
                  )}
                </Card>
              )}
            </div>
          </div>
        )
      )}

      {/* New Discussion Modal */}
      <Modal
        open={newDiscOpen}
        onClose={() => setNewDiscOpen(false)}
        title="Start Team Discussion"
      >
        <form onSubmit={handleCreateDiscussion} className="space-y-4">
          <Field label="Discussion Subject" required>
            <Input
              value={newDiscTitle}
              onChange={(e) => setNewDiscTitle(e.target.value)}
              placeholder="e.g. Database Schema Migration vs Microservices"
              required
            />
          </Field>
          <Field label="Topic Overview & Context" required>
            <Textarea
              rows={4}
              value={newDiscBody}
              onChange={(e) => setNewDiscBody(e.target.value)}
              placeholder="Outline the technical questions, API specs, or task blockers for your team..."
              required
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setNewDiscOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Publish to Project</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
