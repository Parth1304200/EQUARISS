/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { auth } from "../lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import {
  ArrowRight,
  Loader2,
  Luggage,
  Sofa,
  Car,
  Utensils,
  Equal,
  Scale,
  PieChart,
  IndianRupee,
  Star,
  Instagram,
  Linkedin,
} from "lucide-react";
import { EquarisLogo } from "../components/EquarisLogo";
import heroVideo from "@/assets/ARTT.mp4";
import handshakeImg from "@/assets/handshake.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const CATEGORIES = [
  { icon: Luggage, label: "travel" },
  { icon: Sofa, label: "roommates" },
  { icon: Car, label: "rideshare" },
  { icon: Utensils, label: "dining" },
];

const FEATURES = [
  { icon: Equal, label: "Split Equally" },
  { icon: Scale, label: "Weighted Splits" },
  { icon: PieChart, label: "Category Analytics" },
  { icon: IndianRupee, label: "Instant Settlements" },
];

const FOOTER_COLS = [
  { title: "Product", items: ["Home", "About Us", "Features", "Sources"] },
  { title: "Company", items: ["About", "Blog", "Careers"] },
  { title: "Support", items: ["Help", "Contact", "Status"] },
  { title: "Legal", items: ["Privacy", "Terms", "Reporters"] },
];

/** Standard multi-colour Google mark for the OAuth button. */
const GoogleG = () => (
  <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
    <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
  </svg>
);

const XLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export const LandingPage: React.FC<{ onSuccessLogin?: () => void }> = ({ onSuccessLogin }) => {
  const { navigate } = useApp();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const openAuth = (mode: "signin" | "signup") => {
    setAuthMode(mode);
    setAuthError(null);
    setShowAuthModal(true);
  };

  const getFriendlyError = (err: any): string => {
    const code: string = err?.code || "";
    const map: Record<string, string> = {
      "auth/user-not-found": "No account found with this email address.",
      "auth/wrong-password": "Incorrect password. Please try again.",
      "auth/invalid-credential": "Invalid email or password. Please check your credentials.",
      "auth/email-already-in-use": "An account with this email already exists. Try signing in instead.",
      "auth/weak-password": "Password must be at least 6 characters.",
      "auth/invalid-email": "Please enter a valid email address.",
      "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
      "auth/popup-closed-by-user": "Google sign-in was cancelled.",
      "auth/network-request-failed": "Network error. Check your internet connection.",
      "auth/unauthorized-domain": "This domain is not authorised for sign-in.",
    };
    return map[code] || err?.message || "Authentication failed. Please try again.";
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return setAuthError("Email is required.");
    if (!password.trim()) return setAuthError("Password is required.");
    if (authMode === "signup" && !username.trim()) return setAuthError("Your name is required to create an account.");
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (authMode === "signin") {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (username.trim()) await updateProfile(cred.user, { displayName: username.trim() });
      }
      setShowAuthModal(false);
      onSuccessLogin?.();
    } catch (err: any) {
      setAuthError(getFriendlyError(err));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      setShowAuthModal(false);
      onSuccessLogin?.();
    } catch (err: any) {
      setAuthError(getFriendlyError(err));
    } finally {
      setAuthLoading(false);
    }
  };

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* NAV */}
      <header id="top" className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <button onClick={() => scrollTo("top")} className="flex cursor-pointer items-center gap-2.5 text-primary outline-none">
          <EquarisLogo className="h-12 w-auto" />
          <span className="font-heading text-2xl font-bold tracking-tight">EQUARIS</span>
        </button>

        <nav className="hidden items-center gap-1 md:flex">
          {[
            { label: "Home", action: () => scrollTo("top") },
            { label: "About Us", action: () => scrollTo("features") },
            { label: "Sources", action: () => scrollTo("features") },
          ].map((l) => (
            <Button key={l.label} variant="ghost" onClick={l.action} className="cursor-pointer text-foreground/80 hover:text-foreground">
              {l.label}
            </Button>
          ))}
          <Button variant="ghost" onClick={() => navigate("/login")} className="cursor-pointer text-foreground/80 hover:text-foreground">
            Log in
          </Button>
        </nav>

        <Button onClick={() => navigate("/signup")} className="cursor-pointer rounded-full px-5">
          START NOW
        </Button>
      </header>

      {/* HERO */}
      <main className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 pb-8 pt-8 lg:grid-cols-2">
        {/* Left */}
        <div className="flex flex-col gap-7 items-center text-center lg:items-start lg:text-left">
          <h1 className="font-heading text-6xl font-bold leading-[1.05] tracking-tight">Share. Split. Settle.</h1>

          <img src={handshakeImg} alt="Handshake split agreement" className="h-36 w-auto lg:self-start object-contain animate-fade-in" />

          <p className="max-w-md text-lg leading-relaxed text-muted-foreground">
            Expense management for nuanced splits with your partners, roommates, travel mates, or anyone else.
          </p>

          <Button size="lg" onClick={() => navigate("/signup")} className="w-fit cursor-pointer rounded-full px-7 py-6 text-base">
            Start settling
            <ArrowRight />
          </Button>

          {/* category chips */}
          <div className="mt-2 flex flex-wrap justify-center lg:justify-start gap-6">
            {CATEGORIES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-primary">
                  <Icon className="size-6" />
                </span>
                <span className="text-sm text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right */}
        <div className="flex flex-col gap-6">
          <video
            src={heroVideo}
            autoPlay
            loop
            muted
            playsInline
            className="h-auto w-full"
          />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <ul className="flex flex-col items-center sm:items-start gap-3">
              {FEATURES.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2.5 text-sm font-medium">
                  <Icon className="size-4 text-primary" />
                  {label}
                </li>
              ))}
            </ul>

            <figure className="flex flex-col items-center text-center sm:items-start sm:text-left gap-2">
              <div className="flex gap-0.5 text-[var(--gold)]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-current" />
                ))}
              </div>
              <blockquote className="text-sm italic leading-relaxed text-muted-foreground">
                "EQUARIS made my life so much easier. The roommate splits are effortless."
              </blockquote>
              <figcaption className="text-xs font-semibold tracking-wide">— VIGIL</figcaption>
            </figure>
          </div>
        </div>
      </main>

      {/* HOW IT WORKS SECTION */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-heading text-4xl font-bold tracking-tight text-primary mb-4">Three Steps to Split Harmony</h2>
          <p className="text-muted-foreground text-lg">
            Say goodbye to awkward reminders, confusing spreadsheets, and math debates. Equaris streamlines splitting.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center p-6 bg-card rounded-2xl border hover:shadow-md transition-shadow">
            <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-secondary text-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-8">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 className="font-heading text-xl font-bold mb-2">1. Create & Invite</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Create a group for trips, rent, dining, or events. Share the link with friends to get them onboarded instantly.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6 bg-card rounded-2xl border hover:shadow-md transition-shadow">
            <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-secondary text-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-8">
                <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z" />
                <path d="M8 6h8" strokeLinecap="round" />
                <path d="M8 10h8" strokeLinecap="round" />
                <path d="M8 14h6" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="font-heading text-xl font-bold mb-2">2. Log & Split</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Log an expense and split it equally, by percentage, or with custom weights. Each person's share is auto-calculated accurately.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6 bg-card rounded-2xl border hover:shadow-md transition-shadow">
            <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-secondary text-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-8">
                <circle cx="12" cy="12" r="10" />
                <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="font-heading text-xl font-bold mb-2">3. Settle Up Instantly</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Equaris computes balances and provides the absolute minimum transfers needed to clear up all debts.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURE DEEP DIVE WITH GRAPHICAL ANIMATION ART */}
      <section className="bg-card border-t border-b py-20 px-6">
        <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6">
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--gold)] font-semibold">Grounded AI Assistant</span>
            <h2 className="font-heading text-4xl font-bold tracking-tight text-primary leading-tight">
              Get Smart Insights About Your Group Expenses
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Our embedded Wallet Assistant uses AI, grounded in your real data, to give you a real-time breakdown of your balances. Instead of digging through logs, just ask!
            </p>
            
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex gap-4 items-start">
                <div className="flex size-10 items-center justify-center rounded-full bg-secondary text-primary shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-5">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Natural Language Q&A</h4>
                  <p className="text-sm text-muted-foreground mt-1">Ask questions like "How much did we spend on food this month?" and get instant correct answers.</p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="flex size-10 items-center justify-center rounded-full bg-secondary text-primary shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-5">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Budget Risk Notifications</h4>
                  <p className="text-sm text-muted-foreground mt-1">Receive proactive notifications when your group is approaching or exceeding its budget threshold.</p>
                </div>
              </div>
            </div>
          </div>

          {/* ART: Dynamic CSS Mockup/Illustration of splitting balance graph */}
          <div className="relative p-8 rounded-2xl bg-background border shadow-sm overflow-hidden flex flex-col gap-4">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <EquarisLogo className="size-40" />
            </div>
            
            <div className="flex items-center justify-between border-b pb-4">
              <span className="font-mono text-xs text-muted-foreground">SPLIT OPTIMIZATION ENGINE</span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">ACTIVE</span>
            </div>

            {/* Visual Art Grid representing balances */}
            <div className="flex flex-col gap-3 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">V</div>
                  <span className="text-sm font-semibold">Vigil</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-emerald-600 block font-semibold">+₹3,450</span>
                  <span className="text-[10px] text-muted-foreground">will receive</span>
                </div>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: "80%" }} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-full bg-muted flex items-center justify-center text-foreground font-bold text-xs">A</div>
                  <span className="text-sm font-semibold">Alex</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-destructive block font-semibold">-₹2,100</span>
                  <span className="text-[10px] text-muted-foreground">will pay</span>
                </div>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-destructive rounded-full" style={{ width: "50%" }} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-full bg-muted flex items-center justify-center text-foreground font-bold text-xs">K</div>
                  <span className="text-sm font-semibold">Kunal</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-destructive block font-semibold">-₹1,350</span>
                  <span className="text-[10px] text-muted-foreground">will pay</span>
                </div>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-destructive rounded-full" style={{ width: "30%" }} />
              </div>
            </div>

            <div className="border-t pt-4 mt-2 flex flex-col gap-2 relative z-10">
              <span className="text-xs font-semibold text-primary">Optimized Settlement Recommendation:</span>
              <div className="bg-secondary/45 p-3 rounded-lg border border-border/60 flex items-center justify-between text-xs">
                <span>Alex pays <strong>Vigil</strong></span>
                <span className="font-mono font-bold text-primary">₹2,100</span>
              </div>
              <div className="bg-secondary/45 p-3 rounded-lg border border-border/60 flex items-center justify-between text-xs">
                <span>Kunal pays <strong>Vigil</strong></span>
                <span className="font-mono font-bold text-primary">₹1,350</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <div className="bg-primary text-primary-foreground rounded-3xl p-12 md:p-16 flex flex-col items-center gap-6 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] bg-repeat pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
          <h2 className="font-heading text-3xl md:text-5xl font-bold tracking-tight max-w-xl">
            Start Splitting Your Bills Seamlessly Today
          </h2>
          <p className="max-w-md text-sm md:text-base text-primary-foreground/80 leading-relaxed font-sans">
            Create groups, invite companions, log your expenses, and settle up balances with absolute transparency.
          </p>
          <Button onClick={() => navigate("/signup")} size="lg" className="bg-background text-primary hover:bg-background/95 cursor-pointer rounded-full px-8 py-6 font-semibold mt-4 transition-transform hover:scale-105">
            START NOW
          </Button>
        </div>
      </section>

      {/* MINIMAL SEPARATOR LINE BEFORE FOOTER */}

      {/* FOOTER */}
      <footer id="features" className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid grid-cols-2 gap-8 border-t pt-8 md:grid-cols-5">
          <div className="col-span-2 flex flex-col gap-3 md:col-span-1">
            <div className="flex items-center gap-2 text-primary">
              <EquarisLogo className="h-6 w-auto" />
              <span className="font-heading text-lg font-bold">EQUARIS</span>
            </div>
            <p className="text-xs text-muted-foreground">© 2024 Equaris Technologies</p>
            <a href="mailto:splitequaris@gmail.com" className="text-xs text-muted-foreground hover:text-foreground transition-colors">splitequaris@gmail.com</a>
          </div>

          {FOOTER_COLS.map((col) => (
            <div key={col.title} className="flex flex-col gap-2.5">
              <h4 className="font-mono text-[11px] font-semibold uppercase tracking-widest text-foreground">{col.title}</h4>
              {col.items.map((item) => {
                const itemPath = item === "Home" ? "#" : "/" + item.toLowerCase().replace(/\s+/g, "-");
                return (
                  <a
                    key={item}
                    href={itemPath}
                    onClick={(e) => {
                      e.preventDefault();
                      if (item === "Home") {
                        scrollTo("top");
                      } else {
                        window.location.href = itemPath;
                      }
                    }}
                    className="cursor-pointer text-left text-sm text-muted-foreground transition-colors hover:text-foreground block"
                  >
                    {item}
                  </a>
                );
              })}
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-end gap-3">
          {[
            { Icon: Instagram, url: "https://instagram.com/splitequaris" },
            { Icon: Linkedin, url: "https://linkedin.com/company/splitequaris" },
            { Icon: XLogo, url: "https://x.com/splitequaris" },
          ].map(({ Icon, url }, i) => (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/95 transition-all hover:scale-110"
            >
              <Icon className="size-4" />
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
};
