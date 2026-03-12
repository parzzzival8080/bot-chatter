"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Clock, Inbox } from "lucide-react";

type StatusFilter = "all" | "pending" | "claimed" | "done";

function formatShortDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AdminTaskTable() {
  const tasks = useQuery(api.tasks.listAll);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  if (tasks === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const filteredTasks =
    statusFilter === "all"
      ? tasks
      : tasks.filter((task) => task.status === statusFilter);

  // Sort: pending first, then claimed, then done at the bottom
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const order = { pending: 0, claimed: 1, done: 2 };
    return order[a.status] - order[b.status];
  });

  const counts = {
    all: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    claimed: tasks.filter((t) => t.status === "claimed").length,
    done: tasks.filter((t) => t.status === "done").length,
  };

  const getRowStyle = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-50 hover:bg-yellow-100/80 border-l-4 border-l-yellow-400";
      case "claimed":
        return "bg-yellow-50/60 hover:bg-yellow-100/60 border-l-4 border-l-yellow-300";
      case "done":
        return "bg-green-50 hover:bg-green-100/80 border-l-4 border-l-green-500";
      default:
        return "";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-700">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
      case "claimed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-700">
            In Progress
          </span>
        );
      case "done":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
            <CheckCircle2 className="h-3 w-3" />
            Done
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <Tabs
        value={statusFilter}
        onValueChange={(v) => setStatusFilter(v as StatusFilter)}
      >
        <TabsList>
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
          <TabsTrigger value="claimed">Claimed ({counts.claimed})</TabsTrigger>
          <TabsTrigger value="done">Done ({counts.done})</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        {sortedTasks.length === 0 ? (
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 rounded-full bg-muted p-3">
              <Inbox className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium">No tasks found</p>
            <p className="text-sm text-muted-foreground">
              {statusFilter === "all"
                ? "Dispatch a task to get started."
                : `No ${statusFilter} tasks right now.`}
            </p>
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Sender</TableHead>
                  <TableHead>Claimed By</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTasks.map((task) => (
                  <TableRow key={task._id} className={getRowStyle(task.status)}>
                    <TableCell>{getStatusBadge(task.status)}</TableCell>
                    <TableCell className="font-semibold">
                      {task.subject}
                    </TableCell>
                    <TableCell className="max-w-50 truncate text-muted-foreground">
                      {task.body}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          task.type === "stressTest" ? "secondary" : "outline"
                        }
                        className="text-xs"
                      >
                        {task.type === "stressTest" ? "Stress Test" : "Simple"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {task.senderName}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {task.claimerName ?? "\u2014"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                      {formatShortDate(task.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
