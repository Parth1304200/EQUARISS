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
  Facebook,
  Youtube,
} from "lucide-react";
import { EquarisLogo } from "../components/EquarisLogo";
import heroIllustration from "@/assets/hero.png";
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
  { title: "Product", items: ["Home", "Pricing", "Features", "Sources"] },
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
          <EquarisLogo className="h-8 w-auto" />
          <span className="font-heading text-2xl font-bold tracking-tight">EQUARIS</span>
        </button>

        <nav className="hidden items-center gap-1 md:flex">
          {[
            { label: "Home", action: () => scrollTo("top") },
            { label: "Pricing", action: () => scrollTo("features") },
            { label: "Sources", action: () => scrollTo("features") },
          ].map((l) => (
            <Button key={l.label} variant="ghost" onClick={l.action} className="cursor-pointer text-foreground/80 hover:text-foreground">
              {l.label}
            </Button>
          ))}
          <Button variant="ghost" onClick={() => openAuth("signin")} className="cursor-pointer text-foreground/80 hover:text-foreground">
            Log in
          </Button>
        </nav>

        <Button onClick={() => openAuth("signup")} className="cursor-pointer rounded-full px-5">
          Get for free
        </Button>
      </header>

      {/* HERO */}
      <main className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 pb-8 pt-8 lg:grid-cols-2">
        {/* Left */}
        <div className="flex flex-col gap-7">
          <EquarisLogo className="h-12 w-auto text-primary" />

          <div className="flex flex-col gap-4">
            <h1 className="font-heading text-6xl font-bold leading-[1.05] tracking-tight">Share. Split. Settle.</h1>
            <p className="max-w-md text-lg leading-relaxed text-muted-foreground">
              Expense management for nuanced splits with your partners, roommates, travel mates, or anyone else.
            </p>
          </div>

          <Button size="lg" onClick={() => openAuth("signup")} className="w-fit cursor-pointer rounded-full px-7 py-6 text-base">
            Start settling
            <ArrowRight />
          </Button>

          {/* category chips */}
          <div className="mt-2 flex flex-wrap gap-6">
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
          <img
            src={heroIllustration}
            alt="Two people splitting a bill at a cafe"
            className="h-auto w-full"
          />

          <div className="grid grid-cols-1 gap-6 border-t pt-6 sm:grid-cols-2">
            <ul className="flex flex-col gap-3">
              {FEATURES.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2.5 text-sm font-medium">
                  <Icon className="size-4 text-primary" />
                  {label}
                </li>
              ))}
            </ul>

            <figure className="flex flex-col gap-2">
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

      {/* FOOTER */}
      <footer id="features" className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid grid-cols-2 gap-8 border-t pt-8 md:grid-cols-5">
          <div className="col-span-2 flex flex-col gap-3 md:col-span-1">
            <div className="flex items-center gap-2 text-primary">
              <EquarisLogo className="h-6 w-auto" />
              <span className="font-heading text-lg font-bold">EQUARIS</span>
            </div>
            <p className="text-xs text-muted-foreground">© 2024 Equaris Technologies</p>
          </div>

          {FOOTER_COLS.map((col) => (
            <div key={col.title} className="flex flex-col gap-2.5">
              <h4 className="font-mono text-[11px] font-semibold uppercase tracking-widest text-foreground">{col.title}</h4>
              {col.items.map((item) => (
                <button
                  key={item}
                  onClick={() => scrollTo("top")}
                  className="cursor-pointer text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-end gap-3">
          {[Instagram, Facebook, Youtube].map((Icon, i) => (
            <span key={i} className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Icon className="size-4" />
            </span>
          ))}
        </div>
      </footer>

      {/* AUTH MODAL */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mb-1 flex items-center gap-2 text-primary">
              <EquarisLogo className="h-7 w-auto" />
              <span className="font-heading text-lg font-bold">Equaris</span>
            </div>
            <DialogTitle>{authMode === "signin" ? "Welcome back" : "Create your account"}</DialogTitle>
            <DialogDescription>
              {authMode === "signin"
                ? "Sign in to track splits and settle up with your people."
                : "Start splitting expenses fairly in seconds — it's free."}
            </DialogDescription>
          </DialogHeader>

          <Button
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={authLoading}
            className="w-full cursor-pointer gap-2"
          >
            <GoogleG />
            Continue with Google
          </Button>

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
            {authMode === "signup" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="auth-name">Name</Label>
                <Input id="auth-name" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your name" autoComplete="name" />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="auth-email">Email</Label>
              <Input id="auth-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="auth-password">Password</Label>
              <Input id="auth-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete={authMode === "signin" ? "current-password" : "new-password"} />
            </div>

            {authError && (
              <Alert variant="destructive">
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={authLoading} className="w-full cursor-pointer">
              {authLoading ? <Loader2 className="animate-spin" /> : null}
              {authMode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {authMode === "signin" ? "New to Equaris?" : "Already have an account?"}{" "}
            <button
              onClick={() => {
                setAuthMode(authMode === "signin" ? "signup" : "signin");
                setAuthError(null);
              }}
              className="cursor-pointer font-medium text-primary hover:underline"
            >
              {authMode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
};
