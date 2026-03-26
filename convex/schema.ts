import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    role: v.optional(
      v.union(v.literal("admin"), v.literal("manager"), v.literal("staff"), v.literal("customer_service"))
    ),
    createdAt: v.number(),
  }).index("by_clerkId", ["clerkId"]),

  tasks: defineTable({
    type: v.union(v.literal("simple"), v.literal("stressTest")),
    subject: v.string(),
    body: v.string(),
    coin: v.optional(v.string()),
    platform: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    status: v.union(
      v.literal("pending"),
      v.literal("claimed"),
      v.literal("done")
    ),
    senderId: v.id("users"),
    senderName: v.string(),
    claimedBy: v.optional(v.id("users")),
    claimedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_senderId", ["senderId"])
    .index("by_claimedBy", ["claimedBy"]),

  subjects: defineTable({
    name: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
  }),

  coins: defineTable({
    name: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
  }),

  platforms: defineTable({
    name: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
  }),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(),
    message: v.string(),
    taskId: v.id("tasks"),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_isRead", ["userId", "isRead"]),

  chatMessages: defineTable({
    senderId: v.id("users"),
    senderName: v.string(),
    senderRole: v.string(),
    message: v.string(),
    imageId: v.optional(v.id("_storage")),
    replyToId: v.optional(v.id("chatMessages")),
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),

  settings: defineTable({
    key: v.string(),
    value: v.string(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),
});
