"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building,
  Users,
  CreditCard,
  Home as HomeIcon,
  FileCheck,
  Wrench,
  Calendar,
  Settings,
  FileText,
  Sparkles,
  Activity,
  TrendingUp,
  ArrowRight,
  Landmark,
  CircleDollarSign,
  FileArchive,
} from "lucide-react";
import Link from "next/link";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { StatsSkeleton } from "@/components/skeletons/dashboard-skeletons";
import { useSuperadmin } from "@/providers/superadmin-provider";

export default function DashboardPage() {
  const { username } = useSuperadmin();
  const router = useRouter();

  const quickActions = [
    {
      label: "Societies",
      href: "/dashboard/societies",
      icon: Building,
      color: "from-blue-500 to-blue-600",
      bgLight: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: "Admins",
      href: "/dashboard/admins",
      icon: Users,
      color: "from-emerald-500 to-green-600",
      bgLight: "bg-emerald-50 dark:bg-emerald-950/30",
    },
    {
      label: "Payments",
      href: "/dashboard/payments",
      icon: CreditCard,
      color: "from-violet-500 to-purple-600",
      bgLight: "bg-violet-50 dark:bg-violet-950/30",
    },
    {
      label: "Society Payments",
      href: "/dashboard/society-payments",
      icon: CircleDollarSign,
      color: "from-teal-500 to-cyan-600",
      bgLight: "bg-teal-50 dark:bg-teal-950/30",
    },
    {
      label: "Listings",
      href: "/dashboard/apartment-listings",
      icon: HomeIcon,
      color: "from-amber-500 to-orange-600",
      bgLight: "bg-amber-50 dark:bg-amber-950/30",
    },
    {
      label: "LIC Requests",
      href: "/dashboard/lic-requests",
      icon: FileCheck,
      color: "from-rose-500 to-pink-600",
      bgLight: "bg-rose-50 dark:bg-rose-950/30",
    },
    {
      label: "Services",
      href: "/dashboard/services",
      icon: Wrench,
      color: "from-cyan-500 to-teal-600",
      bgLight: "bg-cyan-50 dark:bg-cyan-950/30",
    },
  ];

  const managementCards = [
    {
      title: "Societies",
      description: "Manage housing societies",
      detail: "Create, view and manage all registered housing societies.",
      href: "/dashboard/societies",
      icon: Building,
      gradient: "from-blue-500 to-blue-600",
      bgLight: "bg-blue-50 dark:bg-blue-950/30",
      textColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Admins",
      description: "Manage society administrators",
      detail: "Create, view and manage admin accounts for each society.",
      href: "/dashboard/admins",
      icon: Users,
      gradient: "from-emerald-500 to-green-600",
      bgLight: "bg-emerald-50 dark:bg-emerald-950/30",
      textColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Payment Accounts",
      description: "Manage Razorpay accounts",
      detail: "Configure and manage Razorpay payment accounts for societies.",
      href: "/dashboard/payments",
      icon: CreditCard,
      gradient: "from-violet-500 to-purple-600",
      bgLight: "bg-violet-50 dark:bg-violet-950/30",
      textColor: "text-violet-600 dark:text-violet-400",
    },
    {
      title: "Society Payments",
      description: "Track society collections",
      detail: "Record monthly, quarterly, bi annual and annual payments with proof files.",
      href: "/dashboard/society-payments",
      icon: CircleDollarSign,
      gradient: "from-teal-500 to-cyan-600",
      bgLight: "bg-teal-50 dark:bg-teal-950/30",
      textColor: "text-teal-600 dark:text-teal-400",
    },
    {
      title: "Apartment Listings",
      description: "View apartment listings",
      detail: "View and monitor all apartment listings for sale or rent.",
      href: "/dashboard/apartment-listings",
      icon: HomeIcon,
      gradient: "from-amber-500 to-orange-600",
      bgLight: "bg-amber-50 dark:bg-amber-950/30",
      textColor: "text-amber-600 dark:text-amber-400",
    },
    {
      title: "LIC Requests",
      description: "Manage LIC requests",
      detail: "View and manage LIC requests submitted by the residents.",
      href: "/dashboard/lic-requests",
      icon: FileCheck,
      gradient: "from-rose-500 to-pink-600",
      bgLight: "bg-rose-50 dark:bg-rose-950/30",
      textColor: "text-rose-600 dark:text-rose-400",
    },
    {
      title: "Settlements",
      description: "Manage settlements",
      detail: "View and manage payment settlements across all societies.",
      href: "/dashboard/settlements",
      icon: Landmark,
      gradient: "from-cyan-500 to-teal-600",
      bgLight: "bg-cyan-50 dark:bg-cyan-950/30",
      textColor: "text-cyan-600 dark:text-cyan-400",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-700 to-purple-800 p-6 md:p-8 text-white shadow-xl shadow-violet-600/20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-violet-200" />
            <span className="text-sm font-medium text-violet-200">Welcome back</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2 tracking-tight">
            {username || "SuperAdmin"}
          </h1>
          <p className="text-violet-100 text-sm md:text-base max-w-lg">
            Manage all societies, admins, and services from your super admin dashboard.
          </p>
        </div>
        {/* Decorative circles */}
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -right-4 -bottom-12 h-32 w-32 rounded-full bg-purple-400/20 blur-xl" />
      </div>

      {/* Stats Cards */}
      <DashboardStats />

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-muted-foreground" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href}>
              <div className={`group relative rounded-xl border border-border/50 ${action.bgLight} p-4 text-center transition-all duration-200 hover:shadow-md hover:scale-[1.02] hover:border-border cursor-pointer`}>
                <div className={`mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${action.color} text-white shadow-sm`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-foreground leading-tight block">
                  {action.label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Management Cards Grid */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
          Management
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {managementCards.map((card, i) => (
            <Link key={card.title} href={card.href}>
              <Card className={`group hover:shadow-lg hover:border-border transition-all duration-200 cursor-pointer h-full animate-slide-up stagger-${(i % 4) + 1}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} text-white shadow-sm`}>
                      <card.icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                  </div>
                  <CardTitle className="text-base font-semibold mt-3">{card.title}</CardTitle>
                  <p className="text-xs text-muted-foreground">{card.description}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{card.detail}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Create Actions */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Create New</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Button
            className="w-full justify-start gap-2 h-11"
            onClick={() => router.push("/dashboard/societies/new")}
          >
            <Building className="h-4 w-4" />
            Add New Society
          </Button>
          <Button
            className="w-full justify-start gap-2 h-11"
            onClick={() => router.push("/dashboard/admins/new")}
          >
            <Users className="h-4 w-4" />
            Create Admin Account
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 h-11"
            onClick={() => router.push("/dashboard/services")}
          >
            <Wrench className="h-4 w-4" />
            Manage Services
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 h-11"
            onClick={() => router.push("/dashboard/documents")}
          >
            <FileArchive className="h-4 w-4" />
            Essential Documents
          </Button>
        </div>
      </div>
    </div>
  );
} 