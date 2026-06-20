import { useState, useEffect } from 'react';

export default function UserPanelContact() {
  const [contactData, setContactData] = useState({ title: '', description: '', phone: '', email: '', address: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchSettings = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/panel-settings');
      const data = await res.json();
      if (data.success) {
        setContactData(data.data.contact);
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
      
      const updatedSettings = { ...getResData.data, contact: contactData };
      
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

  const handleChange = (field, value) => {
    setContactData({ ...contactData, [field]: value });
  };

  if (loading) return <div className="container py-5">Loading...</div>;

  return (
    <div className="container-fluid px-3 px-lg-4 py-4">
      <div className="page-heading mb-4">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-telephone" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">User Panel</p>
            <h1 className="h3 mb-1">Contact Section</h1>
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
          <h2 className="h5 mb-0">Contact Information</h2>
        </div>
        <div className="panel-body">
          <div className="row g-3">
            <div className="col-md-12">
              <label className="form-label">Title</label>
              <input type="text" className="form-control" value={contactData.title} onChange={(e) => handleChange('title', e.target.value)} />
            </div>
            <div className="col-md-12">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={3} value={contactData.description} onChange={(e) => handleChange('description', e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Phone</label>
              <input type="text" className="form-control" value={contactData.phone} onChange={(e) => handleChange('phone', e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" value={contactData.email} onChange={(e) => handleChange('email', e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Address</label>
              <input type="text" className="form-control" value={contactData.address} onChange={(e) => handleChange('address', e.target.value)} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
