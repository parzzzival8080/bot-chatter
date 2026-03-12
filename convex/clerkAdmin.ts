import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { createClerkClient } from "@clerk/backend";

export const syncRoleToClerk = internalAction({
  args: {
    clerkId: v.string(),
    role: v.string(),
  },
  handler: async (_ctx, args) => {
    const clerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    await clerkClient.users.updateUserMetadata(args.clerkId, {
      publicMetadata: {
        role: args.role,
      },
    });
  },
});
