import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

export const sendMessage = internalAction({
  args: {
    message: v.string(),
    chatIdKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Read token from settings table, fallback to env var
    const tokenSetting = await ctx.runQuery(internal.settings.getByKey, {
      key: "TELEGRAM_BOT_TOKEN",
    });
    const token = tokenSetting?.value ?? process.env.TELEGRAM_BOT_TOKEN;

    // Read chat ID from settings table, fallback to env var
    // chatIdKey allows routing to a different chat (e.g. TELEGRAM_LIVECHAT_CHAT_ID)
    const key = args.chatIdKey ?? "TELEGRAM_CHAT_ID";
    const chatIdSetting = await ctx.runQuery(internal.settings.getByKey, {
      key,
    });
    const chatId = chatIdSetting?.value ?? process.env[key];

    if (!token || !chatId) {
      console.error(
        "Telegram credentials not configured. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in settings or environment variables."
      );
      return;
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const body = JSON.stringify({
      chat_id: chatId,
      text: args.message,
      parse_mode: "HTML",
    });

    const maxAttempts = 3;
    const delays = [1000, 2000, 4000];

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });

        if (response.ok) {
          return;
        }

        const errorBody = await response.text();
        console.error(
          `Telegram API error (attempt ${attempt + 1}/${maxAttempts}): ${response.status} ${errorBody}`
        );
      } catch (error) {
        console.error(
          `Telegram request failed (attempt ${attempt + 1}/${maxAttempts}):`,
          error
        );
      }

      // Wait before retrying (except on the last attempt)
      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delays[attempt]));
      }
    }

    console.error(
      "Telegram message delivery failed after all retry attempts. Message:",
      args.message
    );
  },
});

export const sendPhoto = internalAction({
  args: {
    photoUrl: v.string(),
    caption: v.string(),
    chatIdKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tokenSetting = await ctx.runQuery(internal.settings.getByKey, {
      key: "TELEGRAM_BOT_TOKEN",
    });
    const token = tokenSetting?.value ?? process.env.TELEGRAM_BOT_TOKEN;

    const key = args.chatIdKey ?? "TELEGRAM_CHAT_ID";
    const chatIdSetting = await ctx.runQuery(internal.settings.getByKey, {
      key,
    });
    const chatId = chatIdSetting?.value ?? process.env[key];

    if (!token || !chatId) {
      console.error("Telegram credentials not configured.");
      return;
    }

    const url = `https://api.telegram.org/bot${token}/sendPhoto`;
    const body = JSON.stringify({
      chat_id: chatId,
      photo: args.photoUrl,
      caption: args.caption,
      parse_mode: "HTML",
    });

    const maxAttempts = 3;
    const delays = [1000, 2000, 4000];

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
        if (response.ok) return;
        const errorBody = await response.text();
        console.error(
          `Telegram sendPhoto error (attempt ${attempt + 1}/${maxAttempts}): ${response.status} ${errorBody}`
        );
      } catch (error) {
        console.error(
          `Telegram sendPhoto failed (attempt ${attempt + 1}/${maxAttempts}):`,
          error
        );
      }
      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delays[attempt]));
      }
    }
    console.error("Telegram photo delivery failed after all retries.");
  },
});
