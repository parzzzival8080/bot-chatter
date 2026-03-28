"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

type Step = "form" | "chat";

export default function LiveChatWidget() {
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [uid, setUid] = useState("");
  const [clientName, setClientName] = useState("");
  const [chatId, setChatId] = useState<Id<"liveChats"> | null>(null);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sending, setSending] = useState(false);
  const [emailError, setEmailError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const startSession = useMutation(api.liveChat.startSession);
  const sendMessage = useMutation(api.liveChat.sendClientMessage);
  const messages = useQuery(
    api.liveChat.getClientMessages,
    chatId ? { chatId } : "skip"
  );
  const chatStatus = useQuery(
    api.liveChat.getChatStatus,
    chatId ? { chatId } : "skip"
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setEmailError("Email is required"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError("Enter a valid email"); return; }
    setEmailError("");
    setSubmitting(true);
    try {
      const id = await startSession({
        email: email.trim(),
        uid: uid.trim() || undefined,
        clientName: clientName.trim() || undefined,
      });
      setChatId(id);
      setStep("chat");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !chatId) return;
    setSending(true);
    try {
      await sendMessage({ chatId, text: text.trim() });
      setText("");
    } finally {
      setSending(false);
    }
  }

  if (step === "form") {
    return (
      <div className="flex h-screen items-center justify-center bg-white p-4">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Live Support</h1>
            <p className="mt-1 text-sm text-gray-500">We typically reply within a few minutes</p>
          </div>

          {/* Form */}
          <form onSubmit={handleStart} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Name <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                placeholder="you@example.com"
                className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
                  emailError
                    ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                    : "border-gray-200 focus:border-blue-500 focus:ring-blue-100"
                }`}
              />
              {emailError && <p className="mt-1 text-xs text-red-500">{emailError}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                UID <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={uid}
                onChange={(e) => setUid(e.target.value)}
                placeholder="Your account UID"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? "Starting…" : "Start Chat"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const isClosed = chatStatus?.status === "closed";

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 border-b bg-blue-600 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Support Team</p>
          <p className="text-xs text-blue-200">
            {chatStatus?.status === "active" ? "Agent connected" : isClosed ? "Chat ended" : "Waiting for agent…"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* Welcome message */}
        <div className="flex gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">S</div>
          <div className="max-w-[75%] rounded-2xl rounded-tl-sm bg-gray-100 px-3 py-2 text-sm text-gray-800">
            Hi there! 👋 We have received your message and will connect you with an agent shortly.
          </div>
        </div>

        {messages?.map((msg) => (
          <div
            key={msg._id}
            className={`flex gap-2 ${msg.sender === "client" ? "flex-row-reverse" : ""}`}
          >
            {msg.sender === "supervisor" && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                {msg.senderName?.[0] ?? "S"}
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                msg.sender === "client"
                  ? "rounded-tr-sm bg-blue-600 text-white"
                  : "rounded-tl-sm bg-gray-100 text-gray-800"
              }`}
            >
              {msg.text}
              <div className={`mt-0.5 text-right text-[10px] ${msg.sender === "client" ? "text-blue-200" : "text-gray-400"}`}>
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        ))}

        {isClosed && (
          <div className="py-2 text-center text-xs text-gray-400">
            — This chat has been closed —
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!isClosed ? (
        <form onSubmit={handleSend} className="flex items-end gap-2 border-t px-3 py-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:opacity-40"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      ) : (
        <div className="border-t px-4 py-3 text-center text-xs text-gray-400">
          Chat closed. Refresh to start a new conversation.
        </div>
      )}
    </div>
  );
}
