"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useSearchParams } from "next/navigation";

type Step = "form" | "chat";

export default function LiveChatWidget() {
  const searchParams = useSearchParams();
  // Accept a hex color via ?color=3b82f6 (without the #)
  const accentColor = `#${searchParams.get("color") ?? "2563eb"}`;
  // Source website label via ?source=mysite.com
  const source = searchParams.get("source") ?? undefined;

  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [uid, setUid] = useState("");
  const [clientName, setClientName] = useState("");
  const [chatId, setChatId] = useState<Id<"liveChats"> | null>(null);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sending, setSending] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startSession = useMutation(api.liveChat.startSession);
  const sendMessage = useMutation(api.liveChat.sendClientMessage);
  const generateUploadUrl = useMutation(api.liveChat.generateClientUploadUrl);
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

  const handleImageFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  // Paste handler
  useEffect(() => {
    if (step !== "chat") return;
    function onPaste(e: ClipboardEvent) {
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
  }, [step, handleImageFile]);

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
        source,
      });
      setChatId(id);
      setStep("chat");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if ((!text.trim() && !imageFile) || !chatId) return;
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
      await sendMessage({ chatId, text: text.trim(), imageId });
      setText("");
      setImageFile(null);
      setImagePreview(null);
    } finally {
      setSending(false);
    }
  }

  const accentStyle = { "--accent": accentColor } as React.CSSProperties;

  if (step === "form") {
    return (
      <div className="flex h-screen items-center justify-center bg-white p-4" style={accentStyle}>
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: "var(--accent)" }}>
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Live Support</h1>
            <p className="mt-1 text-sm text-gray-500">We typically reply within a few minutes</p>
          </div>

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
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-gray-200"
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
                    : "border-gray-200 focus:ring-2 focus:ring-gray-200"
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
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-gray-200"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
              style={{ backgroundColor: "var(--accent)" }}
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
    <div className="flex h-screen flex-col bg-white" style={accentStyle}>
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3" style={{ backgroundColor: "var(--accent)" }}>
        <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: "var(--accent)", filter: "brightness(0.85)" }}>
          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Support Team</p>
          <p className="text-xs text-white/60">
            {chatStatus?.status === "active" ? "Agent connected" : isClosed ? "Chat ended" : "Waiting for agent…"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <div className="flex gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: "var(--accent)", opacity: 0.8 }}>S</div>
          <div className="max-w-[75%] rounded-2xl rounded-tl-sm bg-gray-100 px-3 py-2 text-sm text-gray-800">
            Hi there! 👋 We have received your message and will connect you with an agent shortly.
          </div>
        </div>

        {messages?.map((msg) => (
          <div key={msg._id} className={`flex gap-2 ${msg.sender === "client" ? "flex-row-reverse" : ""}`}>
            {msg.sender === "supervisor" && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: "var(--accent)", opacity: 0.8 }}>
                {msg.senderName?.[0] ?? "S"}
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                msg.sender === "client"
                  ? "rounded-tr-sm text-white"
                  : "rounded-tl-sm bg-gray-100 text-gray-800"
              }`}
              style={msg.sender === "client" ? { backgroundColor: "var(--accent)" } : {}}
            >
              {msg.imageUrl && (
                <img
                  src={msg.imageUrl}
                  alt="attachment"
                  className="mb-1.5 max-h-48 w-auto rounded-lg object-contain"
                />
              )}
              {msg.text && <p>{msg.text}</p>}
              <div className={`mt-0.5 text-right text-[10px] ${msg.sender === "client" ? "text-white/60" : "text-gray-400"}`}>
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        ))}

        {isClosed && (
          <div className="py-2 text-center text-xs text-gray-400">— This chat has been closed —</div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!isClosed ? (
        <form onSubmit={handleSend} className="border-t px-3 py-3 space-y-2">
          {/* Image preview */}
          {imagePreview && (
            <div className="relative inline-block">
              <img src={imagePreview} alt="preview" className="max-h-24 rounded-lg border object-contain" />
              <button
                type="button"
                onClick={() => { setImageFile(null); setImagePreview(null); }}
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-white text-xs hover:bg-red-500"
              >
                ×
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            {/* File upload button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-400 transition hover:border-gray-400 hover:text-gray-600"
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
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message or paste an image…"
              className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-gray-200"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
            />
            <button
              type="submit"
              disabled={(!text.trim() && !imageFile) || sending}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white transition disabled:opacity-40"
              style={{ backgroundColor: "var(--accent)" }}
            >
              {sending ? (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="border-t px-4 py-3 text-center text-xs text-gray-400">
          Chat closed. Refresh to start a new conversation.
        </div>
      )}
    </div>
  );
}
