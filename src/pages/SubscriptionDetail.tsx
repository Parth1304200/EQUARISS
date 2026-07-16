/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { db } from "../lib/firebase";
import { doc, updateDoc, collection, getDocs, query, where } from "firebase/firestore";
import { Loader2, ArrowLeft, Edit2, Play, Pause, Trash2, Calendar, Users, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export const SubscriptionDetail: React.FC = () => {
  const { currentRoute, subscriptions, groups, navigate } = useApp();
  const subId = currentRoute.params?.id;
  const sub = subscriptions.find(s => s.id === subId);

  const [historicalExpenses, setHistoricalExpenses] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!subId) return;

    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        // Query expenses across all groups that reference this subscriptionId
        const list: any[] = [];
        for (const g of groups) {
          const q = query(collection(db, `groups/${g.id}/expenses`), where("subscriptionId", "==", subId));
          const snap = await getDocs(q);
          snap.forEach(docSnap => {
            list.push({ ...docSnap.data(), groupName: g.name });
          });
        }
        // Sort history by date desc
        list.sort((a, b) => b.date.localeCompare(a.date));
        setHistoricalExpenses(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [subId, groups]);

  if (!sub) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
        <ShieldAlert className="size-8 text-destructive animate-pulse" />
        <h2 className="text-base font-bold uppercase tracking-wide">Subscription Not Found</h2>
        <Button onClick={() => navigate("/subscriptions")}>Back to Subscriptions</Button>
      </div>
    );
  }

  const group = sub.contextId ? groups.find(g => g.id === sub.contextId) : null;

  const toggleStatus = async () => {
    try {
      const newStatus = sub.status === "active" ? "paused" : "active";
      await updateDoc(doc(db, "subscriptions", sub.id), {
        status: newStatus
      });
      toast.success(`Subscription ${newStatus === "active" ? "resumed" : "paused"} successfully`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  const deleteSubscription = async () => {
    try {
      await updateDoc(doc(db, "subscriptions", sub.id), {
        status: "cancelled",
        cancelledAt: new Date().toISOString()
      });
      toast.success("Subscription cancelled");
      navigate("/subscriptions");
    } catch (err) {
      console.error(err);
      toast.error("Failed to cancel subscription");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 text-left">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/subscriptions")} className="cursor-pointer">
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex flex-col">
          <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Subscription Detail</span>
          <h1 className="font-heading text-xl font-black uppercase tracking-tight">{sub.name}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider font-mono text-muted-foreground">General Info</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4 border-b border-border pb-4">
              <div>
                <span className="font-mono text-[10px] text-muted-foreground uppercase font-bold">Amount</span>
                <p className="text-lg font-black text-foreground">₹{sub.amount} {sub.currency}</p>
              </div>
              <div>
                <span className="font-mono text-[10px] text-muted-foreground uppercase font-bold">Billing Cycle</span>
                <p className="text-sm font-semibold capitalize">{sub.billingCycle}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-b border-border pb-4">
              <div>
                <span className="font-mono text-[10px] text-muted-foreground uppercase font-bold">Next Renewal</span>
                <p className="text-sm font-semibold">{new Date(sub.nextRenewalDate).toLocaleDateString("en-IN")}</p>
              </div>
              <div>
                <span className="font-mono text-[10px] text-muted-foreground uppercase font-bold">Status</span>
                <p className="text-sm">
                  <Badge variant={sub.status === "active" ? "success" : sub.status === "paused" ? "outline" : "destructive"}>
                    {sub.status.toUpperCase()}
                  </Badge>
                </p>
              </div>
            </div>

            {sub.splitType !== "solo" && group && (
              <div className="border-b border-border pb-4">
                <span className="font-mono text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                  <Users className="size-3.5" /> Split Breakdown ({group.name})
                </span>
                <div className="flex flex-col gap-2 mt-2">
                  {group.members.map(mId => {
                    const shareAmt = sub.splitType === "equal" 
                      ? Math.round(sub.amount / group.members.length) 
                      : sub.splitMembers?.find(m => m.userId === mId)?.share || 0;
                    return (
                      <div key={mId} className="flex justify-between text-xs font-medium">
                        <span>{group.memberNames[mId] || "Member"}</span>
                        <span>₹{shareAmt}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {sub.notes && (
              <div>
                <span className="font-mono text-[10px] text-muted-foreground uppercase font-bold">Notes</span>
                <p className="text-xs mt-1 text-muted-foreground leading-relaxed">{sub.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Panel */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider font-mono text-muted-foreground">Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 cursor-pointer"
                >
                  {sub.status === "active" ? (
                    <>
                      <Pause className="size-4" /> Pause Billing
                    </>
                  ) : (
                    <>
                      <Play className="size-4" /> Resume Billing
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {sub.status === "active" ? "Pause subscription billing?" : "Resume subscription billing?"}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {sub.status === "active"
                      ? "This will pause automatic logging of this subscription into the ledger until resumed."
                      : "This will resume automatic logging of this subscription on its next billing renewal date."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel variant="outline" size="default">Go Back</AlertDialogCancel>
                  <AlertDialogAction onClick={toggleStatus}>
                    Confirm {sub.status === "active" ? "Pause" : "Resume"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trash2 className="size-4" /> Cancel Subscription
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will mark the subscription as cancelled and stop future auto-logged expenses. Past billing logs will remain intact.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel variant="outline" size="default">Go Back</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteSubscription} className="bg-destructive text-destructive-foreground">Confirm Cancel</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>

      {/* Billing history timeline */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider font-mono text-muted-foreground">Renewal Billing Logs</CardTitle>
          <CardDescription>Historical expenses logged by this subscription cycle</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="flex py-6 justify-center">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
          ) : historicalExpenses.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground font-mono">
              No historical charges logged yet.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {historicalExpenses.map((exp, idx) => (
                <div key={idx} className="flex justify-between items-center border-b border-border pb-3 last:border-b-0 last:pb-0">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold">{exp.title}</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">{exp.date} • Context: {exp.groupName}</span>
                  </div>
                  <span className="text-sm font-black text-foreground">₹{exp.amount}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
