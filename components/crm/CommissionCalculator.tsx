"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatAmount(n: number) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const ROLE_LABELS: Record<string, string> = {
  leader: "Leader",
  customer_rep: "Customer Rep",
  customer_rep_asst: "Customer Rep Asst",
};

interface CommissionLine {
  txId: string;
  customerUid: string;
  type: string;
  isFirstDeposit?: boolean;
  coin: string;
  finalAmount: number;
  dateOfTransaction: number;
  ruleName: string;
  percentage: number;
  commission: number;
}

export function CommissionCalculator() {
  const teamMembers = useQuery(api.teamMembers.listActive);
  const allTransactions = useQuery(api.customerTransactions.list);
  const customers = useQuery(api.customers.list);
  const commissionRules = useQuery(api.commissionRules.listActive);

  const [selectedMemberId, setSelectedMemberId] = useState("");

  const selectedMember = teamMembers?.find((m) => m._id === selectedMemberId);

  // Find customers assigned to this team member, with their commission role
  const memberCustomerMap = useMemo(() => {
    if (!selectedMemberId || !selectedMember || !customers || !teamMembers)
      return new Map<string, string>();
    const map = new Map<string, string>();

    if (selectedMember.teamRole === "leader") {
      // Leaders get all customers whose rep/asst is in the same shift
      const shiftMemberIds = new Set(
        teamMembers
          .filter((m) => m.shift === selectedMember.shift)
          .map((m) => m._id)
      );
      for (const c of customers) {
        if (shiftMemberIds.has(c.customerRepId) || (c.customerRepAsstId && shiftMemberIds.has(c.customerRepAsstId))) {
          map.set(c._id, "leader");
        }
      }
    } else {
      for (const c of customers) {
        if (c.customerRepId === selectedMemberId) {
          map.set(c._id, "customer_rep");
        } else if (c.customerRepAsstId === selectedMemberId) {
          map.set(c._id, "customer_rep_asst");
        }
      }
    }
    return map;
  }, [selectedMemberId, selectedMember, customers, teamMembers]);

  // Calculate commissions
  const commissionLines = useMemo((): CommissionLine[] => {
    if (
      !selectedMember ||
      !allTransactions ||
      !commissionRules ||
      memberCustomerMap.size === 0
    )
      return [];

    // Group rules by role
    const rulesByRole = new Map<string, typeof commissionRules>();
    for (const rule of commissionRules) {
      const existing = rulesByRole.get(rule.teamRole) ?? [];
      existing.push(rule);
      rulesByRole.set(rule.teamRole, existing);
    }

    // Group transactions by month to count 1st deposits per month
    const monthFirstDepCounts = new Map<string, number>();
    for (const t of allTransactions) {
      if (!memberCustomerMap.has(t.customerId)) continue;
      if (t.type === "deposit" && t.isFirstDeposit) {
        const d = new Date(t.dateOfTransaction);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        monthFirstDepCounts.set(key, (monthFirstDepCounts.get(key) ?? 0) + 1);
      }
    }

    const lines: CommissionLine[] = [];

    for (const t of allTransactions) {
      const commissionRole = memberCustomerMap.get(t.customerId);
      if (!commissionRole) continue;
      if (t.type !== "deposit") continue;

      const d = new Date(t.dateOfTransaction);
      const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
      const monthFirstDeps = monthFirstDepCounts.get(monthKey) ?? 0;

      const applicableRules = rulesByRole.get(commissionRole) ?? [];

      for (const rule of applicableRules) {
        if (rule.minFirstDepositCount && monthFirstDeps < rule.minFirstDepositCount) continue;
        if (t.finalAmount >= rule.minAmount && t.finalAmount <= rule.maxAmount) {
          lines.push({
            txId: t.txId,
            customerUid: t.customerUid,
            type: t.type,
            isFirstDeposit: t.isFirstDeposit,
            coin: t.coin,
            finalAmount: t.finalAmount,
            dateOfTransaction: t.dateOfTransaction,
            ruleName: rule.description,
            percentage: rule.percentage,
            commission: (t.finalAmount * rule.percentage) / 100,
          });
          break; // use first matching rule
        }
      }
    }

    return lines.sort((a, b) => b.dateOfTransaction - a.dateOfTransaction);
  }, [selectedMember, allTransactions, commissionRules, memberCustomerMap]);

  const totalCommission = commissionLines.reduce(
    (s, l) => s + l.commission,
    0
  );
  const totalDeposits = commissionLines.reduce(
    (s, l) => s + l.finalAmount,
    0
  );

  if (!teamMembers || !allTransactions || !customers || !commissionRules) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Member selector */}
      <Card className="p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2 min-w-60">
            <Label className="text-sm font-semibold">Team Member</Label>
            <Select
              value={selectedMemberId}
              onValueChange={(v) => setSelectedMemberId(v ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a team member">
                  {selectedMember ? `${selectedMember.name} — ${ROLE_LABELS[selectedMember.teamRole]}` : "Select a team member"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((m) => (
                  <SelectItem key={m._id} value={m._id}>
                    {m.name}{" "}
                    <span className="text-muted-foreground">
                      — {ROLE_LABELS[m.teamRole]}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedMember && (
            <div className="flex gap-2">
              <Badge variant="secondary">{ROLE_LABELS[selectedMember.teamRole]}</Badge>
              <Badge variant="outline">{selectedMember.shift}</Badge>
              <Badge variant="outline">
                {memberCustomerMap.size} customer{memberCustomerMap.size !== 1 ? "s" : ""}
              </Badge>
            </div>
          )}
        </div>
      </Card>

      {selectedMember && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="relative overflow-hidden border-green-200 bg-linear-to-br from-green-50 to-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-green-500">
                Total Deposits
              </p>
              <p className="mt-2 text-2xl font-bold text-green-600">
                {formatAmount(totalDeposits)}
              </p>
              <p className="mt-1 text-[11px] text-green-500">
                {commissionLines.length} qualifying transaction{commissionLines.length !== 1 ? "s" : ""}
              </p>
            </Card>
            <Card className="relative overflow-hidden border-blue-200 bg-linear-to-br from-blue-50 to-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-500">
                Total Commission
              </p>
              <p className="mt-2 text-2xl font-bold text-blue-600">
                {formatAmount(totalCommission)}
              </p>
              <p className="mt-1 text-[11px] text-blue-500">
                Earned from deposits
              </p>
            </Card>
            <Card className="relative overflow-hidden border-purple-200 bg-linear-to-br from-purple-50 to-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-purple-500">
                Avg Rate
              </p>
              <p className="mt-2 text-2xl font-bold text-purple-600">
                {totalDeposits > 0
                  ? ((totalCommission / totalDeposits) * 100).toFixed(2)
                  : "0.00"}
                %
              </p>
              <p className="mt-1 text-[11px] text-purple-500">
                Effective commission rate
              </p>
            </Card>
          </div>

          {/* Commission breakdown table */}
          <Card className="overflow-hidden">
            <div className="border-b bg-muted/30 px-5 py-3">
              <h3 className="font-semibold">Commission Breakdown</h3>
              <p className="text-xs text-muted-foreground">
                Based on active commission rules for{" "}
                {ROLE_LABELS[selectedMember.teamRole]}
              </p>
            </div>
            {commissionLines.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No qualifying transactions found. Make sure commission rules are
                configured for the {ROLE_LABELS[selectedMember.teamRole]} role.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20">
                      <TableHead>Date</TableHead>
                      <TableHead>TX ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Coin</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Rule</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissionLines.map((l, i) => (
                      <TableRow key={i} className="hover:bg-muted/20">
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {formatDate(l.dateOfTransaction)}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {l.txId}
                        </TableCell>
                        <TableCell className="font-medium">
                          {l.customerUid}
                        </TableCell>
                        <TableCell>
                          {l.isFirstDeposit ? (
                            <Badge className="bg-red-500 text-white">
                              1st Deposit
                            </Badge>
                          ) : (
                            <Badge className="bg-green-600 text-white">
                              Recharge
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{l.coin}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatAmount(l.finalAmount)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {l.ruleName}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {l.percentage}%
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-blue-600">
                          {formatAmount(l.commission)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-t-2 bg-muted/40">
                      <TableCell
                        colSpan={5}
                        className="text-right font-bold text-muted-foreground"
                      >
                        Totals
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        {formatAmount(totalDeposits)}
                      </TableCell>
                      <TableCell />
                      <TableCell />
                      <TableCell className="text-right font-mono font-bold text-lg text-blue-600">
                        {formatAmount(totalCommission)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
