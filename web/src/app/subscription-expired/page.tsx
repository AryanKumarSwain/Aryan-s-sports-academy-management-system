import Link from 'next/link';

export default function SubscriptionExpiredPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-bold">Subscription Expired</h1>
      <p className="max-w-md text-slate-600">
        Your academy subscription has expired. Contact support or upgrade your plan to restore
        dashboard access.
      </p>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="inline-flex h-10 items-center rounded-lg border border-slate-200 px-4 text-sm font-semibold hover:bg-slate-50"
        >
          Back to Login
        </Link>
        <Link
          href="/register"
          className="inline-flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Upgrade Plan
        </Link>
      </div>
    </main>
  );
}
