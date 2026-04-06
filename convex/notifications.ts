import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { requireAuth } from "./lib/auth";

/**
 * Create notifications for all users with matching roles.
 * Called internally from task mutations via scheduler.
 */
export const createForRole = internalMutation({
  args: {
    roles: v.array(v.string()),
    type: v.string(),
    message: v.string(),
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const allUsers = await ctx.db.query("users").collect();
    const matchingUsers = allUsers.filter(
      (user) => user.role && args.roles.includes(user.role)
    );

    for (const user of matchingUsers) {
      await ctx.db.insert("notifications", {
        userId: user._id,
        type: args.type,
        message: args.message,
        taskId: args.taskId,
        isRead: false,
        createdAt: Date.now(),
      });
    }
  },
});

/**
 * Create notifications for admins and customer_service when a new live chat starts.
 */
export const createForLiveChat = internalMutation({
  args: {
    chatId: v.id("liveChats"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const allUsers = await ctx.db.query("users").collect();
    const matchingUsers = allUsers.filter(
      (user) => user.role === "admin" || user.role === "customer_service" || user.role === "manager"
    );

    for (const user of matchingUsers) {
      await ctx.db.insert("notifications", {
        userId: user._id,
        type: "live_chat",
        message: args.message,
        chatId: args.chatId,
        isRead: false,
        createdAt: Date.now(),
      });
    }
  },
});

/**
 * List notifications for the current user, ordered by most recent first.
 */
export const listForUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return notifications;
  },
});

/**
 * Count unread notifications for the current user.
 */
export const countUnread = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_isRead", (q) =>
        q.eq("userId", user._id).eq("isRead", false)
      )
      .collect();

    return unread.length;
  },
});

/**
 * Mark a single notification as read.
 */
export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.userId !== user._id) {
      return;
    }

    await ctx.db.patch(args.notificationId, { isRead: true });
  },
});

/**
 * Mark all unread notifications as read for the current user.
 */
export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_isRead", (q) =>
        q.eq("userId", user._id).eq("isRead", false)
      )
      .collect();

    for (const notification of unread) {
      await ctx.db.patch(notification._id, { isRead: true });
    }
  },
});
