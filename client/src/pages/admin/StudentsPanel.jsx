import { useCallback, useEffect, useState } from 'react';
import Loader from '../../components/Loader';
import { adminDelete, adminGet, adminPost } from '../../api/client';

const emptyForm = {
  name: '',
  age: '',
  gender: 'Male',
  blood_group: '',
  parent_email: '',
  sport_id: '',
  batch_id: ''
};

export default function StudentsPanel() {
  const [students, setStudents] = useState([]);
  const [sports, setSports] = useState([]);
  const [batches, setBatches] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [studentsRes, sportsRes, batchesRes] = await Promise.all([
        adminGet('/admin/students'),
        adminGet('/admin/sports'),
        adminGet('/admin/batches')
      ]);
      setStudents(studentsRes.data || []);
      const catalog = sportsRes.data || {};
      setSports(catalog.available_sports || []);
      setBatches(batchesRes.data || []);
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
      const result = await adminPost('/admin/students', {
        name: form.name.trim(),
        age: parseInt(form.age, 10),
        gender: form.gender,
        blood_group: form.blood_group || undefined,
        parent_email: form.parent_email.trim(),
        sport_id: parseInt(form.sport_id, 10),
        batch_id: parseInt(form.batch_id, 10)
      });
      setMessage({ text: result.message, type: 'success' });
      setForm(emptyForm);
      loadData();
    } catch (error) {
      setMessage({ text: error.message, type: 'error' });
    }
  };

  const handleRemove = async (studentId) => {
    if (!window.confirm('Archive this student? Record will be soft-deleted (is_deleted: true).')) {
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
        <p className="text-muted">Enroll active students with parent email for attendance notifications.</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <form className="card" onSubmit={handleSubmit}>
          <h3 className="mb-4 font-bold">Add New Student</h3>
          <div className="mb-4">
            <label className="label" htmlFor="studentName">Name</label>
            <input id="studentName" name="name" className="input-field" value={form.name} onChange={handleChange} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="studentAge">Age</label>
              <input id="studentAge" name="age" type="number" min={1} max={100} className="input-field" value={form.age} onChange={handleChange} required />
            </div>
            <div>
              <label className="label" htmlFor="studentGender">Gender</label>
              <select id="studentGender" name="gender" className="input-field" value={form.gender} onChange={handleChange} required>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div className="mb-4 mt-4">
            <label className="label" htmlFor="studentBlood">Blood Group</label>
            <select id="studentBlood" name="blood_group" className="input-field" value={form.blood_group} onChange={handleChange}>
              <option value="">Select…</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="label" htmlFor="parentEmail">Parent Email</label>
            <input id="parentEmail" name="parent_email" type="email" className="input-field" value={form.parent_email} onChange={handleChange} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="studentSport">Sport</label>
              <select id="studentSport" name="sport_id" className="input-field" value={form.sport_id} onChange={handleChange} required>
                <option value="">Select sport…</option>
                {sports.map((s) => (
                  <option key={s.sport_id} value={s.sport_id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="studentBatch">Batch</label>
              <select id="studentBatch" name="batch_id" className="input-field" value={form.batch_id} onChange={handleChange} required>
                <option value="">Select batch…</option>
                {batches.map((b) => (
                  <option key={b.batch_id} value={b.batch_id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary mt-4 w-full">Enroll Student</button>
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
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Blood</th>
                  <th>Fees</th>
                  <th>Batch</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted">No active students.</td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.student_id}>
                      <td>{student.name}</td>
                      <td>{student.age ?? '—'}</td>
                      <td>{student.gender}</td>
                      <td>{student.blood_group || '—'}</td>
                      <td>
                        <span className={`rounded px-2 py-0.5 text-xs font-semibold ${student.fees_status === 'paid' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}`}>
                          {student.fees_status}
                        </span>
                      </td>
                      <td>{student.batch?.name || '—'}</td>
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
    </div>
  );
}
