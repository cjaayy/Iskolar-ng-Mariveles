/* ================================================================
   ADMIN APP SHELL — Sidebar + Header for admin pages
   ================================================================ */

"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/providers/ThemeProvider";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  LinkIcon,
  MapPin,
  FileText,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Settings2,
} from "lucide-react";

/* -- Navigation items for admin -- */
const dashboardItem = {
  href: "/admin/dashboard",
  label: "Dashboard",
  icon: LayoutDashboard,
};

const adminToolItems = [
  { href: "/admin/registered", label: "List of Applicants", icon: Users },
  { href: "/admin/validators", label: "List of Validators", icon: ShieldCheck },
  { href: "/admin/invites", label: "Registration Links", icon: LinkIcon },
  { href: "/admin/barangay-access", label: "Barangay Access", icon: MapPin },
  {
    href: "/admin/barangay-requirements",
    label: "Brgy. Requirements",
    icon: FileText,
  },
];

/* ======================== SIDEBAR ======================== */

function AdminSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  // Auto-expand dropdown if any child route is active
  const isToolActive = adminToolItems.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
  );
  const [toolsOpen, setToolsOpen] = useState(isToolActive);

  const isDashboardActive =
    pathname === dashboardItem.href ||
    pathname.startsWith(dashboardItem.href + "/");

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
        aria-label="Admin navigation"
      >
        {/* Logo / Brand */}
        <div className="p-6 flex items-center justify-between">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-3 group"
            onClick={onClose}
          >
            <Image
              src="/mariveles-seal.png"
              alt="Mariveles seal"
              width={40}
              height={40}
              className="w-10 h-10 group-hover:scale-105 transition-transform"
            />
            <div>
              <h1 className="font-heading text-lg font-bold text-foreground leading-tight">
                Iskolar
              </h1>
              <p className="text-[10px] font-body text-muted-fg -mt-0.5">
                Admin Panel
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
            {/* Dashboard (standalone) */}
            <li>
              <Link
                href={dashboardItem.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-body font-medium
                  transition-all duration-200 group
                  ${
                    isDashboardActive
                      ? "bg-ocean-50 dark:bg-ocean-400/10 text-ocean-400"
                      : "text-muted-fg hover:bg-muted hover:text-foreground"
                  }
                `}
                aria-current={isDashboardActive ? "page" : undefined}
              >
                <LayoutDashboard
                  className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                    isDashboardActive ? "text-ocean-400" : ""
                  }`}
                />
                {dashboardItem.label}
                {isDashboardActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-ocean-400" />
                )}
              </Link>
            </li>

            {/* Admin Tools dropdown */}
            <li>
              <button
                onClick={() => setToolsOpen((prev) => !prev)}
                className={`
                  flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-body font-medium
                  transition-all duration-200 group
                  ${
                    isToolActive && !toolsOpen
                      ? "bg-ocean-50 dark:bg-ocean-400/10 text-ocean-400"
                      : "text-muted-fg hover:bg-muted hover:text-foreground"
                  }
                `}
              >
                <Settings2
                  className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                    isToolActive ? "text-ocean-400" : ""
                  }`}
                />
                Admin Tools
                <ChevronDown
                  className={`w-4 h-4 ml-auto transition-transform duration-200 ${
                    toolsOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown children */}
              <div
                className={`overflow-hidden transition-all duration-200 ease-out ${
                  toolsOpen ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"
                }`}
              >
                <ul className="ml-4 pl-4 border-l border-card-border space-y-0.5">
                  {adminToolItems.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      pathname.startsWith(item.href + "/");
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className={`
                            flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-body font-medium
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
                            className={`w-4 h-4 transition-transform group-hover:scale-110 ${
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
              </div>
            </li>
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
          <button
            onClick={() => {
              localStorage.removeItem("adminId");
              window.location.href = "/";
            }}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-body text-muted-fg hover:bg-coral-50 dark:hover:bg-coral-500/10 hover:text-coral-500 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

/* ======================== HEADER ======================== */

function AdminHeader({ onMenuToggle }: { onMenuToggle: () => void }) {
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

        <div className="flex-1" />
      </div>
    </header>
  );
}

/* ======================== ADMIN APP SHELL ======================== */

export function AdminAppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader onMenuToggle={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-8 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
