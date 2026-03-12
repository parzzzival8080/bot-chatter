import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

export const sendStartReminder = internalAction({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.runQuery(internal.tasks.getById, {
      taskId: args.taskId,
    });

    if (!task) {
      console.warn(
        `sendStartReminder: Task ${args.taskId} not found, skipping.`
      );
      return;
    }

    if (task.type !== "stressTest") {
      console.warn(
        `sendStartReminder: Task ${args.taskId} is not a stressTest, skipping.`
      );
      return;
    }

    const message = `⏰ Reminder: Coin stress test ${task.subject} for ${task.coin} is starting now!`;
    await ctx.runAction(internal.telegram.sendMessage, { message });
  },
});

export const sendEndReminder = internalAction({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.runQuery(internal.tasks.getById, {
      taskId: args.taskId,
    });

    if (!task) {
      console.warn(
        `sendEndReminder: Task ${args.taskId} not found, skipping.`
      );
      return;
    }

    if (task.type !== "stressTest") {
      console.warn(
        `sendEndReminder: Task ${args.taskId} is not a stressTest, skipping.`
      );
      return;
    }

    const message = `⏰ Reminder: Coin stress test ${task.subject} for ${task.coin} has ended!`;
    await ctx.runAction(internal.telegram.sendMessage, { message });
  },
});
