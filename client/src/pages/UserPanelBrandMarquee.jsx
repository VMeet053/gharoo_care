import { useState, useEffect } from 'react';

export default function UserPanelBrandMarquee() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchSettings = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/panel-settings');
      const data = await res.json();
      if (data.success) {
        setBrands(data.data.brandMarquee?.brands || []);
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
      
      const updatedSettings = { ...getResData.data, brandMarquee: { brands } };
      
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

  const handleBrandChange = (index, value) => {
    const newBrands = [...brands];
    newBrands[index] = value;
    setBrands(newBrands);
  };

  const addBrand = () => {
    setBrands([...brands, 'New Brand']);
  };

  const removeBrand = (index) => {
    setBrands(brands.filter((_, i) => i !== index));
  };

  if (loading) return <div className="container py-5">Loading...</div>;

  return (
    <div className="container-fluid px-3 px-lg-4 py-4">
      <div className="page-heading mb-4">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-tags" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">User Panel</p>
            <h1 className="h3 mb-1">Brand Marquee</h1>
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
          <h2 className="h5 mb-0">Brands</h2>
          <button className="btn btn-outline-primary btn-sm" onClick={addBrand}>
            <i className="bi bi-plus"></i> Add Brand
          </button>
        </div>
        <div className="panel-body">
          {brands.map((brand, index) => (
            <div key={index} className="mb-3 d-flex gap-2 align-items-center">
              <input
                type="text"
                className="form-control"
                value={brand}
                onChange={(e) => handleBrandChange(index, e.target.value)}
                placeholder="Brand Name"
              />
              <button className="btn btn-sm btn-danger" onClick={() => removeBrand(index)}>
                <i className="bi bi-trash"></i>
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
