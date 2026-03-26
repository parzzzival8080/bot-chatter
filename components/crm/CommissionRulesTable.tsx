"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, RotateCcw } from "lucide-react";

type TeamRole = "leader" | "customer_rep" | "customer_rep_asst";

const TEAM_ROLE_LABELS: Record<TeamRole, string> = {
  leader: "Leader",
  customer_rep: "Customer Rep",
  customer_rep_asst: "Customer Rep Asst",
};

export function CommissionRulesTable() {
  const rules = useQuery(api.commissionRules.list);
  const create = useMutation(api.commissionRules.create);
  const update = useMutation(api.commissionRules.update);
  const remove = useMutation(api.commissionRules.remove);
  const restore = useMutation(api.commissionRules.restore);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<Id<"commissionRules"> | null>(null);
  const [description, setDescription] = useState("");
  const [teamRole, setTeamRole] = useState<TeamRole>("customer_rep");
  const [percentage, setPercentage] = useState("");
  const [minFirstDepositCount, setMinFirstDepositCount] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  const openAdd = () => {
    setEditingId(null);
    setDescription("");
    setTeamRole("customer_rep");
    setPercentage("");
    setMinFirstDepositCount("");
    setMinAmount("");
    setMaxAmount("");
    setOpen(true);
  };

  const openEdit = (r: {
    _id: Id<"commissionRules">;
    description: string;
    teamRole: TeamRole;
    percentage: number;
    minFirstDepositCount?: number;
    minAmount: number;
    maxAmount: number;
  }) => {
    setEditingId(r._id);
    setDescription(r.description);
    setTeamRole(r.teamRole);
    setPercentage(r.percentage.toString());
    setMinFirstDepositCount(r.minFirstDepositCount?.toString() ?? "");
    setMinAmount(r.minAmount.toString());
    setMaxAmount(r.maxAmount.toString());
    setOpen(true);
  };

  const handleSave = async () => {
    if (!description.trim() || !percentage || !minAmount || !maxAmount) return;
    try {
      const data = {
        description: description.trim(),
        teamRole,
        percentage: parseFloat(percentage),
        minFirstDepositCount: minFirstDepositCount ? parseInt(minFirstDepositCount) : undefined,
        minAmount: parseFloat(minAmount),
        maxAmount: parseFloat(maxAmount),
      };
      if (editingId) {
        await update({ id: editingId, ...data });
        toast.success("Rule updated");
      } else {
        await create(data);
        toast.success("Rule added");
      }
      setOpen(false);
    } catch {
      toast.error("Failed to save");
    }
  };

  if (rules === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const sorted = [...rules].sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return a.description.localeCompare(b.description);
  });

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Commission Rules</CardTitle>
            <CardDescription>
              Rules are applied per month. Each member must meet the minimum 1st deposit count to qualify.
            </CardDescription>
          </div>
          <Button size="sm" onClick={openAdd}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Rate %</TableHead>
                  <TableHead className="text-right">Min 1st Dep #</TableHead>
                  <TableHead className="text-right">Min Amount</TableHead>
                  <TableHead className="text-right">Max Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((r) => (
                  <TableRow key={r._id} className={!r.isActive ? "opacity-50" : ""}>
                    <TableCell className="font-medium">{r.description}</TableCell>
                    <TableCell><Badge variant="secondary">{TEAM_ROLE_LABELS[r.teamRole]}</Badge></TableCell>
                    <TableCell className="text-right font-mono">{r.percentage}%</TableCell>
                    <TableCell className="text-right font-mono">{r.minFirstDepositCount ?? "—"}</TableCell>
                    <TableCell className="text-right font-mono">{r.minAmount.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono">{r.maxAmount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={r.isActive ? "default" : "outline"}>
                        {r.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {r.isActive ? (
                          <>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(r)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove({ id: r._id }).then(() => toast.success("Removed"))}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => restore({ id: r._id }).then(() => toast.success("Restored"))}>
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {sorted.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                      No commission rules yet. Click Add to create one.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Commission Rule" : "Add Commission Rule"}</DialogTitle>
            <DialogDescription>
              Rules are evaluated per month. Members must meet the minimum 1st deposit count requirement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Rule description" />
            </div>
            <div className="space-y-2">
              <Label>Team Role</Label>
              <Select value={teamRole} onValueChange={(v) => v && setTeamRole(v as TeamRole)}>
                <SelectTrigger><SelectValue>{TEAM_ROLE_LABELS[teamRole]}</SelectValue></SelectTrigger>
                <SelectContent>
                  {Object.entries(TEAM_ROLE_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Percentage (%)</Label>
                <Input type="number" value={percentage} onChange={(e) => setPercentage(e.target.value)} placeholder="e.g. 5" />
              </div>
              <div className="space-y-2">
                <Label>Min 1st Deposit Count</Label>
                <Input type="number" value={minFirstDepositCount} onChange={(e) => setMinFirstDepositCount(e.target.value)} placeholder="Optional" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Min Amount</Label>
                <Input type="number" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Max Amount</Label>
                <Input type="number" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} placeholder="0" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!description.trim() || !percentage || !minAmount || !maxAmount}>
              {editingId ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
