"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ConfigItemManager } from "@/components/admin/ConfigItemManager";
import { TelegramSettings } from "@/components/admin/TelegramSettings";

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
        <p className="text-destructive">
          Access denied. Admin role required.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage subjects, coins, platforms, and integrations.
        </p>
      </div>

      <div className="grid gap-6">
        <ConfigItemManager
          title="Subjects"
          description="Manage subject options for task dispatch."
          items={subjects}
          onCreate={async ({ name }) => {
            await createSubject({ name });
          }}
          onUpdate={async ({ id, name }) => {
            await updateSubject({ id: id as any, name });
          }}
          onRemove={async ({ id }) => {
            await removeSubject({ id: id as any });
          }}
          onRestore={async ({ id }) => {
            await restoreSubject({ id: id as any });
          }}
        />

        <ConfigItemManager
          title="Coins"
          description="Manage coin options for task dispatch."
          items={coins}
          onCreate={async ({ name }) => {
            await createCoin({ name });
          }}
          onUpdate={async ({ id, name }) => {
            await updateCoin({ id: id as any, name });
          }}
          onRemove={async ({ id }) => {
            await removeCoin({ id: id as any });
          }}
          onRestore={async ({ id }) => {
            await restoreCoin({ id: id as any });
          }}
        />

        <ConfigItemManager
          title="Platforms"
          description="Manage platform options for task dispatch (e.g. Binance, Bybit)."
          items={platforms}
          onCreate={async ({ name }) => {
            await createPlatform({ name });
          }}
          onUpdate={async ({ id, name }) => {
            await updatePlatform({ id: id as any, name });
          }}
          onRemove={async ({ id }) => {
            await removePlatform({ id: id as any });
          }}
          onRestore={async ({ id }) => {
            await restorePlatform({ id: id as any });
          }}
        />

        <TelegramSettings />
      </div>
    </div>
  );
}
