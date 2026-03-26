"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ChatRoom } from "@/components/chat/ChatRoom";

export default function ChatPage() {
  const currentUser = useQuery(api.users.getCurrentUser);

  if (currentUser === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (
    !currentUser ||
    !currentUser.role ||
    !["admin", "manager", "customer_service"].includes(currentUser.role)
  ) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Access denied. Chat is available for managers and customer service.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team Chat</h1>
        <p className="text-muted-foreground">
          Live chat between managers and customer service.
        </p>
      </div>
      <ChatRoom currentUserId={currentUser._id} />
    </div>
  );
}
