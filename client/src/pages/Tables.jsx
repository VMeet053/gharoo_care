import { useState } from 'react';

export default function Tables() {
  const [orders, setOrders] = useState([]);

  return (
    <div className="container-fluid px-3 px-lg-4 py-4">
      <div className="page-heading animate-fade-in">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-table" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">Data</p>
            <h1 className="h3 mb-1">Tables</h1>
            <p className="text-muted mb-0">Use responsive, searchable tables for operational records.</p>
          </div>
        </div>
      </div>

      <section className="panel animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="panel-header">
          <div>
            <h2 className="h5 mb-1 section-title"><i className="bi bi-table" aria-hidden="true"></i><span>Advanced Table</span></h2>
            <p className="text-muted mb-0">Searchable responsive table for orders and customer data.</p>
          </div>
          <input className="form-control form-control-sm table-search" type="search" placeholder="Search orders" data-table-search="ordersTable" aria-label="Search orders" />
        </div>
        <div className="table-responsive">
          <table className="table align-middle mb-0" id="ordersTable" data-searchable-table>
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Product</th>
                <th scope="col">Customer</th>
                <th scope="col">Status</th>
                <th scope="col">Amount (₹)</th>
                <th scope="col">Date</th>
                <th scope="col" className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <div className="blank-icon mx-auto mb-3">
                      <i className="bi bi-inbox"></i>
                    </div>
                    <h5 className="text-muted">No Orders Found</h5>
                    <p className="text-muted small">Add your first order to get started</p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id}>
                    <td className="fw-semibold">{order.id}</td>
                    <td>
                      <div className="table-media">
                        <span className="product-icon"><i className={`bi ${order.icon}`} aria-hidden="true"></i></span>
                        <span>{order.product}</span>
                      </div>
                    </td>
                    <td>{order.customer}</td>
                    <td><span className={`badge ${order.statusClass}`}>{order.status}</span></td>
                    <td>₹{order.amount}</td>
                    <td>{order.date}</td>
                    <td className="text-end"><button className="btn btn-light btn-sm" type="button">View</button></td>
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
