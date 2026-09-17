import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';

function getStoredUser() {
  const raw = localStorage.getItem('serviceManUser') || sessionStorage.getItem('serviceManUser');
  return raw ? JSON.parse(raw) : null;
}

function getUserId(user) {
  return user?._id || user?.id;
}

function money(value) {
  return `\u20b9${Number(value || 0).toLocaleString('en-IN')}`;
}

function getOrderEarning(order) {
  const finalCost = Number(order.finalCost || 0);
  return finalCost > 0 ? Math.round(finalCost * 0.2) : Number(order.earnings || 0);
}

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [workOrders, setWorkOrders] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      navigate('/login');
      return;
    }
    setUser(storedUser);
    fetchWorkOrders(getUserId(storedUser));
    fetchLeads(getUserId(storedUser));
  }, [navigate]);

  const fetchLeads = async (userId) => {
    fetch(`/api/leads/assigned/${userId}`)
      .then((res) => res.json())
      .then((data) => setLeads(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err));
  };

  const fetchWorkOrders = async (userId) => {
    setLoading(true);
    fetch(`/api/work-orders/assigned/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setWorkOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  if (!user) return null;

  const completedOrders = workOrders.filter((w) => w.status === 'completed');
  const upiTotal = completedOrders.reduce((sum, order) => sum + Number(order.finalCost || order.earnings || 0), 0);
  const totalEarnings = completedOrders.reduce((sum, order) => sum + getOrderEarning(order), 0);

  const stats = [
    { label: 'Assigned Leads', value: leads.length, icon: 'bi-person-lines-fill', color: 'primary' },
    { label: 'Total Orders', value: workOrders.length, icon: 'bi-list-check', color: 'primary' },
    { label: 'Pending', value: workOrders.filter((w) => w.status === 'pending' || w.status === 'assigned').length, icon: 'bi-clock-history', color: 'warning' },
    { label: 'Completed', value: completedOrders.length, icon: 'bi-check-circle', color: 'success' },
    { label: 'My Earnings', value: money(totalEarnings), caption: '20% service share', icon: 'bi-currency-rupee', color: 'info', to: '/earnings' },
    { label: 'QR / UPI Collection', value: money(upiTotal), caption: `${completedOrders.length} paid entries`, icon: 'bi-qr-code', color: 'primary' }
  ];

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div>
          <p className="eyebrow mb-1">Dashboard</p>
          <h1>Welcome, {user.firstName}</h1>
          <p>Your work overview at a glance.</p>
        </div>
        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          onClick={() => fetchWorkOrders(getUserId(user))}
        >
          <i className="bi bi-arrow-clockwise"></i>
        </button>
      </div>

      <div className="sm-stat-grid">
        {stats.map((stat) => (
          <button
            key={stat.label}
            type="button"
            className={`sm-stat-card ${stat.to ? 'sm-stat-card-clickable' : ''}`}
            onClick={() => stat.to && navigate(stat.to)}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <p>{stat.label}</p>
                <h3 className={`text-${stat.color}`}>{stat.value}</h3>
                {stat.caption && <span className="stat-caption">{stat.caption}</span>}
              </div>
              <span className={`sm-stat-icon bg-${stat.color} bg-opacity-10 text-${stat.color}`}>
                <i className={`bi ${stat.icon}`}></i>
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="page-header mb-3">
        <div>
          <h2 className="h5 fw-bold mb-0">Recent Work Orders</h2>
          <p className="mb-0">Latest assigned jobs</p>
        </div>
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
            <p className="text-muted mb-0">Accept leads to see work orders here.</p>
          </div>
        </div>
      ) : (
        <div className="item-list">
          {workOrders.slice(0, 3).map((order) => (
            <article key={order._id} className="item-card">
              <div className="item-card-header">
                <div>
                  <h3 className="item-card-title">{order.serviceType || order.title}</h3>
                  <p className="item-card-subtitle">{order.customerName}</p>
                </div>
                <span className={`badge rounded-pill ${order.status === 'completed' ? 'bg-success' : 'bg-primary'}`}>
                  {order.status}
                </span>
              </div>
              <div className="item-card-section">
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
              <div className="item-card-footer">
                {order.status === 'assigned' && (
                  <button
                    type="button"
                    className="btn btn-info text-dark"
                    onClick={() => navigate(`/work-orders/${order._id}`)}
                  >
                    <i className="bi bi-camera me-2"></i>
                    Start With Photo
                  </button>
                )}
                {order.status === 'in-progress' && (
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={() => navigate(`/work-orders/${order._id}`)}
                  >
                    <i className="bi bi-check-circle me-2"></i>
                    Finish Work
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
