import { useCallback, useEffect, useState } from 'react';
import Loader from '../../components/Loader';
import { adminGet, adminPatch, adminPost } from '../../api/client';

const emptyForm = {
  student_id: '',
  amount: '',
  payment_date: new Date().toISOString().split('T')[0],
  method: 'upi',
  status: 'pending'
};

export default function PaymentsPanel() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [paymentsRes, studentsRes] = await Promise.all([
        adminGet('/admin/payments'),
        adminGet('/admin/students')
      ]);
      setPayments(paymentsRes.data || []);
      setStudents(studentsRes.data || []);
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
      const result = await adminPost('/admin/payments', {
        student_id: parseInt(form.student_id, 10),
        amount: parseFloat(form.amount),
        payment_date: form.payment_date,
        method: form.method,
        status: form.status
      });
      setMessage({ text: result.message, type: 'success' });
      setForm({ ...emptyForm, payment_date: new Date().toISOString().split('T')[0] });
      loadData();
    } catch (error) {
      setMessage({ text: error.message, type: 'error' });
    }
  };

  const updateStatus = async (paymentId, status, rejected_reason) => {
    try {
      const result = await adminPatch(`/admin/payments/${paymentId}/status`, {
        status,
        rejected_reason
      });
      setMessage({ text: result.message, type: 'success' });
      loadData();
    } catch (error) {
      setMessage({ text: error.message, type: 'error' });
    }
  };

  const rejectPayment = async (paymentId) => {
    const reason = window.prompt('Rejection reason (optional):');
    if (reason === null) return;
    await updateStatus(paymentId, 'rejected', reason || undefined);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Payment Processing</h2>
        <p className="text-muted">Record payments and update processing states for student fee tracking.</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <form className="card" onSubmit={handleSubmit}>
          <h3 className="mb-4 font-bold">Record Payment</h3>
          <div className="mb-4">
            <label className="label" htmlFor="payStudent">Student</label>
            <select id="payStudent" name="student_id" className="input-field" value={form.student_id} onChange={handleChange} required>
              <option value="">Select student…</option>
              {students.map((s) => (
                <option key={s.student_id} value={s.student_id}>{s.name} (ID: {s.student_id})</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="label" htmlFor="payAmount">Amount</label>
            <input id="payAmount" name="amount" type="number" min="0" step="0.01" className="input-field" value={form.amount} onChange={handleChange} required />
          </div>
          <div className="mb-4">
            <label className="label" htmlFor="payDate">Payment Date</label>
            <input id="payDate" name="payment_date" type="date" className="input-field" value={form.payment_date} onChange={handleChange} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="payMethod">Method</label>
              <select id="payMethod" name="method" className="input-field" value={form.method} onChange={handleChange} required>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="online">Online</option>
                <option value="upi">UPI</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="payStatus">Status</label>
              <select id="payStatus" name="status" className="input-field" value={form.status} onChange={handleChange}>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary mt-4 w-full">Create Payment</button>
        </form>
        <div className="card overflow-x-auto">
          <h3 className="mb-4 font-bold">Payment Records</h3>
          {loading ? (
            <Loader />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted">No payments recorded.</td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.payment_id}>
                      <td>{payment.student?.name || payment.student_id}</td>
                      <td>${parseFloat(payment.amount).toFixed(2)}</td>
                      <td>{new Date(payment.payment_date).toLocaleDateString()}</td>
                      <td>{payment.method}</td>
                      <td>{payment.status}</td>
                      <td className="space-x-1">
                        {payment.status !== 'completed' && (
                          <button type="button" className="btn-success btn-sm" onClick={() => updateStatus(payment.payment_id, 'completed')}>
                            Mark Paid
                          </button>
                        )}
                        {payment.status === 'pending' && (
                          <button type="button" className="btn-danger btn-sm" onClick={() => rejectPayment(payment.payment_id)}>
                            Reject
                          </button>
                        )}
                        {payment.status !== 'failed' && payment.status !== 'rejected' && (
                          <button type="button" className="btn-secondary btn-sm" onClick={() => updateStatus(payment.payment_id, 'failed')}>
                            Fail
                          </button>
                        )}
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
