import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireRole } from "./lib/auth";

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const coins = await ctx.db.query("coins").collect();
    return coins.filter((c) => c.isActive);
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, "admin");
    return await ctx.db.query("coins").collect();
  },
});

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    await requireRole(ctx, "admin");
    await ctx.db.insert("coins", {
      name: args.name,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: { id: v.id("coins"), name: v.string() },
  handler: async (ctx, args) => {
    await requireRole(ctx, "admin");
    await ctx.db.patch(args.id, { name: args.name });
  },
});

export const remove = mutation({
  args: { id: v.id("coins") },
  handler: async (ctx, args) => {
    await requireRole(ctx, "admin");
    await ctx.db.patch(args.id, { isActive: false });
  },
});

export const restore = mutation({
  args: { id: v.id("coins") },
  handler: async (ctx, args) => {
    await requireRole(ctx, "admin");
    await ctx.db.patch(args.id, { isActive: true });
  },
});
