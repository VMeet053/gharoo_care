import { useState, useEffect } from 'react';

export default function UserPanelStats() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchSettings = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/panel-settings');
      const data = await res.json();
      if (data.success) {
        setStats(data.data.stats?.items || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const getRes = await fetch('http://localhost:5000/api/panel-settings');
      const getResData = await getRes.json();
      if (!getResData.success) throw new Error('Failed to get settings');
      
      const updatedSettings = { ...getResData.data, stats: { items: stats } };
      
      const res = await fetch('http://localhost:5000/api/panel-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings)
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Settings saved successfully!');
      }
    } catch (err) {
      setMessage('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleStatChange = (index, field, value) => {
    const newStats = [...stats];
    newStats[index][field] = value;
    setStats(newStats);
  };

  const addStat = () => {
    setStats([...stats, { icon: '🏆', value: '100', format: 'default', label: 'New Stat' }]);
  };

  const removeStat = (index) => {
    setStats(stats.filter((_, i) => i !== index));
  };

  if (loading) return <div className="container py-5">Loading...</div>;

  return (
    <div className="container-fluid px-3 px-lg-4 py-4">
      <div className="page-heading mb-4">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-bar-chart" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">User Panel</p>
            <h1 className="h3 mb-1">Stats Section</h1>
          </div>
        </div>
        <div className="heading-actions">
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
      {message && <div className={`alert ${message.includes('saved') ? 'alert-success' : 'alert-danger'}`}>{message}</div>}

      <section className="panel">
        <div className="panel-header">
          <h2 className="h5 mb-0">Stats</h2>
          <button className="btn btn-outline-primary btn-sm" onClick={addStat}>
            <i className="bi bi-plus"></i> Add Stat
          </button>
        </div>
        <div className="panel-body">
          {stats.map((stat, index) => (
            <div key={index} className="mb-4 p-3 border rounded">
              <div className="d-flex justify-content-between mb-2">
                <span className="fw-semibold">Stat {index + 1}</span>
                <button className="btn btn-sm btn-danger" onClick={() => removeStat(index)}>
                  <i className="bi bi-trash"></i>
                </button>
              </div>
              <div className="row g-3">
                <div className="col-md-2">
                  <label className="form-label">Icon (Emoji)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={stat.icon}
                    onChange={(e) => handleStatChange(index, 'icon', e.target.value)}
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label">Value</label>
                  <input
                    type="text"
                    className="form-control"
                    value={stat.value}
                    onChange={(e) => handleStatChange(index, 'value', e.target.value)}
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label">Format</label>
                  <select
                    className="form-select"
                    value={stat.format}
                    onChange={(e) => handleStatChange(index, 'format', e.target.value)}
                  >
                    <option value="default">Default</option>
                    <option value="k">Thousands (k)</option>
                    <option value="plus">Plus (+)</option>
                    <option value="percent">Percent (%)</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Label</label>
                  <input
                    type="text"
                    className="form-control"
                    value={stat.label}
                    onChange={(e) => handleStatChange(index, 'label', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
