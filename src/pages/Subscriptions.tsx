/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { db } from "../lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { 
  Calendar, 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  Users, 
  CreditCard, 
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Sparkles,
  Search
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Subscriptions: React.FC = () => {
  const { user, subscriptions, groups, navigate } = useApp();
  const [activeTab, setActiveTab] = useState<"solo" | "shared">("solo");
  const [searchQuery, setSearchQuery] = useState("");

  // Normalized monthly calculation
  const totalMonthlySpend = subscriptions
    .filter(s => s.status === "active")
    .reduce((sum, s) => {
      let monthlyAmount = s.amount;
      if (s.billingCycle === "weekly") {
        monthlyAmount = s.amount * 4.33;
      } else if (s.billingCycle === "quarterly") {
        monthlyAmount = s.amount / 3;
      } else if (s.billingCycle === "yearly") {
        monthlyAmount = s.amount / 12;
      } else if (s.billingCycle === "custom" && s.customCycleDays) {
        monthlyAmount = (s.amount / s.customCycleDays) * 30.4;
      }
      
      // If shared, calculate user's share
      if (s.splitType !== "solo" && s.splitMembers) {
        const myShare = s.splitMembers.find(m => m.userId === user?.uid)?.share || 0;
        if (s.splitType === "equal") {
          return sum + (s.amount / s.splitMembers.length);
        } else {
          // share is absolute amount or percentage
          return sum + myShare;
        }
      }
      return sum + monthlyAmount;
    }, 0);

  const renewingThisWeek = subscriptions.filter(s => {
    if (s.status !== "active") return false;
    const diffTime = new Date(s.nextRenewalDate).getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  });

  const renewingThisWeekCost = renewingThisWeek.reduce((sum, s) => {
    if (s.splitType !== "solo" && s.splitMembers) {
      if (s.splitType === "equal") {
        return sum + (s.amount / s.splitMembers.length);
      }
      return sum + (s.splitMembers.find(m => m.userId === user?.uid)?.share || 0);
    }
    return sum + s.amount;
  }, 0);

  const sharedCount = subscriptions.filter(s => s.splitType !== "solo").length;

  const toggleStatus = async (subId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "active" ? "paused" : "active";
      await updateDoc(doc(db, "subscriptions", subId), {
        status: newStatus
      });
      toast.success(`Subscription ${newStatus === "active" ? "activated" : "paused"} successfully`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to toggle subscription status");
    }
  };

  const cancelSubscription = async (subId: string) => {
    try {
      await updateDoc(doc(db, "subscriptions", subId), {
        status: "cancelled",
        cancelledAt: new Date().toISOString()
      });
      toast.success("Subscription marked as cancelled");
    } catch (err) {
      console.error(err);
      toast.error("Failed to cancel subscription");
    }
  };

  const getDaysRemaining = (dateStr: string) => {
    const diffTime = new Date(dateStr).getTime() - new Date().setHours(0, 0, 0, 0);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return { text: "renews today", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" };
    if (diffDays < 0) return { text: "overdue", color: "bg-destructive/10 text-destructive border-destructive/20" };
    if (diffDays === 1) return { text: "in 1 day", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" };
    if (diffDays <= 3) return { text: `in ${diffDays} days`, color: "bg-amber-500/10 text-amber-600 border-amber-500/20" };
    return { text: `in ${diffDays} days`, color: "bg-muted text-muted-foreground border-border" };
  };

  const filteredSubs = subscriptions
    .filter(s => {
      const matchesTab = activeTab === "solo" ? s.splitType === "solo" : s.splitType !== "solo";
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (s.provider && s.provider.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesTab && matchesSearch && s.status !== "cancelled";
    });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-border pb-6">
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">Automations</span>
          <h1 className="font-heading text-3xl font-black uppercase tracking-tight">Subscriptions</h1>
          <p className="text-sm text-muted-foreground">
            Track personal recurring services or split shared house/team utility bills automatically.
          </p>
        </div>

        <Button
          id="add-subscription-btn"
          onClick={() => navigate("/subscriptions/new")}
          className="flex items-center gap-2 rounded-lg font-mono text-xs uppercase tracking-wider cursor-pointer py-6"
        >
          <Plus className="size-4" />
          Add Subscription
        </Button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-[10px] uppercase font-bold text-muted-foreground">Your Monthly Share</CardDescription>
            <CardTitle className="text-3xl font-black font-sans">₹{Math.round(totalMonthlySpend).toLocaleString("en-IN")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Solo + split share of active subscriptions</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-[10px] uppercase font-bold text-muted-foreground">Renewing This Week</CardDescription>
            <CardTitle className="text-3xl font-black font-sans text-destructive">₹{Math.round(renewingThisWeekCost).toLocaleString("en-IN")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{renewingThisWeek.length} subscriptions renewal pending</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-[10px] uppercase font-bold text-muted-foreground">Shared Pools</CardDescription>
            <CardTitle className="text-3xl font-black font-sans text-success">
              {sharedCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Subscriptions split in group contexts</p>
          </CardContent>
        </Card>
      </div>

      {/* Tab Selectors & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div className="flex gap-2 bg-muted p-1 rounded-lg self-start">
          <button
            onClick={() => setActiveTab("solo")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === "solo" 
                ? "bg-card text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Solo/Personal
          </button>
          <button
            onClick={() => setActiveTab("shared")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === "shared" 
                ? "bg-card text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Shared Splits
          </button>
        </div>

        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search subscriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-input bg-card pl-9 pr-4 py-1.5 text-xs focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
          />
        </div>
      </div>

      {/* Subscription Grid/List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredSubs.map((s) => {
          const daysInfo = getDaysRemaining(s.nextRenewalDate);
          const groupName = s.contextId ? groups.find(g => g.id === s.contextId)?.name : null;

          return (
            <Card
              key={s.id}
              className={`group hover:border-accent border transition-all cursor-pointer bg-card`}
              onClick={() => navigate(`/subscriptions/[id]`, { id: s.id })}
            >
              <CardContent className="p-6 flex flex-col justify-between h-full gap-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center font-bold text-lg uppercase text-primary">
                      {s.provider ? s.provider.substring(0, 2) : s.name.substring(0, 2)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold tracking-tight leading-tight group-hover:text-primary transition-colors">{s.name}</span>
                      <span className="text-xs text-muted-foreground mt-1 capitalize">{s.category.toLowerCase()} • {s.billingCycle}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-base font-black text-foreground">₹{s.amount.toLocaleString("en-IN")}</span>
                    {s.splitType !== "solo" && (
                      <span className="text-[10px] font-mono text-success font-semibold">
                        Your share: ₹{s.splitType === "equal" ? Math.round(s.amount / (s.splitMembers?.length || 1)) : s.splitMembers?.find(m => m.userId === user?.uid)?.share || 0}
                      </span>
                    )}
                  </div>
                </div>

                {s.status === "trial" && s.trialEndsAt && (
                  <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 px-3 py-1.5 rounded-lg text-xs font-medium">
                    <AlertCircle className="size-4 shrink-0 text-yellow-600" />
                    Trial ends {new Date(s.trialEndsAt).toLocaleDateString("en-IN")}
                  </div>
                )}

                <div className="flex justify-between items-center border-t border-border pt-4 text-xs">
                  <span className={`px-2 py-0.5 border rounded-full text-[9px] font-mono font-bold uppercase tracking-wider ${daysInfo.color}`}>
                    {daysInfo.text}
                  </span>
                  
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button 
                      variant="ghost" 
                      size="icon-xs"
                      onClick={() => toggleStatus(s.id, s.status)}
                      title={s.status === "active" ? "Pause subscription" : "Resume subscription"}
                    >
                      {s.status === "active" ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon-xs"
                      onClick={() => cancelSubscription(s.id)}
                      className="text-destructive hover:bg-destructive/10"
                      title="Cancel Subscription"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                {s.splitType !== "solo" && groupName && (
                  <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                    <Users className="size-3" />
                    SPLITTING IN {groupName.toUpperCase()}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {filteredSubs.length === 0 && (
          <div className="col-span-full border-2 border-dashed border-border rounded-2xl p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3 bg-card">
            <Calendar className="size-8 text-muted-foreground" />
            <p className="text-xs font-mono font-bold max-w-sm">
              No subscriptions tracked yet. Tap "Add Subscription" to start tracking your recurring splits!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
