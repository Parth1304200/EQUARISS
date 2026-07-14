/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { calculateBalances } from "../lib/settleEngine";
import {
  IndianRupee,
  Sparkles,
  ArrowRight,
  Users,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  Zap
} from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPiggyBank,
  faArrowTrendUp,
  faArrowTrendDown,
  faHouse,
  faTicket,
  faUtensils,
  faGasPump,
  faHeartPulse,
  faReceipt
} from "@fortawesome/free-solid-svg-icons";

// Human-friendly labels + icons for the raw category keys used on expenses.
const CATEGORY_META: Record<string, { label: string; faIcon: any }> = {
  rent: { label: "Accommodation & Rent", faIcon: faHouse },
  food: { label: "Dining & Food", faIcon: faUtensils },
  travel: { label: "Travel & Transport", faIcon: faGasPump },
  entertainment: { label: "Activities & Entertainment", faIcon: faTicket },
  healthcare: { label: "Healthcare", faIcon: faHeartPulse },
  others: { label: "Others", faIcon: faReceipt }
};

const catMeta = (key: string) =>
  CATEGORY_META[key] || { label: key.charAt(0).toUpperCase() + key.slice(1), faIcon: faReceipt };

const BAR_COLORS = ["bg-cyan-500", "bg-slate-500", "bg-slate-700", "bg-gray-400", "bg-gray-300"];

