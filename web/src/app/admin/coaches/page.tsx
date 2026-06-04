'use client';

import { useEffect, useState, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Batch = { batch_id: number; name: string; timing?: string | null };

type Coach = {
  coach_id: number;
  name: string;
  email: string | null;
  phone_number: string | null;
  specialization: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  batch_assignments: { batch: { batch_id: number; name: string } }[];
};

type FormData = {
  name: string;
  email: string;
  phone_number: string;
  specialization: string;
  status: string;
  password: string;
};

const EMPTY_FORM: FormData = { name: '', email: '', phone_number: '', specialization: '', status: 'ACTIVE', password: '' };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadge(status: string) {
  return status === 'ACTIVE'
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
}

function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <input
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        {...props}
      />
    </label>
  );
}

// ─── Coach Modal ──────────────────────────────────────────────────────────────

function CoachModal({ coach, onClose, onSave }: { coach: Coach | null; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState<FormData>(
    coach
      ? { name: coach.name, email: coach.email ?? '', phone_number: coach.phone_number ?? '', specialization: coach.specialization ?? '', status: coach.status, password: '' }
      : { ...EMPTY_FORM }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit() {
    setError('');
    if (!form.name.trim()) return setError('Name is required');
    if (!coach && !form.password) return setError('Password is required for new coaches');
    setSaving(true);
    try {
      const url = coach ? `/api/coaches/${coach.coach_id}` : '/api/coaches';
      const method = coach ? 'PATCH' : 'POST';
      const body: Record<string, unknown> = { ...form };
      if (coach && !form.password) delete body.password;
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
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
          <h2 className="text-base font-semibold text-slate-800 dark:text-white">{coach ? 'Edit Coach' : 'Add New Coach'}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 px-6 py-4">
          <div className="col-span-2"><Input label="Full Name *" value={form.name} onChange={set('name')} placeholder="Coach full name" /></div>
          <Input label="Email" value={form.email} onChange={set('email')} type="email" placeholder="coach@email.com" />
          <Input label="Phone" value={form.phone_number} onChange={set('phone_number')} type="tel" placeholder="10-digit number" />
          <Input label="Specialization" value={form.specialization} onChange={set('specialization')} placeholder="e.g. Cricket, Swimming" />
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">Status</span>
            <select value={form.status} onChange={set('status')} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white">
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </label>
          <div className="col-span-2">
            <Input
              label={coach ? 'New Password (leave blank to keep current)' : 'Password *'}
              value={form.password}
              onChange={set('password')}
              type="password"
              placeholder={coach ? 'Leave blank to keep unchanged' : 'Set login password'}
            />
          </div>
        </div>
        {error && <p className="mx-6 mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-950 dark:text-rose-400">{error}</p>}
        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
            {saving ? 'Saving…' : coach ? 'Save Changes' : 'Add Coach'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Batch Assignment Modal ───────────────────────────────────────────────────

function BatchModal({ coach, batches, onClose, onSave }: { coach: Coach; batches: Batch[]; onClose: () => void; onSave: () => void }) {
  const current = new Set(coach.batch_assignments.map(a => a.batch.batch_id));
  const [selected, setSelected] = useState<Set<number>>(new Set(current));
  const [saving, setSaving] = useState(false);

  function toggle(id: number) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/coaches/${coach.coach_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch_ids: Array.from(selected) }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      onSave();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-800 dark:text-white">Assign Batches — {coach.name}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="max-h-64 overflow-y-auto px-6 py-4">
          {batches.length === 0 ? (
            <p className="text-center text-sm text-slate-400">No batches available</p>
          ) : (
            <div className="space-y-2">
              {batches.map(b => (
                <label key={b.batch_id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-100 p-3 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800">
                  <input
                    type="checkbox"
                    checked={selected.has(b.batch_id)}
                    onChange={() => toggle(b.batch_id)}
                    className="h-4 w-4 rounded accent-blue-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{b.name}</p>
                    {b.timing && <p className="text-xs text-slate-400">{b.timing}</p>}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Assignments'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AdminCoachesPage() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCoach, setEditCoach] = useState<Coach | null>(null);
  const [batchCoach, setBatchCoach] = useState<Coach | null>(null);
  const [sendingEmail, setSendingEmail] = useState<number | null>(null);
  const [emailMsg, setEmailMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...(search && { search }),
        ...(filterStatus && { status: filterStatus }),
      });
      const res = await fetch(`/api/coaches?${params}`);
      const data = await res.json();
      if (data.success) setCoaches(data.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch('/api/batches').then(r => r.json()).then(d => d.success && setBatches(d.data ?? []));
  }, []);

  async function sendCredentials(coach: Coach) {
    if (!coach.email) return alert('Coach has no email set');
    setSendingEmail(coach.coach_id);
    setEmailMsg('');
    try {
      const res = await fetch(`/api/coaches/${coach.coach_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ send_credentials: true }),
      });
      const data = await res.json();
      setEmailMsg(data.success ? '✅ Credentials sent!' : `❌ ${data.error}`);
    } finally {
      setSendingEmail(null);
      setTimeout(() => setEmailMsg(''), 3000);
    }
  }

  async function toggleStatus(c: Coach) {
    await fetch(`/api/coaches/${c.coach_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }),
    });
    load();
  }

  async function deleteCoach(c: Coach) {
    if (!confirm(`Delete coach ${c.name}?`)) return;
    await fetch(`/api/coaches/${c.coach_id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Coaches</h1>
          <p className="mt-0.5 text-sm text-slate-500">{coaches.length} coaches</p>
        </div>
        <button
          onClick={() => { setEditCoach(null); setShowModal(true); }}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
          Add Coach
        </button>
      </div>

      {/* Email feedback */}
      {emailMsg && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
          {emailMsg}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="py-16 text-center text-sm text-slate-400">Loading coaches…</div>
      ) : coaches.length === 0 ? (
        <div className="py-16 text-center text-sm text-slate-400">No coaches found</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {coaches.map((c) => (
            <div key={c.coach_id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              {/* Coach header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-violet-100 text-sm font-bold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-white">{c.name}</p>
                    {c.specialization && <p className="text-xs text-slate-400">{c.specialization}</p>}
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge(c.status)}`}>
                  {c.status}
                </span>
              </div>

              {/* Contact */}
              <div className="mt-3 space-y-1">
                {c.email && <p className="text-xs text-slate-500">📧 {c.email}</p>}
                {c.phone_number && <p className="text-xs text-slate-500">📞 {c.phone_number}</p>}
              </div>

              {/* Batches */}
              <div className="mt-3">
                {c.batch_assignments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No batches assigned</p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {c.batch_assignments.map(a => (
                      <span key={a.batch.batch_id} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {a.batch.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-50 pt-3 dark:border-slate-800">
                <button
                  onClick={() => { setEditCoach(c); setShowModal(true); }}
                  className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => setBatchCoach(c)}
                  className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Batches
                </button>
                <button
                  onClick={() => sendCredentials(c)}
                  disabled={sendingEmail === c.coach_id || !c.email}
                  className="flex-1 rounded-lg border border-blue-200 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-40 dark:border-blue-800 dark:text-blue-400"
                >
                  {sendingEmail === c.coach_id ? 'Sending…' : 'Send Creds'}
                </button>
                <button
                  onClick={() => toggleStatus(c)}
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  title={c.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                >
                  {c.status === 'ACTIVE' ? '⏸' : '▶'}
                </button>
                <button
                  onClick={() => deleteCoach(c)}
                  className="rounded-lg border border-rose-100 px-2 py-1.5 text-xs font-medium text-rose-500 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <CoachModal
          coach={editCoach}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); load(); }}
        />
      )}
      {batchCoach && (
        <BatchModal
          coach={batchCoach}
          batches={batches}
          onClose={() => setBatchCoach(null)}
          onSave={() => { setBatchCoach(null); load(); }}
        />
      )}
    </div>
  );
}