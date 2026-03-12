"use client";

import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

type ConfigId = Id<"subjects"> | Id<"coins"> | Id<"platforms">;

interface ConfigItem {
  _id: ConfigId;
  name: string;
  isActive: boolean;
  createdAt: number;
}

interface ConfigItemManagerProps {
  title: string;
  description?: string;
  items: ConfigItem[] | undefined;
  onCreate: (args: { name: string }) => Promise<void>;
  onUpdate: (args: { id: ConfigId; name: string }) => Promise<void>;
  onRemove: (args: { id: ConfigId }) => Promise<void>;
  onRestore: (args: { id: ConfigId }) => Promise<void>;
}

export function ConfigItemManager({
  title,
  description,
  items,
  onCreate,
  onUpdate,
  onRemove,
  onRestore,
}: ConfigItemManagerProps) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setIsAdding(true);
    try {
      await onCreate({ name: trimmed });
      setNewName("");
      toast.success(`${title.slice(0, -1)} added successfully`);
    } catch {
      toast.error(`Failed to add ${title.slice(0, -1).toLowerCase()}`);
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdate = async (id: ConfigId) => {
    const trimmed = editingName.trim();
    if (!trimmed) return;
    try {
      await onUpdate({ id, name: trimmed });
      setEditingId(null);
      setEditingName("");
      toast.success(`${title.slice(0, -1)} updated successfully`);
    } catch {
      toast.error(`Failed to update ${title.slice(0, -1).toLowerCase()}`);
    }
  };

  const handleRemove = async (id: ConfigId) => {
    try {
      await onRemove({ id });
      toast.success(`${title.slice(0, -1)} removed successfully`);
    } catch {
      toast.error(`Failed to remove ${title.slice(0, -1).toLowerCase()}`);
    }
  };

  const handleRestore = async (id: ConfigId) => {
    try {
      await onRestore({ id });
      toast.success(`${title.slice(0, -1)} restored successfully`);
    } catch {
      toast.error(`Failed to restore ${title.slice(0, -1).toLowerCase()}`);
    }
  };

  const startEdit = (item: ConfigItem) => {
    setEditingId(item._id);
    setEditingName(item.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  // Sort: active items first, then inactive
  const sortedItems = items
    ? [...items].sort((a, b) => {
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
        return a.name.localeCompare(b.name);
      })
    : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add form */}
        <div className="flex gap-2">
          <Input
            placeholder={`New ${title.slice(0, -1).toLowerCase()} name`}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
            }}
          />
          <Button onClick={handleAdd} disabled={isAdding || !newName.trim()}>
            Add
          </Button>
        </div>

        {/* Items list */}
        {sortedItems === undefined ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : sortedItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No {title.toLowerCase()} yet. Add one above.
          </p>
        ) : (
          <div className="space-y-2">
            {sortedItems.map((item) => (
              <div
                key={item._id}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                  !item.isActive ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {editingId === item._id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            handleUpdate(item._id);
                          if (e.key === "Escape") cancelEdit();
                        }}
                        className="h-7"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={() => handleUpdate(item._id)}
                        disabled={!editingName.trim()}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={cancelEdit}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className={`text-sm ${!item.isActive ? "text-muted-foreground line-through" : ""}`}>
                        {item.name}
                      </span>
                      <Badge variant={item.isActive ? "secondary" : "outline"}>
                        {item.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </>
                  )}
                </div>
                {editingId !== item._id && (
                  <div className="flex items-center gap-1 ml-2">
                    {item.isActive ? (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(item)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemove(item._id)}
                        >
                          Remove
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRestore(item._id)}
                      >
                        Restore
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
