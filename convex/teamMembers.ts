import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireRole } from "./lib/auth";

const TEAM_ROLES = ["leader", "customer_rep", "customer_rep_asst"] as const;

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["admin", "manager", "customer_service"]);
    return await ctx.db.query("teamMembers").collect();
  },
});

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["admin", "manager", "customer_service"]);
    const members = await ctx.db.query("teamMembers").collect();
    return members.filter((m) => m.isActive);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    shift: v.string(),
    teamRole: v.union(
      v.literal("leader"),
      v.literal("customer_rep"),
      v.literal("customer_rep_asst")
    ),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin", "manager", "customer_service"]);
    return await ctx.db.insert("teamMembers", {
      name: args.name,
      shift: args.shift,
      teamRole: args.teamRole,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("teamMembers"),
    name: v.string(),
    shift: v.string(),
    teamRole: v.union(
      v.literal("leader"),
      v.literal("customer_rep"),
      v.literal("customer_rep_asst")
    ),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin", "manager", "customer_service"]);
    await ctx.db.patch(args.id, {
      name: args.name,
      shift: args.shift,
      teamRole: args.teamRole,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("teamMembers") },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin", "manager", "customer_service"]);
    await ctx.db.patch(args.id, { isActive: false });
  },
});

export const restore = mutation({
  args: { id: v.id("teamMembers") },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin", "manager", "customer_service"]);
    await ctx.db.patch(args.id, { isActive: true });
  },
});
