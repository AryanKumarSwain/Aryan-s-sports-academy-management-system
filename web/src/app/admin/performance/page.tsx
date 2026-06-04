'use client';

import { useEffect, useState, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Student = {
  student_id: number;
  name: string;
};

type Attribute = {
  attribute_id: number;
  name: string;
  category: string | null;
};

type Coach = {
  coach_id: number;
  name: string;
};

type PerformanceRecord = {
  score_id: number;
  score: number;
  notes: string | null;
  scored_at: string;
  student: Student;
  attribute: Attribute;
  coach: Coach;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function AdminPerformancePage() {
  const [records, setRecords] = useState<PerformanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Fetching logic pointing directly to the Next.js API route we just checked
  const loadPerformanceData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/performance');
      const data = await res.json();
      
      if (data && data.success) {
        setRecords(Array.isArray(data.data) ? data.data : []);
      } else {
        throw new Error(data.error ?? 'Failed to load records');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPerformanceData();
  }, [loadPerformanceData]);

  // Client-side search filtering by student name or attribute name
  const safeRecords = Array.isArray(records) ? records : [];
  const filteredRecords = safeRecords.filter((r) => {
    const studentName = r.student?.name?.toLowerCase() ?? '';
    const attributeName = r.attribute?.name?.toLowerCase() ?? '';
    const searchLower = search.toLowerCase();
    return studentName.includes(searchLower) || attributeName.includes(searchLower);
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Performance Tracker</h1>
        <p className="mt-0.5 text-sm text-slate-500">View student performance history and score logs.</p>
      </div>

      {/* Filters/Search block */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by student or attribute..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <button 
          onClick={loadPerformanceData}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          Refresh
        </button>
      </div>

      {/* Error State Banner */}
      {error && (
        <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
          {error}
        </div>
      )}

      {/* Records Table Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400">Loading evaluation records...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400">No performance records found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Student Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Attribute / Skill</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Score</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Evaluated By</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Notes</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filteredRecords.map((rec) => (
                  <tr key={rec.score_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">
                      {rec.student?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-700 dark:text-slate-200">{rec.attribute?.name ?? '—'}</span>
                      {rec.attribute?.category && (
                        <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] uppercase font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          {rec.attribute.category}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-lg bg-blue-50 px-2.5 py-1 text-sm font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                        {rec.score}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {rec.coach?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate" title={rec.notes ?? ''}>
                      {rec.notes ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-400">
                      {rec.scored_at ? formatDate(rec.scored_at) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}