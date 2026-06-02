import { useCallback, useEffect, useState } from 'react';
import Loader from '../../components/Loader';
import { adminGet, adminPost, TIMING_OPTIONS } from '../../api/client';

const emptyForm = {
  name: '',
  timing: TIMING_OPTIONS[4],
  coach_id: '',
  sport_id: '',
  max_capacity: ''
};

export default function BatchesPanel() {
  const [batches, setBatches] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [sports, setSports] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [batchesRes, coachesRes, sportsRes] = await Promise.all([
        adminGet('/admin/batches'),
        adminGet('/admin/coaches'),
        adminGet('/admin/sports')
      ]);
      setBatches(batchesRes.data || []);
      setCoaches(coachesRes.data || []);
      const catalog = sportsRes.data || {};
      setSports(catalog.available_sports || []);
    } catch (error) {
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage({ text: '', type: '' });
    try {
      const result = await adminPost('/admin/batches', {
        name: form.name.trim(),
        timing: form.timing,
        coach_id: parseInt(form.coach_id, 10),
        sport_id: parseInt(form.sport_id, 10),
        max_capacity: form.max_capacity ? parseInt(form.max_capacity, 10) : undefined
      });
      setMessage({ text: result.message, type: 'success' });
      setForm(emptyForm);
      loadData();
    } catch (error) {
      setMessage({ text: error.message, type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Training Batches</h2>
        <p className="text-muted">Schedule training blocks linking sport, coach, and timing.</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <form className="card" onSubmit={handleSubmit}>
          <h3 className="mb-4 font-bold">Create Batch</h3>
          <div className="mb-4">
            <label className="label" htmlFor="batchName">Batch Name</label>
            <input id="batchName" name="name" className="input-field" value={form.name} onChange={handleChange} required />
          </div>
          <div className="mb-4">
            <label className="label" htmlFor="batchTiming">Timing</label>
            <select id="batchTiming" name="timing" className="input-field" value={form.timing} onChange={handleChange} required>
              {TIMING_OPTIONS.map((time) => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="label" htmlFor="batchCoach">Coach</label>
            <select id="batchCoach" name="coach_id" className="input-field" value={form.coach_id} onChange={handleChange} required>
              <option value="">Select coach…</option>
              {coaches.map((c) => (
                <option key={c.coach_id} value={c.coach_id}>{c.name} (ID: {c.coach_id})</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="label" htmlFor="batchSport">Sport</label>
            <select id="batchSport" name="sport_id" className="input-field" value={form.sport_id} onChange={handleChange} required>
              <option value="">Select sport…</option>
              {sports.map((s) => (
                <option key={s.sport_id} value={s.sport_id}>{s.name} (ID: {s.sport_id})</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="label" htmlFor="batchCapacity">Max Capacity (optional)</label>
            <input
              id="batchCapacity"
              name="max_capacity"
              type="number"
              min={1}
              className="input-field"
              value={form.max_capacity}
              onChange={handleChange}
              placeholder="e.g. 20"
            />
          </div>
          <button type="submit" className="btn-primary w-full">Create Batch</button>
        </form>
        <div className="card overflow-x-auto">
          <h3 className="mb-4 font-bold">Scheduled Batches</h3>
          {loading ? (
            <Loader />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Timing</th>
                  <th>Coach</th>
                  <th>Sport</th>
                  <th>Capacity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {batches.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted">No batches scheduled.</td>
                  </tr>
                ) : (
                  batches.map((batch) => (
                    <tr key={batch.batch_id}>
                      <td>{batch.name}</td>
                      <td>{batch.timing || '—'}</td>
                      <td>{batch.coach?.name || '—'}</td>
                      <td>{batch.sport?.name || '—'}</td>
                      <td>
                        {batch.enrolled_count ?? batch.students?.length ?? 0}
                        {batch.max_capacity != null ? ` / ${batch.max_capacity}` : ''}
                      </td>
                      <td>{batch.status || 'ACTIVE'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {message.text && (
        <p className={message.type === 'success' ? 'alert-success' : 'alert-error'}>{message.text}</p>
      )}
    </div>
  );
}
