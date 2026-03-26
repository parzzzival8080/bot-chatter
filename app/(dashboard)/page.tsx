"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PendingTaskTable } from "@/components/tasks/PendingTaskTable";
import { MyTasks } from "@/components/tasks/MyTasks";
import { AdminTaskTable } from "@/components/tasks/AdminTaskTable";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ClipboardList, ListChecks } from "lucide-react";

export default function DashboardPage() {
  const currentUser = useQuery(api.users.getCurrentUser);

  if (currentUser === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Not authenticated
      </div>
    );
  }

  const role = currentUser.role;

  if (role === "manager" || role === "admin") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Task Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of all dispatched tasks and their status.
          </p>
        </div>
        <AdminTaskTable />
      </div>
    );
  }

  if (role === "staff" || role === "customer_service") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Claim pending tasks or manage your assigned work.
          </p>
        </div>
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending" className="gap-1.5">
              <ClipboardList className="h-4 w-4" />
              Pending
            </TabsTrigger>
            <TabsTrigger value="my-tasks" className="gap-1.5">
              <ListChecks className="h-4 w-4" />
              My Tasks
            </TabsTrigger>
          </TabsList>
          <TabsContent value="pending">
            <PendingTaskTable />
          </TabsContent>
          <TabsContent value="my-tasks">
            <MyTasks />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="py-8 text-center text-muted-foreground">
      Your account has not been assigned a role yet. Please contact an
      administrator.
    </div>
  );
}
