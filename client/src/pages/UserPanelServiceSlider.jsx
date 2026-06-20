import { useState, useEffect } from 'react';

export default function UserPanelServiceSlider() {
  const [serviceSlider, setServiceSlider] = useState({ eyebrow: '', title: '', description: '', services: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/panel-settings');
      const data = await res.json();
      if (data.success) {
        setServiceSlider(data.data.serviceSlider || { eyebrow: '', title: '', description: '', services: [] });
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

  const handleImageUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        const newServices = [...serviceSlider.services];
        newServices[index].image = data.url;
        setServiceSlider({ ...serviceSlider, services: newServices });
        setMessage('Image uploaded successfully!');
      }
    } catch (err) {
      console.error(err);
      setMessage('Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const getRes = await fetch('/api/panel-settings');
      const getResData = await getRes.json();
      if (!getResData.success) throw new Error('Failed to get settings');
      
      const updatedSettings = { ...getResData.data, serviceSlider };
      
      const res = await fetch('/api/panel-settings', {
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
    setServiceSlider({ ...serviceSlider, [field]: value });
  };

  const handleServiceChange = (index, field, value) => {
    const newServices = [...serviceSlider.services];
    newServices[index][field] = value;
    setServiceSlider({ ...serviceSlider, services: newServices });
  };

  const addService = () => {
    setServiceSlider({ ...serviceSlider, services: [...serviceSlider.services, { title: 'New Service', desc: 'Description', icon: '⚙️', image: '' }] });
  };

  const removeService = (index) => {
    setServiceSlider({ ...serviceSlider, services: serviceSlider.services.filter((_, i) => i !== index) });
  };

  if (loading) return <div className="container py-5">Loading...</div>;

  return (
    <div className="container-fluid px-3 px-lg-4 py-4">
      <div className="page-heading mb-4">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-sliders" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">User Panel</p>
            <h1 className="h3 mb-1">Service Slider</h1>
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
          <h2 className="h5 mb-0">Header</h2>
        </div>
        <div className="panel-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Eyebrow</label>
              <input
                type="text"
                className="form-control"
                value={serviceSlider.eyebrow}
                onChange={(e) => handleChange('eyebrow', e.target.value)}
              />
            </div>
            <div className="col-md-8">
              <label className="form-label">Title</label>
              <input
                type="text"
                className="form-control"
                value={serviceSlider.title}
                onChange={(e) => handleChange('title', e.target.value)}
              />
            </div>
            <div className="col-md-12">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                rows="3"
                value={serviceSlider.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2 className="h5 mb-0">Services</h2>
          <button className="btn btn-outline-primary btn-sm" onClick={addService}>
            <i className="bi bi-plus"></i> Add Service
          </button>
        </div>
        <div className="panel-body">
          {serviceSlider.services.map((service, index) => (
            <div key={index} className="mb-4 p-3 border rounded">
              <div className="d-flex justify-content-between mb-2">
                <span className="fw-semibold">Service {index + 1}</span>
                <button className="btn btn-sm btn-danger" onClick={() => removeService(index)}>
                  <i className="bi bi-trash"></i>
                </button>
              </div>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">Service Image</label>
                  {service.image && <img src={service.image} alt={service.title} className="img-fluid mb-2" style={{ maxHeight: '150px' }} />}
                  <input 
                    type="file" 
                    className="form-control" 
                    accept="image/*" 
                    onChange={(e) => handleImageUpload(e, index)}
                    disabled={uploading}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Icon (Emoji)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={service.icon}
                    onChange={(e) => handleServiceChange(index, 'icon', e.target.value)}
                  />
                </div>
                <div className="col-md-9">
                  <label className="form-label">Title</label>
                  <input
                    type="text"
                    className="form-control"
                    value={service.title}
                    onChange={(e) => handleServiceChange(index, 'title', e.target.value)}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={service.desc}
                    onChange={(e) => handleServiceChange(index, 'desc', e.target.value)}
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
