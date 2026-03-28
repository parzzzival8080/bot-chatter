"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CommissionRulesTable } from "@/components/crm/CommissionRulesTable";

export default function CommissionConfigPage() {
  const currentUser = useQuery(api.users.getCurrentUser);

  if (currentUser === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!currentUser?.role || !["admin", "customer_service"].includes(currentUser.role)) {
    return <div className="py-8 text-center text-muted-foreground">Access denied.</div>;
  }

  return <CommissionRulesTable />;
}
