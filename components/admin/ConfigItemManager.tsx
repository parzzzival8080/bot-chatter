"use client";

import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";

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
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<ConfigId | null>(null);
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 5;

  const singular = title.slice(0, -1);

  const openAdd = () => {
    setEditingId(null);
    setName("");
    setOpen(true);
  };

  const openEdit = (item: ConfigItem) => {
    setEditingId(item._id);
    setName(item.name);
    setOpen(true);
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setIsSaving(true);
    try {
      if (editingId) {
        await onUpdate({ id: editingId, name: trimmed });
        toast.success(`${singular} updated`);
      } else {
        await onCreate({ name: trimmed });
        toast.success(`${singular} added`);
      }
      setOpen(false);
    } catch {
      toast.error(`Failed to save ${singular.toLowerCase()}`);
    } finally {
      setIsSaving(false);
    }
  };

  const sortedItems = items
    ? [...items].sort((a, b) => {
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
        return a.name.localeCompare(b.name);
      })
    : undefined;

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={openAdd}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add
          </Button>
        </div>

        {sortedItems === undefined ? (
          <div className="flex items-center justify-center py-6">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : sortedItems.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No {title.toLowerCase()} yet.
          </p>
        ) : (
          <>
          <div className="space-y-1">
            {sortedItems.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((item) => (
              <div
                key={item._id}
                className={`group flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-muted/50 ${
                  !item.isActive ? "opacity-40" : ""
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`h-2 w-2 rounded-full ${item.isActive ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
                  <span className={`text-sm font-medium ${!item.isActive ? "line-through text-muted-foreground" : ""}`}>
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.isActive ? (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => openEdit(item)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() =>
                          onRemove({ id: item._id }).then(() =>
                            toast.success(`${singular} removed`)
                          )
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() =>
                        onRestore({ id: item._id }).then(() =>
                          toast.success(`${singular} restored`)
                        )
                      }
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {sortedItems.length > PAGE_SIZE && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sortedItems.length)} of {sortedItems.length}
              </p>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= sortedItems.length}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          </>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? `Edit ${singular}` : `Add ${singular}`}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`${singular} name`}
              className="mt-2"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!name.trim() || isSaving}>
              {editingId ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
