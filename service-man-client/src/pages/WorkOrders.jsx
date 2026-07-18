import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function getStoredUser() {
  const raw = localStorage.getItem('serviceManUser') || sessionStorage.getItem('serviceManUser');
  return raw ? JSON.parse(raw) : null;
}

function getUserId(user) {
  return user?._id || user?.id;
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
    <span className={`badge ${badges[status] || 'bg-secondary'} rounded-pill px-3 py-2`}>
      {status.replace('-', ' ').toUpperCase()}
    </span>
  );
}

function WorkOrderCard({ order, onViewDetails }) {
  return (
    <article className="item-card">
      <div className="item-card-header">
        <div>
          <h2 className="item-card-title">{order.serviceType || order.title}</h2>
          <p className="item-card-subtitle">Work Order</p>
          {order.isPremium && (
            <span className="badge text-bg-warning rounded-pill">
              <i className="bi bi-stars me-1"></i>
              Premium User{order.premiumPlan ? ` - ${order.premiumPlan}` : ''}
            </span>
          )}
        </div>
        {getStatusBadge(order.status)}
      </div>

      <div className="item-card-section">
        <p className="item-card-section-title">Customer Details</p>
        <div className="detail-row">
          <i className="bi bi-person"></i>
          <span className="fw-medium">{order.customerName}</span>
        </div>
        <div className="detail-row">
          <i className="bi bi-telephone"></i>
          <a href={`tel:${order.customerPhone}`}>{order.customerPhone}</a>
        </div>
        {order.customerAddress && (
          <div className="detail-row">
            <i className="bi bi-geo-alt"></i>
            <span>{order.customerAddress}</span>
          </div>
        )}
        {order.customerCurrentLocation && (
          <div className="detail-row">
            <i className="bi bi-crosshair"></i>
            <a href={order.customerCurrentLocation} target="_blank" rel="noreferrer">Open current location</a>
          </div>
        )}
      </div>

      <div className="item-card-section">
        <p className="item-card-section-title">What To Do</p>
        <p className="mb-0 small">{order.description}</p>
        {order.notes && <p className="text-muted small mb-0 mt-2">{order.notes}</p>}
      </div>

      <div className="item-card-footer">
        <button
          type="button"
          className="btn btn-outline-primary me-2"
          onClick={() => onViewDetails(order._id)}
        >
          <i className="bi bi-eye me-2"></i>
          View Details
        </button>
        {order.status === 'assigned' && (
          <button type="button" className="btn btn-info text-dark" onClick={() => onViewDetails(order._id)}>
            <i className="bi bi-camera me-2"></i>
            Start With Photo
          </button>
        )}
        {order.status === 'in-progress' && (
          <button type="button" className="btn btn-success" onClick={() => onViewDetails(order._id)}>
            <i className="bi bi-check-circle me-2"></i>
            Finish Work
          </button>
        )}
        {order.status === 'completed' && (
          <span className="text-success fw-medium w-100 text-center py-2">
            <i className="bi bi-check-circle-fill me-1"></i>
            Completed
          </span>
        )}
      </div>
    </article>
  );
}

export default function WorkOrders() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getStoredUser);
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = getUserId(user);
    if (userId) {
      fetchWorkOrders(userId);
    }
  }, [user]);

  const fetchWorkOrders = async (userId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/work-orders/assigned/${userId}`);
      const data = await res.json();
      setWorkOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setWorkOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (id) => {
    navigate(`/work-orders/${id}`);
  };

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div>
          <p className="eyebrow mb-1">Work Orders</p>
          <h1>My Work Orders</h1>
          <p>Accepted leads with full customer details.</p>
        </div>
        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          onClick={() => getUserId(user) && fetchWorkOrders(getUserId(user))}
        >
          <i className="bi bi-arrow-clockwise"></i>
          <span className="d-none d-sm-inline ms-1">Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : workOrders.length === 0 ? (
        <div className="sm-card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <i className="bi bi-inbox"></i>
            </div>
            <h3 className="h5 fw-bold mb-2">No Work Orders</h3>
            <p className="text-muted mb-0">Accept a lead from My Leads to create a work order here.</p>
          </div>
        </div>
      ) : (
        <div className="item-list">
          {workOrders.map((order) => (
            <WorkOrderCard 
              key={order._id} 
              order={order} 
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
}
