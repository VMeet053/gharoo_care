import { useState, useEffect } from 'react';

export default function UserPanelPricing() {
  const [pricingData, setPricingData] = useState({ header: { label: '', title: '', description: '' }, plans: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/panel-settings');
      const data = await res.json();
      if (data.success) {
        setPricingData(data.data.pricing);
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
      
      const updatedSettings = { ...getResData.data, pricing: pricingData };
      
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

  const handleHeaderChange = (field, value) => {
    setPricingData({ ...pricingData, header: { ...pricingData.header, [field]: value } });
  };

  const handlePlanChange = (index, field, value) => {
    const newPlans = [...pricingData.plans];
    newPlans[index][field] = value;
    setPricingData({ ...pricingData, plans: newPlans });
  };

  const handleFeatureChange = (planIndex, featureIndex, value) => {
    const newPlans = [...pricingData.plans];
    const newFeatures = [...newPlans[planIndex].features];
    newFeatures[featureIndex] = value;
    newPlans[planIndex].features = newFeatures;
    setPricingData({ ...pricingData, plans: newPlans });
  };

  const addPlan = () => {
    const newPlans = [...pricingData.plans, { name: 'New Plan', price: '₹999', features: ['Feature 1'], popular: false }];
    setPricingData({ ...pricingData, plans: newPlans });
  };

  const removePlan = (index) => {
    const newPlans = pricingData.plans.filter((_, i) => i !== index);
    setPricingData({ ...pricingData, plans: newPlans });
  };

  const addFeature = (planIndex) => {
    const newPlans = [...pricingData.plans];
    newPlans[planIndex].features.push('New Feature');
    setPricingData({ ...pricingData, plans: newPlans });
  };

  const removeFeature = (planIndex, featureIndex) => {
    const newPlans = [...pricingData.plans];
    newPlans[planIndex].features = newPlans[planIndex].features.filter((_, i) => i !== featureIndex);
    setPricingData({ ...pricingData, plans: newPlans });
  };

  if (loading) return <div className="container py-5">Loading...</div>;

  return (
    <div className="container-fluid px-3 px-lg-4 py-4">
      <div className="page-heading mb-4">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-currency-rupee" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">User Panel</p>
            <h1 className="h3 mb-1">Pricing Section</h1>
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
              <label className="form-label">Label</label>
              <input type="text" className="form-control" value={pricingData.header.label} onChange={(e) => handleHeaderChange('label', e.target.value)} />
            </div>
            <div className="col-md-8">
              <label className="form-label">Title</label>
              <input type="text" className="form-control" value={pricingData.header.title} onChange={(e) => handleHeaderChange('title', e.target.value)} />
            </div>
            <div className="col-md-12">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={2} value={pricingData.header.description} onChange={(e) => handleHeaderChange('description', e.target.value)} />
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2 className="h5 mb-0">Pricing Plans</h2>
          <button className="btn btn-outline-primary btn-sm" onClick={addPlan}>
            <i className="bi bi-plus" /> Add Plan
          </button>
        </div>
        <div className="panel-body">
          {pricingData.plans.map((plan, index) => (
            <div key={index} className="mb-4 p-3 border rounded">
              <div className="d-flex justify-content-between mb-2">
                <span className="fw-semibold">Plan {index + 1}</span>
                <button className="btn btn-sm btn-danger" onClick={() => removePlan(index)}><i className="bi bi-trash" /></button>
              </div>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Plan Name</label>
                  <input type="text" className="form-control" value={plan.name} onChange={(e) => handlePlanChange(index, 'name', e.target.value)} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Price</label>
                  <input type="text" className="form-control" value={plan.price} onChange={(e) => handlePlanChange(index, 'price', e.target.value)} />
                </div>
                <div className="col-md-4 d-flex align-items-end">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" checked={plan.popular} onChange={(e) => handlePlanChange(index, 'popular', e.target.checked)} />
                    <label className="form-check-label">Popular Plan</label>
                  </div>
                </div>
                <div className="col-12">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label mb-0">Features</label>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => addFeature(index)}><i className="bi bi-plus" /></button>
                  </div>
                  {plan.features.map((feature, fIndex) => (
                    <div key={fIndex} className="d-flex gap-2 mb-2">
                      <input type="text" className="form-control" value={feature} onChange={(e) => handleFeatureChange(index, fIndex, e.target.value)} />
                      <button className="btn btn-sm btn-danger" onClick={() => removeFeature(index, fIndex)}><i className="bi bi-x" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
