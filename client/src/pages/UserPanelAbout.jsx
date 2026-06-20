import { useState, useEffect } from 'react';

export default function UserPanelAbout() {
  const [aboutData, setAboutData] = useState({ 
    eyebrow: '', 
    title: '', 
    description: '', 
    features: [], 
    mainImage: '', 
    subImage: '', 
    experience: { number: '25+', line1: 'Years Experiences', line2: 'Maintenance Services' }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState({ type: null });
  const [message, setMessage] = useState('');

  const fetchSettings = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/panel-settings');
      const data = await res.json();
      if (data.success) {
        setAboutData(data.data.about);
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

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading({ type });
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('http://localhost:5000/api/upload-image', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        setAboutData({ ...aboutData, [type]: data.url });
        setMessage('Image uploaded successfully!');
      }
    } catch (err) {
      console.error(err);
      setMessage('Error uploading image');
    } finally {
      setUploading({ type: null });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const getRes = await fetch('http://localhost:5000/api/panel-settings');
      const getResData = await getRes.json();
      if (!getResData.success) throw new Error('Failed to get settings');
      
      const updatedSettings = { ...getResData.data, about: aboutData };
      
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
    setAboutData({ ...aboutData, [field]: value });
  };

  const handleExperienceChange = (field, value) => {
    setAboutData({ 
      ...aboutData, 
      experience: { ...aboutData.experience, [field]: value }
    });
  };

  const handleFeatureChange = (index, field, value) => {
    const newFeatures = [...aboutData.features];
    newFeatures[index][field] = value;
    setAboutData({ ...aboutData, features: newFeatures });
  };

  const addFeature = () => {
    const newFeatures = [...aboutData.features, { icon: '🎉', title: 'New Feature', desc: 'Description' }];
    setAboutData({ ...aboutData, features: newFeatures });
  };

  const removeFeature = (index) => {
    const newFeatures = aboutData.features.filter((_, i) => i !== index);
    setAboutData({ ...aboutData, features: newFeatures });
  };

  if (loading) return <div className="container py-5">Loading...</div>;

  return (
    <div className="container-fluid px-3 px-lg-4 py-4">
      <div className="page-heading mb-4">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-info-circle" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">User Panel</p>
            <h1 className="h3 mb-1">About Section</h1>
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
          <h2 className="h5 mb-0">About Content</h2>
        </div>
        <div className="panel-body">
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label className="form-label">Eyebrow</label>
              <input type="text" className="form-control" value={aboutData.eyebrow} onChange={(e) => handleChange('eyebrow', e.target.value)} />
            </div>
            <div className="col-md-12">
              <label className="form-label">Title</label>
              <input type="text" className="form-control" value={aboutData.title} onChange={(e) => handleChange('title', e.target.value)} />
            </div>
            <div className="col-md-12">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={4} value={aboutData.description} onChange={(e) => handleChange('description', e.target.value)} />
            </div>
          </div>

          {/* Experience Badge */}
          <div className="mb-4 p-3 border rounded">
            <h6 className="mb-3">Experience Badge</h6>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Number</label>
                <input type="text" className="form-control" value={aboutData.experience?.number || ''} onChange={(e) => handleExperienceChange('number', e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Line 1</label>
                <input type="text" className="form-control" value={aboutData.experience?.line1 || ''} onChange={(e) => handleExperienceChange('line1', e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Line 2</label>
                <input type="text" className="form-control" value={aboutData.experience?.line2 || ''} onChange={(e) => handleExperienceChange('line2', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="mb-4">
            <h6 className="mb-3">Images</h6>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Main Image</label>
                {aboutData.mainImage && <img src={aboutData.mainImage} alt="About main" className="img-fluid mb-2" style={{ maxHeight: '150px' }} />}
                <input 
                  type="file" 
                  className="form-control" 
                  accept="image/*" 
                  onChange={(e) => handleImageUpload(e, 'mainImage')}
                  disabled={uploading.type === 'mainImage'}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Sub Image</label>
                {aboutData.subImage && <img src={aboutData.subImage} alt="About sub" className="img-fluid mb-2" style={{ maxHeight: '150px' }} />}
                <input 
                  type="file" 
                  className="form-control" 
                  accept="image/*" 
                  onChange={(e) => handleImageUpload(e, 'subImage')}
                  disabled={uploading.type === 'subImage'}
                />
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6>Features</h6>
            <button className="btn btn-sm btn-outline-primary" onClick={addFeature}>
              <i className="bi bi-plus" /> Add Feature
            </button>
          </div>
          {aboutData.features.map((feature, index) => (
            <div key={index} className="mb-4 p-3 border rounded">
              <div className="d-flex justify-content-between mb-2">
                <span className="fw-semibold">Feature {index + 1}</span>
                <button className="btn btn-sm btn-danger" onClick={() => removeFeature(index)}><i className="bi bi-trash" /></button>
              </div>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Icon (Emoji)</label>
                  <input type="text" className="form-control" value={feature.icon} onChange={(e) => handleFeatureChange(index, 'icon', e.target.value)} />
                </div>
                <div className="col-md-8">
                  <label className="form-label">Title</label>
                  <input type="text" className="form-control" value={feature.title} onChange={(e) => handleFeatureChange(index, 'title', e.target.value)} />
                </div>
                <div className="col-12">
                  <label className="form-label">Description</label>
                  <input type="text" className="form-control" value={feature.desc} onChange={(e) => handleFeatureChange(index, 'desc', e.target.value)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
