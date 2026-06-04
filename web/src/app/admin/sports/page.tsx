'use client';

import { useEffect, useState, useCallback } from 'react';

type Sport = {
  sport_id: number;
  name: string;
  description: string | null;
  base_fee: number;
  status: 'ACTIVE' | 'INACTIVE';
  is_custom: boolean;
  _count?: { students: number; batches: number };
};

type FormData = { name: string; description: string; base_fee: string; status: string };
const EMPTY: FormData = { name: '', description: '', base_fee: '', status: 'ACTIVE' };

function formatINR(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <input className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white" {...props} />
    </label>
  );
}

function SportModal({ sport, onClose, onSave }: { sport: Sport | null; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState<FormData>(
    sport ? { name: sport.name, description: sport.description ?? '', base_fee: String(sport.base_fee), status: sport.status } : { ...EMPTY }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit() {
    if (!form.name.trim()) return setError('Name is required');
    setSaving(true);
    setError('');
    try {
      const url = sport ? `/api/sports/${sport.sport_id}` : '/api/sports';
      const method = sport ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, base_fee: Number(form.base_fee) || 0 }),
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
          <h2 className="text-base font-semibold text-slate-800 dark:text-white">{sport ? 'Edit Sport' : 'Add Sport'}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="space-y-4 px-6 py-4">
          <Input label="Sport Name *" value={form.name} onChange={set('name')} placeholder="e.g. Cricket, Swimming" />
          <Input label="Base Fee (₹)" value={form.base_fee} onChange={set('base_fee')} type="number" min={0} placeholder="Monthly base fee" />
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">Description</span>
            <textarea
              value={form.description}
              onChange={set('description')}
              rows={3}
              placeholder="Optional description"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">Status</span>
            <select value={form.status} onChange={set('status')} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white">
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </label>
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-950 dark:text-rose-400">{error}</p>}
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
            {saving ? 'Saving…' : sport ? 'Save Changes' : 'Add Sport'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminSportsPage() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editSport, setEditSport] = useState<Sport | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sports');
      const data = await res.json();

      if (data && data.success) {
        setSports(Array.isArray(data.data) ? data.data : []);
      } else {
        setSports([]); 
      }
    } catch (error) {
      console.error("Failed to fetch sports:", error);
      setSports([]); 
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleStatus(s: Sport) {
    await fetch(`/api/sports/${s.sport_id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: s.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }),
    });
    load();
  }

  async function deleteSport(s: Sport) {
    if (!confirm(`Delete sport "${s.name}"? This may affect existing students.`)) return;
    await fetch(`/api/sports/${s.sport_id}`, { method: 'DELETE' });
    load();
  }

  // Safe checks and single declarations right before rendering
  const safeSports = Array.isArray(sports) ? sports : [];
  const active = safeSports.filter(s => s && s.status === 'ACTIVE').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Sports</h1>
          <p className="mt-0.5 text-sm text-slate-500">{active} active · {safeSports.length} total</p>
        </div>
        <button
          onClick={() => { setEditSport(null); setShowModal(true); }}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
          Add Sport
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-slate-400">Loading sports…</div>
      ) : safeSports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center dark:border-slate-700">
          <p className="text-slate-400">No sports yet. Add your first sport to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {safeSports.map((s) => (
            <div key={s.sport_id} className={`rounded-2xl border bg-white p-5 shadow-sm dark:bg-slate-900 ${s.status === 'ACTIVE' ? 'border-slate-100 dark:border-slate-800' : 'border-slate-200 opacity-60 dark:border-slate-700'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-lg font-bold text-white">
                  {s.name.charAt(0)}
                </div>
                <div className="flex items-center gap-1.5">
                  {s.is_custom && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">Custom</span>
                  )}
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${s.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                    {s.status}
                  </span>
                </div>
              </div>
              <h3 className="mt-3 font-semibold text-slate-800 dark:text-white">{s.name}</h3>
              {s.description && <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{s.description}</p>}
              <p className="mt-2 text-lg font-bold text-blue-600 dark:text-blue-400">{formatINR(Number(s.base_fee))}<span className="text-xs font-normal text-slate-400">/mo</span></p>
              {s._count && (
                <div className="mt-2 flex gap-3 text-xs text-slate-400">
                  <span>{s._count.students} students</span>
                  <span>{s._count.batches} batches</span>
                </div>
              )}
              <div className="mt-4 flex gap-2 border-t border-slate-50 pt-3 dark:border-slate-800">
                <button onClick={() => { setEditSport(s); setShowModal(true); }} className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Edit</button>
                <button onClick={() => toggleStatus(s)} className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                  {s.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={() => deleteSport(s)} className="rounded-lg border border-rose-100 px-2.5 py-1.5 text-xs font-medium text-rose-500 hover:bg-rose-50 dark:border-rose-900">🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <SportModal sport={editSport} onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); load(); }} />
      )}
    </div>
  );
}