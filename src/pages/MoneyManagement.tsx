/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import { useApp } from "../context/AppContext";
import { calculateBalances } from "../lib/settleEngine";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, DollarSign, Wallet, ArrowUpRight, ArrowDownRight, Layers } from "lucide-react";
import { toast } from "sonner";

export const MoneyManagement: React.FC = () => {
  const { user, groups, allExpenses } = useApp();

  const currentMonthExpenses = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `${currentYear}-${currentMonth}`;
    return allExpenses.filter(e => e.date.startsWith(prefix) && e.category !== "settlement");
  }, [allExpenses]);

  const totalSpentThisMonth = useMemo(() => {
    return currentMonthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [currentMonthExpenses]);

  // Net global outstanding balances
  const { youOwe, youAreOwed } = useMemo(() => {
    let owe = 0;
    let owed = 0;
    if (user) {
      groups.forEach((g) => {
        if (g.status === "ended") return;
        const groupExpenses = allExpenses.filter((e) => e.groupId === g.id);
        if (groupExpenses.length === 0) return;
        const balances = calculateBalances(g.members, groupExpenses);
        const net = balances[user.uid] || 0;
        if (net < -0.01) owe += Math.abs(net);
        else if (net > 0.01) owed += net;
      });
    }
    return {
      youOwe: Math.round(owe * 100) / 100,
      youAreOwed: Math.round(owed * 100) / 100,
    };
  }, [user, groups, allExpenses]);

  // Category Breakdown for the current month
  const categoryBreakdown = useMemo(() => {
    const totals: Record<string, number> = {};
    currentMonthExpenses.forEach(e => {
      const cat = e.category || "Other";
      totals[cat] = (totals[cat] || 0) + (e.amount || 0);
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [currentMonthExpenses]);

  // Export all expenses to CSV
  const exportToCSV = () => {
    try {
      if (allExpenses.length === 0) {
        toast.info("No expenses found to export");
        return;
      }

      const headers = ["ID", "Title", "Amount", "PaidBy", "Category", "Date", "Notes", "SplitType"];
      const rows = allExpenses.map(e => [
        e.id,
        `"${e.title.replace(/"/g, '""')}"`,
        e.amount,
        e.paidBy,
        e.category,
        e.date,
        e.notes ? `"${e.notes.replace(/"/g, '""')}"` : "",
        e.splitType
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `equaris_ledger_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV Statement exported successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export statement");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-border pb-6">
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">Reports</span>
          <h1 className="font-heading text-3xl font-black uppercase tracking-tight">Money Management</h1>
          <p className="text-sm text-muted-foreground">
            Analyze consolidated cash flows, budget statuses, and categorization across all Context pools.
          </p>
        </div>

        <Button
          onClick={exportToCSV}
          className="flex items-center gap-2 rounded-lg font-mono text-xs uppercase tracking-wider cursor-pointer py-6"
        >
          <Download className="size-4" />
          Export Statement
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-[10px] uppercase font-bold text-muted-foreground">Monthly Flow</CardDescription>
            <CardTitle className="text-3xl font-black font-sans">₹{Math.round(totalSpentThisMonth).toLocaleString("en-IN")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Consolidated spend for current month</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-[10px] uppercase font-bold text-muted-foreground">Net Owed</CardDescription>
            <CardTitle className="text-3xl font-black font-sans text-destructive">₹{Math.round(youOwe).toLocaleString("en-IN")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Amount you need to settle up with peers</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-[10px] uppercase font-bold text-muted-foreground">Net Owed to You</CardDescription>
            <CardTitle className="text-3xl font-black font-sans text-success">₹{Math.round(youAreOwed).toLocaleString("en-IN")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Amount peers owe to you globally</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider font-mono text-muted-foreground">Spend Category Breakdown</CardTitle>
            <CardDescription>All context expenditures for the current billing cycle</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {categoryBreakdown.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground font-mono">
                No transactions tracked this month.
              </div>
            ) : (
              categoryBreakdown.map(([cat, amt]) => {
                const percentage = Math.round((amt / (totalSpentThisMonth || 1)) * 100);
                return (
                  <div key={cat} className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="capitalize">{cat}</span>
                      <span>₹{amt.toLocaleString("en-IN")} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-primary h-full transition-all duration-500 ease-out" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider font-mono text-muted-foreground">Context Distribution</CardTitle>
            <CardDescription>Share of money pool distribution among active groups</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {groups.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground font-mono">
                No active contexts found.
              </div>
            ) : (
              groups.map(g => {
                const groupSpend = allExpenses
                  .filter(e => e.groupId === g.id && e.category !== "settlement")
                  .reduce((sum, e) => sum + (e.amount || 0), 0);
                const percent = totalSpentThisMonth > 0 ? Math.round((groupSpend / totalSpentThisMonth) * 100) : 0;

                return (
                  <div key={g.id} className="flex justify-between items-center border-b border-border pb-3 last:border-b-0 last:pb-0 text-xs">
                    <div className="flex items-center gap-2">
                      <Layers className="size-4 text-primary" />
                      <span className="font-semibold">{g.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-muted-foreground">₹{groupSpend.toLocaleString("en-IN")}</span>
                      <span className="px-2 py-0.5 bg-muted text-[10px] font-mono rounded font-bold">{percent}%</span>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
