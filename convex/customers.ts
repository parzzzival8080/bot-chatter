import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireRole } from "./lib/auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["admin", "manager", "customer_service"]);
    const customers = await ctx.db.query("customers").collect();

    const withReps = await Promise.all(
      customers.map(async (c) => {
        const rep = await ctx.db.get(c.customerRepId);
        const repAsst = c.customerRepAsstId
          ? await ctx.db.get(c.customerRepAsstId)
          : null;
        return {
          ...c,
          customerRepName: rep?.name ?? "Unknown",
          customerRepAsstName: repAsst?.name ?? undefined,
        };
      })
    );

    return withReps;
  },
});

export const create = mutation({
  args: {
    uid: v.string(),
    team: v.string(),
    customerRepId: v.id("teamMembers"),
    customerRepAsstId: v.optional(v.id("teamMembers")),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin", "manager", "customer_service"]);
    const existing = await ctx.db
      .query("customers")
      .withIndex("by_uid", (q) => q.eq("uid", args.uid))
      .unique();
    if (existing) throw new Error(`Customer UID "${args.uid}" already exists`);
    return await ctx.db.insert("customers", {
      uid: args.uid,
      team: args.team,
      customerRepId: args.customerRepId,
      customerRepAsstId: args.customerRepAsstId,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("customers"),
    uid: v.string(),
    team: v.string(),
    customerRepId: v.id("teamMembers"),
    customerRepAsstId: v.optional(v.id("teamMembers")),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin", "manager", "customer_service"]);
    const existing = await ctx.db
      .query("customers")
      .withIndex("by_uid", (q) => q.eq("uid", args.uid))
      .unique();
    if (existing && existing._id !== args.id) throw new Error(`Customer UID "${args.uid}" already exists`);
    await ctx.db.patch(args.id, {
      uid: args.uid,
      team: args.team,
      customerRepId: args.customerRepId,
      customerRepAsstId: args.customerRepAsstId,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("customers") },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin", "manager"]);
    await ctx.db.delete(args.id);
  },
});
