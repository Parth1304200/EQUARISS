/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import { useApp } from "../context/AppContext";
import { Sparkles, PieChart } from "lucide-react";

// Human-friendly labels for raw expense category keys.
const CATEGORY_LABELS: Record<string, string> = {
  rent: "Accommodation & Rent 🏠",
  food: "Dining & Food 🍛",
  travel: "Travel & Transport ⛽",
  entertainment: "Activities & Entertainment 🎟️",
  healthcare: "Healthcare 🩺",
  others: "Others 🧾"
};

const BAR_COLORS = ["bg-gray-900", "bg-gray-600", "bg-neutral-400", "bg-gray-300", "bg-gray-200"];

const labelFor = (key: string) =>
  CATEGORY_LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1);

export const Reports: React.FC = () => {
  const { groups, allExpenses } = useApp();

  // Only real, non-settlement spend feeds the analytics.
  const spendExpenses = useMemo(
    () => allExpenses.filter((e) => e.category !== "settlement"),
    [allExpenses]
  );

  const totalSpent = useMemo(
    () => spendExpenses.reduce((sum, e) => sum + (e.amount || 0), 0),
    [spendExpenses]
  );

  const categoryList = useMemo(() => {
    const totals: Record<string, number> = {};
    spendExpenses.forEach((e) => {
      totals[e.category] = (totals[e.category] || 0) + (e.amount || 0);
    });
    return Object.entries(totals)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [spendExpenses]);

  const maxAmt = categoryList[0]?.amount || 1;

  const totalBudget = useMemo(
    () => groups.reduce((sum, g) => sum + (g.budget || 0), 0),
    [groups]
  );

  // Budget Health: how much of the combined group budget is still available.
  // Null when no budgets are configured (we don't invent a score).
  const health = useMemo(() => {
    if (totalBudget <= 0) return null;
    const used = totalSpent / totalBudget;
    const score = Math.max(0, Math.min(100, Math.round((1 - used) * 100)));
    let status: string;
    let caption: string;
    if (score >= 70) {
      status = "HEALTHY";
      caption = "Excellent Spend Discipline";
    } else if (score >= 40) {
      status = "MODERATE";
      caption = "Watch Your Pace";
    } else {
      status = "AT RISK";
      caption = "Budget Nearly Exhausted";
    }
    return { score, status, caption, usedPct: Math.round(used * 100) };
  }, [totalBudget, totalSpent]);

  const topCategory = categoryList[0]
    ? { label: labelFor(categoryList[0].category), pct: Math.round((categoryList[0].amount / totalSpent) * 100) }
    : null;

  const hasData = spendExpenses.length > 0;

  return (
    <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 py-10 flex flex-col gap-8">

      {/* Header section */}
      <div className="flex flex-col gap-1.5 border-b border-gray-100 pb-6">
        <span className="text-xs font-semibold text-gray-400 font-mono tracking-widest uppercase">Analytics</span>
        <h1 className="font-sans font-black text-3xl tracking-tight text-gray-900 leading-tight">Insight Reports</h1>
        <p className="text-sm text-gray-500">
          Analyze trip budgets, category spending patterns, and witty budget health parameters.
        </p>
      </div>

      {!hasData ? (
        <div className="bg-white border-2 border-dashed border-gray-150 rounded-2xl p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
          <PieChart className="w-10 h-10 text-gray-300" />
          <h3 className="font-bold text-gray-800 text-sm">No Spending Data Yet</h3>
          <p className="text-xs max-w-sm">
            Reports are generated from the expenses you log inside your groups. Add a few spends and your category breakdown and budget health will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Category summary */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-6 shadow-3xs">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-mono tracking-widest text-[#9CA3AF] uppercase">Group Category Spends</span>
              <h3 className="text-sm font-bold text-gray-900">Total Bill Distribution Breakdown</h3>
            </div>

            <div className="flex flex-col gap-4 mt-2">
              {categoryList.map((item, idx) => {
                const ratio = (item.amount / maxAmt) * 100;
                return (
                  <div key={item.category} className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs font-semibold text-gray-700">
                      <span className="flex items-center gap-1.5">{labelFor(item.category)}</span>
                      <span className="font-mono text-gray-500">₹{item.amount.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-55/70 border border-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${BAR_COLORS[idx % BAR_COLORS.length]} transition-all duration-500`}
                        style={{ width: `${ratio}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Budget metrics card */}
          <div className="flex flex-col gap-6">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
              Budget Health Score
            </h3>

            <div className="bg-black text-[#fafafa] border border-black rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10"></div>

              {health ? (
                <>
                  <div className="flex justify-between items-center text-xs text-neutral-400 font-mono">
                    <span>SCORE</span>
                    <span className={`px-2 py-0.5 border rounded-full text-[10px] ${
                      health.score >= 70
                        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/10"
                        : health.score >= 40
                          ? "text-amber-400 bg-amber-500/10 border-amber-500/10"
                          : "text-red-400 bg-red-500/10 border-red-500/10"
                    }`}>{health.status}</span>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <h2 className="text-4xl font-black font-serif leading-none text-white">{health.score}%</h2>
                    <span className="text-[11px] text-[#A3A3A3] font-mono leading-none mt-1">{health.caption}</span>
                  </div>

                  <p className="text-xs text-[#A3A3A3] leading-relaxed mt-2.5 border-t border-white/10 pt-4 font-medium">
                    You have spent ₹{totalSpent.toLocaleString("en-IN")} of your ₹{totalBudget.toLocaleString("en-IN")} combined budget ({health.usedPct}% used).
                    {topCategory && ` ${topCategory.label} is your largest category at ${topCategory.pct}% of tracked spend.`}
                  </p>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center text-xs text-neutral-400 font-mono">
                    <span>SCORE</span>
                    <span className="text-neutral-300 bg-white/10 px-2 py-0.5 border border-white/10 rounded-full text-[10px]">NO BUDGET</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <h2 className="text-4xl font-black font-serif leading-none text-white">₹{totalSpent.toLocaleString("en-IN")}</h2>
                    <span className="text-[11px] text-[#A3A3A3] font-mono leading-none mt-1">Total tracked spend</span>
                  </div>
                  <p className="text-xs text-[#A3A3A3] leading-relaxed mt-2.5 border-t border-white/10 pt-4 font-medium">
                    Set a budget on your group{groups.length > 1 ? "s" : ""} to unlock a live budget health score.
                    {topCategory && ` So far, ${topCategory.label} is your largest category at ${topCategory.pct}% of spend.`}
                  </p>
                </>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
