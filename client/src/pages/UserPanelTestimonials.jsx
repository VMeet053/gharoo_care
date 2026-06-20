import { useState, useEffect } from 'react';

export default function UserPanelTestimonials() {
  const [testimonialsData, setTestimonialsData] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchSettings = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/panel-settings');
      const data = await res.json();
      if (data.success) {
        setTestimonialsData(data.data.testimonials);
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

      const res = await fetch('http://localhost:5000/api/upload-image', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        const newItems = [...testimonialsData.items];
        newItems[index].avatar = data.url;
        setTestimonialsData({ ...testimonialsData, items: newItems });
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
      const getRes = await fetch('http://localhost:5000/api/panel-settings');
      const getResData = await getRes.json();
      if (!getResData.success) throw new Error('Failed to get settings');
      
      const updatedSettings = { ...getResData.data, testimonials: testimonialsData };
      
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

  const handleItemChange = (index, field, value) => {
    const newItems = [...testimonialsData.items];
    newItems[index][field] = value;
    setTestimonialsData({ ...testimonialsData, items: newItems });
  };

  const addItem = () => {
    const newItems = [...testimonialsData.items, { name: 'New User', role: 'Customer', text: 'Testimonial text here', rating: 5, avatar: '' }];
    setTestimonialsData({ ...testimonialsData, items: newItems });
  };

  const removeItem = (index) => {
    const newItems = testimonialsData.items.filter((_, i) => i !== index);
    setTestimonialsData({ ...testimonialsData, items: newItems });
  };

  if (loading) return <div className="container py-5">Loading...</div>;

  return (
    <div className="container-fluid px-3 px-lg-4 py-4">
      <div className="page-heading mb-4">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-chat-quote" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">User Panel</p>
            <h1 className="h3 mb-1">Testimonials Section</h1>
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
          <h2 className="h5 mb-0">Testimonials</h2>
          <button className="btn btn-outline-primary btn-sm" onClick={addItem}>
            <i className="bi bi-plus" /> Add Testimonial
          </button>
        </div>
        <div className="panel-body">
          {testimonialsData.items.map((item, index) => (
            <div key={index} className="mb-4 p-3 border rounded">
              <div className="d-flex justify-content-between mb-2">
                <span className="fw-semibold">Testimonial {index + 1}</span>
                <button className="btn btn-sm btn-danger" onClick={() => removeItem(index)}><i className="bi bi-trash" /></button>
              </div>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">Avatar</label>
                  {item.avatar && <img src={item.avatar} alt={item.name} className="img-fluid mb-2 rounded-circle" style={{ maxHeight: '100px' }} />}
                  <input 
                    type="file" 
                    className="form-control" 
                    accept="image/*" 
                    onChange={(e) => handleImageUpload(e, index)}
                    disabled={uploading}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Name</label>
                  <input type="text" className="form-control" value={item.name} onChange={(e) => handleItemChange(index, 'name', e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Role</label>
                  <input type="text" className="form-control" value={item.role} onChange={(e) => handleItemChange(index, 'role', e.target.value)} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Rating (1-5)</label>
                  <input type="number" className="form-control" min={1} max={5} value={item.rating} onChange={(e) => handleItemChange(index, 'rating', Number(e.target.value))} />
                </div>
                <div className="col-md-12">
                  <label className="form-label">Text</label>
                  <textarea className="form-control" rows={3} value={item.text} onChange={(e) => handleItemChange(index, 'text', e.target.value)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
