'use client';

import { useEffect, useState, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Receipt = {
  receipt_id: number;
  receipt_number: string;
  amount: number;
  discount: number;
  additional_charges: number;
  payment_date: string;
  method: string | null;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'VOID';
  remarks: string | null;
  rejected_reason: string | null;
  created_at: string;
  student: { student_id: number; name: string };
  approved_by: { name: string } | null;
  collected_by: { name: string } | null;
};

type RevenueSummary = { totalRevenue: number; monthlyRevenue: number; pendingAmount: number; pendingCount: number };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatINR(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function statusColor(s: string) {
  return {
    COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
    PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    FAILED: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300',
    VOID: 'bg-slate-100 text-slate-500 dark:bg-slate-800',
  }[s] ?? 'bg-slate-100 text-slate-500';
}

function methodIcon(method: string | null) {
  const m = (method ?? '').toLowerCase();
  if (m.includes('cash')) return '💵';
  if (m.includes('upi') || m.includes('gpay') || m.includes('phonepay')) return '📱';
  if (m.includes('card') || m.includes('credit') || m.includes('debit')) return '💳';
  if (m.includes('bank') || m.includes('transfer') || m.includes('neft')) return '🏦';
  return '💰';
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Receipt Detail Modal ─────────────────────────────────────────────────────

function ReceiptModal({ receipt, onClose, onAction }: { receipt: Receipt; onClose: () => void; onAction: () => void }) {
  const [rejectReason, setRejectReason] = useState('');
  const [acting, setActing] = useState<'approve' | 'reject' | 'void' | null>(null);

  async function doAction(action: 'approve' | 'reject' | 'void') {
    setActing(action);
    try {
      const body: Record<string, string> = { action };
      if (action === 'reject' && rejectReason) body.rejected_reason = rejectReason;
      await fetch(`/api/accounts/receipts`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receipt_id: receipt.receipt_id, ...body }),
      });
      onAction();
    } finally {
      setActing(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-800 dark:text-white">Receipt #{receipt.receipt_number}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="space-y-4 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-800 dark:text-white">{receipt.student.name}</p>
              <p className="text-xs text-slate-400">{new Date(receipt.payment_date).toLocaleDateString('en-IN')}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor(receipt.status)}`}>{receipt.status}</span>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Amount</span><span className="font-medium">{formatINR(receipt.amount)}</span></div>
              {receipt.discount > 0 && <div className="flex justify-between"><span className="text-slate-500">Discount</span><span className="text-emerald-600">- {formatINR(receipt.discount)}</span></div>}
              {receipt.additional_charges > 0 && <div className="flex justify-between"><span className="text-slate-500">Additional Charges</span><span>{formatINR(receipt.additional_charges)}</span></div>}
              <hr className="border-slate-200 dark:border-slate-700" />
              <div className="flex justify-between font-semibold"><span>Net Amount</span><span>{formatINR(receipt.amount - receipt.discount + receipt.additional_charges)}</span></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div><p className="text-slate-400">Method</p><p className="font-medium text-slate-700 dark:text-slate-200">{methodIcon(receipt.method)} {receipt.method ?? '—'}</p></div>
            <div><p className="text-slate-400">Collected By</p><p className="font-medium text-slate-700 dark:text-slate-200">{receipt.collected_by?.name ?? 'Admin'}</p></div>
            {receipt.approved_by && <div><p className="text-slate-400">Approved By</p><p className="font-medium text-slate-700 dark:text-slate-200">{receipt.approved_by.name}</p></div>}
            {receipt.remarks && <div className="col-span-2"><p className="text-slate-400">Remarks</p><p className="font-medium text-slate-700 dark:text-slate-200">{receipt.remarks}</p></div>}
            {receipt.rejected_reason && <div className="col-span-2"><p className="text-slate-400">Rejection Reason</p><p className="font-medium text-rose-600">{receipt.rejected_reason}</p></div>}
          </div>

          {receipt.status === 'PENDING' && (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Rejection reason (if rejecting)"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <div className="flex gap-2">
                <button onClick={() => doAction('approve')} disabled={!!acting} className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
                  {acting === 'approve' ? 'Approving…' : '✅ Approve'}
                </button>
                <button onClick={() => doAction('reject')} disabled={!!acting} className="flex-1 rounded-lg bg-rose-600 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60">
                  {acting === 'reject' ? 'Rejecting…' : '❌ Reject'}
                </button>
              </div>
            </div>
          )}
          {receipt.status === 'COMPLETED' && (
            <button onClick={() => doAction('void')} disabled={!!acting} className="w-full rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300">
              {acting === 'void' ? 'Voiding…' : 'Void Receipt'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AdminAccountsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [summary, setSummary] = useState<RevenueSummary>({ totalRevenue: 0, monthlyRevenue: 0, pendingAmount: 0, pendingCount: 0 });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Receipt | null>(null);
  const LIMIT = 25;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page), limit: String(LIMIT),
        ...(filterStatus && { status: filterStatus }),
        ...(search && { search }),
      });
      const [rr, sr] = await Promise.all([
        fetch(`/api/accounts/receipts?${params}`).then(r => r.json()),
        fetch('/api/accounts/revenue-summary').then(r => r.json()),
      ]);
      if (rr.success) { setReceipts(rr.data ?? []); setTotal(rr.meta?.total ?? 0); }
      if (sr.success) setSummary(sr.data);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, search]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Accounts</h1>
        <p className="mt-0.5 text-sm text-slate-500">Receipts, dues, and revenue tracking</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total Revenue', value: formatINR(summary.totalRevenue), color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950' },
          { label: 'This Month', value: formatINR(summary.monthlyRevenue), color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950' },
          { label: 'Pending Amount', value: formatINR(summary.pendingAmount), color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950' },
          { label: 'Pending Receipts', value: summary.pendingCount, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950' },
        ].map(card => (
          <div key={card.label} className={`rounded-2xl border border-slate-100 p-4 shadow-sm dark:border-slate-800 ${card.bg}`}>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{card.label}</p>
            <p className={`mt-1 text-2xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search student name or receipt #…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 min-w-48 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <select
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="COMPLETED">Completed</option>
          <option value="FAILED">Failed</option>
          <option value="VOID">Void</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400">Loading receipts…</div>
        ) : receipts.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400">No receipts found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Receipt #</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {receipts.map(r => (
                  <tr key={r.receipt_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{r.receipt_number}</td>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{r.student.name}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-white">{formatINR(r.amount)}</td>
                    <td className="px-4 py-3 text-slate-500">{methodIcon(r.method)} {r.method ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500">
                      <p>{new Date(r.payment_date).toLocaleDateString('en-IN')}</p>
                      <p className="text-xs text-slate-400">{timeAgo(r.created_at)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor(r.status)}`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelected(r)}
                        className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400">Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300">← Prev</button>
            <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300">Next →</button>
          </div>
        </div>
      )}

      {selected && (
        <ReceiptModal receipt={selected} onClose={() => setSelected(null)} onAction={() => { setSelected(null); load(); }} />
      )}
    </div>
  );
}