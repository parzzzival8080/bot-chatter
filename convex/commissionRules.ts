import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireRole } from "./lib/auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["admin", "manager", "customer_service"]);
    return await ctx.db.query("commissionRules").collect();
  },
});

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["admin", "manager", "customer_service"]);
    const rules = await ctx.db.query("commissionRules").collect();
    return rules.filter((r) => r.isActive);
  },
});

export const create = mutation({
  args: {
    description: v.string(),
    teamRole: v.union(
      v.literal("leader"),
      v.literal("customer_rep"),
      v.literal("customer_rep_asst")
    ),
    percentage: v.number(),
    minFirstDepositCount: v.optional(v.number()),
    minAmount: v.number(),
    maxAmount: v.number(),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin", "manager", "customer_service"]);
    return await ctx.db.insert("commissionRules", {
      description: args.description,
      teamRole: args.teamRole,
      percentage: args.percentage,
      minFirstDepositCount: args.minFirstDepositCount,
      minAmount: args.minAmount,
      maxAmount: args.maxAmount,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("commissionRules"),
    description: v.string(),
    teamRole: v.union(
      v.literal("leader"),
      v.literal("customer_rep"),
      v.literal("customer_rep_asst")
    ),
    percentage: v.number(),
    minFirstDepositCount: v.optional(v.number()),
    minAmount: v.number(),
    maxAmount: v.number(),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin", "manager", "customer_service"]);
    await ctx.db.patch(args.id, {
      description: args.description,
      teamRole: args.teamRole,
      percentage: args.percentage,
      minFirstDepositCount: args.minFirstDepositCount,
      minAmount: args.minAmount,
      maxAmount: args.maxAmount,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("commissionRules") },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin", "manager", "customer_service"]);
    await ctx.db.patch(args.id, { isActive: false });
  },
});

export const restore = mutation({
  args: { id: v.id("commissionRules") },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin", "manager", "customer_service"]);
    await ctx.db.patch(args.id, { isActive: true });
  },
});
