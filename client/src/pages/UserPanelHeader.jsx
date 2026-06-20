import { useState, useEffect } from 'react';

export default function UserPanelHeader() {
  const [header, setHeader] = useState({ logo: '', navLinks: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchSettings = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/panel-settings');
      const data = await res.json();
      if (data.success) {
        setHeader(data.data.header || { logo: '', navLinks: [] });
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
      
      const updatedSettings = { ...getResData.data, header };
      
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

  const handleLinkChange = (index, field, value) => {
    const newNavLinks = [...header.navLinks];
    newNavLinks[index][field] = value;
    setHeader({ ...header, navLinks: newNavLinks });
  };

  const addLink = () => {
    setHeader({ ...header, navLinks: [...header.navLinks, { text: 'New Link', link: '/' }] });
  };

  const removeLink = (index) => {
    setHeader({ ...header, navLinks: header.navLinks.filter((_, i) => i !== index) });
  };

  if (loading) return <div className="container py-5">Loading...</div>;

  return (
    <div className="container-fluid px-3 px-lg-4 py-4">
      <div className="page-heading mb-4">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-header" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">User Panel</p>
            <h1 className="h3 mb-1">Header Section</h1>
          </div>
        </div>
        <div className="heading-actions">
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
      {message && <div className={`alert ${message.includes('saved') ? 'alert-success' : 'alert-danger'}`}>{message}</div>}

      <section className="panel mb-4">
        <div className="panel-header">
          <h2 className="h5 mb-0">Logo</h2>
        </div>
        <div className="panel-body">
          <div className="mb-3">
            <label className="form-label">Logo URL</label>
            <input
              type="text"
              className="form-control"
              value={header.logo}
              onChange={(e) => setHeader({ ...header, logo: e.target.value })}
              placeholder="https://example.com/logo.png"
            />
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2 className="h5 mb-0">Navigation Links</h2>
          <button className="btn btn-outline-primary btn-sm" onClick={addLink}>
            <i className="bi bi-plus"></i> Add Link
          </button>
        </div>
        <div className="panel-body">
          {header.navLinks.map((link, index) => (
            <div key={index} className="mb-4 p-3 border rounded">
              <div className="d-flex justify-content-between mb-2">
                <span className="fw-semibold">Link {index + 1}</span>
                <button className="btn btn-sm btn-danger" onClick={() => removeLink(index)}>
                  <i className="bi bi-trash"></i>
                </button>
              </div>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Text</label>
                  <input
                    type="text"
                    className="form-control"
                    value={link.text}
                    onChange={(e) => handleLinkChange(index, 'text', e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">URL</label>
                  <input
                    type="text"
                    className="form-control"
                    value={link.link}
                    onChange={(e) => handleLinkChange(index, 'link', e.target.value)}
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
