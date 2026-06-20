import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function StatusCompleted() {
  const [completedItems, setCompletedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/work-orders')
      .then(res => res.json())
      .then(data => {
        const items = (Array.isArray(data) ? data : []).filter(
          (order) => order.status === 'completed'
        );
        setCompletedItems(items);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container-fluid px-3 px-lg-4 py-4">
      <div className="page-heading animate-fade-in">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-check-circle" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">Status</p>
            <h1 className="h3 mb-1">Completed</h1>
            <p className="text-muted mb-0">All completed work orders.</p>
          </div>
        </div>
      </div>

      <section className="panel mt-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead><tr><th scope="col">Title</th><th scope="col">Customer</th><th scope="col">Service</th><th scope="col">Amount</th><th scope="col">Date</th><th scope="col" className="text-end">Action</th></tr></thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : completedItems.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <div className="blank-icon mx-auto mb-3">
                      <i className="bi bi-inbox"></i>
                    </div>
                    <h5 className="text-muted">No completed items found</h5>
                    <p className="text-muted small">Completed work orders will appear here</p>
                  </td>
                </tr>
              ) : (
                completedItems.map(item => (
                  <tr key={item._id}>
                    <td>{item.title}</td>
                    <td>{item.customerName}</td>
                    <td>{item.serviceType}</td>
                    <td>₹{item.estimatedCost || 0}</td>
                    <td>{item.completedAt ? new Date(item.completedAt).toLocaleDateString() : new Date(item.updatedAt).toLocaleDateString()}</td>
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
