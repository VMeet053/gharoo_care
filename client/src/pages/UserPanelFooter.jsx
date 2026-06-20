import { useState, useEffect } from 'react';

export default function UserPanelFooter() {
  const [footer, setFooter] = useState({ description: '', copyright: '', socialLinks: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchSettings = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/panel-settings');
      const data = await res.json();
      if (data.success) {
        setFooter(data.data.footer || { description: '', copyright: '', socialLinks: [] });
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
      
      const updatedSettings = { ...getResData.data, footer };
      
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

  const handleSocialLinkChange = (index, field, value) => {
    const newSocialLinks = [...footer.socialLinks];
    newSocialLinks[index][field] = value;
    setFooter({ ...footer, socialLinks: newSocialLinks });
  };

  const addSocialLink = () => {
    setFooter({ ...footer, socialLinks: [...footer.socialLinks, { platform: 'Facebook', url: 'https://facebook.com' }] });
  };

  const removeSocialLink = (index) => {
    setFooter({ ...footer, socialLinks: footer.socialLinks.filter((_, i) => i !== index) });
  };

  if (loading) return <div className="container py-5">Loading...</div>;

  return (
    <div className="container-fluid px-3 px-lg-4 py-4">
      <div className="page-heading mb-4">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-footer" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">User Panel</p>
            <h1 className="h3 mb-1">Footer Section</h1>
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
          <h2 className="h5 mb-0">Content</h2>
        </div>
        <div className="panel-body">
          <div className="mb-3">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              rows="3"
              value={footer.description}
              onChange={(e) => setFooter({ ...footer, description: e.target.value })}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Copyright</label>
            <input
              type="text"
              className="form-control"
              value={footer.copyright}
              onChange={(e) => setFooter({ ...footer, copyright: e.target.value })}
            />
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2 className="h5 mb-0">Social Links</h2>
          <button className="btn btn-outline-primary btn-sm" onClick={addSocialLink}>
            <i className="bi bi-plus"></i> Add Social Link
          </button>
        </div>
        <div className="panel-body">
          {footer.socialLinks.map((link, index) => (
            <div key={index} className="mb-4 p-3 border rounded">
              <div className="d-flex justify-content-between mb-2">
                <span className="fw-semibold">Social Link {index + 1}</span>
                <button className="btn btn-sm btn-danger" onClick={() => removeSocialLink(index)}>
                  <i className="bi bi-trash"></i>
                </button>
              </div>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Platform</label>
                  <input
                    type="text"
                    className="form-control"
                    value={link.platform}
                    onChange={(e) => handleSocialLinkChange(index, 'platform', e.target.value)}
                    placeholder="e.g. Facebook, Twitter"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">URL</label>
                  <input
                    type="text"
                    className="form-control"
                    value={link.url}
                    onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)}
                    placeholder="https://..."
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
