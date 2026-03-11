import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    role: v.optional(
      v.union(v.literal("admin"), v.literal("manager"), v.literal("staff"))
    ),
    createdAt: v.number(),
  }).index("by_clerkId", ["clerkId"]),
});
