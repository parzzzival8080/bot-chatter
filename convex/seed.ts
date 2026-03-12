import { mutation } from "./_generated/server";

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    // Seed subjects if none exist
    const existingSubjects = await ctx.db.query("subjects").collect();
    if (existingSubjects.length === 0) {
      const subjects = ["General", "Urgent", "Follow-up"];
      for (const name of subjects) {
        await ctx.db.insert("subjects", {
          name,
          isActive: true,
          createdAt: Date.now(),
        });
      }
    }

    // Seed coins if none exist
    const existingCoins = await ctx.db.query("coins").collect();
    if (existingCoins.length === 0) {
      const coins = ["BTC", "ETH", "SOL"];
      for (const name of coins) {
        await ctx.db.insert("coins", {
          name,
          isActive: true,
          createdAt: Date.now(),
        });
      }
    }
  },
});
