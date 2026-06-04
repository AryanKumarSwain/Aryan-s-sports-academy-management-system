'use client';

import { useEffect, useState, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Sport = { sport_id: number; name: string; base_fee: number };
type Batch = { batch_id: number; name: string; timing?: string | null };
type Coach = { coach_id: number; name: string };

type Student = {
  student_id: number;
  name: string;
  phone: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  parent_email: string | null;
  age: number | null;
  gender: string | null;
  blood_group: string | null;
  joining_date: string | null;
  fees_status: string;
  status: 'ACTIVE' | 'INACTIVE';
  sport: { name: string } | null;
  batch: { name: string } | null;
  enrollments: {
    enrollment_id: number;
    final_fee: number;
    paid_amount: number;
    next_due_date: string | null;
    sport: { name: string };
    duration_plan: { name: string; duration_months: number } | null;
  }[];
};

type FormData = {
  name: string;
  phone: string;
  parent_name: string;
  parent_phone: string;
  parent_email: string;
  age: string;
  gender: string;
  blood_group: string;
  joining_date: string;
  sport_id: string;
  batch_id: string;
  status: string;
};

const EMPTY_FORM: FormData = {
  name: '', phone: '', parent_name: '', parent_phone: '',
  parent_email: '', age: '', gender: '', blood_group: '',
  joining_date: '', sport_id: '', batch_id: '', status: 'ACTIVE',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatINR(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function feesBadge(status: string) {
  const map: Record<string, string> = {
    paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
    unpaid: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300',
    partial: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  };
  return map[status] ?? 'bg-slate-100 text-slate-600';
}

function statusBadge(status: string) {
  return status === 'ACTIVE'
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <input
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        {...props}
      />
    </label>
  );
}

function Select({ label, children, ...props }: { label: string } & React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <select
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function StudentModal({
  student, sports, batches, onClose, onSave,
}: {
  student: Student | null;
  sports: Sport[];
  batches: Batch[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState<FormData>(
    student
      ? {
          name: student.name,
          phone: student.phone ?? '',
          parent_name: student.parent_name ?? '',
          parent_phone: student.parent_phone ?? '',
          parent_email: student.parent_email ?? '',
          age: student.age?.toString() ?? '',
          gender: student.gender ?? '',
          blood_group: student.blood_group ?? '',
          joining_date: student.joining_date?.slice(0, 10) ?? '',
          sport_id: '',
          batch_id: '',
          status: student.status,
        }
      : { ...EMPTY_FORM }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Name is required');
    setSaving(true);
    try {
      const url = student ? `/api/students/${student.student_id}` : '/api/students';
      const method = student ? 'PATCH' : 'POST';
      const body = {
        ...form,
        age: form.age ? Number(form.age) : undefined,
        sport_id: form.sport_id ? Number(form.sport_id) : undefined,
        batch_id: form.batch_id ? Number(form.batch_id) : undefined,
        joining_date: form.joining_date || undefined,
      };
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

  // Safe checks for arrays inside the modal
  const safeSports = Array.isArray(sports) ? sports : [];
  const safeBatches = Array.isArray(batches) ? batches : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-800 dark:text-white">
            {student ? 'Edit Student' : 'Add New Student'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input label="Full Name *" value={form.name} onChange={set('name')} placeholder="Student full name" required />
            </div>
            <Input label="Phone" value={form.phone} onChange={set('phone')} placeholder="10-digit number" type="tel" />
            <Input label="Age" value={form.age} onChange={set('age')} placeholder="e.g. 14" type="number" min={1} max={99} />
            <Select label="Gender" value={form.gender} onChange={set('gender')}>
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </Select>
            <Select label="Blood Group" value={form.blood_group} onChange={set('blood_group')}>
              <option value="">Select blood group</option>
              {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </Select>
            <Input label="Joining Date" value={form.joining_date} onChange={set('joining_date')} type="date" />
            <Select label="Status" value={form.status} onChange={set('status')}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
            <Select label="Sport" value={form.sport_id} onChange={set('sport_id')}>
              <option value="">Select sport</option>
              {safeSports.map(s => <option key={s.sport_id} value={s.sport_id}>{s.name}</option>)}
            </Select>
            <Select label="Batch" value={form.batch_id} onChange={set('batch_id')}>
              <option value="">Select batch</option>
              {safeBatches.map(b => <option key={b.batch_id} value={b.batch_id}>{b.name}{b.timing ? ` · ${b.timing}` : ''}</option>)}
            </Select>
            <Input label="Parent Name" value={form.parent_name} onChange={set('parent_name')} placeholder="Guardian name" />
            <Input label="Parent Phone" value={form.parent_phone} onChange={set('parent_phone')} placeholder="Parent contact" type="tel" />
            <div className="col-span-2">
              <Input label="Parent Email" value={form.parent_email} onChange={set('parent_email')} placeholder="parent@email.com" type="email" />
            </div>
          </div>
          {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-950 dark:text-rose-400">{error}</p>}
        </form>
        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            Cancel
          </button>
          <button
            onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : student ? 'Save Changes' : 'Add Student'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────

function StudentDrawer({ student, onClose, onEdit }: { student: Student; onClose: () => void; onEdit: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-sm flex-col overflow-y-auto border-l border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h2 className="font-semibold text-slate-800 dark:text-white">Student Detail</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 space-y-5 p-5">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-xl font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              {student.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-slate-800 dark:text-white">{student.name}</p>
              <p className="text-xs text-slate-500">{student.sport?.name ?? 'No sport'} · {student.batch?.name ?? 'No batch'}</p>
              <div className="mt-1 flex gap-1.5">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge(student.status)}`}>{student.status}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${feesBadge(student.fees_status)}`}>{student.fees_status}</span>
              </div>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-100 p-4 dark:border-slate-800">
            {[
              ['Phone', student.phone],
              ['Age', student.age],
              ['Gender', student.gender],
              ['Blood Group', student.blood_group],
              ['Joining Date', student.joining_date?.slice(0, 10)],
            ].map(([label, value]) => (
              <div key={String(label)}>
                <p className="text-xs text-slate-400">{label}</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{value ?? '—'}</p>
              </div>
            ))}
          </div>

          {/* Parent info */}
          <div className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Parent / Guardian</p>
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{student.parent_name ?? '—'}</p>
              <p className="text-xs text-slate-500">{student.parent_phone ?? '—'}</p>
              <p className="text-xs text-slate-500">{student.parent_email ?? '—'}</p>
            </div>
          </div>

          {/* Enrollments */}
          {student.enrollments && student.enrollments.length > 0 && (
            <div className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Enrollments</p>
              <div className="space-y-3">
                {student.enrollments.map((en) => (
                  <div key={en.enrollment_id} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{en.sport?.name ?? 'Sport'}</p>
                      <span className="text-xs font-semibold text-emerald-600">{formatINR(en.final_fee)}</span>
                    </div>
                    {en.duration_plan && (
                      <p className="text-xs text-slate-400">{en.duration_plan.name} · {en.duration_plan.duration_months}mo</p>
                    )}
                    {en.next_due_date && (
                      <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                        Next due: {new Date(en.next_due_date).toLocaleDateString('en-IN')}
                      </p>
                    )}
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${en.final_fee > 0 ? Math.min(100, (en.paid_amount / en.final_fee) * 100) : 0}%` }}
                      />
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {formatINR(en.paid_amount)} paid of {formatINR(en.final_fee)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800">
          <button
            onClick={onEdit}
            className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Edit Student
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFees, setFilterFees] = useState('');
  const [filterSport, setFilterSport] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page), limit: String(LIMIT),
        ...(search && { search }),
        ...(filterStatus && { status: filterStatus }),
        ...(filterFees && { fees_status: filterFees }),
        ...(filterSport && { sport_id: filterSport }),
      });
      const res = await fetch(`/api/students?${params}`);
      const data = await res.json();
      if (data && data.success) {
        setStudents(Array.isArray(data.data) ? data.data : []);
        setTotal(data.meta?.total ?? 0);
      } else {
        setStudents([]);
      }
    } catch (err) {
      console.error("Failed loading students:", err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus, filterFees, filterSport]);

  useEffect(() => { load(); }, [load]);

  // Safer data ingestion inside layout mount hooks
  useEffect(() => {
    fetch('/api/sports')
      .then(r => r.json())
      .then(d => setSports(d && d.success && Array.isArray(d.data) ? d.data : []))
      .catch(() => setSports([]));
      
    fetch('/api/batches')
      .then(r => r.json())
      .then(d => setBatches(d && d.success && Array.isArray(d.data) ? d.data : []))
      .catch(() => setBatches([]));
  }, []);

  function openAdd() { setEditStudent(null); setShowModal(true); }
  function openEdit(s: Student) { setEditStudent(s); setViewStudent(null); setShowModal(true); }

  async function toggleStatus(s: Student) {
    const newStatus = s.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await fetch(`/api/students/${s.student_id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    load();
  }

  async function deleteStudent(s: Student) {
    if (!confirm(`Delete ${s.name}? This cannot be undone.`)) return;
    await fetch(`/api/students/${s.student_id}`, { method: 'DELETE' });
    load();
  }

  const totalPages = Math.ceil(total / LIMIT);
  
  // Guard values globally before the UI returns
  const safeStudents = Array.isArray(students) ? students : [];
  const safeSports = Array.isArray(sports) ? sports : [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Students</h1>
          <p className="mt-0.5 text-sm text-slate-500">{total} total students</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
          Add Student
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by name or phone…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 min-w-48 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <select
          value={filterFees}
          onChange={(e) => { setFilterFees(e.target.value); setPage(1); }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          <option value="">All Fee Status</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partial</option>
        </select>
        <select
          value={filterSport}
          onChange={(e) => { setFilterSport(e.target.value); setPage(1); }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          <option value="">All Sports</option>
          {safeSports.map(s => <option key={s.sport_id} value={s.sport_id}>{s.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400">Loading students…</div>
        ) : safeStudents.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400">No students found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Sport / Batch</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Fees</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {safeStudents.map((s) => (
                  <tr key={s.student_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setViewStudent(s)}
                        className="flex items-center gap-2.5 text-left"
                      >
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 hover:text-blue-600 dark:text-white">{s.name}</p>
                          {s.age && <p className="text-xs text-slate-400">{s.age} yrs · {s.gender ?? '—'}</p>}
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-700 dark:text-slate-200">{s.sport?.name ?? '—'}</p>
                      <p className="text-xs text-slate-400">{s.batch?.name ?? 'No batch'}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{s.phone ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge(s.status)}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${feesBadge(s.fees_status)}`}>
                        {s.fees_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(s)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700"
                          title="Edit"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => toggleStatus(s)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700"
                          title={s.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                        </button>
                        <button
                          onClick={() => deleteStudent(s)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950"
                          title="Delete"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
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
          <p className="text-xs text-slate-400">
            Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
            >
              ← Prev
            </button>
            <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <StudentModal
          student={editStudent}
          sports={sports}
          batches={batches}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); load(); }}
        />
      )}
      {viewStudent && !showModal && (
        <StudentDrawer
          student={viewStudent}
          onClose={() => setViewStudent(null)}
          onEdit={() => openEdit(viewStudent)}
        />
      )}
    </div>
  );
}