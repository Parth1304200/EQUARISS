/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { db } from "../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { dbSetDoc } from "../lib/firestoreQuery";
import { ArrowLeft, ArrowRight, Check, Calendar, Info, Users, CreditCard, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const PROVIDER_PRESETS = [
  "Netflix", "Spotify", "YouTube Premium", "Prime Video", "Hotstar", 
  "Apple Music", "iCloud", "Google One", "Adobe CC", "ChatGPT Plus", 
  "Claude Pro", "Notion", "Github Copilot"
];

const CATEGORIES = [
  "OTT", "Music", "Software", "Cloud/Storage", "Utilities", "Fitness", "News/Reading", "Other"
];

export const AddSubscription: React.FC = () => {
  const { user, profile, groups, navigate } = useApp();
  const [step, setStep] = useState(1);

  // Form State
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [category, setCategory] = useState("OTT");
  
  const [billingCycle, setBillingCycle] = useState<"weekly" | "monthly" | "quarterly" | "yearly" | "custom">("monthly");
  const [customCycleDays, setCustomCycleDays] = useState("");
  const [nextRenewalDate, setNextRenewalDate] = useState(new Date().toISOString().split("T")[0]);
  const [isTrial, setIsTrial] = useState(false);
  const [trialEndsAt, setTrialEndsAt] = useState("");

  const [splitType, setSplitType] = useState<"solo" | "equal" | "weighted" | "exact">("solo");
  const [directSplitMode, setDirectSplitMode] = useState<"group" | "friends">("group");
  const [selectedContextId, setSelectedContextId] = useState("");
  const [splitMembers, setSplitMembers] = useState<Array<{ userId: string; share: number; name: string }>>([]);

  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<any[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  const [reminderDaysBefore, setReminderDaysBefore] = useState("3");
  const [autoLogExpense, setAutoLogExpense] = useState(false);
  const [notes, setNotes] = useState("");

  // Load verified friends
  useEffect(() => {
    if (!profile) return;
    const loadFriends = async () => {
      setLoadingFriends(true);
      try {
        const list: any[] = [];
        const q = collection(db, "users");
        const snap = await getDocs(q);
        const friendsUids = profile.friends || [];
        
        snap.forEach((docSnap) => {
          const uData = docSnap.data();
          if (friendsUids.includes(uData.uid)) {
            list.push(uData);
          }
        });
        setFriendsList(list);
      } catch (err) {
        console.error("Error loading eligible friends for groups:", err);
      } finally {
        setLoadingFriends(false);
      }
    };
    loadFriends();
  }, [profile]);

  // Update Split Members when splitType is Shared and Context/Friends are selected
  useEffect(() => {
    if (!user) return;
    if (splitType === "solo") {
      setAutoLogExpense(false);
      return;
    }
    setAutoLogExpense(true); // default on for shared
    if (directSplitMode === "group") {
      if (selectedContextId) {
        const activeCtx = groups.find(g => g.id === selectedContextId);
        if (activeCtx) {
          const membersList = activeCtx.members.map(mId => ({
            userId: mId,
            share: 0,
            name: activeCtx.memberNames[mId] || "Member"
          }));
          setSplitMembers(membersList);
        }
      }
    } else {
      const membersList = [
        { userId: user.uid, share: 0, name: profile?.name || "Me" },
        ...selectedFriends.map(f => ({
          userId: f.uid,
          share: 0,
          name: f.name
        }))
      ];
      setSplitMembers(membersList);
    }
  }, [splitType, directSplitMode, selectedContextId, selectedFriends, groups, user, profile]);

  const handlePresetSelect = (presetName: string) => {
    setProvider(presetName);
    setName(presetName);
    if (["Netflix", "Prime Video", "Hotstar", "YouTube Premium"].includes(presetName)) {
      setCategory("OTT");
    } else if (["Spotify", "Apple Music"].includes(presetName)) {
      setCategory("Music");
    } else if (["ChatGPT Plus", "Claude Pro", "Adobe CC", "Github Copilot"].includes(presetName)) {
      setCategory("Software");
    } else if (["iCloud", "Google One"].includes(presetName)) {
      setCategory("Cloud/Storage");
    } else if (["Notion"].includes(presetName)) {
      setCategory("Other");
    }
  };

  const handleMemberShareChange = (userId: string, val: string) => {
    setSplitMembers(prev => prev.map(m => m.userId === userId ? { ...m, share: Number(val) } : m));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!name.trim() || !amount || !nextRenewalDate) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      let contextIdToUse = selectedContextId;
      if (splitType !== "solo" && directSplitMode === "friends") {
        if (selectedFriends.length === 0) {
          toast.error("Please select at least one connection to split with");
          return;
        }
        // Create an ad-hoc group for this split!
        const newGroupId = `group_${Date.now()}`;
        const friendUids = selectedFriends.map(f => f.uid);
        const memberUids = [user.uid, ...friendUids];
        const namesRecord: Record<string, string> = {
          [user.uid]: profile?.name || "Me",
        };
        selectedFriends.forEach(f => {
          namesRecord[f.uid] = f.name;
        });

        const newGroupData = {
          id: newGroupId,
          name: `Split: ${name}`,
          description: `Group automatically created for subscription split: ${name}`,
          createdBy: user.uid,
          members: memberUids,
          memberNames: namesRecord,
          budget: Number(amount),
          category: "others",
          type: "group" as const,
          currency,
          status: "active",
          createdAt: new Date().toISOString()
        };

        await dbSetDoc("groups", newGroupId, newGroupData);
        contextIdToUse = newGroupId;
      }

      const subId = `sub_${Date.now()}`;
      const subscriptionData = {
        id: subId,
        ownerId: user.uid,
        name: name.trim(),
        provider: provider.trim() || null,
        amount: Number(amount),
        currency,
        billingCycle,
        customCycleDays: billingCycle === "custom" ? Number(customCycleDays) : null,
        nextRenewalDate,
        lastChargedDate: null,
        splitType,
        splitMembers: splitType !== "solo" ? splitMembers.map(m => ({ userId: m.userId, share: splitType === "equal" ? 0 : m.share })) : null,
        contextId: splitType !== "solo" ? contextIdToUse : null,
        category,
        status: isTrial ? "trial" : "active",
        trialEndsAt: isTrial && trialEndsAt ? trialEndsAt : null,
        reminderDaysBefore: Number(reminderDaysBefore),
        autoLogExpense,
        createdAt: new Date().toISOString(),
        notes: notes.trim() || null
      };

      await dbSetDoc("subscriptions", subId, subscriptionData);
      toast.success("Subscription saved successfully!");
      navigate("/subscriptions");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save subscription");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/subscriptions")} className="cursor-pointer">
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex flex-col">
          <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Step {step} of 4</span>
          <h1 className="font-heading text-xl font-black uppercase tracking-tight">Add Subscription</h1>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm text-left">
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <h2 className="text-sm font-bold uppercase tracking-wide font-mono text-muted-foreground mb-2">1. Basics & Presets</h2>
            
            <div className="flex flex-wrap gap-2 mb-2">
              {PROVIDER_PRESETS.map(preset => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => handlePresetSelect(preset)}
                  className={`px-3 py-1 text-xs border rounded-full font-semibold transition-colors cursor-pointer ${
                    provider === preset 
                      ? "bg-primary text-primary-foreground border-primary" 
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <Label className="font-mono text-[10px] uppercase font-bold text-muted-foreground">Subscription Name *</Label>
              <Input
                type="text"
                required
                placeholder="e.g. Netflix Premium"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label className="font-mono text-[10px] uppercase font-bold text-muted-foreground">Amount *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">₹</span>
                  <Input
                    type="number"
                    required
                    placeholder="649"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="pl-7"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="font-mono text-[10px] uppercase font-bold text-muted-foreground">Category</Label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full text-xs h-10 px-3 rounded-lg border border-input bg-card focus:outline-none focus:ring-1 focus:ring-gold"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-5">
            <h2 className="text-sm font-bold uppercase tracking-wide font-mono text-muted-foreground mb-2">2. Billing Cycle</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label className="font-mono text-[10px] uppercase font-bold text-muted-foreground">Billing Cycle</Label>
                <select
                  value={billingCycle}
                  onChange={e => setBillingCycle(e.target.value as any)}
                  className="w-full text-xs h-10 px-3 rounded-lg border border-input bg-card focus:outline-none"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                  <option value="custom">Custom Days</option>
                </select>
              </div>

              {billingCycle === "custom" && (
                <div className="flex flex-col gap-2">
                  <Label className="font-mono text-[10px] uppercase font-bold text-muted-foreground">Cycle Days</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 45"
                    value={customCycleDays}
                    onChange={e => setCustomCycleDays(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label className="font-mono text-[10px] uppercase font-bold text-muted-foreground">Next Renewal Date *</Label>
              <Input
                type="date"
                required
                value={nextRenewalDate}
                onChange={e => setNextRenewalDate(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 border-t border-border pt-4 mt-2">
              <input
                type="checkbox"
                id="isTrial"
                checked={isTrial}
                onChange={e => setIsTrial(e.target.checked)}
                className="rounded border-input text-primary focus:ring-primary size-4"
              />
              <Label htmlFor="isTrial" className="font-semibold text-xs cursor-pointer select-none">This subscription is a free trial</Label>
            </div>

            {isTrial && (
              <div className="flex flex-col gap-2 mt-2">
                <Label className="font-mono text-[10px] uppercase font-bold text-muted-foreground">Trial Ends At</Label>
                <Input
                  type="date"
                  value={trialEndsAt}
                  onChange={e => setTrialEndsAt(e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-5">
            <h2 className="text-sm font-bold uppercase tracking-wide font-mono text-muted-foreground mb-2">3. Split Configuration</h2>

            <div className="flex gap-2 bg-muted p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setSplitType("solo")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  splitType === "solo" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Solo / Personal
              </button>
              <button
                type="button"
                onClick={() => setSplitType("equal")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  splitType !== "solo" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Shared Split
              </button>
            </div>

            {splitType !== "solo" && (
              <div className="flex flex-col gap-5 border-t border-border pt-4 mt-2">
                <div className="flex gap-2 bg-muted p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setDirectSplitMode("group")}
                    className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                      directSplitMode === "group" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Split in Context
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirectSplitMode("friends")}
                    className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                      directSplitMode === "friends" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Split with Connections
                  </button>
                </div>

                {directSplitMode === "group" ? (
                  <div className="flex flex-col gap-2">
                    <Label className="font-mono text-[10px] uppercase font-bold text-muted-foreground">Link to Context / Group</Label>
                    <select
                      value={selectedContextId}
                      onChange={e => setSelectedContextId(e.target.value)}
                      className="w-full text-xs h-10 px-3 rounded-lg border border-input bg-card focus:outline-none"
                    >
                      <option value="">-- Choose a Context --</option>
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Label className="font-mono text-[10px] uppercase font-bold text-muted-foreground">Select Connections (Friends)</Label>
                    {loadingFriends ? (
                      <div className="flex py-4 justify-center">
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      </div>
                    ) : friendsList.length === 0 ? (
                      <div className="p-4 rounded-xl border bg-amber-50 border-amber-200 text-amber-700 flex flex-col gap-3 text-xs font-medium">
                        <ShieldCheck className="w-4 h-4 text-amber-500" />
                        <span>No verified connections. Go to Connections Center to connect with friends!</span>
                        <Button variant="outline" size="sm" onClick={() => navigate("/network")} className="self-start">Go to Connections</Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                        {friendsList.map(f => {
                          const isSelected = selectedFriends.some(item => item.uid === f.uid);
                          return (
                            <div
                              key={f.uid}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedFriends(selectedFriends.filter(item => item.uid !== f.uid));
                                } else {
                                  setSelectedFriends([...selectedFriends, f]);
                                }
                              }}
                              className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                isSelected 
                                  ? "bg-primary/5 border-primary text-foreground font-semibold"
                                  : "bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-350"
                              }`}
                            >
                              <span className="text-xs font-semibold">{f.name} {f.surname || ""}</span>
                              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                isSelected ? "bg-primary border-primary text-primary-foreground" : "border-gray-300"
                              }`}>
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Split Type Configuration */}
                {((directSplitMode === "group" && selectedContextId) || (directSplitMode === "friends" && selectedFriends.length > 0)) && (
                  <div className="flex flex-col gap-3">
                    <Label className="font-mono text-[10px] uppercase font-bold text-muted-foreground">Split Type</Label>
                    <select
                      value={splitType}
                      onChange={e => setSplitType(e.target.value as any)}
                      className="w-full text-xs h-10 px-3 rounded-lg border border-input bg-card focus:outline-none"
                    >
                      <option value="equal">Equal Split</option>
                      <option value="exact">Exact Amount Shares</option>
                    </select>

                    {splitType === "exact" && (
                      <div className="flex flex-col gap-3 mt-2">
                        <Label className="font-mono text-[10px] uppercase font-bold text-muted-foreground">Member Share Breakdown</Label>
                        {splitMembers.map(m => (
                          <div key={m.userId} className="flex items-center justify-between gap-4">
                            <span className="text-xs font-medium">{m.name}</span>
                            <div className="relative w-32">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">₹</span>
                              <Input
                                type="number"
                                placeholder="0"
                                value={m.share || ""}
                                onChange={e => handleMemberShareChange(m.userId, e.target.value)}
                                className="pl-6 h-8 text-xs"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-5">
            <h2 className="text-sm font-bold uppercase tracking-wide font-mono text-muted-foreground mb-2">4. Reminders & Automations</h2>

            <div className="flex flex-col gap-2">
              <Label className="font-mono text-[10px] uppercase font-bold text-muted-foreground">Days before renewal to remind</Label>
              <select
                value={reminderDaysBefore}
                onChange={e => setReminderDaysBefore(e.target.value)}
                className="w-full text-xs h-10 px-3 rounded-lg border border-input bg-card focus:outline-none"
              >
                <option value="1">1 Day Before</option>
                <option value="3">3 Days Before</option>
                <option value="5">5 Days Before</option>
                <option value="7">7 Days Before</option>
              </select>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-4 mt-2">
              <div className="flex flex-col">
                <Label htmlFor="autoLog" className="font-semibold text-xs cursor-pointer select-none">Auto-log Expense</Label>
                <span className="text-[10px] text-muted-foreground">Automatically write split into ledger on billing renewal date</span>
              </div>
              <input
                type="checkbox"
                id="autoLog"
                checked={autoLogExpense}
                onChange={e => setAutoLogExpense(e.target.checked)}
                className="rounded border-input text-primary focus:ring-primary size-4"
              />
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <Label className="font-mono text-[10px] uppercase font-bold text-muted-foreground">Notes</Label>
              <textarea
                placeholder="Account credentials location, billing details, etc."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full rounded-lg border border-input bg-card p-3 text-xs focus:outline-none focus:ring-1 focus:ring-gold h-20 resize-none"
              />
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8 border-t border-border pt-4">
          <Button
            variant="outline"
            disabled={step === 1}
            onClick={() => setStep(prev => prev - 1)}
            className="cursor-pointer"
          >
            Back
          </Button>

          {step < 4 ? (
            <Button
              onClick={() => {
                if (step === 1) {
                  if (!name.trim() || !amount) {
                    toast.error("Please enter a Subscription Name and Amount first");
                    return;
                  }
                }
                if (step === 2) {
                  if (!nextRenewalDate) {
                    toast.error("Please select a Next Renewal Date");
                    return;
                  }
                }
                if (step === 3) {
                  if (splitType !== "solo") {
                    if (directSplitMode === "group" && !selectedContextId) {
                      toast.error("Please select a Context Group to split with");
                      return;
                    }
                    if (directSplitMode === "friends" && selectedFriends.length === 0) {
                      toast.error("Please select at least one connection to split with");
                      return;
                    }
                  }
                }
                setStep(prev => prev + 1);
              }}
              className="flex items-center gap-1 cursor-pointer"
            >
              Next <ArrowRight className="size-3.5" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="bg-primary text-primary-foreground flex items-center gap-1 cursor-pointer"
            >
              Save Subscription <Check className="size-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
