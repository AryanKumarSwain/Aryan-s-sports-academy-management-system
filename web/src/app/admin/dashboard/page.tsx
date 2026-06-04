import { getSession, requireRole } from '@/lib/session';
import { UserRole, ReceiptStatus, RecordStatus } from '@/generated/prisma';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSubscriptionExpiryWarnings } from '@/lib/subscription';
import { startOfDay, startOfMonth, addDays } from 'date-fns';
import Link from 'next/link';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatINR(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(n);
}

function timeAgo(date: Date) {
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, colorClass, icon,
}: {
  label: string; value: string | number; sub?: string;
  colorClass: string; icon: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10 ${colorClass}`} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-800 dark:text-white">{value}</p>
          {sub && <p className="mt-0.5 truncate text-xs text-slate-400">{sub}</p>}
        </div>
        <div className={`flex-shrink-0 rounded-xl p-2.5 text-white ${colorClass}`}>{icon}</div>
      </div>
    </div>
  );
}

function AlertBanner({ text, href, variant }: { text: string; href?: string; variant: 'warn' | 'danger' | 'info' }) {
  const cls = {
    warn: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300',
    danger: 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950 dark:border-rose-800 dark:text-rose-300',
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300',
  }[variant];
  const inner = (
    <div className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium ${cls}`}>
      <span className="text-base">{variant === 'danger' ? '🔴' : variant === 'warn' ? '🟡' : 'ℹ️'}</span>
      {text}
      {href && <span className="ml-auto text-xs underline underline-offset-2">View →</span>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const icons = {
  students: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5.356-3.765M9 20H4v-2a4 4 0 015.356-3.765M15 7a4 4 0 11-8 0 4 4 0 018 0zm6 3a3 3 0 11-6 0 3 3 0 016 0zM3 10a3 3 0 116 0 3 3 0 01-6 0z" />
    </svg>
  ),
  coaches: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
      <circle cx="12" cy="8" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20c0-4 3.582-7 8-7s8 3 8 7" />
    </svg>
  ),
  batches: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2M12 12v4M10 14h4" />
    </svg>
  ),
  revenue: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  ),
  due: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4" />
    </svg>
  ),
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function AdminDashboardPage() {
  const session = await getSession();
  requireRole(session, UserRole.ACADEMY_ADMIN);
  const academyId = session!.academy_id!;

  const today = startOfDay(new Date());
  const monthStart = startOfMonth(new Date());
  const in3Days = addDays(today, 3);

  const [
    academy,
    activeStudents,
    activeCoaches,
    activeBatches,
    receipts,
    unpaidStudents,
    coachAbsentToday,
    upcomingDues,
    overdueDues,
    recentReceipts,
    recentStudents,
  ] = await Promise.all([
    prisma.academy.findUnique({ where: { academy_id: academyId } }),
    prisma.student.count({ where: { academy_id: academyId, is_deleted: false, status: RecordStatus.ACTIVE } }),
    prisma.coach.count({ where: { academy_id: academyId, is_deleted: false, status: RecordStatus.ACTIVE } }),
    prisma.batch.count({ where: { academy_id: academyId, status: RecordStatus.ACTIVE } }),
    prisma.receipt.findMany({
      where: { academy_id: academyId, status: ReceiptStatus.COMPLETED },
      select: { amount: true, payment_date: true, student_id: true },
    }),
    prisma.student.count({
      where: { academy_id: academyId, is_deleted: false, fees_status: { in: ['unpaid', 'pending', 'partial'] } },
    }),
    prisma.coachAttendance.count({ where: { academy_id: academyId, date: today, status: 'ABSENT' } }),
    prisma.studentEnrollment.count({
      where: { academy_id: academyId, is_active: true, next_due_date: { gte: today, lte: in3Days } },
    }),
    prisma.studentEnrollment.count({
      where: { academy_id: academyId, is_active: true, next_due_date: { lt: today } },
    }),
    prisma.receipt.findMany({
      where: { academy_id: academyId, status: ReceiptStatus.COMPLETED },
      orderBy: { created_at: 'desc' },
      take: 6,
      include: { student: { select: { name: true } } },
    }),
    prisma.student.findMany({
      where: { academy_id: academyId, is_deleted: false },
      orderBy: { created_at: 'desc' },
      take: 4,
      select: { name: true, created_at: true, sport: { select: { name: true } } },
    }),
  ]);

  const totalRevenue = receipts.reduce((s, r) => s + Number(r.amount), 0);
  const monthlyRevenue = receipts
    .filter((r) => r.payment_date >= monthStart)
    .reduce((s, r) => s + Number(r.amount), 0);

  const subscriptionAlerts = getSubscriptionExpiryWarnings(academy?.subscription_expires_at ?? null);

  const dateLabel = today.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Dashboard</h1>
          <p className="mt-0.5 text-sm text-slate-500">{dateLabel}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          {academy?.name ?? 'Your Academy'}
        </div>
      </div>

      {/* ── Alerts ── */}
      {(coachAbsentToday > 0 || overdueDues > 0 || upcomingDues > 0 || subscriptionAlerts) && (
        <div className="space-y-2">
          {coachAbsentToday > 0 && (
            <AlertBanner
              variant="warn"
              text={`${coachAbsentToday} coach${coachAbsentToday > 1 ? 'es' : ''} marked absent today`}
              href="/admin/coaches"
            />
          )}
          {overdueDues > 0 && (
            <AlertBanner
              variant="danger"
              text={`${overdueDues} enrollment${overdueDues > 1 ? 's' : ''} have overdue fees`}
              href="/admin/accounts"
            />
          )}
          {upcomingDues > 0 && overdueDues === 0 && (
            <AlertBanner
              variant="info"
              text={`${upcomingDues} fee${upcomingDues > 1 ? 's' : ''} due in the next 3 days`}
              href="/admin/accounts"
            />
          )}
          {subscriptionAlerts && (
            <AlertBanner variant="warn" text={subscriptionAlerts} />
          )}
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Active Students" value={activeStudents} sub={`${unpaidStudents} unpaid`} colorClass="bg-blue-500" icon={icons.students} />
        <StatCard label="Active Coaches" value={activeCoaches} colorClass="bg-violet-500" icon={icons.coaches} />
        <StatCard label="Active Batches" value={activeBatches} colorClass="bg-cyan-500" icon={icons.batches} />
        <StatCard label="Monthly Revenue" value={formatINR(monthlyRevenue)} sub={`${formatINR(totalRevenue)} total`} colorClass="bg-emerald-500" icon={icons.revenue} />
        <StatCard label="Overdue Fees" value={overdueDues} sub="enrollments" colorClass="bg-rose-500" icon={icons.due} />
        <StatCard label="Due This Week" value={upcomingDues} sub="next 3 days" colorClass="bg-amber-500" icon={icons.calendar} />
      </div>

      {/* ── Bottom Grid ── */}
      <div className="grid gap-6 lg:grid-cols-5">

        {/* Recent Payments */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">Recent Payments</h2>
            <Link href="/admin/accounts" className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">
              View all →
            </Link>
          </div>
          {recentReceipts.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No payments yet</p>
          ) : (
            <ul className="divide-y divide-slate-50 dark:divide-slate-800">
              {recentReceipts.map((r) => (
                <li key={r.receipt_id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{r.student.name}</p>
                    <p className="text-xs text-slate-400">{timeAgo(r.created_at)}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    {formatINR(Number(r.amount))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* New Students */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">New Students</h2>
              <Link href="/admin/students" className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">
                View all →
              </Link>
            </div>
            {recentStudents.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">No students yet</p>
            ) : (
              <ul className="space-y-2.5">
                {recentStudents.map((s, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{s.name}</p>
                      <p className="text-xs text-slate-400">{s.sport?.name ?? 'No sport'} · {timeAgo(s.created_at)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Fee Summary */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">Fee Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Paid students</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {activeStudents - unpaidStudents}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Unpaid / partial</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">{unpaidStudents}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Overdue enrollments</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">{overdueDues}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Due in 3 days</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">{upcomingDues}</span>
              </div>
              <hr className="border-slate-100 dark:border-slate-800" />
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-slate-600 dark:text-slate-300">This month</span>
                <span className="text-emerald-600 dark:text-emerald-400">{formatINR(monthlyRevenue)}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}