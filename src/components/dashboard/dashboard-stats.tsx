'use client';

import React from 'react';
import { Wrench, Building, CreditCard, Users, ArrowUpRight } from 'lucide-react';
import { useSuperadminStats } from '@/hooks/useSuperadminStats';

export function DashboardStats() {
  const { data: stats, isLoading } = useSuperadminStats();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="h-3.5 w-20 bg-muted rounded-md animate-pulse" />
              <div className="h-9 w-9 bg-muted rounded-lg animate-pulse" />
            </div>
            <div className="h-8 w-14 bg-muted rounded-md animate-pulse mb-1.5" />
            <div className="h-3 w-24 bg-muted rounded-md animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Services',
      value: stats?.totalServices || 0,
      description: 'Active and inactive',
      icon: Wrench,
      gradient: 'from-blue-500 to-blue-600',
      bgLight: 'bg-blue-50 dark:bg-blue-950/40',
      textColor: 'text-blue-600 dark:text-blue-400',
      trend: '+5%',
    },
    {
      title: 'Active Services',
      value: stats?.activeServices || 0,
      description: 'Currently available',
      icon: Building,
      gradient: 'from-emerald-500 to-green-600',
      bgLight: 'bg-emerald-50 dark:bg-emerald-950/40',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      trend: '+8%',
    },
    {
      title: 'Total Bookings',
      value: stats?.totalBookings || 0,
      description: 'All time',
      icon: CreditCard,
      gradient: 'from-violet-500 to-purple-600',
      bgLight: 'bg-violet-50 dark:bg-violet-950/40',
      textColor: 'text-violet-600 dark:text-violet-400',
      trend: '+15%',
    },
    {
      title: 'Pending Bookings',
      value: stats?.pendingBookings || 0,
      description: 'Awaiting confirmation',
      icon: Users,
      gradient: 'from-amber-500 to-orange-600',
      bgLight: 'bg-amber-50 dark:bg-amber-950/40',
      textColor: 'text-amber-600 dark:text-amber-400',
      trend: '-2%',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card, index) => (
        <div
          key={index}
          className={`group relative rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:shadow-md hover:border-border/80 animate-slide-up stagger-${index + 1}`}
        >
          {/* Gradient accent bar */}
          <div className={`absolute top-0 left-4 right-4 h-[3px] rounded-b-full bg-gradient-to-r ${card.gradient} opacity-80`} />

          <div className="flex items-center justify-between mb-4">
            <p className="text-[13px] font-medium text-muted-foreground">{card.title}</p>
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.bgLight}`}>
              <card.icon className={`h-[18px] w-[18px] ${card.textColor}`} />
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-foreground tracking-tight">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.description}</p>
            </div>
            <div className={`flex items-center gap-0.5 text-xs font-medium ${
              card.trend.startsWith('+')
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-500 dark:text-red-400'
            }`}>
              <ArrowUpRight className={`h-3 w-3 ${card.trend.startsWith('-') ? 'rotate-90' : ''}`} />
              {card.trend}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
