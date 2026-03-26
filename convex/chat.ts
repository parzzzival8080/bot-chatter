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

    const messagesWithExtras = await Promise.all(
      messages.map(async (msg) => {
        let imageUrl: string | null = null;
        if (msg.imageId) {
          imageUrl = await ctx.storage.getUrl(msg.imageId);
        }

        let replyTo: { senderName: string; message: string } | null = null;
        if (msg.replyToId) {
          const parent = await ctx.db.get(msg.replyToId);
          if (parent) {
            replyTo = {
              senderName: parent.senderName,
              message: parent.message || "(image)",
            };
          }
        }

        return { ...msg, imageUrl, replyTo };
      })
    );

    return messagesWithExtras.reverse();
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, [...CHAT_ROLES]);
    return await ctx.storage.generateUploadUrl();
  },
});

export const search = query({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, [...CHAT_ROLES]);

    const searchTerm = args.query.trim().toLowerCase();
    if (!searchTerm) return [];

    const allMessages = await ctx.db
      .query("chatMessages")
      .withIndex("by_createdAt")
      .order("desc")
      .collect();

    const matched = allMessages.filter(
      (msg) =>
        msg.message.toLowerCase().includes(searchTerm) ||
        msg.senderName.toLowerCase().includes(searchTerm)
    );

    const withUrls = await Promise.all(
      matched.slice(0, 50).map(async (msg) => {
        let imageUrl: string | null = null;
        if (msg.imageId) {
          imageUrl = await ctx.storage.getUrl(msg.imageId);
        }
        return { ...msg, imageUrl };
      })
    );

    return withUrls;
  },
});

export const send = mutation({
  args: {
    message: v.string(),
    imageId: v.optional(v.id("_storage")),
    replyToId: v.optional(v.id("chatMessages")),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, [...CHAT_ROLES]);

    const trimmed = args.message.trim();
    if (!trimmed && !args.imageId) return null;

    return await ctx.db.insert("chatMessages", {
      senderId: user._id,
      senderName: user.name,
      senderRole: user.role!,
      message: trimmed,
      imageId: args.imageId,
      replyToId: args.replyToId,
      createdAt: Date.now(),
    });
  },
});