export const Dashboard: React.FC = () => {
  const { user, profile, groups, allExpenses, navigate, theme } = useApp();

  // Gemini state
  const [aiInsights, setAiInsights] = useState<{ type: string; title: string; message: string }[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // --- Real, computed metrics (settlement offset entries excluded from "spend") ---
  const spendExpenses = useMemo(
    () => allExpenses.filter((e) => e.category !== "settlement"),
    [allExpenses]
  );

  const totalSpent = useMemo(
    () => spendExpenses.reduce((sum, e) => sum + (e.amount || 0), 0),
    [spendExpenses]
  );

  // Net balance of the current user across all groups (includes settlement offsets).
  const { youOwe, youAreOwed } = useMemo(() => {
    let owe = 0;
    let owed = 0;
    if (user) {
      groups.forEach((g) => {
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
      youAreOwed: Math.round(owed * 100) / 100
    };
  }, [user, groups, allExpenses]);

  // Category distribution across all real spend.
  const categoryList = useMemo(() => {
    const totals: Record<string, number> = {};
    spendExpenses.forEach((e) => {
      totals[e.category] = (totals[e.category] || 0) + (e.amount || 0);
    });
    return Object.entries(totals)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [spendExpenses]);

  // Fetch server-side Gemini insights from REAL expenses only.
  const loadAInsights = async () => {
    if (spendExpenses.length === 0) return;
    setLoadingInsights(true);
    try {
      const mergedNames: Record<string, string> = {};
      groups.forEach((g) => Object.assign(mergedNames, g.memberNames || {}));
      const res = await fetch("/api/gemini/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expenses: spendExpenses.map((e) => ({
            title: e.title,
            amount: e.amount,
            category: e.category
          })),
          budget: groups.reduce((sum, g) => sum + (g.budget || 0), 0),
          memberNames: mergedNames
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiInsights(data);
      }
    } catch (err) {
      console.error("Failed to fetch Gemini insights:", err);
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    if (spendExpenses.length > 0) {
      loadAInsights();
    } else {
      setAiInsights([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spendExpenses.length]);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-10">

      {/* Hero Welcome banner */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b pb-8 ${
        theme === "dark" ? "border-white/5" : "border-gray-100"
      }`}>
        <div className="flex flex-col gap-1.5 text-left">
          <span className="text-xs font-semibold text-gray-400 font-mono tracking-widest uppercase">Overview</span>
          <h1 className={`font-sans font-black text-3.5xl tracking-tight leading-tight uppercase ${
            theme === "dark" ? "text-white" : "text-slate-900"
          }`}>
            Hi, {profile?.nickname || profile?.name?.split(" ")[0] || "there"}
          </h1>
          <p className="text-sm text-gray-500 leading-normal max-w-lg">
            Track clearly, split fairly, and settle up on the screen in seconds. No awkward reminders. Only good times.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            id="explore-network-banner-btn"
            onClick={() => navigate("/network")}
            className={`flex items-center gap-2 py-3 px-5 border text-xs font-bold leading-none uppercase font-mono tracking-wider rounded-xl cursor-pointer ${
              theme === "dark"
                ? "border-cyan-500/20 bg-cyan-500/5 text-cyan-400 hover:bg-cyan-500/10"
                : "border-slate-200 bg-white hover:bg-slate-50 text-slate-800"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Manage Network</span>
          </button>
        </div>
      </div>

      {/* Empty State — no fake data, just a real CTA to create the first group */}
      {groups.length === 0 && (
        <div className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center text-center gap-5 ${
          theme === "dark" ? "border-white/10 bg-slate-900/10" : "border-gray-200 bg-white"
        }`}>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${
            theme === "dark" ? "bg-slate-950 border-white/5" : "bg-gray-50 border-gray-100"
          }`}>
            <Layers className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className={`text-base font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>No Active Balance Groups</h3>
            <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
              Create your first group to start tracking shared expenses. Everything on your dashboard is built from the spends you and your group members log — nothing is pre-filled.
            </p>
          </div>
          <button
            id="create-first-group-btn"
            onClick={() => navigate("/groups")}
            className={`py-3 px-6 font-bold font-mono text-xs tracking-wider uppercase rounded-xl transition-all cursor-pointer shadow-sm ${
              theme === "dark"
                ? "bg-cyan-500 text-black hover:bg-cyan-400"
                : "bg-black text-white hover:bg-slate-900"
            }`}
          >
            Create a Group
          </button>
        </div>
      )}

      {/* Bento Stats Panels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">

        {/* Total spent card */}
        <div className={`border rounded-2xl p-6 flex flex-col gap-4 shadow-3xs transition-colors ${
          theme === "dark" ? "bg-slate-900/60 border-white/5" : "bg-white border-slate-200/80 hover:border-gray-300"
        }`}>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono tracking-widest text-gray-400 uppercase font-bold flex items-center gap-1.5">
              Total group spend
              <FontAwesomeIcon icon={faPiggyBank} className="text-cyan-400 text-xs" />
            </span>
            <div className={`p-2 border rounded-lg text-gray-700 dark:text-cyan-400 ${
              theme === "dark" ? "bg-slate-950 border-white/5" : "bg-gray-50 border-gray-100"
            }`}>
              <IndianRupee className="w-4 h-4 text-inherit" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-3.5xl font-black tracking-tight leading-none">
              ₹{totalSpent.toLocaleString("en-IN")}
            </h2>
            <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider mt-1">Aggregated across active pools</p>
          </div>
        </div>

        {/* Owes details card */}
        <div className={`border rounded-2xl p-6 flex flex-col gap-4 shadow-3xs transition-colors ${
          theme === "dark" ? "bg-slate-900/60 border-white/5" : "bg-white border-slate-200/80 hover:border-gray-300"
        }`}>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono tracking-widest text-red-400 uppercase font-bold flex items-center gap-1.5">
              You owe
              <FontAwesomeIcon icon={faArrowTrendDown} className="text-red-500 text-xs" />
            </span>
            <div className={`p-2 border rounded-lg text-red-500 ${
              theme === "dark" ? "bg-slate-950 border-white/5" : "bg-red-50/50 border-red-50"
            }`}>
              <ArrowDownLeft className="w-4 h-4 text-inherit" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-3.5xl font-black tracking-tight text-red-600 dark:text-red-500 leading-none">
              ₹{youOwe.toLocaleString("en-IN")}
            </h2>
            <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider mt-1">Total outstanding bills</p>
          </div>
        </div>

        {/* Back repo details card */}
        <div className={`border rounded-2xl p-6 flex flex-col gap-4 shadow-3xs transition-colors ${
          theme === "dark" ? "bg-slate-900/60 border-white/5" : "bg-white border-slate-200/80 hover:border-gray-300"
        }`}>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase font-bold flex items-center gap-1.5">
              You are owed
              <FontAwesomeIcon icon={faArrowTrendUp} className="text-emerald-400 text-xs" />
            </span>
            <div className={`p-2 border rounded-lg text-emerald-600 dark:text-emerald-400 ${
              theme === "dark" ? "bg-slate-950 border-white/5" : "bg-emerald-50 border-emerald-100"
            }`}>
              <ArrowUpRight className="w-4 h-4 text-inherit" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-3.5xl font-black tracking-tight text-emerald-600 dark:text-emerald-400 leading-none">
              ₹{youAreOwed.toLocaleString("en-IN")}
            </h2>
            <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider mt-1">Reimbursement suggestions</p>
          </div>
        </div>

      </div>

      {groups.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* List of active groups (left part) */}
          <div className="lg:col-span-2 flex flex-col gap-6 text-left">
            <div className="flex justify-between items-center">
              <h3 className="font-sans font-black text-sm tracking-wider uppercase text-gray-400">Active Dispute Pools</h3>
              <button
                onClick={() => navigate("/groups")}
                className="text-xs text-gray-400 hover:text-black dark:hover:text-cyan-400 font-semibold flex items-center gap-1 cursor-pointer font-mono"
              >
                <span>[ ALL GROUPS ]</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {groups.map((group) => (
                <div
                  key={group.id}
                  onClick={() => navigate("/groups/[id]", { id: group.id })}
                  className={`border rounded-xl p-5 transition-all cursor-pointer flex items-center justify-between group shadow-3xs ${
                    theme === "dark"
                      ? "bg-slate-900/60 border-white/5 hover:border-cyan-500/20"
                      : "bg-white border-slate-150 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-lg flex items-center justify-center font-black text-lg ${
                      theme === "dark" ? "bg-slate-950 text-white border border-white/5" : "bg-gray-50 border border-gray-150 text-gray-700"
                    }`}>
                      {group.name[0]}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <h4 className="text-sm font-bold tracking-tight leading-tight group-hover:text-cyan-400 transition-colors">{group.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          {group.members.length} members
                        </span>
                        <span>•</span>
                        <span>Limit: ₹{group.budget?.toLocaleString("en-IN") || "Unlimited"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-gray-400 group-hover:text-cyan-400 transition-all">[ OPEN ]</span>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>

            {/* Real category distribution */}
            <div className={`border rounded-2xl p-6 flex flex-col gap-5 mt-2 ${
              theme === "dark" ? "bg-slate-900/60 border-white/5" : "bg-white border-slate-200/80"
            }`}>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono tracking-widest text-gray-400 uppercase font-bold">Category Analytics</span>
                <h4 className="text-sm font-bold truncate">Overall Expense Distribution</h4>
              </div>

              {categoryList.length === 0 ? (
                <p className="text-xs text-gray-400 font-mono py-4 text-center">
                  No expenses logged yet. Add spends inside a group to see the breakdown here.
                </p>
              ) : (
                <div className="flex flex-col gap-4 mt-2">
                  {categoryList.map((item, idx) => {
                    const meta = catMeta(item.category);
                    const pct = totalSpent > 0 ? Math.round((item.amount / totalSpent) * 100) : 0;
                    return (
                      <div key={item.category} className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold flex items-center gap-1.5">
                            <FontAwesomeIcon icon={meta.faIcon} className="text-[10px] text-gray-400 dark:text-cyan-400 shrink-0" />
                            <span>{meta.label}</span>
                          </span>
                          <span className="text-gray-400 font-mono font-bold">₹{item.amount.toLocaleString("en-IN")} ({pct}%)</span>
                        </div>
                        <div className={`w-full h-2 rounded-full overflow-hidden ${
                          theme === "dark" ? "bg-slate-950 border border-white/5" : "bg-gray-50 border-gray-100"
                        }`}>
                          <div className={`h-full rounded-full ${BAR_COLORS[idx % BAR_COLORS.length]}`} style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar: Intelligent Gemini Insights card */}
          <div className="flex flex-col gap-6 text-left">
            <div className="flex items-center gap-2 font-bold text-sm tracking-wider uppercase text-gray-400">
              <Sparkles className="w-4 h-4 text-gray-800 dark:text-cyan-400 animate-pulse shrink-0" />
              <span>Gemini AI Engine</span>
            </div>

            {/* Smart card style */}
            <div className="bg-slate-950 text-[#fafafa] border border-white/5 rounded-2xl p-6 flex flex-col gap-5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10"></div>

              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-emerald-300" />
                  </div>
                  <span className="text-xs font-mono font-bold tracking-widest text-[#9CA3AF] uppercase">Audit Comments</span>
                </div>
                <span className="text-[10px] font-mono select-none px-2 py-0.5 border border-emerald-500/20 text-emerald-400 bg-emerald-500/10 rounded-full font-bold">LIVE</span>
              </div>

              {loadingInsights ? (
                <div className="flex flex-col gap-3 py-6 items-center justify-center text-center">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span className="text-xs text-[#9CA3AF] font-mono">Running neural spend audit...</span>
                </div>
              ) : aiInsights.length > 0 ? (
                <div className="flex flex-col gap-5">
                  {aiInsights.map((insight, idx) => (
                    <div key={idx} className="flex gap-3 items-start border-l border-white/10 pl-3">
                      <div className="flex flex-col gap-1">
                        <h4 className="text-xs font-bold text-white tracking-tight flex items-center gap-1">
                          {insight.type === "warning" && "⚠️ "}
                          {insight.type === "budget" && "💰 "}
                          {insight.type === "tip" && "💡 "}
                          {insight.type === "chill" && "🌴 "}
                          {insight.title}
                        </h4>
                        <p className="text-xs text-[#9CA3AF] leading-relaxed font-semibold">
                          {insight.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3 text-center py-6">
                  <p className="text-xs text-[#9CA3AF] font-semibold leading-relaxed">
                    {spendExpenses.length === 0
                      ? "Log some group expenses and the AI will audit your spending patterns here."
                      : "No insights yet. Recalculate to run an audit on your logged spends."}
                  </p>
                  {spendExpenses.length > 0 && (
                    <button
                      onClick={loadAInsights}
                      className="text-[10px] text-cyan-400 underline hover:text-cyan-300 font-bold cursor-pointer font-mono"
                    >
                      [ RECALCULATE AUDIT FEED ]
                    </button>
                  )}
                </div>
              )}

              <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                <span className="text-[10px] text-slate-400 font-mono">
                  Slogan: "Track, Split, Settle. Done."
                </span>
              </div>
            </div>

            {/* UPI QR Prompt Banner */}
            <div className={`border rounded-xl p-5 flex flex-col gap-3 ${
              theme === "dark" ? "bg-emerald-500/5 border-emerald-500/10 text-white" : "bg-emerald-50/50 border-emerald-100"
            }`}>
              <h4 className="text-xs font-black uppercase tracking-tight flex items-center gap-1.5 font-mono">
                <Zap className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Peer repayments simplified</span>
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Connect your UPI address in settings. Friends can repay you by scanning real-time generated BHIM QR codes inside active group sheets!
              </p>
              <button
                id="view-payments-hero-btn"
                onClick={() => navigate("/settlements")}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 self-start mt-1 cursor-pointer font-mono"
              >
                <span>[ GOTO SETTLEMENT CENTER ]</span>
                <ArrowRight className="w-3" />
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
