"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ClipboardList, UserCheck, CheckCircle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

function getTypeIcon(type: string) {
  switch (type) {
    case "task_dispatched":
      return <ClipboardList className="h-4 w-4 text-blue-500 shrink-0" />;
    case "task_claimed":
      return <UserCheck className="h-4 w-4 text-yellow-500 shrink-0" />;
    case "task_completed":
      return <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />;
    case "live_chat":
      return <MessageCircle className="h-4 w-4 text-purple-500 shrink-0" />;
    default:
      return <ClipboardList className="h-4 w-4 text-muted-foreground shrink-0" />;
  }
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function NotificationList() {
  const notifications = useQuery(api.notifications.listForUser);
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  if (!notifications) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No notifications
      </div>
    );
  }

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-sm font-medium">Notifications</span>
        {hasUnread && (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto px-2 py-1 text-xs"
            onClick={() => markAllAsRead()}
          >
            Mark all as read
          </Button>
        )}
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.map((notification) => (
          <button
            key={notification._id}
            className={`flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-muted/50 ${
              !notification.isRead ? "bg-muted/30" : ""
            }`}
            onClick={() => {
              if (!notification.isRead) {
                markAsRead({
                  notificationId: notification._id as Id<"notifications">,
                });
              }
            }}
          >
            {getTypeIcon(notification.type)}
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className={`text-sm leading-snug ${!notification.isRead ? "font-medium" : ""}`}>
                {notification.message}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(notification.createdAt)}
              </span>
            </div>
            {!notification.isRead && (
              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
