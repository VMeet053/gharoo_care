import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastProvider';

function getStatusBadge(status) {
  const badges = {
    pending: 'bg-warning text-dark',
    assigned: 'bg-primary',
    'in-progress': 'bg-info text-dark',
    completed: 'bg-success',
    cancelled: 'bg-danger'
  };
  return (
    <span className={"badge " + (badges[status] || 'bg-secondary') + " rounded-pill px-3 py-2"}>
      {status.replace('-', ' ').toUpperCase()}
    </span>
  );
}

function money(value) {
  return `\u20b9${Number(value || 0).toLocaleString('en-IN')}`;
}

function serviceEarning(value) {
  return Math.round(Number(value || 0) * 0.2);
}

const UPI_ID = 'kalpeshgajera3-1@okaxis';
const UPI_NAME = 'Kalpesh Gajera';

function getUpiQrUrl(amount, note) {
  const safeAmount = Number(amount || 0).toFixed(2);
  const upiUri = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(UPI_NAME)}&am=${safeAmount}&cu=INR&tn=${encodeURIComponent(note)}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiUri)}`;
}

export default function WorkOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [workOrder, setWorkOrder] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState('');
  const [formData, setFormData] = useState({
    beforeImage: '',
    afterImage: '',
    serviceDetails: '',
    partsChanged: '',
    finalCost: 0,
    paymentMethod: 'upi'
  });

  useEffect(() => {
    if (id) {
      fetchWorkOrder(id);
      fetchServices();
    }
  }, [id]);

  const selectedPart = useMemo(
    () => services.find((service) => String(service._id || service.id) === String(formData.partsChanged)),
    [services, formData.partsChanged]
  );

  const fetchWorkOrder = async (orderId) => {
    setLoading(true);
    try {
      const res = await fetch('/api/work-orders/' + orderId);
      const data = await res.json();
      setWorkOrder(data);
      setFormData({
        beforeImage: data.beforeImage || '',
        afterImage: data.afterImage || '',
        serviceDetails: data.serviceDetails || '',
        partsChanged: data.partsChanged || '',
        finalCost: Number(data.finalCost || 0),
        paymentMethod: 'upi'
      });
    } catch (err) {
      console.error('Error fetching work order:', err);
      showToast('Could not load work order.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/service-prices');
      const data = await res.json();
      setServices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setServices([]);
    }
  };

  const handlePartChange = (e) => {
    const partId = e.target.value;
    const part = services.find((service) => String(service._id || service.id) === String(partId));
    setFormData((prev) => ({
      ...prev,
      partsChanged: partId,
      finalCost: part ? Number(part.price || 0) : 0
    }));
  };

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file.', 'warning');
      return;
    }

    const formDataImg = new FormData();
    formDataImg.append('image', file);
    setUploading(type);

    try {
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: formDataImg
      });
      const data = await res.json();
      if (data.success) {
        setFormData((prev) => ({ ...prev, [type]: data.url }));
        showToast(type === 'beforeImage' ? 'Before work photo uploaded.' : 'After work photo uploaded.', 'success');
      } else {
        showToast(data.message || 'Image upload failed.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Image upload failed. Please try again.', 'error');
    } finally {
      setUploading('');
    }
  };

  const updateWorkOrder = async (updates, successMessage) => {
    setSaving(true);
    try {
      const res = await fetch('/api/work-orders/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (data.success) {
        showToast(successMessage, 'success');
        fetchWorkOrder(id);
      } else {
        showToast(data.message || 'Could not update work order.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Could not update work order.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleStartWork = async () => {
    if (!formData.beforeImage) {
      showToast('Upload before work photo first.', 'warning');
      return;
    }
    await updateWorkOrder({
      status: 'in-progress',
      startedAt: new Date(),
      beforeImage: formData.beforeImage
    }, 'Work started.');
  };

  const handleCompleteWork = async () => {
    if (!formData.afterImage) {
      showToast('Upload after work photo first.', 'warning');
      return;
    }
    if (!formData.serviceDetails.trim()) {
      showToast('Write what work was done.', 'warning');
      return;
    }

    const partName = selectedPart ? selectedPart.name : '';
    await updateWorkOrder({
      afterImage: formData.afterImage,
      serviceDetails: formData.serviceDetails.trim(),
      partsChanged: partName,
      finalCost: Number(formData.finalCost || 0),
      earnings: serviceEarning(formData.finalCost),
      paymentMethod: 'upi',
      status: 'completed',
      completedAt: new Date()
    }, 'Work completed and payment entry saved.');
  };

  if (loading) {
    return (
      <div className="page-wrap d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="page-wrap">
        <p>Work order not found</p>
        <button onClick={() => navigate('/work-orders')} className="btn btn-primary">Back</button>
      </div>
    );
  }

  const paymentNote = `Gharoo Care ${workOrder.serviceType || 'Service'} Payment`;
  const serviceQrUrl = getUpiQrUrl(formData.finalCost, paymentNote);

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div className="d-flex align-items-center gap-2 mb-3">
          <button onClick={() => navigate('/work-orders')} className="btn btn-outline-secondary btn-sm">
            <i className="bi bi-arrow-left"></i>
          </button>
          <div>
            <p className="eyebrow mb-1">Work Order Details</p>
            <h1>{workOrder.title}</h1>
            {workOrder.isPremium && (
              <span className="badge text-bg-warning rounded-pill mt-2">
                <i className="bi bi-stars me-1"></i>
                Premium User{workOrder.premiumPlan ? ` - ${workOrder.premiumPlan}` : ''}{workOrder.premiumPrice ? ` (${workOrder.premiumPrice})` : ''}
              </span>
            )}
          </div>
        </div>
        {getStatusBadge(workOrder.status)}
      </div>

      <div className="item-card mb-4">
        <div className="item-card-header">
          <h2 className="item-card-title">Customer Details</h2>
        </div>
        <div className="item-card-section">
          <div className="detail-row"><i className="bi bi-person"></i><span className="fw-medium">{workOrder.customerName}</span></div>
          {workOrder.isPremium && (
            <div className="detail-row">
              <i className="bi bi-stars"></i>
              <span className="fw-medium text-warning-emphasis">
                Premium User{workOrder.premiumPlan ? ` - ${workOrder.premiumPlan}` : ''}
              </span>
            </div>
          )}
          <div className="detail-row"><i className="bi bi-telephone"></i><a href={"tel:" + workOrder.customerPhone}>{workOrder.customerPhone}</a></div>
          {workOrder.customerAddress && <div className="detail-row"><i className="bi bi-geo-alt"></i><span>{workOrder.customerAddress}</span></div>}
          {workOrder.customerCurrentLocation && (
            <div className="detail-row">
              <i className="bi bi-crosshair"></i>
              <a href={workOrder.customerCurrentLocation} target="_blank" rel="noreferrer">Open current location</a>
            </div>
          )}
          <div className="detail-row"><i className="bi bi-tools"></i><span>{workOrder.serviceType || workOrder.title}</span></div>
        </div>
      </div>

      {workOrder.status === 'assigned' && (
        <div className="item-card mb-4">
          <div className="item-card-header">
            <div>
              <h3 className="item-card-title">Start Work</h3>
              <p className="item-card-subtitle">Before starting, capture the AC/device condition.</p>
            </div>
          </div>
          <div className="item-card-section">
            <label className="form-label">Before work photo required</label>
            <input type="file" accept="image/*" capture="environment" className="form-control" onChange={(e) => handleImageUpload(e, 'beforeImage')} />
            {uploading === 'beforeImage' && <p className="text-muted small mt-2">Uploading photo...</p>}
            {formData.beforeImage && <img src={formData.beforeImage} alt="Before work" className="work-proof-img" />}
            <button onClick={handleStartWork} className="btn btn-info text-dark mt-3" disabled={!formData.beforeImage || saving}>
              <i className="bi bi-play-circle me-2"></i>
              Start Work
            </button>
          </div>
        </div>
      )}

      {workOrder.status === 'in-progress' && (
        <div className="item-card mb-4">
          <div className="item-card-header">
            <div>
              <h3 className="item-card-title">Finish Work</h3>
              <p className="item-card-subtitle">Upload after photo, write work details, and record payment.</p>
            </div>
          </div>
          <div className="item-card-section">
            {workOrder.beforeImage && (
              <div className="mb-3">
                <label className="form-label">Before photo</label>
                <img src={workOrder.beforeImage} alt="Before" className="work-proof-img" />
              </div>
            )}

            <div className="mb-3">
              <label className="form-label">After work photo required</label>
              <input type="file" accept="image/*" capture="environment" className="form-control" onChange={(e) => handleImageUpload(e, 'afterImage')} />
              {uploading === 'afterImage' && <p className="text-muted small mt-2">Uploading photo...</p>}
              {formData.afterImage && <img src={formData.afterImage} alt="After" className="work-proof-img" />}
            </div>

            <div className="mb-3">
              <label className="form-label">What work was done?</label>
              <textarea className="form-control" rows={3} value={formData.serviceDetails} onChange={(e) => setFormData({ ...formData, serviceDetails: e.target.value })} placeholder="Example: AC cleaned, cooling checked, gas pressure verified..." />
            </div>

            <div className="mb-3">
              <label className="form-label">Spare part changed</label>
              <select className="form-select" value={formData.partsChanged} onChange={handlePartChange}>
                <option value="">No spare part / only service - {'\u20b9'}0</option>
                {services.map((service) => (
                  <option key={service._id || service.id} value={service._id || service.id}>
                    {service.name} - {money(service.price)}
                  </option>
                ))}
              </select>
              <p className="text-muted small mt-2 mb-0">If only plan/service work was done, keep this as {'\u20b9'}0.</p>
            </div>

            <div className="row g-3 align-items-stretch">
              <div className="col-md-6">
                <label className="form-label">Final amount</label>
                <input type="number" className="form-control" value={formData.finalCost} onChange={(e) => setFormData({ ...formData, finalCost: Number(e.target.value) })} />
                <p className="text-muted small mt-2 mb-0">Service earning: {money(serviceEarning(formData.finalCost))} (20%)</p>
              </div>
              <div className="col-md-6">
                <div className="service-upi-panel">
                  <div>
                    <p className="service-upi-title">Scan & Pay with GPay / UPI</p>
                    <p>Payee: <strong>{UPI_NAME}</strong></p>
                    <p>UPI ID: <strong>{UPI_ID}</strong></p>
                    <p>Amount: <strong>{money(formData.finalCost)}</strong></p>
                  </div>
                  <img src={serviceQrUrl} alt={`UPI QR for ${money(formData.finalCost)}`} />
                </div>
              </div>
            </div>

            <button onClick={handleCompleteWork} className="btn btn-success mt-3" disabled={saving}>
              <i className="bi bi-check-circle me-2"></i>
              Finish & Save Payment
            </button>
          </div>
        </div>
      )}

      {workOrder.status === 'completed' && (
        <div className="item-card">
          <div className="item-card-header">
            <div>
              <h3 className="item-card-title">Work Completed</h3>
              <p className="item-card-subtitle">Photos, work details, spare parts, and payment record.</p>
            </div>
          </div>
          <div className="item-card-section">
            <div className="work-proof-grid">
              {workOrder.beforeImage && <div><label className="form-label">Before</label><img src={workOrder.beforeImage} alt="Before" className="work-proof-img" /></div>}
              {workOrder.afterImage && <div><label className="form-label">After</label><img src={workOrder.afterImage} alt="After" className="work-proof-img" /></div>}
            </div>
            <p><strong>Details:</strong> {workOrder.serviceDetails || '—'}</p>
            <p><strong>Spare Part:</strong> {workOrder.partsChanged || 'No spare part / only service'}</p>
            <p><strong>Final Amount:</strong> {money(workOrder.finalCost)}</p>
            <p><strong>Service Earning:</strong> {money(serviceEarning(workOrder.finalCost))} (20%)</p>
            <p><strong>Payment Method:</strong> QR / UPI</p>
          </div>
        </div>
      )}
    </div>
  );
}
