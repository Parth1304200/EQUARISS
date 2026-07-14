/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { logoutUser } from "../lib/firebase";
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
  Sun,
  Moon,
  Scale,
} from "lucide-react";
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
  { label: "Groups", path: "/groups", icon: Layers },
  { label: "Network", path: "/network", icon: Users },
  { label: "Settlements", path: "/settlements", icon: CreditCard },
  { label: "Reports", path: "/reports", icon: PieChart },
  { label: "Profile", path: "/profile", icon: User },
  { label: "Settings", path: "/settings", icon: SettingsIcon },
];

export const Navbar: React.FC = () => {
  const { user, profile, currentRoute, navigate, theme, setTheme } = useApp();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const displayName = profile?.nickname || profile?.name || user?.displayName || "Equaris User";
  const displayEmail = profile?.email || user?.email || "";
  const displayPhoto = profile?.photoURL || user?.photoURL || "";
  const avatarInitial = (displayName || "E").charAt(0).toUpperCase();

  if (currentRoute.path === "/login") return null;

  const isActive = (path: string) =>
    currentRoute.path === path || (path === "/groups" && currentRoute.path === "/groups/[id]");

  const go = (path: string) => {
    navigate(path);
    setSheetOpen(false);
  };

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

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

  const Brand = ({ onClick }: { onClick?: () => void }) => (
    <button
      onClick={onClick}
      className="group flex cursor-pointer select-none items-center gap-2 outline-none"
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary font-heading text-lg font-bold text-primary-foreground transition-transform group-hover:scale-105">
        E
      </span>
      <span className="flex items-center gap-1.5 font-heading text-xl font-bold tracking-tight">
        Equaris
        <Scale className="size-4 text-muted-foreground" />
      </span>
    </button>
  );

  const NavLinks = () => (
    <nav className="flex flex-col gap-1">
      {LINKS.map((link) => {
        const Icon = link.icon;
        const active = isActive(link.path);
        return (
          <button
            key={link.path}
            id={`nav-${link.label.toLowerCase()}`}
            onClick={() => go(link.path)}
            aria-current={active ? "page" : undefined}
            className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <Icon className="size-4 shrink-0" />
            {link.label}
          </button>
        );
      })}
    </nav>
  );

  const UserFooter = () => (
    <div className="flex items-center justify-between gap-2 border-t pt-4">
      <button
        onClick={() => go("/profile")}
        className="-m-1 flex min-w-0 cursor-pointer items-center gap-3 rounded-lg p-1 outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Avatar className="size-9 shrink-0">
          {displayPhoto && <AvatarImage src={displayPhoto} alt={displayName} referrerPolicy="no-referrer" />}
          <AvatarFallback className="text-xs font-semibold uppercase">{avatarInitial}</AvatarFallback>
        </Avatar>
        <span className="flex min-w-0 flex-col text-left">
          <span className="truncate text-xs font-semibold leading-tight">{displayName}</span>
          <span className="truncate font-mono text-[10px] leading-tight text-muted-foreground">{displayEmail}</span>
        </span>
      </button>
      <Button
        id="sidebar-logout-btn"
        variant="ghost"
        size="icon-sm"
        onClick={() => setShowLogoutConfirm(true)}
        aria-label="Sign out"
        className="shrink-0 cursor-pointer text-muted-foreground hover:text-destructive"
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
          <div className="flex items-center justify-between">
            <Brand onClick={() => navigate("/dashboard")} />
            <Button
              id="desktop-theme-toggle"
              variant="outline"
              size="icon-sm"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="cursor-pointer"
            >
              {theme === "dark" ? <Sun /> : <Moon />}
            </Button>
          </div>

          <NavLinks />

          <div className="flex flex-col gap-1.5 rounded-lg border bg-card p-4">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Equaris
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Split clearly. Settle up on the screen in seconds. No awkward reminders.
            </p>
          </div>
        </div>

        {user && <UserFooter />}
      </aside>

      {/* MOBILE HEADER */}
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b bg-background px-6 md:hidden">
        <Brand onClick={() => navigate("/dashboard")} />
        <div className="flex items-center gap-2">
          <Button
            id="mobile-theme-toggle"
            variant="outline"
            size="icon-sm"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="cursor-pointer"
          >
            {theme === "dark" ? <Sun /> : <Moon />}
          </Button>

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger
              render={
                <Button variant="outline" size="icon-sm" aria-label="Open menu" className="cursor-pointer">
                  <Menu />
                </Button>
              }
            />
            <SheetContent side="left" className="w-72 p-6">
              <SheetHeader className="p-0">
                <SheetTitle>
                  <Brand onClick={() => go("/dashboard")} />
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-1 flex-col justify-between">
                <NavLinks />
                {user && <UserFooter />}
              </div>
            </SheetContent>
          </Sheet>
        </div>
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
