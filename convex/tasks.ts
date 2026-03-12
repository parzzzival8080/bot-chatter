import { v, ConvexError } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireRole } from "./lib/auth";

// Internal query used by reminders to read a task by ID
export const getById = internalQuery({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.taskId);
  },
});

export const create = mutation({
  args: {
    type: v.union(v.literal("simple"), v.literal("stressTest")),
    subject: v.string(),
    body: v.string(),
    coin: v.optional(v.string()),
    platform: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["admin", "manager"]);

    const taskId = await ctx.db.insert("tasks", {
      type: args.type,
      subject: args.subject,
      body: args.body,
      coin: args.coin,
      platform: args.platform,
      startTime: args.startTime,
      endTime: args.endTime,
      status: "pending",
      senderId: user._id,
      senderName: user.name,
      createdAt: Date.now(),
    });

    // Dispatch Telegram notification (fire-and-forget)
    const coinPart = args.coin ? ` for ${args.coin}` : "";
    const platformPart = args.platform ? ` on ${args.platform}` : "";
    const fmt = (ts: number) =>
      new Date(ts).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    const timePart =
      args.startTime && args.endTime
        ? `\n\u23F0 ${fmt(args.startTime)} \u2192 ${fmt(args.endTime)}`
        : "";
    const telegramMsg = `\u{1F4CB} ${user.name} sent a ${args.subject}${coinPart}${platformPart}\n${args.body}${timePart}`;
    await ctx.scheduler.runAfter(0, internal.telegram.sendMessage, {
      message: telegramMsg,
    });

    // Story 4.1: Schedule reminders for stress test tasks
    if (args.type === "stressTest" && args.startTime && args.endTime) {
      const now = Date.now();

      if (args.startTime < now) {
        await ctx.scheduler.runAfter(
          0,
          internal.reminders.sendStartReminder,
          { taskId }
        );
      } else {
        await ctx.scheduler.runAt(
          args.startTime,
          internal.reminders.sendStartReminder,
          { taskId }
        );
      }

      if (args.endTime < now) {
        await ctx.scheduler.runAfter(0, internal.reminders.sendEndReminder, {
          taskId,
        });
      } else {
        await ctx.scheduler.runAt(
          args.endTime,
          internal.reminders.sendEndReminder,
          { taskId }
        );
      }
    }

    // Story 5.1: Dispatch in-app notifications to staff
    await ctx.scheduler.runAfter(0, internal.notifications.createForRole, {
      roles: ["staff"],
      type: "task_dispatched",
      message: `New task: ${args.subject} \u2014 ${args.body}`,
      taskId,
    });

    return taskId;
  },
});

// Story 3.1: List pending tasks for staff/manager/admin
export const listPending = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["staff", "manager", "admin"]);

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    return tasks.map((task) => ({
      _id: task._id,
      subject: task.subject,
      body: task.body,
      senderName: task.senderName,
      createdAt: task.createdAt,
    }));
  },
});

// Story 3.1: Claim a pending task
export const claim = mutation({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["staff", "manager", "admin"]);

    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Task not found" });
    }

    if (task.status !== "pending") {
      throw new ConvexError({
        code: "ALREADY_CLAIMED",
        message: "Task already claimed",
      });
    }

    await ctx.db.patch(args.taskId, {
      status: "claimed",
      claimedBy: user._id,
      claimedAt: Date.now(),
    });

    const claimCoinPart = task.coin ? ` for ${task.coin}` : "";
    const claimPlatformPart = task.platform ? ` on ${task.platform}` : "";
    const claimFmt = (ts: number) =>
      new Date(ts).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    const claimTimePart =
      task.startTime && task.endTime
        ? `\n\u23F0 ${claimFmt(task.startTime)} \u2192 ${claimFmt(task.endTime)}`
        : "";
    const telegramMsg = `\u2705 ${user.name} acknowledged ${task.subject}${claimCoinPart}${claimPlatformPart}\n${task.body}${claimTimePart}`;
    await ctx.scheduler.runAfter(0, internal.telegram.sendMessage, {
      message: telegramMsg,
    });

    // Story 5.1: Notify admins and managers about task claim
    await ctx.scheduler.runAfter(0, internal.notifications.createForRole, {
      roles: ["admin", "manager"],
      type: "task_claimed",
      message: `${user.name} claimed ${task.subject}`,
      taskId: args.taskId,
    });

    return { success: true };
  },
});

// Story 3.2: Complete a claimed task
export const complete = mutation({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["staff", "manager", "admin"]);

    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Task not found" });
    }

    if (task.status !== "claimed") {
      throw new ConvexError({
        code: "INVALID_STATUS",
        message: "Task is not in claimed status",
      });
    }

    if (task.claimedBy !== user._id) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Only the claimer can complete this task",
      });
    }

    await ctx.db.patch(args.taskId, {
      status: "done",
      completedAt: Date.now(),
    });

    const doneCoinPart = task.coin ? ` for ${task.coin}` : "";
    const donePlatformPart = task.platform ? ` on ${task.platform}` : "";
    const doneFmt = (ts: number) =>
      new Date(ts).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    const doneTimePart =
      task.startTime && task.endTime
        ? `\n\u23F0 ${doneFmt(task.startTime)} \u2192 ${doneFmt(task.endTime)}`
        : "";
    const telegramMsg = `\u{1F389} ${user.name} completed ${task.subject}${doneCoinPart}${donePlatformPart}\n${task.body}${doneTimePart}`;
    await ctx.scheduler.runAfter(0, internal.telegram.sendMessage, {
      message: telegramMsg,
    });

    // Story 5.1: Notify admins and managers about task completion
    await ctx.scheduler.runAfter(0, internal.notifications.createForRole, {
      roles: ["admin", "manager"],
      type: "task_completed",
      message: `${user.name} completed ${task.subject}`,
      taskId: args.taskId,
    });

    return { success: true };
  },
});

// Story 3.2: List tasks claimed by the current user
export const listMyTasks = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireRole(ctx, ["staff", "manager", "admin"]);

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_claimedBy", (q) => q.eq("claimedBy", user._id))
      .collect();

    return tasks.map((task) => ({
      _id: task._id,
      subject: task.subject,
      body: task.body,
      status: task.status,
      senderName: task.senderName,
      claimedAt: task.claimedAt,
      completedAt: task.completedAt,
      createdAt: task.createdAt,
    }));
  },
});

// Story 3.3: List all tasks for manager/admin
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["admin", "manager"]);

    const tasks = await ctx.db.query("tasks").order("desc").collect();

    const tasksWithClaimerNames = await Promise.all(
      tasks.map(async (task) => {
        let claimerName: string | undefined;
        if (task.claimedBy) {
          const claimer = await ctx.db.get(task.claimedBy);
          claimerName = claimer?.name;
        }

        return {
          _id: task._id,
          type: task.type,
          subject: task.subject,
          body: task.body,
          senderName: task.senderName,
          status: task.status,
          claimedBy: task.claimedBy,
          claimerName,
          claimedAt: task.claimedAt,
          completedAt: task.completedAt,
          createdAt: task.createdAt,
        };
      })
    );

    return tasksWithClaimerNames;
  },
});
