"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

export function TelegramSettings() {
  const tokenDisplay = useQuery(api.settings.getForDisplay, {
    key: "TELEGRAM_BOT_TOKEN",
  });
  const chatIdDisplay = useQuery(api.settings.getForDisplay, {
    key: "TELEGRAM_CHAT_ID",
  });
  const liveChatIdDisplay = useQuery(api.settings.getForDisplay, {
    key: "TELEGRAM_LIVECHAT_CHAT_ID",
  });

  const setSetting = useMutation(api.settings.set);
  const testTelegram = useMutation(api.settings.testTelegram);

  const [token, setToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [liveChatId, setLiveChatId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Show placeholder text from current values
  const tokenPlaceholder = tokenDisplay?.value ?? "Enter bot API token";
  const chatIdPlaceholder = chatIdDisplay?.value ?? "Enter chat ID";
  const liveChatIdPlaceholder = liveChatIdDisplay?.value ?? "Enter live chat group chat ID";

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const promises: Promise<unknown>[] = [];
      if (token.trim()) {
        promises.push(
          setSetting({ key: "TELEGRAM_BOT_TOKEN", value: token.trim() })
        );
      }
      if (chatId.trim()) {
        promises.push(
          setSetting({ key: "TELEGRAM_CHAT_ID", value: chatId.trim() })
        );
      }
      if (liveChatId.trim()) {
        promises.push(
          setSetting({ key: "TELEGRAM_LIVECHAT_CHAT_ID", value: liveChatId.trim() })
        );
      }
      if (promises.length === 0) {
        toast.error("No changes to save");
        setIsSaving(false);
        return;
      }
      await Promise.all(promises);
      setToken("");
      setChatId("");
      setLiveChatId("");
      toast.success("Telegram settings saved successfully");
    } catch {
      toast.error("Failed to save Telegram settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      await testTelegram();
      toast.success("Test message sent! Check your Telegram chat.");
    } catch {
      toast.error("Failed to send test message");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Telegram Configuration</CardTitle>
        <CardDescription>
          Configure the Telegram bot integration. Values stored here override
          environment variables.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="telegram-token">Bot API Token</Label>
          <Input
            id="telegram-token"
            type="password"
            placeholder={tokenPlaceholder}
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          {tokenDisplay && (
            <p className="text-xs text-muted-foreground">
              Current: {tokenDisplay.value}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="telegram-chat-id">Tasks Chat ID</Label>
          <Input
            id="telegram-chat-id"
            type="text"
            placeholder={chatIdPlaceholder}
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
          />
          {chatIdDisplay && (
            <p className="text-xs text-muted-foreground">
              Current: {chatIdDisplay.value}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="telegram-livechat-id">Live Chat Group ID</Label>
          <Input
            id="telegram-livechat-id"
            type="text"
            placeholder={liveChatIdPlaceholder}
            value={liveChatId}
            onChange={(e) => setLiveChatId(e.target.value)}
          />
          {liveChatIdDisplay && (
            <p className="text-xs text-muted-foreground">
              Current: {liveChatIdDisplay.value}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={isTesting}
          >
            {isTesting ? "Sending..." : "Send Test"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
