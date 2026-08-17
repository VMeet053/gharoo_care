import { useState, useEffect } from 'react';

export default function UserPanelNewSection() {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(null);
  const [message, setMessage] = useState('');

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/panel-settings');
      const data = await res.json();
      if (data.success) {
        setFeatures(data.data.newSection?.features || []);
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
      const getRes = await fetch('/api/panel-settings');
      const getResData = await getRes.json();
      if (!getResData.success) throw new Error('Failed to get settings');
      
      const updatedSettings = { ...getResData.data, newSection: { features } };
      
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

  const handleFeatureChange = (index, field, value) => {
    const newFeatures = [...features];
    newFeatures[index][field] = value;
    setFeatures(newFeatures);
  };

  const handleDetailImageUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(index);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/upload-image', { method: 'POST', body: formData });
      const data = await res.json();
      if (!data.success) throw new Error('Upload failed');
      handleFeatureChange(index, 'detailImage', data.url);
      setMessage('Detail image uploaded successfully!');
    } catch (err) {
      console.error(err);
      setMessage('Error uploading detail image');
    } finally {
      setUploading(null);
    }
  };

  const handleKeyPointsChange = (index, value) => {
    handleFeatureChange(index, 'keyPoints', value.split('\n').map((point) => point.trim()).filter(Boolean));
  };

  const addFeature = () => {
    setFeatures([...features, { title: 'New Feature', description: 'Description', icon: '', detailImage: '', detailContent: '', keyPoints: [], link: '' }]);
  };

  const removeFeature = (index) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  if (loading) return <div className="container py-5">Loading...</div>;

  return (
    <div className="container-fluid px-3 px-lg-4 py-4">
      <div className="page-heading mb-4">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-stars" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">User Panel</p>
            <h1 className="h3 mb-1">New Section</h1>
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
          <h2 className="h5 mb-0">Features</h2>
          <button className="btn btn-outline-primary btn-sm" onClick={addFeature}>
            <i className="bi bi-plus"></i> Add Feature
          </button>
        </div>
        <div className="panel-body">
          {features.map((feature, index) => (
            <div key={index} className="mb-4 p-3 border rounded">
              <div className="d-flex justify-content-between mb-2">
                <span className="fw-semibold">Feature {index + 1}</span>
                <button className="btn btn-sm btn-danger" onClick={() => removeFeature(index)}>
                  <i className="bi bi-trash"></i>
                </button>
              </div>
              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label">Icon (Emoji)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={feature.icon}
                    onChange={(e) => handleFeatureChange(index, 'icon', e.target.value)}
                  />
                </div>
                <div className="col-md-9">
                  <label className="form-label">Title</label>
                  <input
                    type="text"
                    className="form-control"
                    value={feature.title}
                    onChange={(e) => handleFeatureChange(index, 'title', e.target.value)}
                  />
                </div>
                <div className="col-md-12">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={feature.description}
                    onChange={(e) => handleFeatureChange(index, 'description', e.target.value)}
                  />
                </div>
                <div className="col-md-12">
                  <label className="form-label">Custom Read More Link (optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={feature.link || ''}
                    onChange={(e) => handleFeatureChange(index, 'link', e.target.value)}
                    placeholder="Leave blank for this feature's detail page"
                  />
                  <small className="text-muted">Leave blank to open the automatically created detail page.</small>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Detail Page Image</label>
                  {feature.detailImage && <img src={feature.detailImage} alt={`${feature.title} detail`} className="img-fluid mb-2 d-block" style={{ maxHeight: '150px' }} />}
                  <input type="file" className="form-control" accept="image/*" onChange={(e) => handleDetailImageUpload(e, index)} disabled={uploading === index} />
                  {uploading === index && <small className="text-muted">Uploading...</small>}
                </div>
                <div className="col-md-6">
                  <label className="form-label">Key Points (one per line)</label>
                  <textarea
                    className="form-control"
                    rows="5"
                    value={(feature.keyPoints || []).join('\n')}
                    onChange={(e) => handleKeyPointsChange(index, e.target.value)}
                    placeholder={'Fast response\nCertified technicians\nService warranty'}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Detail Page Content</label>
                  <textarea
                    className="form-control"
                    rows="6"
                    value={feature.detailContent || ''}
                    onChange={(e) => handleFeatureChange(index, 'detailContent', e.target.value)}
                    placeholder="Write the complete content for this Read More page..."
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
