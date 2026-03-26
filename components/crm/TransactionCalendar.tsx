"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  ArrowDownCircle,
  RefreshCw,
  ArrowUpCircle,
  TrendingUp,
} from "lucide-react";

function formatAmount(n: number) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function compactAmount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(2);
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface DaySummary {
  firstDeposits: number;
  recharges: number;
  withdrawals: number;
  count: number;
}

export function TransactionCalendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const allTransactions = useQuery(api.customerTransactions.list);

  const allFirstDeposits =
    allTransactions
      ?.filter((t) => t.type === "deposit" && t.isFirstDeposit)
      .reduce((s, t) => s + t.finalAmount, 0) ?? 0;
  const allRecharges =
    allTransactions
      ?.filter((t) => t.type === "deposit" && !t.isFirstDeposit)
      .reduce((s, t) => s + t.finalAmount, 0) ?? 0;
  const allWithdrawals =
    allTransactions
      ?.filter((t) => t.type === "withdraw")
      .reduce((s, t) => s + t.finalAmount, 0) ?? 0;
  const grandTotal = allFirstDeposits + allRecharges - allWithdrawals;

  const monthTransactions = useQuery(
    api.customerTransactions.listByDateRange,
    { startDate: monthStart.getTime(), endDate: monthEnd.getTime() + 1 }
  );

  const daySummaries = useMemo(() => {
    const map = new Map<number, DaySummary>();
    monthTransactions?.forEach((t) => {
      const day = new Date(t.dateOfTransaction).getDate();
      const existing = map.get(day) ?? {
        firstDeposits: 0,
        recharges: 0,
        withdrawals: 0,
        count: 0,
      };
      if (t.type === "withdraw") {
        existing.withdrawals += t.finalAmount;
      } else if (t.isFirstDeposit) {
        existing.firstDeposits += t.finalAmount;
      } else {
        existing.recharges += t.finalAmount;
      }
      existing.count++;
      map.set(day, existing);
    });
    return map;
  }, [monthTransactions]);

  const selectedDayTransactions = useMemo(() => {
    if (selectedDay === null || !monthTransactions) return [];
    return monthTransactions.filter(
      (t) => new Date(t.dateOfTransaction).getDate() === selectedDay
    );
  }, [selectedDay, monthTransactions]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDow = new Date(year, month, 1).getDay();
  const totalCells = Math.ceil((startDow + daysInMonth) / 7) * 7;

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else setMonth(month + 1);
  };

  const monthLabel = new Date(year, month).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const formattedSelectedDate = selectedDay
    ? new Date(year, month, selectedDay).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      {allTransactions && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="relative overflow-hidden border-red-200 bg-linear-to-br from-red-50 to-white p-5">
            <div className="absolute -right-3 -top-3 rounded-full bg-red-100 p-4 opacity-50">
              <ArrowDownCircle className="h-8 w-8 text-red-400" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-red-400">
              1st Deposit
            </p>
            <p className="mt-2 text-2xl font-bold text-red-600">
              {formatAmount(allFirstDeposits)}
            </p>
            <p className="mt-1 text-[11px] text-red-400">
              All-time new customers
            </p>
          </Card>

          <Card className="relative overflow-hidden border-green-200 bg-linear-to-br from-green-50 to-white p-5">
            <div className="absolute -right-3 -top-3 rounded-full bg-green-100 p-4 opacity-50">
              <RefreshCw className="h-8 w-8 text-green-400" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-green-500">
              Recharge
            </p>
            <p className="mt-2 text-2xl font-bold text-green-600">
              {formatAmount(allRecharges)}
            </p>
            <p className="mt-1 text-[11px] text-green-500">
              All-time returning
            </p>
          </Card>

          <Card className="relative overflow-hidden border-orange-200 bg-linear-to-br from-orange-50 to-white p-5">
            <div className="absolute -right-3 -top-3 rounded-full bg-orange-100 p-4 opacity-50">
              <ArrowUpCircle className="h-8 w-8 text-orange-400" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-orange-500">
              Withdraw
            </p>
            <p className="mt-2 text-2xl font-bold text-orange-600">
              {formatAmount(allWithdrawals)}
            </p>
            <p className="mt-1 text-[11px] text-orange-500">
              All-time payouts
            </p>
          </Card>

          <Card
            className={`relative overflow-hidden p-5 ${
              grandTotal >= 0
                ? "border-blue-200 bg-linear-to-br from-blue-50 to-white"
                : "border-red-300 bg-linear-to-br from-red-50 to-white"
            }`}
          >
            <div
              className={`absolute -right-3 -top-3 rounded-full p-4 opacity-50 ${
                grandTotal >= 0 ? "bg-blue-100" : "bg-red-100"
              }`}
            >
              <TrendingUp
                className={`h-8 w-8 ${grandTotal >= 0 ? "text-blue-400" : "text-red-400"}`}
              />
            </div>
            <p
              className={`text-xs font-semibold uppercase tracking-wider ${
                grandTotal >= 0 ? "text-blue-500" : "text-red-400"
              }`}
            >
              Grand Total
            </p>
            <p
              className={`mt-2 text-2xl font-bold ${
                grandTotal >= 0 ? "text-blue-600" : "text-red-600"
              }`}
            >
              {formatAmount(grandTotal)}
            </p>
            <p
              className={`mt-1 text-[11px] ${
                grandTotal >= 0 ? "text-blue-400" : "text-red-400"
              }`}
            >
              Dep + Recharge - Withdraw
            </p>
          </Card>
        </div>
      )}

      {/* Calendar */}
      <Card className="overflow-hidden">
        {/* Month nav */}
        <div className="flex items-center justify-between border-b bg-muted/30 px-5 py-3">
          <Button variant="ghost" size="sm" onClick={prevMonth}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Prev
          </Button>
          <h2 className="text-lg font-bold tracking-tight">{monthLabel}</h2>
          <Button variant="ghost" size="sm" onClick={nextMonth}>
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 bg-muted/20">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="border-b border-r py-2.5 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        {monthTransactions === undefined ? (
          <div className="flex items-center justify-center py-32">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {Array.from({ length: totalCells }, (_, i) => {
              const dayNum = i - startDow + 1;
              const isValid = dayNum >= 1 && dayNum <= daysInMonth;
              const summary = isValid ? daySummaries.get(dayNum) : undefined;
              const isToday =
                isValid &&
                dayNum === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear();
              const net = summary
                ? summary.firstDeposits + summary.recharges - summary.withdrawals
                : 0;

              return (
                <button
                  key={i}
                  type="button"
                  disabled={!isValid}
                  onClick={() => isValid && setSelectedDay(dayNum)}
                  className={`group relative min-h-28 border-b border-r p-2 text-left transition-all ${
                    isValid
                      ? "hover:bg-accent/50 hover:shadow-inner cursor-pointer"
                      : "bg-muted/10"
                  } ${isToday ? "bg-primary/5 ring-1 ring-inset ring-primary/20" : ""}`}
                >
                  {isValid && (
                    <>
                      <span
                        className={`inline-flex text-sm font-semibold ${
                          isToday
                            ? "h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
                            : "text-foreground"
                        }`}
                      >
                        {dayNum}
                      </span>
                      {summary && (
                        <div className="mt-1.5 space-y-1">
                          {summary.firstDeposits > 0 && (
                            <div className="flex items-center gap-1 rounded-md bg-red-50 px-1.5 py-0.5">
                              <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                              <span className="text-[10px] font-semibold text-red-600 truncate">
                                {compactAmount(summary.firstDeposits)}
                              </span>
                            </div>
                          )}
                          {summary.recharges > 0 && (
                            <div className="flex items-center gap-1 rounded-md bg-green-50 px-1.5 py-0.5">
                              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                              <span className="text-[10px] font-semibold text-green-600 truncate">
                                {compactAmount(summary.recharges)}
                              </span>
                            </div>
                          )}
                          {summary.withdrawals > 0 && (
                            <div className="flex items-center gap-1 rounded-md bg-orange-50 px-1.5 py-0.5">
                              <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                              <span className="text-[10px] font-semibold text-orange-600 truncate">
                                -{compactAmount(summary.withdrawals)}
                              </span>
                            </div>
                          )}
                          <div
                            className={`text-[10px] font-bold ${
                              net >= 0 ? "text-blue-600" : "text-red-600"
                            }`}
                          >
                            = {compactAmount(net)}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* Transaction detail dialog */}
      <Dialog
        open={selectedDay !== null}
        onOpenChange={(open) => !open && setSelectedDay(null)}
      >
        <DialogContent className="sm:max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {formattedSelectedDate}
            </DialogTitle>
          </DialogHeader>
          {selectedDayTransactions.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No transactions on this date.
            </p>
          ) : (
            <>
              {/* Day summary cards inside dialog */}
              {(() => {
                const firstDep = selectedDayTransactions
                  .filter((t) => t.type === "deposit" && t.isFirstDeposit)
                  .reduce((s, t) => s + t.finalAmount, 0);
                const recharge = selectedDayTransactions
                  .filter((t) => t.type === "deposit" && !t.isFirstDeposit)
                  .reduce((s, t) => s + t.finalAmount, 0);
                const wd = selectedDayTransactions
                  .filter((t) => t.type === "withdraw")
                  .reduce((s, t) => s + t.finalAmount, 0);
                const net = firstDep + recharge - wd;
                return (
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                    <div className="rounded-lg bg-red-50 px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase text-red-400">
                        1st Deposit
                      </p>
                      <p className="text-lg font-bold text-red-600">
                        {formatAmount(firstDep)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-green-50 px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase text-green-500">
                        Recharge
                      </p>
                      <p className="text-lg font-bold text-green-600">
                        {formatAmount(recharge)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-orange-50 px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase text-orange-500">
                        Withdraw
                      </p>
                      <p className="text-lg font-bold text-orange-600">
                        {formatAmount(wd)}
                      </p>
                    </div>
                    <div
                      className={`rounded-lg px-3 py-2 ${
                        net >= 0 ? "bg-blue-50" : "bg-red-50"
                      }`}
                    >
                      <p
                        className={`text-[10px] font-semibold uppercase ${
                          net >= 0 ? "text-blue-500" : "text-red-400"
                        }`}
                      >
                        Net
                      </p>
                      <p
                        className={`text-lg font-bold ${
                          net >= 0 ? "text-blue-600" : "text-red-600"
                        }`}
                      >
                        {formatAmount(net)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                        Transactions
                      </p>
                      <p className="text-lg font-bold">
                        {selectedDayTransactions.length}
                      </p>
                    </div>
                  </div>
                );
              })()}

              <div className="max-h-[60vh] overflow-y-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Time</TableHead>
                      <TableHead>TX ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Coin</TableHead>
                      <TableHead className="text-right">Initial</TableHead>
                      <TableHead className="text-right">Conv.</TableHead>
                      <TableHead className="text-right">Final</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedDayTransactions.map((t) => (
                      <TableRow key={t._id} className="hover:bg-muted/20">
                        <TableCell className="whitespace-nowrap text-xs">
                          {formatTime(t.dateOfTransaction)}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {t.txId}
                        </TableCell>
                        <TableCell className="font-medium">
                          {t.customerUid}
                        </TableCell>
                        <TableCell>
                          {t.type === "withdraw" ? (
                            <Badge
                              variant="outline"
                              className="border-orange-300 text-orange-600"
                            >
                              Withdraw
                            </Badge>
                          ) : t.isFirstDeposit ? (
                            <Badge className="bg-red-500 hover:bg-red-600 text-white">
                              1st Deposit
                            </Badge>
                          ) : (
                            <Badge className="bg-green-600 hover:bg-green-700 text-white">
                              Recharge
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{t.coin}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatAmount(t.initialAmount)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {t.conversion != null
                            ? formatAmount(t.conversion)
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {formatAmount(t.finalAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-t-2 bg-muted/40">
                      <TableCell
                        colSpan={7}
                        className="text-right font-bold text-muted-foreground"
                      >
                        Net Total
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-lg">
                        {formatAmount(
                          selectedDayTransactions.reduce(
                            (sum, t) =>
                              t.type === "withdraw"
                                ? sum - t.finalAmount
                                : sum + t.finalAmount,
                            0
                          )
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
