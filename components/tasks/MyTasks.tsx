"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle2, ListChecks } from "lucide-react";

function formatShortDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function MyTasks() {
  const tasks = useQuery(api.tasks.listMyTasks);
  const completeTask = useMutation(api.tasks.complete);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const handleComplete = async () => {
    if (!completingId) return;
    try {
      await completeTask({ taskId: completingId as any });
      toast.success("Task marked as done");
    } catch (error: unknown) {
      const convexError = error as {
        data?: { code?: string; message?: string };
      };
      if (convexError?.data?.code === "UNAUTHORIZED") {
        toast.error("Only the claimer can complete this task");
      } else {
        toast.error("Failed to complete task");
      }
    } finally {
      setCompletingId(null);
    }
  };

  if (tasks === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-3 rounded-full bg-muted p-3">
            <ListChecks className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-medium">No tasks assigned</p>
          <p className="text-sm text-muted-foreground">
            Claim a pending task to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort: claimed (active) first, done at the bottom
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.status === "claimed" && b.status === "done") return -1;
    if (a.status === "done" && b.status === "claimed") return 1;
    return 0;
  });

  const completingTask = tasks.find((t) => t._id === completingId);

  return (
    <>
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Claimed</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTasks.map((task) => {
                const isDone = task.status === "done";
                return (
                  <TableRow
                    key={task._id}
                    className={
                      isDone
                        ? "bg-green-50 hover:bg-green-100/80 border-l-4 border-l-green-500"
                        : "bg-yellow-50 hover:bg-yellow-100/80 border-l-4 border-l-yellow-400"
                    }
                  >
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          isDone
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {isDone && <CheckCircle2 className="h-3 w-3" />}
                        {isDone ? "Done" : "In Progress"}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {task.subject}
                    </TableCell>
                    <TableCell className="max-w-60 truncate text-muted-foreground">
                      {task.body}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                      {task.claimedAt ? formatShortDate(task.claimedAt) : "\u2014"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                      {task.completedAt
                        ? formatShortDate(task.completedAt)
                        : "\u2014"}
                    </TableCell>
                    <TableCell className="text-right">
                      {!isDone && (
                        <Button
                          size="sm"
                          className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => setCompletingId(task._id)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Done
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      <AlertDialog
        open={!!completingId}
        onOpenChange={() => setCompletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark task as done?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to complete{" "}
              <span className="font-medium text-foreground">
                {completingTask?.subject}
              </span>
              . This will notify the team on Telegram. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleComplete}>
              Mark Done
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
