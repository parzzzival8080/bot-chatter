"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommissionOverview } from "@/components/crm/CommissionOverview";
import { CommissionCalculator } from "@/components/crm/CommissionCalculator";
import { BarChart3, Calculator } from "lucide-react";

export default function CommissionPage() {
  const currentUser = useQuery(api.users.getCurrentUser);

  if (currentUser === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (
    !currentUser?.role ||
    !["admin", "customer_service"].includes(currentUser.role)
  ) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Access denied.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Commission</h1>
        <p className="text-muted-foreground">
          Overview and calculator for team commissions.
        </p>
      </div>
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="calculator" className="gap-1.5">
            <Calculator className="h-4 w-4" />
            Calculator
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <CommissionOverview />
        </TabsContent>
        <TabsContent value="calculator" className="mt-4">
          <CommissionCalculator />
        </TabsContent>
      </Tabs>
    </div>
  );
}
