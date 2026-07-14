/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Group, Expense } from "../types";
import { calculateBalances, generateSettlementSuggestions } from "./settleEngine";

/**
 * Builds a COMPLETE, EXACT snapshot of the user's real wallet state.
 *
 * Every number here is computed deterministically from Firestore data using the
 * same engine that powers the UI. The AI assistant is only ever allowed to read
 * and narrate these values — it never performs arithmetic itself — which is what
 * prevents hallucinated / fake figures.
 */

const CATEGORY_LABELS: Record<string, string> = {
  rent: "Accommodation & Rent",
  food: "Dining & Food",
  travel: "Travel & Transport",
  entertainment: "Activities & Entertainment",
  healthcare: "Healthcare",
  others: "Others",
  settlement: "Settlement"
};

const labelFor = (key: string) =>
  CATEGORY_LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1);

const round2 = (n: number) => Math.round(n * 100) / 100;
const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export interface CategorySlice {
  category: string;
  label: string;
  amount: number;
  pct: number;
}

export interface DebtEdge {
  from: string;
  to: string;
  amount: number;
  group: string;
  involvesYou: boolean;
}

export interface GroupSnapshot {
  id: string;
  name: string;
  memberCount: number;
  members: string[];
  totalSpend: number;
  myPaid: number;
  myShare: number;
  myNet: number;
  myNetLabel: "you are owed" | "you owe" | "settled";
  categoryBreakdown: CategorySlice[];
  topExpenses: { title: string; amount: number; category: string; date: string; paidBy: string }[];
  whoOwesWhom: DebtEdge[];
  budget: {
    limit: number;
    spent: number;
    remaining: number;
    usedPct: number;
    level: "healthy" | "moderate" | "at risk" | "over budget";
  } | null;
}

export interface WalletSnapshot {
  currency: "INR";
  generatedAt: string;
  user: { name: string };
  overall: {
    totalSpendAllGroups: number;
    youOweTotal: number;
    youAreOwedTotal: number;
    netPosition: number;
    groupCount: number;
  };
  byCategory: CategorySlice[];
  whoOwesWhom: DebtEdge[];
  groups: GroupSnapshot[];
  /** Plain-language TRUE statements the assistant can quote verbatim. */
  facts: string[];
}

