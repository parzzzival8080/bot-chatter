"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserRoleSelect } from "@/components/admin/UserRoleSelect";
import { Users } from "lucide-react";

const roleBadgeVariant = (role: string | undefined) => {
  switch (role) {
    case "admin":
      return "default" as const;
    case "manager":
      return "secondary" as const;
    case "staff":
      return "outline" as const;
    default:
      return "outline" as const;
  }
};

export default function AdminUsersPage() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const users = useQuery(api.users.list);

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

  if (users === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Manage user roles and permissions.
        </p>
      </div>

      <Card>
        {users.length === 0 ? (
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 rounded-full bg-muted p-3">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium">No users found</p>
            <p className="text-sm text-muted-foreground">
              Users will appear here after they sign up.
            </p>
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant={roleBadgeVariant(user.role)}>
                        {user.role ?? "No role"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <UserRoleSelect
                        userId={user._id}
                        currentRole={user.role}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
