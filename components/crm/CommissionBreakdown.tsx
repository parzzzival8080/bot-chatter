"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

function fmt(n: number) {
  if (n === 0) return "";
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtTotal(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const SHIFTS = ["MORNING", "MID", "NIGHT"] as const;

interface DayData {
  firstDepCount: number;
  firstDepTotal: number;
  recharge: number;
  withdraw: number;
}

export function CommissionBreakdown() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [activeShift, setActiveShift] = useState<string>(SHIFTS[0]);

  const teamMembers = useQuery(api.teamMembers.listActive);
  const customers = useQuery(api.customers.list);
  const commissionRules = useQuery(api.commissionRules.listActive);

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthTransactions = useQuery(
    api.customerTransactions.listByDateRange,
    { startDate: monthStart.getTime(), endDate: monthEnd.getTime() + 1 }
  );

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  // Build per-member, per-day data
  const memberBreakdowns = useMemo(() => {
    if (!teamMembers || !customers || !monthTransactions) return null;

    const customerToRep = new Map<string, string>();
    const customerToAsst = new Map<string, string>();
    for (const c of customers) {
      customerToRep.set(c._id, c.customerRepId);
      if (c.customerRepAsstId) customerToAsst.set(c._id, c.customerRepAsstId);
    }

    const memberShiftMap = new Map<string, string>();
    for (const m of teamMembers) memberShiftMap.set(m._id, m.shift);

    const customerShiftMap = new Map<string, string>();
    for (const c of customers) {
      const repShift = memberShiftMap.get(c.customerRepId);
      if (repShift) customerShiftMap.set(c._id, repShift);
    }

    // memberId -> day (1-31) -> DayData
    const data = new Map<string, Map<number, DayData>>();

    const ensureMember = (mId: string) => {
      if (!data.has(mId)) {
        const days = new Map<number, DayData>();
        for (let d = 1; d <= daysInMonth; d++) {
          days.set(d, { firstDepCount: 0, firstDepTotal: 0, recharge: 0, withdraw: 0 });
        }
        data.set(mId, days);
      }
      return data.get(mId)!;
    };

    // Initialize all active members
    for (const m of teamMembers) ensureMember(m._id);

    for (const t of monthTransactions) {
      const day = new Date(t.dateOfTransaction).getDate();
      const repId = customerToRep.get(t.customerId);
      const asstId = customerToAsst.get(t.customerId);
      const customerShift = customerShiftMap.get(t.customerId);

      const creditIds: string[] = [];
      if (repId) creditIds.push(repId);
      if (asstId) creditIds.push(asstId);
      // Leaders get all their shift's transactions
      if (customerShift) {
        const leader = teamMembers.find((m) => m.teamRole === "leader" && m.shift === customerShift);
        if (leader && !creditIds.includes(leader._id)) creditIds.push(leader._id);
      }

      for (const mId of creditIds) {
        const days = ensureMember(mId);
        const dayData = days.get(day);
        if (!dayData) continue;

        if (t.type === "withdraw") {
          dayData.withdraw += t.finalAmount;
        } else if (t.isFirstDeposit) {
          dayData.firstDepCount++;
          dayData.firstDepTotal += t.finalAmount;
        } else {
          dayData.recharge += t.finalAmount;
        }
      }
    }

    return data;
  }, [teamMembers, customers, monthTransactions, daysInMonth]);

  if (!teamMembers || !memberBreakdowns) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const shiftMembers = teamMembers.filter((m) => m.shift === activeShift);
  const monthLabel = `${MONTHS[month]} ${year}`;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={String(month)} onValueChange={(v) => v !== null && setMonth(parseInt(v))}>
          <SelectTrigger className="w-36">
            <SelectValue>{MONTHS[month]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((m, i) => (
              <SelectItem key={i} value={String(i)}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-32 text-center text-sm font-semibold">{monthLabel}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Shift tabs */}
      <div className="flex gap-1 border-b">
        {SHIFTS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setActiveShift(s)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeShift === s
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Member tables */}
      {shiftMembers.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No team members in {activeShift} shift.
        </p>
      ) : (
        shiftMembers.map((member) => {
          const days = memberBreakdowns.get(member._id);
          if (!days) return null;

          let totalFirstDepCount = 0;
          let totalFirstDepTotal = 0;
          let totalRecharge = 0;
          let totalWithdraw = 0;

          for (const d of days.values()) {
            totalFirstDepCount += d.firstDepCount;
            totalFirstDepTotal += d.firstDepTotal;
            totalRecharge += d.recharge;
            totalWithdraw += d.withdraw;
          }

          const digested = totalRecharge - totalWithdraw;

          return (
            <Card key={member._id} className="overflow-hidden">
              {/* Member header */}
              <div className="border-b bg-emerald-50 px-4 py-2">
                <span className="text-sm font-bold uppercase tracking-wide text-emerald-800">
                  {member.name}
                </span>
              </div>

              {/* Grid */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30 text-xs">
                      <th className="w-16 px-3 py-2 text-left font-semibold text-muted-foreground">DATE</th>
                      <th className="w-20 px-3 py-2 text-center font-semibold text-muted-foreground">NO. of 1st Dep</th>
                      <th className="px-3 py-2 text-right font-semibold text-red-500">1st DEP TOTAL</th>
                      <th className="px-3 py-2 text-right font-semibold text-emerald-600">RECHARGE</th>
                      <th className="px-3 py-2 text-right font-semibold text-amber-600">WITHDRAW</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: daysInMonth }, (_, i) => {
                      const day = i + 1;
                      const d = days.get(day)!;
                      const hasData = d.firstDepCount > 0 || d.firstDepTotal > 0 || d.recharge > 0 || d.withdraw > 0;

                      return (
                        <tr
                          key={day}
                          className={`border-b transition-colors ${hasData ? "bg-white" : "bg-muted/5"} hover:bg-muted/20`}
                        >
                          <td className="px-3 py-1.5 text-muted-foreground font-medium">{day}</td>
                          <td className="px-3 py-1.5 text-center tabular-nums text-blue-600 font-medium">
                            {d.firstDepCount > 0 ? d.firstDepCount : ""}
                          </td>
                          <td className="px-3 py-1.5 text-right tabular-nums text-red-500 font-medium">
                            {fmt(d.firstDepTotal)}
                          </td>
                          <td className="px-3 py-1.5 text-right tabular-nums text-emerald-600 font-medium">
                            {fmt(d.recharge)}
                          </td>
                          <td className="px-3 py-1.5 text-right tabular-nums text-amber-600 font-medium">
                            {fmt(d.withdraw)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 bg-muted/40 font-bold">
                      <td className="px-3 py-2 text-muted-foreground">TOTAL</td>
                      <td className="px-3 py-2 text-center tabular-nums text-blue-600">{totalFirstDepCount || ""}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-red-500">{fmtTotal(totalFirstDepTotal)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-emerald-600">{fmtTotal(totalRecharge)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-amber-600">{fmtTotal(totalWithdraw)}</td>
                    </tr>
                    <tr className="bg-emerald-50">
                      <td colSpan={4} className="px-3 py-2 text-right font-bold text-emerald-800">
                        DIGESTED (Recharge - Withdraw)
                      </td>
                      <td className={`px-3 py-2 text-right tabular-nums font-bold text-lg ${digested >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                        {fmtTotal(digested)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}
