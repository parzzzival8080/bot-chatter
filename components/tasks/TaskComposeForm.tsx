"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { toast } from "sonner";
import { simpleTaskSchema, stressTestTaskSchema } from "@/lib/validations/task";

export function TaskComposeForm() {
  const [taskType, setTaskType] = useState<"simple" | "stressTest">("simple");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [coin, setCoin] = useState("");
  const [platform, setPlatform] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const subjects = useQuery(api.subjects.listActive);
  const coins = useQuery(api.coins.listActive);
  const platforms = useQuery(api.platforms.listActive);
  const createTask = useMutation(api.tasks.create);

  const isStressTest = taskType === "stressTest";

  const resetForm = () => {
    setSubject("");
    setBody("");
    setCoin("");
    setPlatform("");
    setStartTime("");
    setEndTime("");
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (isStressTest) {
      const result = stressTestTaskSchema.safeParse({
        platform,
        subject,
        body,
        coin,
        startTime: startTime ? new Date(startTime).getTime() : undefined,
        endTime: endTime ? new Date(endTime).getTime() : undefined,
      });
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of result.error.issues) {
          const field = issue.path[0] as string;
          fieldErrors[field] = issue.message;
        }
        setErrors(fieldErrors);
        return;
      }
    } else {
      const result = simpleTaskSchema.safeParse({ platform, subject, body });
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of result.error.issues) {
          const field = issue.path[0] as string;
          fieldErrors[field] = issue.message;
        }
        setErrors(fieldErrors);
        return;
      }
    }

    setShowConfirm(true);
  };

  const handleConfirmedSubmit = async () => {
    setShowConfirm(false);
    setIsSubmitting(true);
    try {
      await createTask({
        type: taskType,
        subject,
        body,
        platform,
        ...(isStressTest
          ? {
              coin,
              startTime: new Date(startTime).getTime(),
              endTime: new Date(endTime).getTime(),
            }
          : {}),
      });
      toast.success("Task dispatched!");
      resetForm();
    } catch (error) {
      toast.error("Failed to dispatch task");
      console.error("Failed to create task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{isStressTest ? "Coin Stress Test" : "Simple Task"}</span>
            <label className="flex items-center gap-2 text-sm font-normal">
              <span className="text-muted-foreground">Stress Test</span>
              <Switch
                checked={isStressTest}
                onCheckedChange={(checked: boolean) =>
                  setTaskType(checked ? "stressTest" : "simple")
                }
              />
            </label>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Platform */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Platform</label>
              <Select value={platform} onValueChange={(v: string | null) => setPlatform(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a platform" />
                </SelectTrigger>
                <SelectContent>
                  {platforms?.map((p: { _id: string; name: string }) => (
                    <SelectItem key={p._id} value={p.name}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.platform && (
                <p className="text-sm text-destructive">{errors.platform}</p>
              )}
            </div>

            {/* Coin (stress test only) */}
            {isStressTest && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Coin</label>
                <Select value={coin} onValueChange={(v: string | null) => setCoin(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a coin" />
                  </SelectTrigger>
                  <SelectContent>
                    {coins?.map((c: { _id: string; name: string }) => (
                      <SelectItem key={c._id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.coin && (
                  <p className="text-sm text-destructive">{errors.coin}</p>
                )}
              </div>
            )}

            {/* Subject */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Subject</label>
              <Select value={subject} onValueChange={(v: string | null) => setSubject(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects?.map((s: { _id: string; name: string }) => (
                    <SelectItem key={s._id} value={s.name}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.subject && (
                <p className="text-sm text-destructive">{errors.subject}</p>
              )}
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Message</label>
              <Textarea
                placeholder="Enter task details..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
              />
              {errors.body && (
                <p className="text-sm text-destructive">{errors.body}</p>
              )}
            </div>

            {/* Start/End Time (stress test only) */}
            {isStressTest && (
              <>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Start Time</label>
                  <Input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                  {errors.startTime && (
                    <p className="text-sm text-destructive">{errors.startTime}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">End Time</label>
                  <Input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                  {errors.endTime && (
                    <p className="text-sm text-destructive">{errors.endTime}</p>
                  )}
                </div>
              </>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Dispatching..." : "Dispatch Task"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dispatch this task?</AlertDialogTitle>
            <AlertDialogDescription>
              This will send a notification to the Telegram group and notify all
              staff members. Are you sure you want to dispatch this task?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmedSubmit}>
              Dispatch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
