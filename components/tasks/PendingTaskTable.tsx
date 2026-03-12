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
import { Hand } from "lucide-react";

function formatShortDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function PendingTaskTable() {
  const tasks = useQuery(api.tasks.listPending);
  const claimTask = useMutation(api.tasks.claim);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const handleClaim = async () => {
    if (!claimingId) return;
    try {
      await claimTask({ taskId: claimingId as any });
      toast.success("Task claimed successfully");
    } catch (error: unknown) {
      const convexError = error as {
        data?: { code?: string; message?: string };
      };
      if (convexError?.data?.code === "ALREADY_CLAIMED") {
        toast.error("Task already claimed by someone else");
      } else {
        toast.error("Failed to claim task");
      }
    } finally {
      setClaimingId(null);
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
            <Hand className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-medium">No pending tasks</p>
          <p className="text-sm text-muted-foreground">
            All caught up! Check back later.
          </p>
        </CardContent>
      </Card>
    );
  }

  const claimingTask = tasks.find((t) => t._id === claimingId);

  return (
    <>
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Sender</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow
                  key={task._id}
                  className="bg-yellow-50 hover:bg-yellow-100/80 border-l-4 border-l-yellow-400"
                >
                  <TableCell className="font-semibold">{task.subject}</TableCell>
                  <TableCell className="max-w-60 truncate text-muted-foreground">
                    {task.body}
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {task.senderName}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                    {formatShortDate(task.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      className="bg-yellow-500 hover:bg-yellow-600 text-white"
                      onClick={() => setClaimingId(task._id)}
                    >
                      Claim
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <AlertDialog open={!!claimingId} onOpenChange={() => setClaimingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Claim this task?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to claim{" "}
              <span className="font-medium text-foreground">
                {claimingTask?.subject}
              </span>
              . This will notify the team on Telegram. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClaim}>
              Claim Task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
