import { useState, useEffect } from 'react';

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

export default function Earnings() {
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

  const completedOrders = workOrders.filter((w) => w.status === 'completed');
  const totalCollection = completedOrders.reduce((sum, order) => sum + Number(order.finalCost || 0), 0);
  const totalEarnings = completedOrders.reduce((sum, order) => sum + getOrderEarning(order), 0);
  const thisMonthEarnings = completedOrders
    .filter((order) => {
      const orderDate = new Date(order.completedAt || order.updatedAt);
      const now = new Date();
      return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, order) => sum + getOrderEarning(order), 0);

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div>
          <p className="eyebrow mb-1">Earnings</p>
          <h1>My Earnings</h1>
          <p>Completed work order payments.</p>
        </div>
      </div>

      <div className="sm-stat-grid earnings-stat-grid">
        <div className="sm-stat-card">
          <p>Total Collection</p>
          <h3 className="text-success">{money(totalCollection)}</h3>
          <span className="stat-caption">Full customer payments</span>
        </div>
        <div className="sm-stat-card">
          <p>Total Earnings</p>
          <h3 className="text-primary">{money(totalEarnings)}</h3>
          <span className="stat-caption">20% service share</span>
        </div>
        <div className="sm-stat-card">
          <p>This Month</p>
          <h3 className="text-success">{money(thisMonthEarnings)}</h3>
          <span className="stat-caption">20% service share</span>
        </div>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : completedOrders.length === 0 ? (
        <div className="sm-card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <i className="bi bi-wallet2"></i>
            </div>
            <h3 className="h5 fw-bold mb-2">No Earnings Yet</h3>
            <p className="text-muted mb-0">Complete work orders to see earnings here.</p>
          </div>
        </div>
      ) : (
        <div className="item-list">
          {completedOrders.map((order) => (
            <article key={order._id} className="item-card">
              <div className="item-card-header">
                <div>
                  <h2 className="item-card-title">{order.title}</h2>
                  <p className="item-card-subtitle">{order.customerName}</p>
                </div>
                <span className="badge bg-success rounded-pill px-3 py-2">
                  {money(getOrderEarning(order))}
                </span>
              </div>
              <div className="item-card-section">
                <div className="detail-row">
                  <i className="bi bi-receipt"></i>
                  <span>Collection: {money(order.finalCost || 0)} | Earning: {money(getOrderEarning(order))}</span>
                </div>
                <div className="detail-row">
                  <i className="bi bi-calendar-check"></i>
                  <span>
                    {new Date(order.completedAt || order.updatedAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
                {order.serviceType && (
                  <div className="detail-row">
                    <i className="bi bi-tools"></i>
                    <span>{order.serviceType}</span>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
