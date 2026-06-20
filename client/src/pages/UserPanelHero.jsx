import { useState, useEffect } from 'react';

export default function UserPanelHero() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState({ index: null, type: null });
  const [message, setMessage] = useState('');

  const fetchSettings = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/panel-settings');
      const data = await res.json();
      if (data.success) {
        setSlides(data.data.hero.slides);
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

  const handleImageUpload = async (e, index, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading({ index, type });
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('http://localhost:5000/api/upload-image', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        const newSlides = [...slides];
        newSlides[index][type] = data.url;
        setSlides(newSlides);
        setMessage('Image uploaded successfully!');
      }
    } catch (err) {
      console.error(err);
      setMessage('Error uploading image');
    } finally {
      setUploading({ index: null, type: null });
    }
  };

  const handleChange = (index, field, value) => {
    const newSlides = [...slides];
    newSlides[index][field] = value;
    setSlides(newSlides);
  };

  const addSlide = () => {
    const newSlides = [...slides, {
      eyebrow: 'New Slide',
      titleTop: 'Title',
      titleHighlight: 'Highlight',
      text: 'Description',
      bg: '',
      side: ''
    }];
    setSlides(newSlides);
  };

  const removeSlide = (index) => {
    const newSlides = slides.filter((_, i) => i !== index);
    setSlides(newSlides);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const getRes = await fetch('http://localhost:5000/api/panel-settings');
      const getResData = await getRes.json();
      if (!getResData.success) throw new Error('Failed to get settings');
      
      const updatedSettings = { ...getResData.data, hero: { slides } };
      
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

  if (loading) return <div className="container py-5">Loading...</div>;

  return (
    <div className="container-fluid px-3 px-lg-4 py-4">
      <div className="page-heading mb-4">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-house-door" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">User Panel</p>
            <h1 className="h3 mb-1">Hero Section</h1>
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
          <h2 className="h5 mb-0">Manage Hero Slides</h2>
          <button className="btn btn-outline-primary btn-sm" onClick={addSlide}>
            <i className="bi bi-plus" /> Add Slide
          </button>
        </div>
        <div className="panel-body">
          {slides.map((slide, index) => (
            <div key={index} className="mb-4 p-3 border rounded">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6>Slide {index + 1}</h6>
                <button className="btn btn-sm btn-danger" onClick={() => removeSlide(index)}>
                  <i className="bi bi-trash" />
                </button>
              </div>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Background Image</label>
                  {slide.bg && <img src={slide.bg} alt="Slide background" className="img-fluid mb-2" style={{ maxHeight: '150px' }} />}
                  <input 
                    type="file" 
                    className="form-control" 
                    accept="image/*" 
                    onChange={(e) => handleImageUpload(e, index, 'bg')}
                    disabled={uploading.index === index && uploading.type === 'bg'}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Side Image</label>
                  {slide.side && <img src={slide.side} alt="Slide side" className="img-fluid mb-2" style={{ maxHeight: '150px' }} />}
                  <input 
                    type="file" 
                    className="form-control" 
                    accept="image/*" 
                    onChange={(e) => handleImageUpload(e, index, 'side')}
                    disabled={uploading.index === index && uploading.type === 'side'}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Eyebrow</label>
                  <input type="text" className="form-control" value={slide.eyebrow} onChange={(e) => handleChange(index, 'eyebrow', e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Title Top</label>
                  <input type="text" className="form-control" value={slide.titleTop} onChange={(e) => handleChange(index, 'titleTop', e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Title Highlight</label>
                  <input type="text" className="form-control" value={slide.titleHighlight} onChange={(e) => handleChange(index, 'titleHighlight', e.target.value)} />
                </div>
                <div className="col-12">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" rows={3} value={slide.text} onChange={(e) => handleChange(index, 'text', e.target.value)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
