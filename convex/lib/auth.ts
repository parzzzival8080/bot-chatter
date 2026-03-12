import { QueryCtx, MutationCtx } from "../_generated/server";
import { ConvexError } from "convex/values";

type Role = "admin" | "manager" | "staff";

/**
 * Requires the current user to have one of the specified roles.
 * Returns the authenticated user document for downstream use.
 */
export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  roles: Role | Role[]
) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();

  if (!user) {
    throw new ConvexError({ code: "UNAUTHORIZED", message: "User not found" });
  }

  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  if (!user.role || !allowedRoles.includes(user.role)) {
    throw new ConvexError({ code: "FORBIDDEN", message: "Insufficient permissions" });
  }

  return user;
}

/**
 * Gets the current authenticated user without role checking.
 * Useful for endpoints that any authenticated user can access.
 */
export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();

  if (!user) {
    throw new ConvexError({ code: "UNAUTHORIZED", message: "User not found" });
  }

  return user;
}
