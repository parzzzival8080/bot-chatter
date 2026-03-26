"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ConfigItemManager } from "@/components/admin/ConfigItemManager";
import { TelegramSettings } from "@/components/admin/TelegramSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Tag, Coins, Monitor, Bot } from "lucide-react";

export default function AdminSettingsPage() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const subjects = useQuery(api.subjects.listAll);
  const coins = useQuery(api.coins.listAll);
  const platforms = useQuery(api.platforms.listAll);

  const createSubject = useMutation(api.subjects.create);
  const updateSubject = useMutation(api.subjects.update);
  const removeSubject = useMutation(api.subjects.remove);
  const restoreSubject = useMutation(api.subjects.restore);

  const createCoin = useMutation(api.coins.create);
  const updateCoin = useMutation(api.coins.update);
  const removeCoin = useMutation(api.coins.remove);
  const restoreCoin = useMutation(api.coins.restore);

  const createPlatform = useMutation(api.platforms.create);
  const updatePlatform = useMutation(api.platforms.update);
  const removePlatform = useMutation(api.platforms.remove);
  const restorePlatform = useMutation(api.platforms.restore);

  if (currentUser === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-destructive">Access denied. Admin role required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage dispatch options and integrations.
        </p>
      </div>

      <Tabs defaultValue="subjects">
        <TabsList>
          <TabsTrigger value="subjects" className="gap-1.5">
            <Tag className="h-3.5 w-3.5" />
            Subjects
          </TabsTrigger>
          <TabsTrigger value="coins" className="gap-1.5">
            <Coins className="h-3.5 w-3.5" />
            Coins
          </TabsTrigger>
          <TabsTrigger value="platforms" className="gap-1.5">
            <Monitor className="h-3.5 w-3.5" />
            Platforms
          </TabsTrigger>
          <TabsTrigger value="telegram" className="gap-1.5">
            <Bot className="h-3.5 w-3.5" />
            Telegram
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="mt-4">
          <Card className="p-5">
            <ConfigItemManager
              title="Subjects"
              description="Task subject options for dispatch."
              items={subjects}
              onCreate={async ({ name }) => { await createSubject({ name }); }}
              onUpdate={async ({ id, name }) => { await updateSubject({ id: id as any, name }); }}
              onRemove={async ({ id }) => { await removeSubject({ id: id as any }); }}
              onRestore={async ({ id }) => { await restoreSubject({ id: id as any }); }}
            />
          </Card>
        </TabsContent>

        <TabsContent value="coins" className="mt-4">
          <Card className="p-5">
            <ConfigItemManager
              title="Coins"
              description="Coin options for task dispatch."
              items={coins}
              onCreate={async ({ name }) => { await createCoin({ name }); }}
              onUpdate={async ({ id, name }) => { await updateCoin({ id: id as any, name }); }}
              onRemove={async ({ id }) => { await removeCoin({ id: id as any }); }}
              onRestore={async ({ id }) => { await restoreCoin({ id: id as any }); }}
            />
          </Card>
        </TabsContent>

        <TabsContent value="platforms" className="mt-4">
          <Card className="p-5">
            <ConfigItemManager
              title="Platforms"
              description="Platform options for dispatch (e.g. Binance, Bybit)."
              items={platforms}
              onCreate={async ({ name }) => { await createPlatform({ name }); }}
              onUpdate={async ({ id, name }) => { await updatePlatform({ id: id as any, name }); }}
              onRemove={async ({ id }) => { await removePlatform({ id: id as any }); }}
              onRestore={async ({ id }) => { await restorePlatform({ id: id as any }); }}
            />
          </Card>
        </TabsContent>

        <TabsContent value="telegram" className="mt-4">
          <TelegramSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
