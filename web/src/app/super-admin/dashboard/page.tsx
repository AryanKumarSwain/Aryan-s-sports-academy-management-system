'use client';

import { StatCard } from '@/components/dashboard/stat-card';

export default function SuperAdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Platform Dashboard</h1>
        <p className="text-slate-500">All academies, subscriptions, and revenue</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Academies" value="—" href="/super-admin/academies" />
        <StatCard title="Total Students" value="—" href="/super-admin/analytics" />
        <StatCard title="Total Coaches" value="—" href="/super-admin/analytics" />
        <StatCard title="Total Revenue" value="—" href="/super-admin/analytics" />
        <StatCard title="Active Plans" value="—" href="/super-admin/subscriptions" />
        <StatCard title="Expiring Plans" value="—" href="/super-admin/subscriptions" />
      </div>
    </div>
  );
}
