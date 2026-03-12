"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import PendingApproval from "./PendingApproval";
import { ReactNode, useEffect, useRef } from "react";

export default function RoleGuard({ children }: { children: ReactNode }) {
  const user = useQuery(api.users.getCurrentUser);
  const ensureUser = useMutation(api.users.ensureUser);
  const ensuredRef = useRef(false);

  useEffect(() => {
    // If authenticated but no user record in Convex, auto-create it
    if (user === null && !ensuredRef.current) {
      ensuredRef.current = true;
      ensureUser().catch(console.error);
    }
  }, [user, ensureUser]);

  // Still loading
  if (user === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // User not found in Convex yet (webhook hasn't fired) or no role assigned
  if (!user || !user.role) {
    return <PendingApproval />;
  }

  // User has a role — render protected content
  return <>{children}</>;
}
