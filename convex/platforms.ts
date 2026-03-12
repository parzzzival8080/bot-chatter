import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireRole } from "./lib/auth";

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const platforms = await ctx.db.query("platforms").collect();
    return platforms.filter((p) => p.isActive);
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, "admin");
    return await ctx.db.query("platforms").collect();
  },
});

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    await requireRole(ctx, "admin");
    await ctx.db.insert("platforms", {
      name: args.name,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: { id: v.id("platforms"), name: v.string() },
  handler: async (ctx, args) => {
    await requireRole(ctx, "admin");
    await ctx.db.patch(args.id, { name: args.name });
  },
});

export const remove = mutation({
  args: { id: v.id("platforms") },
  handler: async (ctx, args) => {
    await requireRole(ctx, "admin");
    await ctx.db.patch(args.id, { isActive: false });
  },
});

export const restore = mutation({
  args: { id: v.id("platforms") },
  handler: async (ctx, args) => {
    await requireRole(ctx, "admin");
    await ctx.db.patch(args.id, { isActive: true });
  },
});
