"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TaskComposeForm } from "@/components/tasks/TaskComposeForm";

export default function ComposePage() {
  const user = useQuery(api.users.getCurrentUser);

  if (user === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user || !user.role || !["admin", "manager"].includes(user.role)) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-destructive">
          Access denied. Only managers and admins can compose tasks.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Compose Task</h1>
        <p className="text-muted-foreground">
          Create and dispatch a new task to the team.
        </p>
      </div>
      <TaskComposeForm />
    </div>
  );
}
