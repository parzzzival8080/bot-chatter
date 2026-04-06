"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

export function LiveChatNotifier() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const canReceive =
    currentUser?.role === "admin" ||
    currentUser?.role === "customer_service" ||
    currentUser?.role === "manager";

  const waitingChats = useQuery(
    api.liveChat.getWaitingChats,
    canReceive ? {} : "skip"
  );

  const prevCountRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const permissionAsked = useRef(false);

  // Request browser notification permission on first load
  useEffect(() => {
    if (!canReceive || permissionAsked.current) return;
    permissionAsked.current = true;
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [canReceive]);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio("/notification.wav");
    audioRef.current.volume = 0.6;
  }, []);

  // Watch for new waiting chats
  useEffect(() => {
    if (!canReceive || waitingChats === undefined) return;

    const currentCount = waitingChats.length;

    // Skip on first load — only fire on increase
    if (prevCountRef.current === null) {
      prevCountRef.current = currentCount;
      return;
    }

    if (currentCount > prevCountRef.current) {
      const newChats = currentCount - prevCountRef.current;
      const latestChat = waitingChats[waitingChats.length - 1];
      const label = latestChat?.clientName ?? latestChat?.email ?? "Unknown";
      const source = latestChat?.source ? ` from ${latestChat.source}` : "";

      // 1. Sound
      audioRef.current?.play().catch(() => {});

      // 2. Toast
      toast.info(`New live chat${source}`, {
        description: `${label} is waiting for support`,
        duration: 8000,
        action: {
          label: "View",
          onClick: () => {
            window.location.href = "/crm/livechat";
          },
        },
      });

      // 3. Browser push notification
      if ("Notification" in window && Notification.permission === "granted") {
        const n = new Notification(`New Live Chat${source}`, {
          body: `${label} is waiting for support`,
          icon: "/favicon.ico",
          tag: "livechat-new",
        });
        n.onclick = () => {
          window.focus();
          window.location.href = "/crm/livechat";
          n.close();
        };
      }
    }

    prevCountRef.current = currentCount;
  }, [canReceive, waitingChats]);

  return null;
}
