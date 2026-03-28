import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireRole, requireAuth } from "./lib/auth";

// ── Client-facing (no auth) ────────────────────────────────────────────────

export const startSession = mutation({
  args: {
    email: v.string(),
    uid: v.optional(v.string()),
    clientName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const chatId = await ctx.db.insert("liveChats", {
      email: args.email,
      uid: args.uid,
      clientName: args.clientName,
      status: "waiting",
      createdAt: now,
    });
    await ctx.db.insert("liveChatAuditLog", {
      chatId,
      event: "chat_started",
      details: `Email: ${args.email}${args.uid ? `, UID: ${args.uid}` : ""}`,
      createdAt: now,
    });
    return chatId;
  },
});

export const generateClientUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const sendClientMessage = mutation({
  args: {
    chatId: v.id("liveChats"),
    text: v.string(),
    imageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.status === "closed") {
      throw new Error("Chat not found or closed");
    }
    await ctx.db.insert("liveMessages", {
      chatId: args.chatId,
      sender: "client",
      text: args.text,
      imageId: args.imageId,
      createdAt: Date.now(),
    });
  },
});

export const getClientMessages = query({
  args: { chatId: v.id("liveChats") },
  handler: async (ctx, args) => {
    const msgs = await ctx.db
      .query("liveMessages")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .order("asc")
      .collect();
    return await Promise.all(
      msgs.map(async (msg) => ({
        ...msg,
        imageUrl: msg.imageId ? await ctx.storage.getUrl(msg.imageId) : null,
      }))
    );
  },
});

export const getChatStatus = query({
  args: { chatId: v.id("liveChats") },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) return null;
    return {
      status: chat.status,
      claimedBy: chat.claimedBy,
    };
  },
});

// ── Supervisor-facing (authenticated) ─────────────────────────────────────

export const getAllChats = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["admin", "customer_service"]);
    const chats = await ctx.db.query("liveChats").order("desc").collect();
    return chats;
  },
});

export const getWaitingChats = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["admin", "customer_service"]);
    return await ctx.db
      .query("liveChats")
      .withIndex("by_status", (q) => q.eq("status", "waiting"))
      .order("asc")
      .collect();
  },
});

export const getMyActiveChats = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireRole(ctx, ["admin", "customer_service"]);
    return await ctx.db
      .query("liveChats")
      .withIndex("by_claimedBy", (q) => q.eq("claimedBy", user._id))
      .collect();
  },
});

export const generateSupervisorUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["admin", "customer_service"]);
    return await ctx.storage.generateUploadUrl();
  },
});

export const getChatMessages = query({
  args: { chatId: v.id("liveChats") },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin", "customer_service"]);
    const msgs = await ctx.db
      .query("liveMessages")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .order("asc")
      .collect();
    return await Promise.all(
      msgs.map(async (msg) => ({
        ...msg,
        imageUrl: msg.imageId ? await ctx.storage.getUrl(msg.imageId) : null,
      }))
    );
  },
});

export const claimChat = mutation({
  args: { chatId: v.id("liveChats") },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["admin", "customer_service"]);
    const chat = await ctx.db.get(args.chatId);
    if (!chat) throw new Error("Chat not found");
    if (chat.status === "closed") throw new Error("Chat is already closed");
    if (chat.claimedBy) throw new Error("Chat is already claimed");

    const now = Date.now();
    await ctx.db.patch(args.chatId, {
      claimedBy: user._id,
      claimedAt: now,
      status: "active",
    });
    await ctx.db.insert("liveChatAuditLog", {
      chatId: args.chatId,
      event: "claimed",
      performedBy: user._id,
      performedByName: user.name,
      details: `Claimed by ${user.name}`,
      createdAt: now,
    });
  },
});

export const unclaimChat = mutation({
  args: { chatId: v.id("liveChats") },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["admin", "customer_service"]);
    const chat = await ctx.db.get(args.chatId);
    if (!chat) throw new Error("Chat not found");

    const now = Date.now();
    await ctx.db.patch(args.chatId, {
      claimedBy: undefined,
      claimedAt: undefined,
      status: "waiting",
    });
    await ctx.db.insert("liveChatAuditLog", {
      chatId: args.chatId,
      event: "unclaimed",
      performedBy: user._id,
      performedByName: user.name,
      details: `Unclaimed by ${user.name}`,
      createdAt: now,
    });
  },
});

export const transferChat = mutation({
  args: { chatId: v.id("liveChats"), toUserId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["admin", "customer_service"]);
    const chat = await ctx.db.get(args.chatId);
    if (!chat) throw new Error("Chat not found");

    const toUser = await ctx.db.get(args.toUserId);
    if (!toUser) throw new Error("Target user not found");

    const now = Date.now();
    await ctx.db.patch(args.chatId, {
      claimedBy: args.toUserId,
      claimedAt: now,
      status: "active",
    });
    await ctx.db.insert("liveChatAuditLog", {
      chatId: args.chatId,
      event: "transferred",
      performedBy: user._id,
      performedByName: user.name,
      details: `Transferred from ${user.name} to ${toUser.name}`,
      createdAt: now,
    });
  },
});

export const sendSupervisorMessage = mutation({
  args: {
    chatId: v.id("liveChats"),
    text: v.string(),
    imageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["admin", "customer_service"]);
    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.status === "closed") throw new Error("Chat not found or closed");

    await ctx.db.insert("liveMessages", {
      chatId: args.chatId,
      sender: "supervisor",
      senderId: user._id,
      senderName: user.name,
      text: args.text,
      imageId: args.imageId,
      createdAt: Date.now(),
    });
  },
});

export const closeChat = mutation({
  args: { chatId: v.id("liveChats") },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["admin", "customer_service"]);
    const chat = await ctx.db.get(args.chatId);
    if (!chat) throw new Error("Chat not found");

    const now = Date.now();
    await ctx.db.patch(args.chatId, {
      status: "closed",
      closedAt: now,
      closedBy: user._id,
    });
    await ctx.db.insert("liveChatAuditLog", {
      chatId: args.chatId,
      event: "closed",
      performedBy: user._id,
      performedByName: user.name,
      details: `Closed by ${user.name}`,
      createdAt: now,
    });
  },
});

export const reopenChat = mutation({
  args: { chatId: v.id("liveChats") },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["admin", "customer_service"]);
    const chat = await ctx.db.get(args.chatId);
    if (!chat) throw new Error("Chat not found");

    const now = Date.now();
    await ctx.db.patch(args.chatId, {
      status: "waiting",
      closedAt: undefined,
      closedBy: undefined,
    });
    await ctx.db.insert("liveChatAuditLog", {
      chatId: args.chatId,
      event: "reopened",
      performedBy: user._id,
      performedByName: user.name,
      details: `Reopened by ${user.name}`,
      createdAt: now,
    });
  },
});

// ── Audit log (admin only) ─────────────────────────────────────────────────

export const getAuditLog = query({
  args: { chatId: v.id("liveChats") },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);
    return await ctx.db
      .query("liveChatAuditLog")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .order("asc")
      .collect();
  },
});

// ── Supervisor list (for transfer dropdown) ───────────────────────────────

export const getSupervisors = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["admin", "customer_service"]);
    const users = await ctx.db.query("users").collect();
    return users.filter(
      (u) => u.role === "admin" || u.role === "customer_service"
    );
  },
});
