"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageCircle,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  Send,
  ArrowLeftRight,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type TabKey = "waiting" | "active" | "all" | "closed";

interface Props {
  currentUser: { _id: Id<"users">; name: string; role?: string };
}

const STATUS_COLORS: Record<string, string> = {
  waiting: "bg-yellow-100 text-yellow-700",
  active: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-500",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  waiting: <Clock className="h-3 w-3" />,
  active: <CheckCircle2 className="h-3 w-3" />,
  closed: <XCircle className="h-3 w-3" />,
};

const AUDIT_ICONS: Record<string, string> = {
  chat_started: "💬",
  claimed: "🙋",
  unclaimed: "↩️",
  transferred: "🔄",
  message_sent: "✉️",
  closed: "✅",
  reopened: "🔁",
};

export function LiveChatInbox({ currentUser }: Props) {
  const [tab, setTab] = useState<TabKey>("waiting");
  const [selectedChatId, setSelectedChatId] = useState<Id<"liveChats"> | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferTo, setTransferTo] = useState<string | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);

  const allChats = useQuery(api.liveChat.getAllChats) ?? [];
  const supervisors = useQuery(api.liveChat.getSupervisors) ?? [];
  const messages = useQuery(
    api.liveChat.getChatMessages,
    selectedChatId ? { chatId: selectedChatId } : "skip"
  ) ?? [];
  const auditLog = useQuery(
    api.liveChat.getAuditLog,
    currentUser.role === "admin" && auditOpen && selectedChatId
      ? { chatId: selectedChatId }
      : "skip"
  );

  const generateUploadUrl = useMutation(api.liveChat.generateSupervisorUploadUrl);

  const handleImageFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  // Paste handler — only when a chat is selected and claimed
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      if (!selectedChatId) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) handleImageFile(file);
        }
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [selectedChatId, handleImageFile]);

  const claimChat = useMutation(api.liveChat.claimChat);
  const unclaimChat = useMutation(api.liveChat.unclaimChat);
  const sendMessage = useMutation(api.liveChat.sendSupervisorMessage);
  const closeChat = useMutation(api.liveChat.closeChat);
  const reopenChat = useMutation(api.liveChat.reopenChat);
  const transferChat = useMutation(api.liveChat.transferChat);

  const filteredChats = allChats.filter((c) => {
    if (tab === "waiting") return c.status === "waiting";
    if (tab === "active") return c.status === "active" && c.claimedBy === currentUser._id;
    if (tab === "closed") return c.status === "closed";
    return true; // "all"
  });

  const selectedChat = allChats.find((c) => c._id === selectedChatId) ?? null;

  async function handleClaim() {
    if (!selectedChatId) return;
    try {
      await claimChat({ chatId: selectedChatId });
      toast.success("Chat claimed");
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function handleUnclaim() {
    if (!selectedChatId) return;
    try {
      await unclaimChat({ chatId: selectedChatId });
      toast.success("Chat returned to queue");
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if ((!replyText.trim() && !imageFile) || !selectedChatId) return;
    setSending(true);
    try {
      let imageId: Id<"_storage"> | undefined;
      if (imageFile) {
        const uploadUrl = await generateUploadUrl();
        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": imageFile.type },
          body: imageFile,
        });
        const { storageId } = await res.json();
        imageId = storageId;
      }
      await sendMessage({ chatId: selectedChatId, text: replyText.trim(), imageId });
      setReplyText("");
      setImageFile(null);
      setImagePreview(null);
    } finally {
      setSending(false);
    }
  }

  async function handleClose() {
    if (!selectedChatId) return;
    try {
      await closeChat({ chatId: selectedChatId });
      toast.success("Chat closed");
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function handleReopen() {
    if (!selectedChatId) return;
    try {
      await reopenChat({ chatId: selectedChatId });
      toast.success("Chat reopened");
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function handleTransfer() {
    if (!selectedChatId || !transferTo) return;
    try {
      await transferChat({ chatId: selectedChatId, toUserId: transferTo as Id<"users"> });
      toast.success("Chat transferred");
      setTransferOpen(false);
      setTransferTo(null);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  const tabCounts = {
    waiting: allChats.filter((c) => c.status === "waiting").length,
    active: allChats.filter((c) => c.status === "active" && c.claimedBy === currentUser._id).length,
    all: allChats.length,
    closed: allChats.filter((c) => c.status === "closed").length,
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Left panel — chat list */}
      <div className="flex w-72 shrink-0 flex-col border-r">
        <div className="border-b px-4 py-3">
          <h2 className="text-base font-semibold">Live Chat</h2>
          <p className="text-xs text-muted-foreground">Incoming client conversations</p>
        </div>

        <div className="border-b px-3 py-2">
          <Tabs value={tab} onValueChange={(v) => { setTab(v as TabKey); setSelectedChatId(null); }}>
            <TabsList className="grid w-full grid-cols-4 h-8">
              <TabsTrigger value="waiting" className="text-xs px-1">
                Wait {tabCounts.waiting > 0 && <span className="ml-1 rounded-full bg-yellow-500 px-1 text-[10px] text-white">{tabCounts.waiting}</span>}
              </TabsTrigger>
              <TabsTrigger value="active" className="text-xs px-1">
                Mine {tabCounts.active > 0 && <span className="ml-1 rounded-full bg-green-500 px-1 text-[10px] text-white">{tabCounts.active}</span>}
              </TabsTrigger>
              <TabsTrigger value="all" className="text-xs px-1">All</TabsTrigger>
              <TabsTrigger value="closed" className="text-xs px-1">Done</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredChats.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              <MessageCircle className="mx-auto mb-2 h-8 w-8 opacity-30" />
              No chats here
            </div>
          ) : (
            filteredChats.map((chat) => (
              <button
                key={chat._id}
                onClick={() => setSelectedChatId(chat._id)}
                className={cn(
                  "w-full border-b px-4 py-3 text-left transition hover:bg-muted/50",
                  selectedChatId === chat._id && "bg-muted"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {chat.clientName?.[0]?.toUpperCase() ?? chat.email[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {chat.clientName ?? chat.email}
                      </p>
                      {chat.clientName && (
                        <p className="truncate text-xs text-muted-foreground">{chat.email}</p>
                      )}
                      {chat.uid && (
                        <p className="text-xs text-muted-foreground">UID: {chat.uid}</p>
                      )}
                    </div>
                  </div>
                  <span className={cn("flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium", STATUS_COLORS[chat.status])}>
                    {STATUS_ICONS[chat.status]}
                    {chat.status}
                  </span>
                </div>
                <p className="mt-1 text-right text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(chat.createdAt), { addSuffix: true })}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right panel — chat thread */}
      {selectedChat ? (
        <div className="flex flex-1 flex-col">
          {/* Chat header */}
          <div className="flex items-center justify-between border-b px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {selectedChat.clientName?.[0]?.toUpperCase() ?? selectedChat.email[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {selectedChat.clientName ?? selectedChat.email}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{selectedChat.email}</span>
                  {selectedChat.uid && <span>· UID: <span className="font-medium text-foreground">{selectedChat.uid}</span></span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Audit trail — admin only */}
              {currentUser.role === "admin" && (
                <Button size="sm" variant="outline" onClick={() => setAuditOpen(true)} className="gap-1.5 text-xs">
                  <History className="h-3.5 w-3.5" />
                  Audit
                </Button>
              )}

              {/* Claim / Unclaim */}
              {selectedChat.status === "waiting" && (
                <Button size="sm" onClick={handleClaim} className="gap-1.5 text-xs">
                  <User className="h-3.5 w-3.5" />
                  Claim
                </Button>
              )}
              {selectedChat.status === "active" && selectedChat.claimedBy === currentUser._id && (
                <Button size="sm" variant="outline" onClick={handleUnclaim} className="gap-1.5 text-xs">
                  ↩ Release
                </Button>
              )}

              {/* Transfer */}
              {selectedChat.status === "active" && (
                <Button size="sm" variant="outline" onClick={() => setTransferOpen(true)} className="gap-1.5 text-xs">
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                  Transfer
                </Button>
              )}

              {/* Close / Reopen */}
              {selectedChat.status !== "closed" ? (
                <Button size="sm" variant="destructive" onClick={handleClose} className="text-xs">
                  Close
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={handleReopen} className="text-xs">
                  Reopen
                </Button>
              )}
            </div>
          </div>

          {/* Claimed by banner */}
          {selectedChat.claimedBy && selectedChat.status === "active" && (
            <div className="border-b bg-green-50 px-5 py-1.5 text-xs text-green-700">
              {selectedChat.claimedBy === currentUser._id
                ? "You are handling this chat"
                : `Claimed by another agent`}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg._id}
                className={`flex gap-2 ${msg.sender === "supervisor" ? "flex-row-reverse" : ""}`}
              >
                <div className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  msg.sender === "supervisor" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {msg.sender === "supervisor" ? (msg.senderName?.[0] ?? "S") : (selectedChat.clientName?.[0]?.toUpperCase() ?? "C")}
                </div>
                <div className={cn(
                  "max-w-[65%] rounded-2xl px-3 py-2 text-sm",
                  msg.sender === "supervisor"
                    ? "rounded-tr-sm bg-primary text-primary-foreground"
                    : "rounded-tl-sm bg-muted text-foreground"
                )}>
                  {msg.sender === "supervisor" && (
                    <p className="mb-0.5 text-[10px] opacity-70">{msg.senderName}</p>
                  )}
                  {(msg as any).imageUrl && (
                    <img
                      src={(msg as any).imageUrl}
                      alt="attachment"
                      className="mb-1.5 max-h-48 w-auto rounded-lg object-contain"
                    />
                  )}
                  {msg.text && <p>{msg.text}</p>}
                  <div className={cn("mt-0.5 text-right text-[10px] opacity-60")}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">No messages yet</div>
            )}
          </div>

          {/* Reply input */}
          {selectedChat.status !== "closed" ? (
            <form onSubmit={handleSend} className="border-t px-4 py-3 space-y-2">
              {/* Image preview */}
              {imagePreview && (
                <div className="relative inline-block">
                  <img src={imagePreview} alt="preview" className="max-h-24 rounded-lg border object-contain" />
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-white text-xs hover:bg-red-500"
                  >×</button>
                </div>
              )}
              <div className="flex items-end gap-2">
                {/* File upload */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={selectedChat.claimedBy !== currentUser._id}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-muted-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                  title="Attach image"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = ""; }}
                />
                <input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={selectedChat.claimedBy === currentUser._id ? "Type a reply or paste an image…" : "Claim this chat to reply"}
                  disabled={selectedChat.claimedBy !== currentUser._id}
                  className="flex-1 rounded-xl border px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={(!replyText.trim() && !imageFile) || sending || selectedChat.claimedBy !== currentUser._id}
                  className="h-9 w-9 shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          ) : (
            <div className="border-t px-4 py-3 text-center text-xs text-muted-foreground">
              This chat is closed.
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          <div className="text-center">
            <MessageCircle className="mx-auto mb-3 h-12 w-12 opacity-20" />
            <p className="text-sm">Select a chat to view</p>
          </div>
        </div>
      )}

      {/* Transfer dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Chat</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Select a supervisor to transfer this chat to.</p>
          <Select value={transferTo ?? ""} onValueChange={(v) => setTransferTo(v || null)}>
            <SelectTrigger>
              <SelectValue placeholder="Select supervisor">
                {transferTo
                  ? supervisors.find((s) => s._id === transferTo)?.name ?? "Select supervisor"
                  : "Select supervisor"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {supervisors
                .filter((s) => s._id !== currentUser._id)
                .map((s) => (
                  <SelectItem key={s._id} value={s._id}>
                    {s.name} — {s.role}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setTransferOpen(false)}>Cancel</Button>
            <Button disabled={!transferTo} onClick={handleTransfer}>Transfer</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Audit trail dialog — admin only */}
      {currentUser.role === "admin" && (
        <Dialog open={auditOpen} onOpenChange={setAuditOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Audit Trail</DialogTitle>
            </DialogHeader>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {auditLog === undefined ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
              ) : auditLog.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No audit events</div>
              ) : (
                auditLog.map((log) => (
                  <div key={log._id} className="flex gap-3 rounded-lg border px-3 py-2 text-sm">
                    <span className="text-base">{AUDIT_ICONS[log.event] ?? "📋"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium capitalize">{log.event.replace(/_/g, " ")}</p>
                      {log.details && <p className="text-xs text-muted-foreground">{log.details}</p>}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
