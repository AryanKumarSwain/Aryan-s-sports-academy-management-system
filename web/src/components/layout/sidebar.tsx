'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export type NavItem = { href: string; label: string; icon?: string };

export function Sidebar({ items, title }: { items: NavItem[]; title: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
      <div className="border-b border-slate-200 p-4 dark:border-slate-800">
        <p className="text-xs font-bold uppercase tracking-wider text-blue-600">SAMS</p>
        <p className="font-semibold">{title}</p>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'block rounded-lg px-3 py-2 text-sm font-medium transition',
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export const ADMIN_NAV: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/sports', label: 'Sports' },
  { href: '/admin/plans-batches', label: 'Plans & Batches' },
  { href: '/admin/coaches', label: 'Coaches' },
  { href: '/admin/students', label: 'Students' },
  { href: '/admin/accounts', label: 'Accounts' },
  { href: '/admin/performance', label: 'Performance Tracker' },
  { href: '/admin/reports', label: 'Reports' },
  { href: '/admin/settings', label: 'Settings' }
];

export const COACH_NAV: NavItem[] = [
  { href: '/coach/dashboard', label: 'Dashboard' },
  { href: '/coach/attendance', label: 'Attendance' },
  { href: '/coach/students', label: 'Students' },
  { href: '/coach/performance', label: 'Performance Tracker' },
  { href: '/coach/accounts', label: 'Accounts' },
  { href: '/coach/notifications', label: 'Notifications' }
];

export const SUPER_ADMIN_NAV: NavItem[] = [
  { href: '/super-admin/dashboard', label: 'Dashboard' },
  { href: '/super-admin/academies', label: 'Academies' },
  { href: '/super-admin/subscriptions', label: 'Subscriptions' },
  { href: '/super-admin/analytics', label: 'Analytics' },
  { href: '/super-admin/settings', label: 'Settings' }
];
