"use client";

import React, { useState, useMemo, useCallback, memo } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Building,
  Users,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Home,
  CreditCard,
  CircleDollarSign,
  Wrench,
  Calendar,
  FileText,
  FileArchive,
  Landmark,
  FileCheck,
  Shield,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { SuperadminProvider, useSuperadmin } from "@/providers/superadmin-provider";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

const navSections: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", href: "/dashboard", icon: Home }],
  },
  {
    label: "Management",
    items: [
      { title: "Societies", href: "/dashboard/societies", icon: Building },
      { title: "Admins", href: "/dashboard/admins", icon: Users },
      { title: "Apartment Listings", href: "/dashboard/apartment-listings", icon: Home },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Payment Accounts", href: "/dashboard/payments", icon: CreditCard },
      { title: "Society Payments", href: "/dashboard/society-payments", icon: CircleDollarSign },
      { title: "Settlements", href: "/dashboard/settlements", icon: Landmark },
    ],
  },
  {
    label: "Services",
    items: [
      { title: "Services", href: "/dashboard/services", icon: Wrench },
      { title: "Bookings", href: "/dashboard/bookings", icon: Calendar },
    ],
  },
  {
    label: "Requests",
    items: [
      { title: "LIC Requests", href: "/dashboard/lic-requests", icon: FileCheck },
      { title: "CA Requests", href: "/dashboard/ca-requests", icon: FileText },
    ],
  },
  {
    label: "Documents",
    items: [{ title: "Essential Documents", href: "/dashboard/documents", icon: FileArchive }],
  },
];

// Prefetchable link — triggers Next.js prefetch on hover for instant nav
const PrefetchLink = memo(function PrefetchLink({
  href,
  onClick,
  className,
  children,
  title,
}: {
  href: string;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
  title?: string;
}) {
  const router = useRouter();
  const handleMouseEnter = useCallback(() => {
    router.prefetch(href);
  }, [href, router]);

  return (
    <Link
      href={href}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onFocus={handleMouseEnter}
      className={className}
      title={title}
      prefetch={false}
    >
      {children}
    </Link>
  );
});

const SidebarNavItem = memo(function SidebarNavItem({
  item,
  pathname,
  isCollapsed,
  onMobileClose,
}: {
  item: NavItem;
  pathname: string;
  isCollapsed: boolean;
  onMobileClose: () => void;
}) {
  const Icon = item.icon;
  const isActive =
    pathname === item.href ||
    (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
  const isHighlighted = isActive;

  return (
    <PrefetchLink
      href={item.href}
      onClick={onMobileClose}
      className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150
        ${
          isHighlighted
            ? "bg-primary/10 text-primary dark:bg-primary/10 dark:text-blue-400"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }
        ${isCollapsed ? "justify-center px-2" : ""}
      `}
      title={isCollapsed ? item.title : undefined}
    >
      <Icon
        className={`h-[18px] w-[18px] shrink-0 transition-colors ${
          isHighlighted
            ? "text-blue-600 dark:text-blue-400"
            : "text-muted-foreground group-hover:text-foreground"
        }`}
      />
      {!isCollapsed && <span className="truncate">{item.title}</span>}
    </PrefetchLink>
  );
});

function DashboardLayoutInner({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  // Use shared superadmin context — single fetch for auth + username
  const { username, loading, signOut } = useSuperadmin();

  const closeMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(false);
  }, []);

  const pageTitle = useMemo(() => {
    if (pathname === "/dashboard") return "Dashboard";
    for (const section of navSections) {
      for (const item of section.items) {
        if (pathname === item.href || pathname.startsWith(item.href + "/"))
          return item.title;
      }
    }
    const segments = pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1];
    return last
      ? last.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "Dashboard";
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 animate-fade-in">
          <div className="relative mx-auto h-12 w-12">
            <div className="absolute inset-0 rounded-full border-[3px] border-muted"></div>
            <div className="absolute inset-0 rounded-full border-[3px] border-primary border-t-transparent animate-spin"></div>
          </div>
          <p className="text-sm text-muted-foreground font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo / Brand */}
      <div
        className={`flex items-center border-b border-border/50 ${
          isCollapsed ? "justify-center p-4" : "gap-3 px-5 py-5"
        }`}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/25">
          <Shield className="h-5 w-5" />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col overflow-hidden animate-fade-in">
            <span className="truncate text-sm font-bold tracking-tight text-foreground">
              MySocietyDetails
            </span>
            <span className="truncate text-[11px] text-muted-foreground">Super Admin</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navSections.map((section) => (
          <div key={section.label}>
            {!isCollapsed && (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <SidebarNavItem
                  key={item.title}
                  item={item}
                  pathname={pathname || ""}
                  isCollapsed={isCollapsed}
                  onMobileClose={closeMobileSidebar}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border/50 p-3">
        {!isCollapsed && (
          <div className="mb-3 rounded-lg bg-muted/50 px-3 py-2.5">
            <p className="text-[11px] font-medium text-muted-foreground">Signed in as</p>
            <p className="truncate text-sm font-semibold text-foreground">{username}</p>
          </div>
        )}
        <div className="flex items-center gap-1">
          {!isCollapsed && <ThemeToggle />}
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 dark:text-red-400 ${
              isCollapsed ? "w-full justify-center" : "flex-1 justify-start"
            }`}
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span>Sign Out</span>}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border shadow-2xl transition-transform duration-300 ease-out md:hidden
          ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="absolute right-3 top-4 z-10">
          <button
            onClick={closeMobileSidebar}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden md:flex flex-col bg-card border-r border-border transition-all duration-300 ease-out
          ${isCollapsed ? "w-[68px]" : "w-[260px]"}
        `}
      >
        {sidebarContent}
        {/* Collapse toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-7 z-40 flex h-6 w-6 items-center justify-center rounded-full border bg-card text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground transition-all"
        >
          <ChevronRight
            className={`h-3.5 w-3.5 transition-transform duration-200 ${
              isCollapsed ? "" : "rotate-180"
            }`}
          />
        </button>
      </aside>

      {/* Main area */}
      <div
        className={`transition-all duration-300 ease-out ${
          isCollapsed ? "md:pl-[68px]" : "md:pl-[260px]"
        }`}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-xl px-4 md:px-6">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground tracking-tight">
              {pageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}

// Wrap with SuperadminProvider so all dashboard children share the same auth/username data
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SuperadminProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </SuperadminProvider>
  );
} 