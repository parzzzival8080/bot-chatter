"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatAmount(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function TransactionsTable() {
  const transactions = useQuery(api.customerTransactions.list);
  const customers = useQuery(api.customers.list);
  const create = useMutation(api.customerTransactions.create);
  const remove = useMutation(api.customerTransactions.remove);

  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [txId, setTxId] = useState("");
  const [type, setType] = useState<"deposit" | "withdraw">("deposit");
  const [isFirstDeposit, setIsFirstDeposit] = useState(false);
  const [coin, setCoin] = useState("");
  const [initialAmount, setInitialAmount] = useState("");
  const [conversion, setConversion] = useState("");

  // Auto-calculate final amount = initial / conversion
  const computedFinal = (() => {
    const init = parseFloat(initialAmount);
    const conv = parseFloat(conversion);
    if (!isNaN(init) && !isNaN(conv) && conv !== 0) {
      return init * conv;
    }
    if (!isNaN(init) && (!conversion || conversion === "")) {
      return init;
    }
    return null;
  })();

  const openAdd = () => {
    setCustomerId("");
    setTxId("");
    setType("deposit");
    setIsFirstDeposit(false);
    setCoin("");
    setInitialAmount("");
    setConversion("");
    setOpen(true);
  };

  const handleSave = async () => {
    if (!customerId || !txId.trim() || !coin.trim() || !initialAmount || computedFinal === null) return;
    try {
      await create({
        customerId: customerId as Id<"customers">,
        txId: txId.trim(),
        type,
        isFirstDeposit: type === "deposit" ? isFirstDeposit : undefined,
        coin: coin.trim(),
        initialAmount: parseFloat(initialAmount),
        conversion: conversion ? parseFloat(conversion) : undefined,
        finalAmount: computedFinal,
        dateOfTransaction: Date.now(),
      });
      setOpen(false);
      toast.success("Transaction added");
    } catch {
      toast.error("Failed to add transaction");
    }
  };

  if (transactions === undefined || customers === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>Customer deposit and withdrawal records</CardDescription>
          </div>
          <Button size="sm" onClick={openAdd}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>TX ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Coin</TableHead>
                  <TableHead className="text-right">Initial</TableHead>
                  <TableHead className="text-right">Conversion</TableHead>
                  <TableHead className="text-right">Final</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-16">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => (
                  <TableRow key={t._id}>
                    <TableCell className="font-mono text-xs">{t.txId}</TableCell>
                    <TableCell className="font-medium">{t.customerUid}</TableCell>
                    <TableCell>
                      {t.type === "withdraw" ? (
                        <Badge variant="secondary">Withdraw</Badge>
                      ) : t.isFirstDeposit ? (
                        <Badge className="bg-red-500 hover:bg-red-600 text-white">1st Deposit</Badge>
                      ) : (
                        <Badge className="bg-green-600 hover:bg-green-700 text-white">Recharge</Badge>
                      )}
                    </TableCell>
                    <TableCell>{t.coin}</TableCell>
                    <TableCell className="text-right font-mono">{formatAmount(t.initialAmount)}</TableCell>
                    <TableCell className="text-right font-mono">
                      {t.conversion != null ? formatAmount(t.conversion) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono">{formatAmount(t.finalAmount)}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDate(t.dateOfTransaction)}
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove({ id: t._id }).then(() => toast.success("Deleted"))}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {transactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                      No transactions yet. Click Add to create one.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
            <DialogDescription>Record a new deposit or withdrawal.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>TX ID</Label>
              <Input value={txId} onChange={(e) => setTxId(e.target.value)} placeholder="Transaction ID" />
            </div>
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select value={customerId} onValueChange={(v) => setCustomerId(v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Select customer">{customers.find((c) => c._id === customerId)?.uid ?? "Select customer"}</SelectValue></SelectTrigger>
                <SelectContent>
                  {customers.map((c) => <SelectItem key={c._id} value={c._id}>{c.uid}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => { if (v) { setType(v as "deposit" | "withdraw"); if (v === "withdraw") setIsFirstDeposit(false); } }}>
                <SelectTrigger><SelectValue>{type === "deposit" ? "Deposit" : "Withdraw"}</SelectValue></SelectTrigger>
                <SelectContent>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="withdraw">Withdraw</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {type === "deposit" && (
              <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <input
                  type="checkbox"
                  id="firstDeposit"
                  checked={isFirstDeposit}
                  onChange={(e) => setIsFirstDeposit(e.target.checked)}
                  className="h-5 w-5 rounded border-red-300 accent-red-500"
                />
                <Label htmlFor="firstDeposit" className="cursor-pointer text-sm font-medium text-red-700">
                  This is a 1st Deposit (new customer)
                </Label>
              </div>
            )}
            <div className="space-y-2">
              <Label>Coin</Label>
              <Input value={coin} onChange={(e) => setCoin(e.target.value)} placeholder="e.g. BTC" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Initial Amount</Label>
                <Input type="number" value={initialAmount} onChange={(e) => setInitialAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Conversion Rate</Label>
                <Input type="number" value={conversion} onChange={(e) => setConversion(e.target.value)} placeholder="Optional" />
              </div>
              <div className="space-y-2">
                <Label>Final Amount</Label>
                <Input
                  type="text"
                  value={computedFinal !== null ? formatAmount(computedFinal) : ""}
                  readOnly
                  disabled
                  placeholder="Auto-calculated"
                  className="bg-muted"
                />
              </div>
            </div>
            {conversion && computedFinal !== null && (
              <p className="text-xs text-muted-foreground">
                {initialAmount} x {conversion} = {formatAmount(computedFinal)}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!customerId || !txId.trim() || !coin.trim() || !initialAmount || computedFinal === null}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
