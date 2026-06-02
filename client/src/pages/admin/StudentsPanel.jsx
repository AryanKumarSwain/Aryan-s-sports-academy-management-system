import { useCallback, useEffect, useState } from 'react';
import Loader from '../../components/Loader';
import { useFormDraft } from '../../hooks/useFormDraft';
import { adminDelete, adminGet, adminPost } from '../../api/client';

const emptyForm = {
  name: '',
  age: '',
  gender: 'Male',
  blood_group: '',
  parent_name: '',
  parent_email: '',
  parent_phone: '',
  sport_id: '',
  batch_id: ''
};

export default function StudentsPanel() {
  const { form, setForm, updateField, clearDraft, draftSavedAt } = useFormDraft(
    'sams_draft_student_form',
    emptyForm
  );
  const [students, setStudents] = useState([]);
  const [sports, setSports] = useState([]);
  const [availableBatches, setAvailableBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [studentsRes, sportsRes] = await Promise.all([
        adminGet('/admin/students'),
        adminGet('/admin/sports')
      ]);
      setStudents(studentsRes.data || []);
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

  useEffect(() => {
    if (!form.sport_id) {
      setAvailableBatches([]);
      setForm((prev) => ({ ...prev, batch_id: '' }));
      return;
    }

    const loadBatches = async () => {
      try {
        const result = await adminGet(
          `/admin/batches/available?sport_id=${encodeURIComponent(form.sport_id)}`
        );
        setAvailableBatches(result.data || []);
        setForm((prev) => {
          if (
            prev.batch_id &&
            !(result.data || []).some((b) => String(b.batch_id) === String(prev.batch_id))
          ) {
            return { ...prev, batch_id: '' };
          }
          return prev;
        });
      } catch (error) {
        setMessage({ text: error.message, type: 'error' });
      }
    };

    loadBatches();
  }, [form.sport_id, setForm]);

  const handleSportChange = (event) => {
    updateField(event);
    setForm((prev) => ({ ...prev, batch_id: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage({ text: '', type: '' });
    try {
      const result = await adminPost('/admin/students', {
        name: form.name.trim(),
        age: parseInt(form.age, 10),
        gender: form.gender,
        blood_group: form.blood_group || undefined,
        parent_name: form.parent_name.trim() || undefined,
        parent_email: form.parent_email.trim(),
        parent_phone: form.parent_phone.trim() || undefined,
        sport_id: parseInt(form.sport_id, 10),
        batch_id: parseInt(form.batch_id, 10)
      });
      setMessage({ text: result.message, type: 'success' });
      clearDraft();
      loadData();
    } catch (error) {
      setMessage({ text: error.message, type: 'error' });
    }
  };

  const handleRemove = async (studentId) => {
    if (!window.confirm('Archive this student? Record will be soft-deleted.')) {
      return;
    }
    try {
      await adminDelete(`/admin/students/${studentId}`);
      setMessage({ text: 'Student archived successfully.', type: 'success' });
      loadData();
    } catch (error) {
      setMessage({ text: error.message, type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Students Registration</h2>
        <p className="text-muted">
          Enroll students with smart batch options filtered by sport, active status, and seat availability.
        </p>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <form className="card" onSubmit={handleSubmit}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold">Add New Student</h3>
            {draftSavedAt && (
              <span className="text-xs text-muted">Draft saved</span>
            )}
          </div>
          <div className="mb-4">
            <label className="label" htmlFor="studentName">Name</label>
            <input id="studentName" name="name" className="input-field" value={form.name} onChange={updateField} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="studentAge">Age</label>
              <input id="studentAge" name="age" type="number" min={1} max={100} className="input-field" value={form.age} onChange={updateField} required />
            </div>
            <div>
              <label className="label" htmlFor="studentGender">Gender</label>
              <select id="studentGender" name="gender" className="input-field" value={form.gender} onChange={updateField} required>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div className="mb-4 mt-4">
            <label className="label" htmlFor="studentBlood">Blood Group</label>
            <select id="studentBlood" name="blood_group" className="input-field" value={form.blood_group} onChange={updateField}>
              <option value="">Select…</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="label" htmlFor="parentName">Parent Name</label>
            <input id="parentName" name="parent_name" className="input-field" value={form.parent_name} onChange={updateField} />
          </div>
          <div className="mb-4">
            <label className="label" htmlFor="parentEmail">Parent Email</label>
            <input id="parentEmail" name="parent_email" type="email" className="input-field" value={form.parent_email} onChange={updateField} required />
          </div>
          <div className="mb-4">
            <label className="label" htmlFor="parentPhone">Parent Phone</label>
            <input id="parentPhone" name="parent_phone" type="tel" className="input-field" value={form.parent_phone} onChange={updateField} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="studentSport">Sport</label>
              <select id="studentSport" name="sport_id" className="input-field" value={form.sport_id} onChange={handleSportChange} required>
                <option value="">Select sport…</option>
                {sports.map((s) => (
                  <option key={s.sport_id} value={s.sport_id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="studentBatch">Batch (sport · active · seats)</label>
              <select
                id="studentBatch"
                name="batch_id"
                className="input-field"
                value={form.batch_id}
                onChange={updateField}
                required
                disabled={!form.sport_id}
              >
                <option value="">
                  {!form.sport_id ? 'Select sport first…' : availableBatches.length ? 'Select batch…' : 'No batches with seats'}
                </option>
                {availableBatches.map((b) => (
                  <option key={b.batch_id} value={b.batch_id}>
                    {b.name}
                    {b.timing ? ` · ${b.timing}` : ''}
                    {b.max_capacity != null
                      ? ` · ${b.available_seats ?? 0}/${b.max_capacity} seats`
                      : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="submit" className="btn-primary flex-1">Enroll Student</button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowClearConfirm(true)}
            >
              Clear Form
            </button>
          </div>
        </form>
        <div className="card overflow-x-auto">
          <h3 className="mb-4 font-bold">Active Students</h3>
          {loading ? (
            <Loader />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Sport</th>
                  <th>Batch</th>
                  <th>Fees</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted">No active students.</td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.student_id}>
                      <td>{student.name}</td>
                      <td>{student.sport?.name || '—'}</td>
                      <td>{student.batch?.name || '—'}</td>
                      <td>
                        <span className={`rounded px-2 py-0.5 text-xs font-semibold ${student.fees_status === 'paid' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}`}>
                          {student.fees_status}
                        </span>
                      </td>
                      <td>
                        <button type="button" className="btn-danger btn-sm" onClick={() => handleRemove(student.student_id)}>
                          Remove
                        </button>
                      </td>
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
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card max-w-md">
            <h3 className="mb-2 font-bold">Clear form?</h3>
            <p className="mb-4 text-sm text-muted">This removes the saved draft and resets all fields.</p>
            <div className="flex gap-2">
              <button type="button" className="btn-danger flex-1" onClick={() => { clearDraft(); setShowClearConfirm(false); }}>
                Yes, clear
              </button>
              <button type="button" className="btn-secondary flex-1" onClick={() => setShowClearConfirm(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
