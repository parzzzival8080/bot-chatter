"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { SendHorizontal } from "lucide-react";

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

export function ChatRoom({ currentUserId }: { currentUserId: string }) {
  const messages = useQuery(api.chat.list);
  const sendMessage = useMutation(api.chat.send);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    setInput("");
    try {
      await sendMessage({ message: trimmed });
    } catch {
      setInput(trimmed);
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
                  className={`flex ${isMe ? "justify-end" : "justify-start"} mb-1`}
                >
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
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {msg.message}
                    </p>
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
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            autoFocus
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isSending}
          >
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
}