function categoryBreakdown(expenses: Expense[]): CategorySlice[] {
  const totals: Record<string, number> = {};
  let sum = 0;
  expenses.forEach((e) => {
    totals[e.category] = (totals[e.category] || 0) + (e.amount || 0);
    sum += e.amount || 0;
  });
  return Object.entries(totals)
    .map(([category, amount]) => ({
      category,
      label: labelFor(category),
      amount: round2(amount),
      pct: sum > 0 ? Math.round((amount / sum) * 100) : 0
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function buildWalletSnapshot(
  userUid: string,
  userName: string,
  groups: Group[],
  allExpenses: Expense[],
  generatedAt: string
): WalletSnapshot {
  const facts: string[] = [];
  const groupSnaps: GroupSnapshot[] = [];
  const consolidatedDebts: DebtEdge[] = [];

  let totalSpendAll = 0;
  let youOweTotal = 0;
  let youAreOwedTotal = 0;
  const allSpendExpenses: Expense[] = [];

  const nameIn = (g: Group, uid: string) =>
    uid === userUid ? "you" : g.memberNames?.[uid] || "a member";

  groups.forEach((g) => {
    const groupExpenses = allExpenses.filter((e) => e.groupId === g.id);
    const spendExpenses = groupExpenses.filter((e) => e.category !== "settlement");
    allSpendExpenses.push(...spendExpenses);

    const totalSpend = round2(spendExpenses.reduce((s, e) => s + (e.amount || 0), 0));
    totalSpendAll += totalSpend;

    // Balances include settlement offsets so already-paid debts drop out.
    const balances = calculateBalances(g.members, groupExpenses);
    const myNet = round2(balances[userUid] || 0);

    const myPaid = round2(
      spendExpenses.filter((e) => e.paidBy === userUid).reduce((s, e) => s + (e.amount || 0), 0)
    );
    const myShare = round2(
      spendExpenses.reduce((s, e) => {
        const mine = (e.splits || []).find((sp) => sp.uid === userUid);
        return s + (mine ? mine.amount : 0);
      }, 0)
    );

    const suggestions = generateSettlementSuggestions(g.id, balances);
    const groupDebts: DebtEdge[] = suggestions.map((s) => {
      const edge: DebtEdge = {
        from: nameIn(g, s.fromUid),
        to: nameIn(g, s.toUid),
        amount: round2(s.amount),
        group: g.name,
        involvesYou: s.fromUid === userUid || s.toUid === userUid
      };
      if (s.fromUid === userUid) youOweTotal += s.amount;
      if (s.toUid === userUid) youAreOwedTotal += s.amount;
      return edge;
    });
    consolidatedDebts.push(...groupDebts);

    const cats = categoryBreakdown(spendExpenses);

    const topExpenses = [...spendExpenses]
      .sort((a, b) => (b.amount || 0) - (a.amount || 0))
      .slice(0, 5)
      .map((e) => ({
        title: e.title,
        amount: round2(e.amount || 0),
        category: labelFor(e.category),
        date: e.date,
        paidBy: nameIn(g, e.paidBy)
      }));

    let budget: GroupSnapshot["budget"] = null;
    if (g.budget && g.budget > 0) {
      const usedPct = Math.round((totalSpend / g.budget) * 100);
      const remaining = round2(g.budget - totalSpend);
      const level =
        totalSpend > g.budget
          ? "over budget"
          : usedPct >= 85
            ? "at risk"
            : usedPct >= 60
              ? "moderate"
              : "healthy";
      budget = { limit: g.budget, spent: totalSpend, remaining, usedPct, level };
    }

    const myNetLabel = myNet > 0.01 ? "you are owed" : myNet < -0.01 ? "you owe" : "settled";

    groupSnaps.push({
      id: g.id,
      name: g.name,
      memberCount: g.members.length,
      members: g.members.map((uid) => (uid === userUid ? "you" : g.memberNames?.[uid] || uid)),
      totalSpend,
      myPaid,
      myShare,
      myNet,
      myNetLabel,
      categoryBreakdown: cats,
      topExpenses,
      whoOwesWhom: groupDebts,
      budget
    });

    // ---- Human-readable true facts (assistant can quote these) ----
    facts.push(
      `In "${g.name}", total group spend is ${inr(totalSpend)}. You paid ${inr(myPaid)} and your share of the bills is ${inr(myShare)}.`
    );
    if (myNetLabel === "you owe") {
      facts.push(`In "${g.name}", your net position is ${inr(Math.abs(myNet))} that YOU OWE.`);
    } else if (myNetLabel === "you are owed") {
      facts.push(`In "${g.name}", your net position is ${inr(myNet)} that YOU ARE OWED.`);
    } else {
      facts.push(`In "${g.name}", you are fully settled up.`);
    }
    groupDebts.forEach((d) => {
      facts.push(`In "${g.name}", ${d.from} owes ${d.to} ${inr(d.amount)}.`);
    });
    if (cats[0]) {
      facts.push(
        `In "${g.name}", the biggest spending category is ${cats[0].label} at ${inr(cats[0].amount)} (${cats[0].pct}% of the group's spend).`
      );
    }
    if (budget) {
      facts.push(
        `In "${g.name}", the budget is ${inr(budget.limit)}, spent ${inr(budget.spent)} (${budget.usedPct}% used), remaining ${inr(budget.remaining)} — status: ${budget.level}.`
      );
    }
  });

  const overallByCategory = categoryBreakdown(allSpendExpenses);
  youOweTotal = round2(youOweTotal);
  youAreOwedTotal = round2(youAreOwedTotal);
  totalSpendAll = round2(totalSpendAll);
  const netPosition = round2(youAreOwedTotal - youOweTotal);

  // Overall summary facts (placed first so they anchor the model).
  const summaryFacts: string[] = [];
  if (groups.length === 0) {
    summaryFacts.push("You have no groups and no expenses recorded yet. There is no financial data to report.");
  } else {
    summaryFacts.push(`You belong to ${groups.length} group(s). Total spend across all of them is ${inr(totalSpendAll)}.`);
    summaryFacts.push(
      `Across all groups combined, you owe a total of ${inr(youOweTotal)} and you are owed a total of ${inr(youAreOwedTotal)}. Your overall net position is ${
        netPosition >= 0 ? `${inr(netPosition)} in your favour` : `${inr(Math.abs(netPosition))} that you owe`
      }.`
    );
    if (overallByCategory[0]) {
      summaryFacts.push(
        `Across everything, your largest category is ${overallByCategory[0].label} at ${inr(overallByCategory[0].amount)} (${overallByCategory[0].pct}%).`
      );
    }
  }

  return {
    currency: "INR",
    generatedAt,
    user: { name: userName || "you" },
    overall: {
      totalSpendAllGroups: totalSpendAll,
      youOweTotal,
      youAreOwedTotal,
      netPosition,
      groupCount: groups.length
    },
    byCategory: overallByCategory,
    whoOwesWhom: consolidatedDebts,
    groups: groupSnaps,
    facts: [...summaryFacts, ...facts]
  };
}
