'use client';

import { useEffect, useState, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type DurationPlan = {
  plan_id: number;
  name: string;
  duration_months: number;
  multiplier: number;
  status: 'ACTIVE' | 'INACTIVE';
};

type Sport = { sport_id: number; name: string };
type Coach = { coach_id: number; name: string };

type Batch = {
  batch_id: number;
  name: string;
  timing: string | null;
  start_time: string | null;
  end_time: string | null;
  max_capacity: number | null;
  status: 'ACTIVE' | 'INACTIVE';
  sport: { sport_id: number; name: string } | null;
  coaches: { coach: { coach_id: number; name: string } }[];
  _count?: { students: number };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <input className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white" {...props} />
    </label>
  );
}

function statusBadge(s: string) {
  return s === 'ACTIVE'
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
    : 'bg-slate-100 text-slate-500 dark:bg-slate-800';
}

// ─── Duration Plan Modal ──────────────────────────────────────────────────────

function PlanModal({ plan, onClose, onSave }: { plan: DurationPlan | null; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    name: plan?.name ?? '',
    duration_months: String(plan?.duration_months ?? ''),
    multiplier: String(plan?.multiplier ?? '1'),
    status: plan?.status ?? 'ACTIVE',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit() {
    if (!form.name.trim() || !form.duration_months) return setError('Name and duration are required');
    setSaving(true); setError('');
    try {
      const url = plan ? `/api/plans/${plan.plan_id}` : '/api/plans';
      const method = plan ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, duration_months: Number(form.duration_months), multiplier: Number(form.multiplier) }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? 'Failed');
      onSave();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-800 dark:text-white">{plan ? 'Edit Plan' : 'Add Duration Plan'}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 px-6 py-4">
          <div className="col-span-2"><Input label="Plan Name *" value={form.name} onChange={set('name')} placeholder="e.g. Quarterly, Half-yearly" /></div>
          <Input label="Duration (months) *" value={form.duration_months} onChange={set('duration_months')} type="number" min={1} max={24} placeholder="e.g. 3" />
          <Input label="Fee Multiplier" value={form.multiplier} onChange={set('multiplier')} type="number" min={0.1} step={0.1} placeholder="e.g. 2.8 for 3 months" />
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">Status</span>
            <select value={form.status} onChange={set('status')} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white">
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </label>
          <div className="col-span-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            Multiplier × base sport fee = total plan fee. E.g. multiplier 2.8 on ₹1,000/mo = ₹2,800 for 3 months.
          </div>
        </div>
        {error && <p className="mx-6 mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-950 dark:text-rose-400">{error}</p>}
        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
            {saving ? 'Saving…' : plan ? 'Save Changes' : 'Add Plan'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Batch Modal ──────────────────────────────────────────────────────────────

function BatchModal({ batch, sports, onClose, onSave }: { batch: Batch | null; sports: Sport[]; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    name: batch?.name ?? '',
    sport_id: String(batch?.sport?.sport_id ?? ''),
    timing: batch?.timing ?? '',
    start_time: batch?.start_time ?? '',
    end_time: batch?.end_time ?? '',
    max_capacity: String(batch?.max_capacity ?? ''),
    status: batch?.status ?? 'ACTIVE',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit() {
    if (!form.name.trim()) return setError('Batch name is required');
    setSaving(true); setError('');
    try {
      const url = batch ? `/api/batches/${batch.batch_id}` : '/api/batches';
      const method = batch ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          sport_id: form.sport_id ? Number(form.sport_id) : undefined,
          max_capacity: form.max_capacity ? Number(form.max_capacity) : undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? 'Failed');
      onSave();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-800 dark:text-white">{batch ? 'Edit Batch' : 'Add Batch'}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 px-6 py-4">
          <div className="col-span-2"><Input label="Batch Name *" value={form.name} onChange={set('name')} placeholder="e.g. Morning Batch A" /></div>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">Sport</span>
            <select value={form.sport_id} onChange={set('sport_id')} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white">
              <option value="">No sport</option>
              {sports.map(s => <option key={s.sport_id} value={s.sport_id}>{s.name}</option>)}
            </select>
          </label>
          <Input label="Timing (label)" value={form.timing} onChange={set('timing')} placeholder="e.g. 6:00 AM – 7:30 AM" />
          <Input label="Start Time" value={form.start_time} onChange={set('start_time')} type="time" />
          <Input label="End Time" value={form.end_time} onChange={set('end_time')} type="time" />
          <Input label="Max Capacity" value={form.max_capacity} onChange={set('max_capacity')} type="number" min={1} placeholder="Leave blank for unlimited" />
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">Status</span>
            <select value={form.status} onChange={set('status')} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white">
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </label>
        </div>
        {error && <p className="mx-6 mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-950 dark:text-rose-400">{error}</p>}
        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
            {saving ? 'Saving…' : batch ? 'Save Changes' : 'Add Batch'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PlansBatchesPage() {
  const [tab, setTab] = useState<'batches' | 'plans'>('batches');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [plans, setPlans] = useState<DurationPlan[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [editBatch, setEditBatch] = useState<Batch | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editPlan, setEditPlan] = useState<DurationPlan | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [br, pr, sr] = await Promise.all([
        fetch('/api/batches').then(r => r.json()),
        fetch('/api/plans').then(r => r.json()),
        fetch('/api/sports').then(r => r.json()),
      ]);
      if (br.success) setBatches(br.data ?? []);
      if (pr.success) setPlans(pr.data ?? []);
      if (sr.success) setSports(sr.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function deleteBatch(b: Batch) {
    if (!confirm(`Delete batch "${b.name}"?`)) return;
    await fetch(`/api/batches/${b.batch_id}`, { method: 'DELETE' });
    load();
  }

  async function deletePlan(p: DurationPlan) {
    if (!confirm(`Delete plan "${p.name}"?`)) return;
    await fetch(`/api/plans/${p.plan_id}`, { method: 'DELETE' });
    load();
  }

  async function toggleBatchStatus(b: Batch) {
    await fetch(`/api/batches/${b.batch_id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: b.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }),
    });
    load();
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Plans & Batches</h1>
          <p className="mt-0.5 text-sm text-slate-500">Manage training batches and fee duration plans</p>
        </div>
        <button
          onClick={() => tab === 'batches' ? (setEditBatch(null), setShowBatchModal(true)) : (setEditPlan(null), setShowPlanModal(true))}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
          Add {tab === 'batches' ? 'Batch' : 'Plan'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 w-fit dark:border-slate-700 dark:bg-slate-800">
        {(['batches', 'plans'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-5 py-2 text-sm font-medium capitalize transition ${tab === t ? 'bg-white shadow-sm text-slate-800 dark:bg-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
          >
            {t === 'batches' ? `Batches (${batches.length})` : `Duration Plans (${plans.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-slate-400">Loading…</div>
      ) : tab === 'batches' ? (
        /* ── Batches ── */
        batches.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center dark:border-slate-700">
            <p className="text-slate-400">No batches yet. Create your first batch.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {batches.map(b => (
              <div key={b.batch_id} className={`rounded-2xl border bg-white p-5 shadow-sm dark:bg-slate-900 ${b.status === 'ACTIVE' ? 'border-slate-100 dark:border-slate-800' : 'border-slate-200 opacity-60 dark:border-slate-700'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-white">{b.name}</h3>
                    {b.sport && <p className="text-xs text-slate-400">{b.sport.name}</p>}
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge(b.status)}`}>{b.status}</span>
                </div>

                <div className="mt-3 space-y-1 text-xs text-slate-500">
                  {b.timing && <p>🕐 {b.timing}</p>}
                  {(b.start_time || b.end_time) && <p>⏱ {b.start_time ?? ''}{b.start_time && b.end_time ? ' – ' : ''}{b.end_time ?? ''}</p>}
                  {b.max_capacity && <p>👥 Max {b.max_capacity} students{b._count ? ` · ${b._count.students} enrolled` : ''}</p>}
                </div>

                {b.coaches.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {b.coaches.map(c => (
                      <span key={c.coach.coach_id} className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                        {c.coach.name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex gap-2 border-t border-slate-50 pt-3 dark:border-slate-800">
                  <button onClick={() => { setEditBatch(b); setShowBatchModal(true); }} className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Edit</button>
                  <button onClick={() => toggleBatchStatus(b)} className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                    {b.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => deleteBatch(b)} className="rounded-lg border border-rose-100 px-2.5 py-1.5 text-xs font-medium text-rose-500 hover:bg-rose-50 dark:border-rose-900">🗑</button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* ── Duration Plans ── */
        plans.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center dark:border-slate-700">
            <p className="text-slate-400">No duration plans yet. Add plans like monthly, quarterly, annual.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {plans.map(p => (
              <div key={p.plan_id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-sm font-bold text-white">
                    {p.duration_months}m
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge(p.status)}`}>{p.status}</span>
                </div>
                <h3 className="mt-3 font-semibold text-slate-800 dark:text-white">{p.name}</h3>
                <p className="text-xs text-slate-400">{p.duration_months} month{p.duration_months > 1 ? 's' : ''}</p>
                <p className="mt-2 text-lg font-bold text-emerald-600 dark:text-emerald-400">{p.multiplier}×<span className="text-xs font-normal text-slate-400"> base fee</span></p>
                <div className="mt-4 flex gap-2 border-t border-slate-50 pt-3 dark:border-slate-800">
                  <button onClick={() => { setEditPlan(p); setShowPlanModal(true); }} className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Edit</button>
                  <button onClick={() => deletePlan(p)} className="rounded-lg border border-rose-100 px-2.5 py-1.5 text-xs font-medium text-rose-500 hover:bg-rose-50 dark:border-rose-900">🗑</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {showBatchModal && (
        <BatchModal batch={editBatch} sports={sports} onClose={() => setShowBatchModal(false)} onSave={() => { setShowBatchModal(false); load(); }} />
      )}
      {showPlanModal && (
        <PlanModal plan={editPlan} onClose={() => setShowPlanModal(false)} onSave={() => { setShowPlanModal(false); load(); }} />
      )}
    </div>
  );
}