/* ================================================================
   APP SHELL LAYOUT — Sidebar + Header for authenticated pages
   ================================================================ */

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useSession } from "@/components/providers/SessionProvider";
import {
  LayoutDashboard,
  ClipboardList,
  User,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  GraduationCap,
  Bell,
} from "lucide-react";

/* -- Navigation items -- */
const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/requirements", label: "Requirements", icon: ClipboardList },
  { href: "/profile", label: "Profile", icon: User },
];

/* ======================== SIDEBAR ======================== */

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64
          bg-card-bg border-r border-card-border
          flex flex-col
          transition-transform duration-300 ease-out
          lg:translate-x-0 lg:static lg:z-auto
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
        aria-label="Main navigation"
      >
        {/* Logo / Brand */}
        <div className="p-6 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 group"
            onClick={onClose}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ocean-400 to-peach-300 flex items-center justify-center shadow-soft group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-heading text-lg font-bold text-foreground leading-tight">
                Iskolar
              </h1>
              <p className="text-[10px] font-body text-muted-fg -mt-0.5">
                ng Mariveles
              </p>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden text-muted-fg hover:text-foreground transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-2">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`
                      flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-body font-medium
                      transition-all duration-200 group
                      ${
                        isActive
                          ? "bg-ocean-50 dark:bg-ocean-400/10 text-ocean-400"
                          : "text-muted-fg hover:bg-muted hover:text-foreground"
                      }
                    `}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon
                      className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                        isActive ? "text-ocean-400" : ""
                      }`}
                    />
                    {item.label}
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-ocean-400" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom section */}
        <div className="p-4 border-t border-card-border space-y-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-body text-muted-fg hover:bg-muted hover:text-foreground transition-all"
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
            {theme === "light" ? "Dark Mode" : "Light Mode"}
          </button>

          {/* Logout */}
          <Link
            href="/"
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-body text-muted-fg hover:bg-coral-50 dark:hover:bg-coral-500/10 hover:text-coral-500 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </Link>
        </div>
      </aside>
    </>
  );
}

/* ======================== HEADER ======================== */

export function Header({ onMenuToggle }: { onMenuToggle: () => void }) {
  const { user } = useSession();
  const initials = user
    ? `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`
    : "?";
  return (
    <header className="sticky top-0 z-30 bg-card-bg/80 backdrop-blur-md border-b border-card-border px-4 lg:px-8 py-3">
      <div className="flex items-center justify-between">
        {/* Mobile menu button */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 -ml-2 rounded-xl text-muted-fg hover:bg-muted transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="7"
                cy="7"
                r="5.5"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M11 11l3.5 3.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <input
              type="search"
              placeholder="Search requirements, documents..."
              className="w-full bg-muted border-0 rounded-xl pl-10 pr-4 py-2 text-sm font-body text-foreground placeholder:text-muted-fg focus:outline-none focus:ring-2 focus:ring-ocean-400/20 transition-all"
              aria-label="Search"
            />
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button
            className="relative p-2 rounded-xl text-muted-fg hover:bg-muted hover:text-foreground transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-coral-400 rounded-full" />
          </button>

          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full bg-gradient-to-br from-ocean-300 to-peach-300 flex items-center justify-center text-sm font-heading font-bold text-white"
            title={user?.fullName ?? ""}
          >
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}

/* ======================== APP SHELL ======================== */

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuToggle={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-8 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
