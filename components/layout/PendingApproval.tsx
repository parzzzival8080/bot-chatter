"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUser } from "@clerk/nextjs";

export default function PendingApproval() {
  const { user } = useUser();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Awaiting Role Assignment</CardTitle>
          <CardDescription>
            Your account has been created but you have not been assigned a role
            yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Name</div>
            <div className="text-sm font-medium">
              {user?.fullName ?? "Loading..."}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Email</div>
            <div className="text-sm font-medium">
              {user?.primaryEmailAddress?.emailAddress ?? "Loading..."}
            </div>
          </div>
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              An administrator needs to assign you a role before you can access
              the application. Please contact your team administrator for
              assistance.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
