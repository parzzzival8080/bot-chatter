import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireRole } from "./lib/auth";

/**
 * Upsert a user from a Clerk webhook event.
 * Called from the Next.js webhook API route via ConvexHttpClient.
 * Security is enforced at the webhook route level via svix signature verification.
 */
export const upsertFromWebhook = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    role: v.optional(
      v.union(v.literal("admin"), v.literal("manager"), v.literal("staff"), v.literal("customer_service"))
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        email: args.email,
        ...(args.role !== undefined ? { role: args.role } : {}),
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      name: args.name,
      email: args.email,
      role: args.role,
      createdAt: Date.now(),
    });
  },
});

/**
 * Look up a user by their Clerk ID.
 */
export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

/**
 * Get the current authenticated user from Convex.
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
  },
});

/**
 * Ensure the current authenticated user exists in Convex.
 * Auto-creates the user record from Clerk identity if missing.
 * Used as a fallback when webhooks haven't fired (e.g., local dev).
 */
export const ensureUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (existing) {
      return existing;
    }

    // Auto-create user from Clerk identity
    const id = await ctx.db.insert("users", {
      clerkId: identity.subject,
      name: identity.name ?? "Unknown",
      email: identity.email ?? "",
      createdAt: Date.now(),
    });

    return await ctx.db.get(id);
  },
});

/**
 * List all users (admin only).
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, "admin");

    const users = await ctx.db.query("users").collect();

    return users.map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    }));
  },
});

/**
 * Update a user's role (admin only).
 * Syncs role to Clerk publicMetadata via scheduled action.
 */
export const updateRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(
      v.literal("admin"),
      v.literal("manager"),
      v.literal("staff")
    ),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, "admin");

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(args.userId, { role: args.role });

    // Schedule Clerk metadata sync
    await ctx.scheduler.runAfter(
      0,
      internal.clerkAdmin.syncRoleToClerk,
      {
        clerkId: user.clerkId,
        role: args.role,
      }
    );

    return { success: true };
  },
});
