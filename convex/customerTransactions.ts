import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireRole } from "./lib/auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["admin", "manager", "customer_service"]);
    const transactions = await ctx.db
      .query("customerTransactions")
      .withIndex("by_dateOfTransaction")
      .order("desc")
      .collect();

    const withCustomer = await Promise.all(
      transactions.map(async (t) => {
        const customer = await ctx.db.get(t.customerId);
        return {
          ...t,
          customerUid: customer?.uid ?? "Unknown",
        };
      })
    );

    return withCustomer;
  },
});

export const listByCustomer = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin", "manager", "customer_service"]);
    return await ctx.db
      .query("customerTransactions")
      .withIndex("by_customerId", (q) => q.eq("customerId", args.customerId))
      .order("desc")
      .collect();
  },
});

export const listByDateRange = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin", "manager", "customer_service"]);
    const transactions = await ctx.db
      .query("customerTransactions")
      .withIndex("by_dateOfTransaction")
      .order("desc")
      .collect();

    const filtered = transactions.filter(
      (t) => t.dateOfTransaction >= args.startDate && t.dateOfTransaction < args.endDate
    );

    const withCustomer = await Promise.all(
      filtered.map(async (t) => {
        const customer = await ctx.db.get(t.customerId);
        return { ...t, customerUid: customer?.uid ?? "Unknown" };
      })
    );

    return withCustomer;
  },
});

export const create = mutation({
  args: {
    customerId: v.id("customers"),
    txId: v.string(),
    type: v.union(v.literal("deposit"), v.literal("withdraw")),
    isFirstDeposit: v.optional(v.boolean()),
    coin: v.string(),
    initialAmount: v.number(),
    conversion: v.optional(v.number()),
    finalAmount: v.number(),
    dateOfTransaction: v.number(),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin", "manager", "customer_service"]);
    const existingTx = await ctx.db
      .query("customerTransactions")
      .withIndex("by_txId", (q) => q.eq("txId", args.txId))
      .unique();
    if (existingTx) throw new Error(`TX ID "${args.txId}" already exists`);
    return await ctx.db.insert("customerTransactions", {
      customerId: args.customerId,
      txId: args.txId,
      type: args.type,
      isFirstDeposit: args.type === "deposit" ? (args.isFirstDeposit ?? false) : undefined,
      coin: args.coin,
      initialAmount: args.initialAmount,
      conversion: args.conversion,
      finalAmount: args.finalAmount,
      dateOfTransaction: args.dateOfTransaction,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("customerTransactions"),
    customerId: v.id("customers"),
    txId: v.string(),
    type: v.union(v.literal("deposit"), v.literal("withdraw")),
    isFirstDeposit: v.optional(v.boolean()),
    coin: v.string(),
    initialAmount: v.number(),
    conversion: v.optional(v.number()),
    finalAmount: v.number(),
    dateOfTransaction: v.number(),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin", "manager", "customer_service"]);
    const existingTx = await ctx.db
      .query("customerTransactions")
      .withIndex("by_txId", (q) => q.eq("txId", args.txId))
      .unique();
    if (existingTx && existingTx._id !== args.id) throw new Error(`TX ID "${args.txId}" already exists`);
    await ctx.db.patch(args.id, {
      customerId: args.customerId,
      txId: args.txId,
      type: args.type,
      isFirstDeposit: args.type === "deposit" ? (args.isFirstDeposit ?? false) : undefined,
      coin: args.coin,
      initialAmount: args.initialAmount,
      conversion: args.conversion,
      finalAmount: args.finalAmount,
      dateOfTransaction: args.dateOfTransaction,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("customerTransactions") },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin", "manager"]);
    await ctx.db.delete(args.id);
  },
});
