import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireRole } from "./lib/auth";

const CHAT_ROLES = ["customer_service", "manager", "admin"] as const;

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, [...CHAT_ROLES]);

    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_createdAt")
      .order("desc")
      .take(100);

    return messages.reverse();
  },
});

export const send = mutation({
  args: {
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, [...CHAT_ROLES]);

    const trimmed = args.message.trim();
    if (!trimmed) return null;

    return await ctx.db.insert("chatMessages", {
      senderId: user._id,
      senderName: user.name,
      senderRole: user.role!,
      message: trimmed,
      createdAt: Date.now(),
    });
  },
});
