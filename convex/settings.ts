import { v } from "convex/values";
import { internalQuery, query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireRole } from "./lib/auth";

// Internal query used by telegram action — no auth check
export const getByKey = internalQuery({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
  },
});

// Admin query — returns full value
export const get = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    await requireRole(ctx, "admin");
    return await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
  },
});

// Admin query — returns masked value for tokens
export const getForDisplay = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    await requireRole(ctx, "admin");
    const setting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
    if (!setting) return null;
    if (args.key.includes("TOKEN")) {
      return {
        ...setting,
        value: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" + setting.value.slice(-4),
      };
    }
    return setting;
  },
});

// Admin mutation — upsert setting by key
export const set = mutation({
  args: { key: v.string(), value: v.string() },
  handler: async (ctx, args) => {
    await requireRole(ctx, "admin");
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("settings", {
        key: args.key,
        value: args.value,
        updatedAt: Date.now(),
      });
    }
  },
});

// Admin mutation — send a test Telegram message
export const testTelegram = mutation({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, "admin");
    await ctx.scheduler.runAfter(0, internal.telegram.sendMessage, {
      message: "\ud83d\udd27 Test message from bot-chatter admin",
    });
  },
});
