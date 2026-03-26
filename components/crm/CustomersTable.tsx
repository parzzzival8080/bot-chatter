"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
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
import { Plus, Pencil, Trash2 } from "lucide-react";

export function CustomersTable() {
  const customers = useQuery(api.customers.list);
  const teamMembers = useQuery(api.teamMembers.listActive);
  const create = useMutation(api.customers.create);
  const update = useMutation(api.customers.update);
  const remove = useMutation(api.customers.remove);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<Id<"customers"> | null>(null);
  const [uid, setUid] = useState("");
  const [team, setTeam] = useState("");
  const [repId, setRepId] = useState("");
  const [repAsstId, setRepAsstId] = useState("");

  const reps = teamMembers?.filter((m) => m.teamRole === "customer_rep") ?? [];
  const repAssts = teamMembers?.filter((m) => m.teamRole === "customer_rep_asst") ?? [];

  const openAdd = () => {
    setEditingId(null);
    setUid("");
    setTeam("");
    setRepId("");
    setRepAsstId("");
    setOpen(true);
  };

  const openEdit = (c: {
    _id: Id<"customers">;
    uid: string;
    team: string;
    customerRepId: Id<"teamMembers">;
    customerRepAsstId?: Id<"teamMembers">;
  }) => {
    setEditingId(c._id);
    setUid(c.uid);
    setTeam(c.team);
    setRepId(c.customerRepId);
    setRepAsstId(c.customerRepAsstId ?? "");
    setOpen(true);
  };

  const handleSave = async () => {
    if (!uid.trim() || !team.trim() || !repId) return;
    try {
      const data = {
        uid: uid.trim(),
        team: team.trim(),
        customerRepId: repId as Id<"teamMembers">,
        customerRepAsstId: repAsstId ? (repAsstId as Id<"teamMembers">) : undefined,
      };
      if (editingId) {
        await update({ id: editingId, ...data });
        toast.success("Customer updated");
      } else {
        await create(data);
        toast.success("Customer added");
      }
      setOpen(false);
    } catch {
      toast.error("Failed to save");
    }
  };

  if (customers === undefined || teamMembers === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Customers</CardTitle>
            <CardDescription>Manage customers and their assigned reps</CardDescription>
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
                  <TableHead>UID</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Customer Rep</TableHead>
                  <TableHead>Rep Assistant</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c._id}>
                    <TableCell className="font-medium">{c.uid}</TableCell>
                    <TableCell>{c.team}</TableCell>
                    <TableCell>{c.customerRepName}</TableCell>
                    <TableCell>{c.customerRepAsstName ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(c)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove({ id: c._id }).then(() => toast.success("Deleted"))}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {customers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No customers yet. Click Add to create one.
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
            <DialogTitle>{editingId ? "Edit Customer" : "Add Customer"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Update customer details." : "Fill in the details to add a new customer."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>UID</Label>
              <Input value={uid} onChange={(e) => setUid(e.target.value)} placeholder="Customer UID" />
            </div>
            <div className="space-y-2">
              <Label>Team</Label>
              <Select value={team} onValueChange={(v) => setTeam(v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Select team">{team || "Select team"}</SelectValue></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MORNING">MORNING</SelectItem>
                  <SelectItem value="MID">MID</SelectItem>
                  <SelectItem value="NIGHT">NIGHT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Customer Rep</Label>
              <Select value={repId} onValueChange={(v) => setRepId(v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Select rep">{reps.find((r) => r._id === repId)?.name ?? "Select rep"}</SelectValue></SelectTrigger>
                <SelectContent>
                  {reps.map((r) => <SelectItem key={r._id} value={r._id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Rep Assistant (optional)</Label>
              <Select value={repAsstId || "none"} onValueChange={(v) => setRepAsstId(!v || v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="None">{repAssts.find((r) => r._id === repAsstId)?.name ?? "None"}</SelectValue></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {repAssts.map((r) => <SelectItem key={r._id} value={r._id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!uid.trim() || !team.trim() || !repId}>
              {editingId ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
