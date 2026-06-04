'use client';

import { StatCard } from '@/components/dashboard/stat-card';

export default function CoachDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Coach Dashboard</h1>
        <p className="text-slate-500">Today&apos;s batches, attendance, and performance</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Today's Batches" value="—" href="/coach/attendance" />
        <StatCard title="Today's Students" value="—" href="/coach/students" />
        <StatCard title="Pending Fees" value="—" href="/coach/accounts" />
        <StatCard title="My Attendance" value="—" href="/coach/attendance" />
        <StatCard title="Performance Submitted" value="—" href="/coach/performance" />
      </div>
    </div>
  );
}
