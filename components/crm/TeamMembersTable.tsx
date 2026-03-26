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
type Shift = "MORNING" | "MID" | "NIGHT";

const TEAM_ROLE_LABELS: Record<TeamRole, string> = {
  leader: "Leader",
  customer_rep: "Customer Rep",
  customer_rep_asst: "Customer Rep Asst",
};

const SHIFTS: Shift[] = ["MORNING", "MID", "NIGHT"];

export function TeamMembersTable() {
  const members = useQuery(api.teamMembers.list);
  const create = useMutation(api.teamMembers.create);
  const update = useMutation(api.teamMembers.update);
  const remove = useMutation(api.teamMembers.remove);
  const restore = useMutation(api.teamMembers.restore);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<Id<"teamMembers"> | null>(null);
  const [name, setName] = useState("");
  const [shift, setShift] = useState<Shift>("MORNING");
  const [teamRole, setTeamRole] = useState<TeamRole>("customer_rep");

  const openAdd = () => {
    setEditingId(null);
    setName("");
    setShift("MORNING");
    setTeamRole("customer_rep");
    setOpen(true);
  };

  const openEdit = (m: { _id: Id<"teamMembers">; name: string; shift: string; teamRole: TeamRole }) => {
    setEditingId(m._id);
    setName(m.name);
    setShift(m.shift as Shift);
    setTeamRole(m.teamRole);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !shift) return;
    try {
      if (editingId) {
        await update({ id: editingId, name: name.trim(), shift, teamRole });
        toast.success("Team member updated");
      } else {
        await create({ name: name.trim(), shift, teamRole });
        toast.success("Team member added");
      }
      setOpen(false);
    } catch {
      toast.error("Failed to save");
    }
  };

  if (members === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const sorted = [...members].sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>Manage team members and their roles</CardDescription>
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
                  <TableHead>Name</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((m) => (
                  <TableRow key={m._id} className={!m.isActive ? "opacity-50" : ""}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell>{m.shift}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{TEAM_ROLE_LABELS[m.teamRole]}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={m.isActive ? "default" : "outline"}>
                        {m.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {m.isActive ? (
                          <>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(m)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove({ id: m._id }).then(() => toast.success("Removed"))}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => restore({ id: m._id }).then(() => toast.success("Restored"))}>
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {sorted.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No team members yet. Click Add to create one.
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
            <DialogTitle>{editingId ? "Edit Team Member" : "Add Team Member"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Update the team member details." : "Fill in the details to add a new team member."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
            </div>
            <div className="space-y-2">
              <Label>Shift</Label>
              <Select value={shift} onValueChange={(v) => v && setShift(v as Shift)}>
                <SelectTrigger><SelectValue>{shift}</SelectValue></SelectTrigger>
                <SelectContent>
                  {SHIFTS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!name.trim()}>
              {editingId ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
