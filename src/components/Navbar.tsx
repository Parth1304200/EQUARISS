/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { useApp } from "../context/AppContext";
import { logoutUser } from "../lib/firebase";
import { cn } from "@/lib/utils";
import {
  User,
  LogOut,
  LayoutGrid,
  Users,
  Settings as SettingsIcon,
  PieChart,
  CreditCard,
  Layers,
  Menu,
  Calendar,
} from "lucide-react";
import { EquarisLogo } from "./EquarisLogo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const LINKS = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutGrid },
  { label: "Contexts", path: "/groups", icon: Layers },
  { label: "Subscriptions", path: "/subscriptions", icon: Calendar },
  { label: "Network", path: "/network", icon: Users },
  { label: "Settlements", path: "/settlements", icon: CreditCard },
  { label: "Reports", path: "/reports", icon: PieChart },
  { label: "Profile", path: "/profile", icon: User },
  { label: "Settings", path: "/settings", icon: SettingsIcon },
];

export const Navbar: React.FC = () => {
  const { user, profile, currentRoute, navigate } = useApp();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const displayName = profile?.nickname || profile?.name || user?.displayName || "Equaris User";
  const displayEmail = profile?.email || user?.email || "";
  const displayPhoto = profile?.photoURL || user?.photoURL || "";
  const avatarInitial = (displayName || "E").charAt(0).toUpperCase();

  if (currentRoute.path === "/login") return null;

  const isActive = (path: string) => {
    if (path === "/groups") {
      return currentRoute.path === "/groups" || currentRoute.path === "/groups/[id]";
    }
    if (path === "/subscriptions") {
      return currentRoute.path === "/subscriptions" || currentRoute.path === "/subscriptions/new" || currentRoute.path === "/subscriptions/[id]";
    }
    return currentRoute.path === path;
  };

  const go = (path: string) => {
    navigate(path);
    setSheetOpen(false);
  };

  const doLogout = async () => {
    setShowLogoutConfirm(false);
    if (localStorage.getItem("dispute_mock_auth") === "true") {
      localStorage.removeItem("dispute_mock_auth");
      localStorage.removeItem("dispute_mock_user");
      window.location.reload();
    } else {
      await logoutUser();
    }
  };

  const renderBrand = (onClick?: () => void, className?: string) => (
    <button
      onClick={onClick}
      className={cn("group flex cursor-pointer select-none items-center gap-3.5 outline-none", className)}
    >
      <EquarisLogo className="h-9 w-auto shrink-0 transition-transform group-hover:scale-105" />
      <span className="font-heading text-[25px] font-bold tracking-tight">Equaris</span>
    </button>
  );

  const renderNavLinks = (prefix: string) => (
    <nav className="flex flex-col gap-1 relative">
      {LINKS.map((link) => {
        const Icon = link.icon;
        const active = isActive(link.path);
        return (
          <button
            key={link.path}
            id={`${prefix}-nav-${link.label.toLowerCase()}`}
            onClick={() => go(link.path)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring",
              active
                ? "text-sidebar-accent-foreground"
                : "text-sidebar-foreground/75 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/30"
            )}
          >
            {active && (
              <motion.div
                layoutId={`${prefix}-active-indicator`}
                className="absolute inset-0 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.1)] pointer-events-none"
                initial={false}
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 30,
                }}
              />
            )}
            <Icon className="relative z-10 size-4 shrink-0" />
            <span className="relative z-10">{link.label}</span>
          </button>
        );
      })}
    </nav>
  );

  const renderUserFooter = () => (
    <div className="flex items-center justify-between gap-2 border-t border-sidebar-border pt-4">
      <button
        onClick={() => go("/profile")}
        className="-m-1 flex min-w-0 cursor-pointer items-center gap-3 rounded-lg p-1 outline-none transition-colors hover:bg-sidebar-accent/60 focus-visible:ring-2 focus-visible:ring-sidebar-ring"
      >
        <Avatar className="size-9 shrink-0">
          {displayPhoto && <AvatarImage src={displayPhoto} alt={displayName} referrerPolicy="no-referrer" />}
          <AvatarFallback className="bg-sidebar-accent text-xs font-semibold uppercase text-sidebar-accent-foreground">
            {avatarInitial}
          </AvatarFallback>
        </Avatar>
        <span className="flex min-w-0 flex-col text-left">
          <span className="truncate text-xs font-semibold leading-tight text-sidebar-foreground">{displayName}</span>
          <span className="truncate font-mono text-[10px] leading-tight text-sidebar-foreground/55">{displayEmail}</span>
        </span>
      </button>
      <Button
        id="sidebar-logout-btn"
        variant="ghost"
        size="icon-sm"
        onClick={() => setShowLogoutConfirm(true)}
        aria-label="Sign out"
        className="shrink-0 cursor-pointer text-sidebar-foreground/70 hover:bg-white/10 hover:text-white"
      >
        <LogOut />
      </Button>
    </div>
  );

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="sticky top-0 hidden min-h-screen w-64 shrink-0 flex-col justify-between border-r border-sidebar-border bg-sidebar p-6 text-sidebar-foreground md:flex">
        <div className="flex flex-col gap-8">
          {renderBrand(() => navigate("/dashboard"))}

          {renderNavLinks("desktop")}

          <div className="flex flex-col gap-1.5 rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-4">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/60">
              Equaris
            </p>
            <p className="text-xs leading-relaxed text-sidebar-foreground/80">
              Split clearly. Settle up on the screen in seconds. No awkward reminders.
            </p>
          </div>
        </div>

        {user && renderUserFooter()}
      </aside>

      {/* MOBILE HEADER */}
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b bg-background px-6 md:hidden">
        {renderBrand(() => navigate("/dashboard"), "text-primary")}

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger
            render={
              <Button variant="outline" size="icon-sm" aria-label="Open menu" className="cursor-pointer">
                <Menu />
              </Button>
            }
          />
          <SheetContent
            side="left"
            className="w-72 border-sidebar-border bg-sidebar p-6 text-sidebar-foreground"
          >
            <SheetHeader className="p-0">
              <SheetTitle className="text-sidebar-foreground">
                {renderBrand(() => go("/dashboard"))}
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6 flex flex-1 flex-col justify-between">
              {renderNavLinks("mobile")}
              {user && renderUserFooter()}
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* LOGOUT CONFIRMATION — destructive action → alert-dialog */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out of Equaris?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll need to sign back in to view your groups and settle up. Your data stays exactly where it is.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline" size="default" className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={doLogout}
              className="cursor-pointer bg-destructive text-white hover:bg-destructive/90"
            >
              Sign out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
