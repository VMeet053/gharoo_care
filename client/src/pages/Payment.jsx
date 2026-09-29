import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Payment() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/work-orders')
      .then(res => res.json())
      .then(data => {
        const items = (Array.isArray(data) ? data : [])
          .filter((order) => order.status === 'completed')
          .map((order) => ({
            id: order._id,
            user: order.customerName,
            amount: order.estimatedCost || 0,
            status: 'Paid',
            date: order.completedAt
              ? new Date(order.completedAt).toLocaleDateString()
              : new Date(order.updatedAt).toLocaleDateString()
          }));
        setPayments(items);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container-fluid px-3 px-lg-4 py-4">
      <div className="page-heading animate-fade-in">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-cash" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">Transactions</p>
            <h1 className="h3 mb-1">Payment</h1>
            <p className="text-muted mb-0">Payments from completed work orders.</p>
          </div>
        </div>
      </div>

      <section className="panel mt-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead><tr><th scope="col">Customer</th><th scope="col">Amount (₹)</th><th scope="col">Status</th><th scope="col">Date</th><th scope="col" className="text-end">Action</th></tr></thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-5">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-5">
                    <div className="blank-icon mx-auto mb-3">
                      <i className="bi bi-inbox"></i>
                    </div>
                    <h5 className="text-muted">No payments found</h5>
                    <p className="text-muted small">Completed work orders will appear here</p>
                  </td>
                </tr>
              ) : (
                payments.map(payment => (
                  <tr key={payment.id}>
                    <td>{payment.user}</td>
                    <td>₹{payment.amount}</td>
                    <td><span className={`badge ${payment.status === 'Paid' ? 'text-bg-success' : 'text-bg-warning'}`}>{payment.status}</span></td>
                    <td>{payment.date}</td>
                    <td className="text-end"><Link className="btn btn-light btn-sm" to="/work-orders">View</Link></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
