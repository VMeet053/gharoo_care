import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function getStoredUser() {
  const raw = localStorage.getItem('serviceManUser') || sessionStorage.getItem('serviceManUser');
  return raw ? JSON.parse(raw) : null;
}

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

export default function WorkOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workOrder, setWorkOrder] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    beforeImage: '',
    afterImage: '',
    serviceType: '',
    serviceDetails: '',
    partsChanged: '',
    finalCost: 0,
    paymentMethod: 'cash'
  });

  useEffect(() => {
    if (id) {
      fetchWorkOrder(id);
      fetchServices();
    }
  }, [id]);

  const fetchWorkOrder = async (orderId) => {
    console.log('Fetching work order with ID:', orderId);
    setLoading(true);
    try {
      const res = await fetch('/api/work-orders/' + orderId);
      console.log('Response status:', res.status);
      const data = await res.json();
      console.log('Work order data:', data);
      setWorkOrder(data);
      if (data) {
        setFormData({
          beforeImage: data.beforeImage || '',
          afterImage: data.afterImage || '',
          serviceType: data.serviceType || '',
          serviceDetails: data.serviceDetails || '',
          partsChanged: data.partsChanged || '',
          finalCost: data.finalCost || 0,
          paymentMethod: data.paymentMethod || 'cash'
        });
      }
    } catch (err) {
      console.error('Error fetching work order:', err);
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
    }
  };

  const handleServiceChange = (e) => {
    const serviceId = e.target.value;
    const selectedService = services.find(s => s._id === serviceId || s.id === serviceId);
    let cost = 0;
    if (selectedService) {
      cost = Number(selectedService.price) || 0;
    }
    setFormData(function(prev) {
      return {
        ...prev,
        serviceType: serviceId,
        finalCost: cost
      };
    });
  };

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const formDataImg = new FormData();
    formDataImg.append('image', file);

    try {
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: formDataImg
      });
      const data = await res.json();
      if (data.success) {
        setFormData(function(prev) {
          return {
            ...prev,
            [type]: data.url
          };
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartWork = async () => {
    await updateWorkOrder({
      status: 'in-progress',
      startedAt: new Date(),
      beforeImage: formData.beforeImage
    });
  };

  const handleCompleteWork = async () => {
    await updateWorkOrder({
      ...formData,
      status: 'completed',
      completedAt: new Date()
    });
  };

  const updateWorkOrder = async (updates) => {
    try {
      const res = await fetch('/api/work-orders/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (data.success) {
        fetchWorkOrder(id);
      }
    } catch (err) {
      console.error(err);
    }
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
          </div>
        </div>
        {getStatusBadge(workOrder.status)}
      </div>

      <div className="item-card mb-4">
        <div className="item-card-header">
          <div>
            <h2 className="item-card-title">Customer Details</h2>
          </div>
        </div>
        <div className="item-card-section">
          <div className="detail-row">
            <i className="bi bi-person"></i>
            <span className="fw-medium">{workOrder.customerName}</span>
          </div>
          <div className="detail-row">
            <i className="bi bi-telephone"></i>
            <a href={"tel:" + workOrder.customerPhone}>{workOrder.customerPhone}</a>
          </div>
          {workOrder.customerAddress && (
            <div className="detail-row">
              <i className="bi bi-geo-alt"></i>
              <span>{workOrder.customerAddress}</span>
            </div>
          )}
        </div>
      </div>

      {workOrder.status === 'assigned' && (
        <div className="item-card mb-4">
          <div className="item-card-header">
            <h3>Start Work</h3>
          </div>
          <div className="item-card-section">
            <div className="mb-3">
              <label className="form-label">AC Before Image (Required)</label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="form-control"
                onChange={(e) => handleImageUpload(e, 'beforeImage')}
              />
              {formData.beforeImage && (
                <img src={formData.beforeImage} alt="Before work" style={{maxWidth:'200px', marginTop:'10px', borderRadius:'8px'}} />
              )}
            </div>
            <button 
              onClick={handleStartWork} 
              className="btn btn-info text-dark"
              disabled={!formData.beforeImage}
            >
              <i className="bi bi-play-circle me-2"></i>
              Start Work
            </button>
          </div>
        </div>
      )}

      {workOrder.status === 'in-progress' && (
        <div className="item-card mb-4">
          <div className="item-card-header">
            <h3>Complete Work</h3>
          </div>
          <div className="item-card-section">
            <div className="mb-3">
              <label className="form-label">Before Image (Optional)</label>
              {workOrder.beforeImage && (
                <img src={workOrder.beforeImage} alt="Before" style={{maxWidth:'200px', marginBottom:'10px', borderRadius:'8px'}} />
              )}
            </div>

            <div className="mb-3">
              <label className="form-label">After Work Image</label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="form-control"
                onChange={(e) => handleImageUpload(e, 'afterImage')}
              />
              {formData.afterImage && (
                <img src={formData.afterImage} alt="After" style={{maxWidth:'200px', marginTop:'10px', borderRadius:'8px'}} />
              )}
            </div>

            <div className="mb-3">
              <label className="form-label">Service Type</label>
              <select
                className="form-select"
                value={formData.serviceType}
                onChange={handleServiceChange}
              >
                <option value="">Select Service</option>
                {services.map(service => (
                  <option key={service._id || service.id} value={service._id || service.id}>
                    {service.name} - ₹{service.price}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Service Details</label>
              <textarea
                className="form-control"
                rows={3}
                value={formData.serviceDetails}
                onChange={(e) => setFormData({...formData, serviceDetails: e.target.value})}
                placeholder="What was done..."
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Parts Changed</label>
              <textarea
                className="form-control"
                rows={2}
                value={formData.partsChanged}
                onChange={(e) => setFormData({...formData, partsChanged: e.target.value})}
                placeholder="Parts changed..."
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Final Cost (₹)</label>
              <input
                type="number"
                className="form-control"
                value={formData.finalCost}
                onChange={(e) => setFormData({...formData, finalCost: Number(e.target.value)})}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Payment Method</label>
              <select
                className="form-select"
                value={formData.paymentMethod}
                onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="net-banking">Net Banking</option>
              </select>
            </div>

            <button onClick={handleCompleteWork} className="btn btn-success">
              <i className="bi bi-check-circle me-2"></i>
              Mark Complete
            </button>
          </div>
        </div>
      )}

      {workOrder.status === 'completed' && (
        <div className="item-card">
          <div className="item-card-header">
            <h3>Work Completed</h3>
          </div>
          <div className="item-card-section">
            {workOrder.beforeImage && (
              <div className="mb-3">
                <label className="form-label">Before</label>
                <img src={workOrder.beforeImage} alt="Before" style={{maxWidth:'300px', borderRadius:'8px'}} />
              </div>
            )}
            {workOrder.afterImage && (
              <div className="mb-3">
                <label className="form-label">After</label>
                <img src={workOrder.afterImage} alt="After" style={{maxWidth:'300px', borderRadius:'8px'}} />
              </div>
            )}
            <p><strong>Service Type:</strong> {workOrder.serviceType ? (services.find(s => (s._id || s.id) === workOrder.serviceType)?.name || '') : ''}</p>
            <p><strong>Details:</strong> {workOrder.serviceDetails}</p>
            <p><strong>Parts Changed:</strong> {workOrder.partsChanged}</p>
            <p><strong>Final Cost:</strong> ₹{workOrder.finalCost}</p>
            <p><strong>Payment Method:</strong> {workOrder.paymentMethod}</p>
          </div>
        </div>
      )}
    </div>
  );
}
