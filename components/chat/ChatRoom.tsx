"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { SendHorizontal, ImagePlus, X, Search, Reply } from "lucide-react";

function autoResize(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = `${Math.min(el.scrollHeight, 150)}px`;
}

function getRoleBadge(role: string) {
  switch (role) {
    case "admin":
      return (
        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
          Admin
        </span>
      );
    case "manager":
      return (
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
          Manager
        </span>
      );
    case "customer_service":
      return (
        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
          CS
        </span>
      );
    default:
      return null;
  }
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateSeparator(ts: number) {
  const date = new Date(ts);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatFullDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

interface ReplyInfo {
  id: Id<"chatMessages">;
  senderName: string;
  message: string;
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const results = useQuery(
    api.chat.search,
    debouncedQuery.trim() ? { query: debouncedQuery.trim() } : "skip"
  );

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [searchQuery]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search messages..."
          className="border-0 shadow-none focus-visible:ring-0"
          autoFocus
        />
        <Button size="sm" variant="ghost" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {!debouncedQuery.trim() ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Search by message content or sender name
          </p>
        ) : results === undefined ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : results.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No messages found
          </p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              {results.length} result{results.length !== 1 ? "s" : ""}
            </p>
            {results.map((msg) => (
              <div
                key={msg._id}
                className="rounded-lg border p-3 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold">
                      {msg.senderName}
                    </span>
                    {getRoleBadge(msg.senderRole)}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {formatFullDate(msg.createdAt)}
                  </span>
                </div>
                {msg.imageUrl && (
                  <img
                    src={msg.imageUrl}
                    alt="Shared image"
                    className="max-h-32 rounded object-contain"
                  />
                )}
                {msg.message && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap wrap-break-word">
                    {msg.message}
                  </p>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export function ChatRoom({ currentUserId }: { currentUserId: string }) {
  const messages = useQuery(api.chat.list);
  const sendMessage = useMutation(api.chat.send);
  const generateUploadUrl = useMutation(api.chat.generateUploadUrl);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [replyTo, setReplyTo] = useState<ReplyInfo | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!showSearch) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, showSearch]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImage(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleReply = (msg: { _id: Id<"chatMessages">; senderName: string; message: string }) => {
    setReplyTo({
      id: msg._id,
      senderName: msg.senderName,
      message: msg.message || "(image)",
    });
    inputRef.current?.focus();
  };

  const clearReply = () => setReplyTo(null);

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) return;
        setSelectedImage(file);
        const url = URL.createObjectURL(file);
        setImagePreview(url);
        return;
      }
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if ((!trimmed && !selectedImage) || isSending) return;

    setIsSending(true);
    const savedInput = input;
    setInput("");

    try {
      let imageId: Id<"_storage"> | undefined;

      if (selectedImage) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": selectedImage.type },
          body: selectedImage,
        });
        const { storageId } = await result.json();
        imageId = storageId;
      }

      await sendMessage({
        message: trimmed,
        imageId,
        replyToId: replyTo?.id,
      });
      clearImage();
      clearReply();
    } catch {
      setInput(savedInput);
    } finally {
      setIsSending(false);
    }
  };

  if (messages === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  let lastDate = "";

  return (
    <Card className="flex h-[calc(100vh-12rem)] flex-col">
      {/* Header with search toggle */}
      <div className="flex items-center justify-end border-b px-4 py-2">
        <Button
          size="sm"
          variant={showSearch ? "secondary" : "ghost"}
          onClick={() => setShowSearch(!showSearch)}
        >
          <Search className="mr-1.5 h-4 w-4" />
          Search
        </Button>
      </div>

      {showSearch ? (
        <SearchPanel onClose={() => setShowSearch(false)} />
      ) : (
        <>
          <div
            ref={containerRef}
            className="flex-1 overflow-y-auto px-4 py-3 space-y-1"
          >
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === currentUserId;
                const dateStr = formatDateSeparator(msg.createdAt);
                let showDate = false;
                if (dateStr !== lastDate) {
                  lastDate = dateStr;
                  showDate = true;
                }

                return (
                  <div key={msg._id}>
                    {showDate && (
                      <div className="flex items-center justify-center py-2">
                        <span className="rounded-full bg-muted px-3 py-0.5 text-xs text-muted-foreground">
                          {dateStr}
                        </span>
                      </div>
                    )}
                    <div
                      className={`group flex items-end gap-1 ${isMe ? "justify-end" : "justify-start"} mb-1`}
                    >
                      {/* Reply button on left for own messages */}
                      {isMe && (
                        <button
                          type="button"
                          onClick={() => handleReply(msg)}
                          className="mb-2 opacity-0 transition-opacity group-hover:opacity-100"
                          title="Reply"
                        >
                          <Reply className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </button>
                      )}
                      <div
                        className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                          isMe
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {!isMe && (
                          <div className="mb-0.5 flex items-center gap-1.5">
                            <span className="text-xs font-semibold">
                              {msg.senderName}
                            </span>
                            {getRoleBadge(msg.senderRole)}
                          </div>
                        )}
                        {/* Reply preview */}
                        {msg.replyTo && (
                          <div
                            className={`mb-1.5 rounded-lg border-l-2 px-2 py-1 ${
                              isMe
                                ? "border-l-primary-foreground/50 bg-primary-foreground/10"
                                : "border-l-primary/50 bg-background/50"
                            }`}
                          >
                            <p
                              className={`text-[10px] font-semibold ${
                                isMe ? "text-primary-foreground/80" : "text-foreground/70"
                              }`}
                            >
                              {msg.replyTo.senderName}
                            </p>
                            <p
                              className={`text-[11px] truncate ${
                                isMe ? "text-primary-foreground/60" : "text-muted-foreground"
                              }`}
                            >
                              {msg.replyTo.message}
                            </p>
                          </div>
                        )}
                        {msg.imageUrl && (
                          <a
                            href={msg.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block mb-1"
                          >
                            <img
                              src={msg.imageUrl}
                              alt="Shared image"
                              className="max-h-60 rounded-lg object-contain"
                            />
                          </a>
                        )}
                        {msg.message && (
                          <p className="text-sm whitespace-pre-wrap wrap-break-word">
                            {msg.message}
                          </p>
                        )}
                        <p
                          className={`mt-0.5 text-[10px] ${
                            isMe
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                      {/* Reply button on right for others' messages */}
                      {!isMe && (
                        <button
                          type="button"
                          onClick={() => handleReply(msg)}
                          className="mb-2 opacity-0 transition-opacity group-hover:opacity-100"
                          title="Reply"
                        >
                          <Reply className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t p-3">
            {/* Reply banner */}
            {replyTo && (
              <div className="mb-2 flex items-center justify-between rounded-lg border-l-4 border-l-primary bg-muted px-3 py-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold">
                    Replying to {replyTo.senderName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {replyTo.message}
                  </p>
                </div>
                <button type="button" onClick={clearReply}>
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            )}
            {imagePreview && (
              <div className="mb-2 flex items-start gap-2">
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-20 rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute -right-1.5 -top-1.5 rounded-full bg-destructive p-0.5 text-destructive-foreground shadow-sm"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
            <div className="flex items-end gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="shrink-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSending}
              >
                <ImagePlus className="h-4 w-4" />
              </Button>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  autoResize(e.target);
                }}
                onPaste={handlePaste}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={
                  replyTo
                    ? `Reply to ${replyTo.senderName}...`
                    : selectedImage
                      ? "Add a caption..."
                      : "Type a message..."
                }
                rows={1}
                className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                autoFocus
              />
              <Button
                type="button"
                size="icon"
                className="shrink-0"
                onClick={handleSend}
                disabled={(!input.trim() && !selectedImage) || isSending}
              >
                <SendHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
