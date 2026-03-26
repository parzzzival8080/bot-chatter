"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, FileDown, Eye, ExternalLink } from "lucide-react";
import { previewCommissionPdf, downloadCommissionPdf } from "@/lib/generateCommissionPdf";

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const SHIFTS = ["MORNING", "MID", "NIGHT"] as const;
const ROLE_ORDER = ["leader", "customer_rep", "customer_rep_asst"] as const;
const ROLE_LABELS: Record<string, string> = {
  leader: "Leader",
  customer_rep: "Customer Rep",
  customer_rep_asst: "Customer Rep Asst",
};
const CONVERSION_RATE = 50;
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface MemberRow {
  memberId: string;
  name: string;
  firstDepositCount: number;
  firstDepositTotal: number;
  rechargeTotal: number;
  totalWithdrawals: number;
  totalDeposits: number;
  commission: number;
  percentage: number;
  total: number;
  totalConversion: number;
}

export function CommissionOverview() {
  const today = new Date();
  const [filterMonth, setFilterMonth] = useState<string>(String(today.getMonth()));
  const [filterYear, setFilterYear] = useState(today.getFullYear());
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [viewMemberId, setViewMemberId] = useState<string | null>(null);

  const teamMembers = useQuery(api.teamMembers.listActive);
  const allTransactions = useQuery(api.customerTransactions.list);
  const customers = useQuery(api.customers.list);
  const commissionRules = useQuery(api.commissionRules.listActive);

  const filteredTransactions = useMemo(() => {
    if (!allTransactions) return null;
    if (filterMonth === "all") return allTransactions;
    const monthIdx = parseInt(filterMonth);
    return allTransactions.filter((t) => {
      const d = new Date(t.dateOfTransaction);
      return d.getMonth() === monthIdx && d.getFullYear() === filterYear;
    });
  }, [allTransactions, filterMonth, filterYear]);

  const data = useMemo(() => {
    if (!teamMembers || !filteredTransactions || !customers || !commissionRules) return null;

    const customerToRep = new Map<string, string>();
    const customerToAsst = new Map<string, string>();
    for (const c of customers) {
      customerToRep.set(c._id, c.customerRepId);
      if (c.customerRepAsstId) customerToAsst.set(c._id, c.customerRepAsstId);
    }

    const memberStats = new Map<string, MemberRow>();
    for (const m of teamMembers) {
      memberStats.set(m._id, {
        memberId: m._id, name: m.name,
        firstDepositCount: 0, firstDepositTotal: 0,
        rechargeTotal: 0, totalWithdrawals: 0, totalDeposits: 0,
        commission: 0, percentage: 0, total: 0, totalConversion: 0,
      });
    }

    const rulesByRole = new Map<string, typeof commissionRules>();
    for (const rule of commissionRules) {
      const existing = rulesByRole.get(rule.teamRole) ?? [];
      existing.push(rule);
      rulesByRole.set(rule.teamRole, existing);
    }

    const memberShiftMap = new Map<string, string>();
    for (const m of teamMembers) memberShiftMap.set(m._id, m.shift);
    const customerShiftMap = new Map<string, string>();
    for (const c of customers) {
      const repShift = memberShiftMap.get(c.customerRepId);
      if (repShift) customerShiftMap.set(c._id, repShift);
    }

    // Track which commission role each member uses per transaction
    const memberTxEntries: { mId: string; commissionRole: string; t: typeof filteredTransactions[number] }[] = [];

    // Pass 1: accumulate stats (counts, totals)
    for (const t of filteredTransactions) {
      const repId = customerToRep.get(t.customerId);
      const asstId = customerToAsst.get(t.customerId);
      const customerShift = customerShiftMap.get(t.customerId);

      const entries: { mId: string; commissionRole: string }[] = [];
      if (repId) entries.push({ mId: repId, commissionRole: "customer_rep" });
      if (asstId) entries.push({ mId: asstId, commissionRole: "customer_rep_asst" });
      if (customerShift) {
        const leader = teamMembers.find((m) => m.teamRole === "leader" && m.shift === customerShift);
        if (leader) entries.push({ mId: leader._id, commissionRole: "leader" });
      }

      for (const { mId, commissionRole } of entries) {
        const stats = memberStats.get(mId);
        if (!stats) continue;
        if (t.type === "withdraw") { stats.totalWithdrawals += t.finalAmount; continue; }
        if (t.isFirstDeposit) { stats.firstDepositCount++; stats.firstDepositTotal += t.finalAmount; }
        else { stats.rechargeTotal += t.finalAmount; }
        stats.totalDeposits += t.finalAmount;
        memberTxEntries.push({ mId, commissionRole, t });
      }
    }

    // Pass 2: find the matching commission rule percentage for each member
    const memberRulePercentage = new Map<string, number>();

    // Determine each member's commission role
    const memberCommissionRole = new Map<string, string>();
    for (const { mId, commissionRole } of memberTxEntries) {
      if (!memberCommissionRole.has(mId)) memberCommissionRole.set(mId, commissionRole);
    }
    // Also set for members with no transactions based on their teamRole
    for (const m of teamMembers) {
      if (!memberCommissionRole.has(m._id)) memberCommissionRole.set(m._id, m.teamRole);
    }

    for (const [mId, commissionRole] of memberCommissionRole) {
      const stats = memberStats.get(mId);
      if (!stats) continue;
      const rules = rulesByRole.get(commissionRole) ?? [];
      for (const rule of rules) {
        if (rule.minFirstDepositCount && stats.firstDepositCount < rule.minFirstDepositCount) continue;
        memberRulePercentage.set(mId, rule.percentage);
        break;
      }
    }

    // Pass 3: calculate Total, then Commission = Total x %
    for (const stats of memberStats.values()) {
      stats.total = stats.rechargeTotal - stats.totalWithdrawals;
      stats.percentage = memberRulePercentage.get(stats.memberId) ?? 0;
      stats.commission = stats.total > 0 ? (stats.total * stats.percentage) / 100 : 0;
      stats.totalConversion = stats.commission * CONVERSION_RATE;
    }

    return memberStats;
  }, [teamMembers, filteredTransactions, customers, commissionRules]);

  const grandTotals = useMemo(() => {
    if (!filteredTransactions) return { firstDep: 0, recharge: 0, withdraw: 0, commission: 0 };
    let firstDep = 0, recharge = 0, withdraw = 0;
    for (const t of filteredTransactions) {
      if (t.type === "withdraw") withdraw += t.finalAmount;
      else if (t.isFirstDeposit) firstDep += t.finalAmount;
      else recharge += t.finalAmount;
    }
    // Sum commission from customer_rep only (avoid double counting with asst)
    let commission = 0;
    if (data && teamMembers) {
      for (const [id, stats] of data) {
        const member = teamMembers.find((m) => m._id === id);
        if (member?.teamRole === "customer_rep") commission += stats.commission;
      }
    }
    return { firstDep, recharge, withdraw, commission };
  }, [filteredTransactions, data, teamMembers]);

  const prevMonth = () => {
    if (filterMonth === "all") return;
    const m = parseInt(filterMonth);
    if (m === 0) { setFilterMonth("11"); setFilterYear(filterYear - 1); }
    else setFilterMonth(String(m - 1));
  };
  const nextMonth = () => {
    if (filterMonth === "all") return;
    const m = parseInt(filterMonth);
    if (m === 11) { setFilterMonth("0"); setFilterYear(filterYear + 1); }
    else setFilterMonth(String(m + 1));
  };

  if (!teamMembers || !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const filterLabel = filterMonth === "all"
    ? "All Time"
    : `${MONTHS[parseInt(filterMonth)]} ${filterYear}`;

  const net = grandTotals.firstDep + grandTotals.recharge - grandTotals.withdraw;

  const buildPdfRows = () => {
    if (!data || !teamMembers) return null;

    const rows = teamMembers.map((m) => {
      const stats = data.get(m._id);
      return {
        memberId: m._id as string,
        name: m.name,
        teamRole: m.teamRole,
        shift: m.shift,
        firstDepositCount: stats?.firstDepositCount ?? 0,
        firstDepositTotal: stats?.firstDepositTotal ?? 0,
        rechargeTotal: stats?.rechargeTotal ?? 0,
        totalWithdrawals: stats?.totalWithdrawals ?? 0,
        total: stats?.total ?? 0,
        percentage: stats?.percentage ?? 0,
        commission: stats?.commission ?? 0,
        totalConversion: stats?.totalConversion ?? 0,
      };
    });

    // For leaders, merge into one row per shift
    const mergedRows = rows.filter((r) => r.teamRole !== "leader");
    const leadersByShift = new Map<string, typeof rows>();
    for (const r of rows.filter((r) => r.teamRole === "leader")) {
      const existing = leadersByShift.get(r.shift) ?? [];
      existing.push(r);
      leadersByShift.set(r.shift, existing);
    }
    for (const [shift, leaders] of leadersByShift) {
      mergedRows.push({
        memberId: `leaders-${shift}`,
        name: leaders.map((l) => l.name).join(" & "),
        teamRole: "leader",
        shift,
        firstDepositCount: leaders.reduce((s, l) => s + l.firstDepositCount, 0),
        firstDepositTotal: leaders.reduce((s, l) => s + l.firstDepositTotal, 0),
        rechargeTotal: leaders.reduce((s, l) => s + l.rechargeTotal, 0),
        totalWithdrawals: leaders.reduce((s, l) => s + l.totalWithdrawals, 0),
        total: leaders.reduce((s, l) => s + l.total, 0),
        percentage: (() => {
          const t = leaders.reduce((s, l) => s + l.total, 0);
          const c = leaders.reduce((s, l) => s + l.commission, 0);
          return t > 0 ? (c / t) * 100 : 0;
        })(),
        commission: leaders.reduce((s, l) => s + l.commission, 0),
        totalConversion: leaders.reduce((s, l) => s + l.totalConversion, 0),
      });
    }

    return mergedRows;
  };

  const handlePreview = () => {
    const rows = buildPdfRows();
    if (!rows) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = previewCommissionPdf({ filterLabel, rows });
    setPreviewUrl(url);
  };

  const handleDownload = () => {
    const rows = buildPdfRows();
    if (!rows) return;
    downloadCommissionPdf({ filterLabel, rows });
  };

  return (
    <div className="space-y-6">
      {/* Period filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={filterMonth} onValueChange={(v) => v !== null && setFilterMonth(v)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Select month">
                {filterMonth === "all" ? "All Time" : MONTHS[parseInt(filterMonth)]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              {MONTHS.map((m, i) => (
                <SelectItem key={i} value={String(i)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filterMonth !== "all" && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-32 text-center text-sm font-semibold">{filterLabel}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={handlePreview}>
          <Eye className="mr-1.5 h-4 w-4" />
          Preview PDF
        </Button>
      </div>


      {/* Summary stats row */}
      <div className="grid grid-cols-5 divide-x rounded-xl border bg-card shadow-sm">
        <div className="px-5 py-4">
          <p className="text-[11px] font-medium text-muted-foreground">1st Deposit</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-red-500">{fmt(grandTotals.firstDep)}</p>
        </div>
        <div className="px-5 py-4">
          <p className="text-[11px] font-medium text-muted-foreground">Recharge</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-emerald-600">{fmt(grandTotals.recharge)}</p>
        </div>
        <div className="px-5 py-4">
          <p className="text-[11px] font-medium text-muted-foreground">Withdraw</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-amber-600">{fmt(grandTotals.withdraw)}</p>
        </div>
        <div className="px-5 py-4">
          <p className="text-[11px] font-medium text-muted-foreground">Net</p>
          <p className={`mt-1 text-xl font-bold tabular-nums ${net >= 0 ? "text-foreground" : "text-red-600"}`}>{fmt(net)}</p>
        </div>
        <div className="px-5 py-4">
          <p className="text-[11px] font-medium text-muted-foreground">Commission</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-blue-600">{fmt(grandTotals.commission)}</p>
        </div>
      </div>

      {/* Shift tabs */}
      <Tabs defaultValue={SHIFTS[0]}>
        <TabsList>
          {SHIFTS.map((s) => (
            <TabsTrigger key={s} value={s}>{s}</TabsTrigger>
          ))}
        </TabsList>

        {SHIFTS.map((shift) => {
          const shiftMembers = teamMembers.filter((m) => m.shift === shift);

          return (
            <TabsContent key={shift} value={shift} className="mt-4 space-y-3">
              {shiftMembers.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No team members in {shift} shift.
                </p>
              ) : (
                ROLE_ORDER.map((role) => {
              const roleMembers = shiftMembers.filter((m) => m.teamRole === role);
              if (roleMembers.length === 0) return null;

              const roleRows = roleMembers
                .map((m) => data.get(m._id))
                .filter(Boolean) as MemberRow[];

              const roleTotals = roleRows.reduce(
                (acc, r) => ({
                  firstDepositCount: acc.firstDepositCount + r.firstDepositCount,
                  firstDepositTotal: acc.firstDepositTotal + r.firstDepositTotal,
                  rechargeTotal: acc.rechargeTotal + r.rechargeTotal,
                  totalWithdrawals: acc.totalWithdrawals + r.totalWithdrawals,
                  totalDeposits: acc.totalDeposits + r.totalDeposits,
                  commission: acc.commission + r.commission,
                  totalConversion: acc.totalConversion + r.totalConversion,
                  total: acc.total + r.total,
                }),
                { firstDepositCount: 0, firstDepositTotal: 0, rechargeTotal: 0, totalWithdrawals: 0, totalDeposits: 0, commission: 0, totalConversion: 0, total: 0 }
              );

              const displayRows: MemberRow[] = role === "leader"
                ? [{
                    memberId: "leaders",
                    name: roleMembers.map((m) => m.name).join(" & "),
                    firstDepositCount: roleTotals.firstDepositCount,
                    firstDepositTotal: roleTotals.firstDepositTotal,
                    rechargeTotal: roleTotals.rechargeTotal,
                    totalWithdrawals: roleTotals.totalWithdrawals,
                    totalDeposits: 0,
                    commission: roleTotals.commission,
                    percentage: roleRows[0]?.percentage ?? 0,
                    total: roleTotals.total,
                    totalConversion: roleTotals.totalConversion,
                  }]
                : roleRows;

              return (
                <div key={role} className="rounded-lg border bg-card shadow-sm overflow-hidden">
                  <div className="px-4 py-2 border-b bg-muted/40">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {ROLE_LABELS[role]}
                    </span>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow className="text-[11px] hover:bg-transparent">
                        <TableHead className="w-44">Name</TableHead>
                        <TableHead className="text-right w-20">1st Dep #</TableHead>
                        <TableHead className="text-right">1st Dep Total</TableHead>
                        <TableHead className="text-right">Recharge</TableHead>
                        <TableHead className="text-right">Withdraw</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right w-16">%</TableHead>
                        <TableHead className="text-right">Commission</TableHead>
                        <TableHead className="text-right">Comm in P</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayRows.map((r) => (
                        <TableRow key={r.memberId}>
                          <TableCell>
                            <button
                              type="button"
                              onClick={() => setViewMemberId(r.memberId)}
                              className="font-semibold text-left hover:text-primary hover:underline underline-offset-2 transition-colors"
                            >
                              {r.name}
                            </button>
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-red-500">{r.firstDepositCount}</TableCell>
                          <TableCell className="text-right tabular-nums text-red-500">{fmt(r.firstDepositTotal)}</TableCell>
                          <TableCell className="text-right tabular-nums text-emerald-600">{fmt(r.rechargeTotal)}</TableCell>
                          <TableCell className="text-right tabular-nums text-amber-600">{fmt(r.totalWithdrawals)}</TableCell>
                          <TableCell className="text-right tabular-nums font-bold">{fmt(r.total)}</TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">{r.percentage.toFixed(2)}%</TableCell>
                          <TableCell className="text-right tabular-nums font-bold text-blue-600">{fmt(r.commission)}</TableCell>
                          <TableCell className="text-right tabular-nums font-bold text-violet-600">{fmt(r.totalConversion)}</TableCell>
                        </TableRow>
                      ))}
                      {role !== "leader" && displayRows.length > 1 && (
                        <TableRow className="border-t bg-muted/30 font-semibold">
                          <TableCell className="text-muted-foreground">Subtotal</TableCell>
                          <TableCell className="text-right tabular-nums text-red-500">{roleTotals.firstDepositCount}</TableCell>
                          <TableCell className="text-right tabular-nums text-red-500">{fmt(roleTotals.firstDepositTotal)}</TableCell>
                          <TableCell className="text-right tabular-nums text-emerald-600">{fmt(roleTotals.rechargeTotal)}</TableCell>
                          <TableCell className="text-right tabular-nums text-amber-600">{fmt(roleTotals.totalWithdrawals)}</TableCell>
                          <TableCell className="text-right tabular-nums font-bold">{fmt(roleTotals.total)}</TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {(roleRows[0]?.percentage ?? 0).toFixed(2)}%
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-bold text-blue-600">{fmt(roleTotals.commission)}</TableCell>
                          <TableCell className="text-right tabular-nums font-bold text-violet-600">{fmt(roleTotals.totalConversion)}</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              );
            })
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Member Breakdown Dialog */}
      {(() => {
        if (!viewMemberId || !filteredTransactions || !teamMembers || !customers) return null;

        // Find the member(s) — for leaders it's a combined ID like "leaders-MORNING"
        const isLeaderView = viewMemberId.startsWith("leaders");
        const viewMember = isLeaderView ? null : teamMembers.find((m) => m._id === viewMemberId);
        const viewName = isLeaderView
          ? teamMembers
              .filter((m) => m.teamRole === "leader" && m.shift === viewMemberId.split("-")[1])
              .map((m) => m.name)
              .join(" & ")
          : viewMember?.name ?? "";

        // Build customer set for this member
        const memberCustomerIds = new Set<string>();
        if (isLeaderView) {
          const shift = viewMemberId.split("-")[1];
          const shiftMemberIds = new Set(teamMembers.filter((m) => m.shift === shift).map((m) => m._id));
          for (const c of customers) {
            if (shiftMemberIds.has(c.customerRepId) || (c.customerRepAsstId && shiftMemberIds.has(c.customerRepAsstId))) {
              memberCustomerIds.add(c._id);
            }
          }
        } else {
          for (const c of customers) {
            if (c.customerRepId === viewMemberId || c.customerRepAsstId === viewMemberId) {
              memberCustomerIds.add(c._id);
            }
          }
        }

        // Get month info
        const monthIdx = filterMonth === "all" ? today.getMonth() : parseInt(filterMonth);
        const yr = filterMonth === "all" ? today.getFullYear() : filterYear;
        const daysInMonth = new Date(yr, monthIdx + 1, 0).getDate();

        // Build daily data
        const dayData = Array.from({ length: daysInMonth }, () => ({
          firstDepCount: 0, firstDepTotal: 0, recharge: 0, withdraw: 0,
        }));

        for (const t of filteredTransactions) {
          if (!memberCustomerIds.has(t.customerId)) continue;
          const d = new Date(t.dateOfTransaction);
          const dayIdx = d.getDate() - 1;
          if (dayIdx < 0 || dayIdx >= daysInMonth) continue;

          if (t.type === "withdraw") dayData[dayIdx].withdraw += t.finalAmount;
          else if (t.isFirstDeposit) { dayData[dayIdx].firstDepCount++; dayData[dayIdx].firstDepTotal += t.finalAmount; }
          else dayData[dayIdx].recharge += t.finalAmount;
        }

        const totals = dayData.reduce(
          (a, d) => ({
            firstDepCount: a.firstDepCount + d.firstDepCount,
            firstDepTotal: a.firstDepTotal + d.firstDepTotal,
            recharge: a.recharge + d.recharge,
            withdraw: a.withdraw + d.withdraw,
          }),
          { firstDepCount: 0, firstDepTotal: 0, recharge: 0, withdraw: 0 }
        );
        const digested = totals.recharge - totals.withdraw;

        const fmtCell = (n: number) => n === 0 ? "" : fmt(n);

        return (
          <Dialog open onOpenChange={(open) => !open && setViewMemberId(null)}>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span>{viewName}</span>
                  <span className="text-sm font-normal text-muted-foreground">— {filterLabel}</span>
                </DialogTitle>
              </DialogHeader>
              <table className="w-full text-[11px] leading-none">
                <thead>
                  <tr className="border-b text-[10px]">
                    <th className="w-8 px-1 py-1 text-left text-muted-foreground">#</th>
                    <th className="w-8 px-1 py-1 text-center text-muted-foreground">FD</th>
                    <th className="px-1 py-1 text-right text-red-500">1st Dep</th>
                    <th className="px-1 py-1 text-right text-emerald-600">Recharge</th>
                    <th className="px-1 py-1 text-right text-amber-600">Withdraw</th>
                  </tr>
                </thead>
                <tbody>
                  {dayData.map((d, i) => {
                    const hasData = d.firstDepCount > 0 || d.recharge > 0 || d.withdraw > 0;
                    return (
                      <tr key={i} className={`border-b border-dashed ${!hasData ? "opacity-20" : ""}`}>
                        <td className="px-1 py-0.75 text-muted-foreground">{i + 1}</td>
                        <td className="px-1 py-0.75 text-center tabular-nums text-blue-600">{d.firstDepCount > 0 ? d.firstDepCount : ""}</td>
                        <td className="px-1 py-0.75 text-right tabular-nums text-red-500">{fmtCell(d.firstDepTotal)}</td>
                        <td className="px-1 py-0.75 text-right tabular-nums text-emerald-600">{fmtCell(d.recharge)}</td>
                        <td className="px-1 py-0.75 text-right tabular-nums text-amber-600">{fmtCell(d.withdraw)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 bg-muted/40 text-xs font-bold">
                    <td className="px-1 py-1.5" colSpan={1}>TTL</td>
                    <td className="px-1 py-1.5 text-center tabular-nums text-blue-600">{totals.firstDepCount || ""}</td>
                    <td className="px-1 py-1.5 text-right tabular-nums text-red-500">{fmt(totals.firstDepTotal)}</td>
                    <td className="px-1 py-1.5 text-right tabular-nums text-emerald-600">{fmt(totals.recharge)}</td>
                    <td className="px-1 py-1.5 text-right tabular-nums text-amber-600">{fmt(totals.withdraw)}</td>
                  </tr>
                  <tr className="bg-emerald-50 text-xs font-bold">
                    <td colSpan={4} className="px-1 py-1.5 text-right text-emerald-800">DIGESTED</td>
                    <td className={`px-1 py-1.5 text-right tabular-nums ${digested >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                      {fmt(digested)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* PDF Preview Dialog */}
      <Dialog
        open={previewUrl !== null}
        onOpenChange={(open) => {
          if (!open) {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-6xl max-h-[95vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Commission Report Preview</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0">
            {previewUrl && (
              <iframe
                src={previewUrl}
                className="h-[75vh] w-full rounded-lg border"
                title="PDF Preview"
              />
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (previewUrl) URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
              }}
            >
              Close
            </Button>
            <Button onClick={handleDownload}>
              <FileDown className="mr-1.5 h-4 w-4" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
