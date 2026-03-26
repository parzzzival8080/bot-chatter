"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "staff", label: "Staff" },
  { value: "customer_service", label: "Customer Service" },
] as const;

interface UserRoleSelectProps {
  userId: Id<"users">;
  currentRole: string | undefined;
}

export function UserRoleSelect({ userId, currentRole }: UserRoleSelectProps) {
  const updateRole = useMutation(api.users.updateRole);

  const handleRoleChange = async (value: string | null) => {
    if (!value || value === currentRole) return;

    try {
      await updateRole({
        userId,
        role: value as "admin" | "manager" | "staff" | "customer_service",
      });
      toast.success("Role updated successfully");
    } catch (error) {
      toast.error("Failed to update role");
      console.error("Failed to update role:", error);
    }
  };

  return (
    <Select value={currentRole ?? ""} onValueChange={handleRoleChange}>
      <SelectTrigger className="w-35">
        <SelectValue placeholder="Assign role" />
      </SelectTrigger>
      <SelectContent>
        {ROLES.map((role) => (
          <SelectItem key={role.value} value={role.value}>
            {role.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
