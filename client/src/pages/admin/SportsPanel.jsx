import { useCallback, useEffect, useState } from 'react';
import Loader from '../../components/Loader';
import { adminGet, adminPost } from '../../api/client';

export default function SportsPanel() {
  const [catalog, setCatalog] = useState({ global_sports: [], academy_sports: [], available_sports: [] });
  const [customName, setCustomName] = useState('');
  const [linkSportId, setLinkSportId] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  const loadSports = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminGet('/admin/sports');
      setCatalog(result.data || { global_sports: [], academy_sports: [], available_sports: [] });
    } catch (error) {
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSports();
  }, [loadSports]);

  const handleCreateCustom = async (event) => {
    event.preventDefault();
    setMessage({ text: '', type: '' });
    try {
      const result = await adminPost('/admin/sports', { name: customName.trim() });
      setMessage({ text: result.message, type: 'success' });
      setCustomName('');
      loadSports();
    } catch (error) {
      setMessage({ text: error.message, type: 'error' });
    }
  };

  const handleLinkGlobal = async (event) => {
    event.preventDefault();
    setMessage({ text: '', type: '' });
    try {
      const result = await adminPost('/admin/sports/link', {
        sport_id: parseInt(linkSportId, 10)
      });
      setMessage({ text: result.message, type: 'success' });
      setLinkSportId('');
      loadSports();
    } catch (error) {
      setMessage({ text: error.message, type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Sports Catalog</h2>
        <p className="text-muted">Create custom sports or link global catalog entries to your workspace.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <form className="card" onSubmit={handleCreateCustom}>
          <h3 className="mb-4 font-bold">Create Custom Sport</h3>
          <label className="label" htmlFor="customSportName">Sport Name</label>
          <input
            id="customSportName"
            className="input-field mb-4"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary">Add Custom Sport</button>
        </form>
        <form className="card" onSubmit={handleLinkGlobal}>
          <h3 className="mb-4 font-bold">Link Global Sport</h3>
          <label className="label" htmlFor="globalSportId">Global Sport</label>
          <select
            id="globalSportId"
            className="input-field mb-4"
            value={linkSportId}
            onChange={(e) => setLinkSportId(e.target.value)}
            required
          >
            <option value="">Select global sport…</option>
            {(catalog.global_sports || []).map((sport) => (
              <option key={sport.sport_id} value={sport.sport_id}>
                {sport.name}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-secondary">Link to Academy</button>
        </form>
      </div>
      {message.text && (
        <p className={message.type === 'success' ? 'alert-success' : 'alert-error'}>{message.text}</p>
      )}
      <div className="card overflow-x-auto">
        <h3 className="mb-4 font-bold">Available Sports in Workspace</h3>
        {loading ? (
          <Loader message="Loading sports catalog…" />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {(catalog.available_sports || []).length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-muted">
                    No sports available. Create or link a sport above.
                  </td>
                </tr>
              ) : (
                catalog.available_sports.map((sport) => (
                  <tr key={sport.sport_id}>
                    <td>{sport.sport_id}</td>
                    <td>{sport.name}</td>
                    <td>{sport.is_custom ? 'Custom' : 'Linked / Global'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
