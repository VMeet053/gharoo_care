import { useState, useEffect } from 'react';

function WorkOrders() {
  const [workOrders, setWorkOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    status: 'pending',
    priority: 'medium',
    assignedTo: null,
    serviceType: '',
    notes: '',
    estimatedCost: 0,
    earnings: 0
  });

  useEffect(() => {
    fetchWorkOrders();
    fetchUsers();
  }, []);

  const fetchWorkOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/work-orders');
      const data = await res.json();
      setWorkOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users/role/Service Man');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingOrder
      ? `/api/work-orders/${editingOrder._id}`
      : '/api/work-orders';
    const method = editingOrder ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          fetchWorkOrders();
          setShowModal(false);
          resetForm();
        }
      });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      status: 'pending',
      priority: 'medium',
      assignedTo: null,
      serviceType: '',
      notes: '',
      estimatedCost: 0,
      earnings: 0
    });
    setEditingOrder(null);
  };

  const deleteOrder = async (id) => {
    if (window.confirm('Are you sure you want to delete this work order?')) {
      fetch(`/api/work-orders/${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
          if (data.success) fetchWorkOrders();
        });
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'badge bg-warning text-dark',
      assigned: 'badge bg-primary',
      'in-progress': 'badge bg-info text-dark',
      completed: 'badge bg-success',
      cancelled: 'badge bg-danger'
    };
    return (
      <span className={colors[status] || 'badge bg-secondary'}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="container-fluid px-3 px-lg-4 py-4 animate-fade-in">
      <div className="page-heading">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-list-check" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">Management</p>
            <h1 className="h3 mb-1">Work Orders</h1>
            <p className="text-muted mb-0">Manage and track all work orders</p>
          </div>
        </div>
        <div className="heading-actions">
          <button className="btn btn-primary btn-sm" onClick={() => {
            resetForm();
            setShowModal(true);
          }}>
            <i className="bi bi-plus-lg" aria-hidden="true"></i> Add New Work Order
          </button>
        </div>
      </div>

      <section className="panel animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="panel-header">
          <div>
            <h2 className="h5 mb-1 section-title"><i className="bi bi-table" aria-hidden="true"></i> Work Orders List</h2>
            <p className="text-muted mb-0">All work orders in the system</p>
          </div>
        </div>
        <div className="panel-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th scope="col">Title</th>
                  <th scope="col">Customer</th>
                  <th scope="col">Status</th>
                  <th scope="col">Priority</th>
                  <th scope="col">Assigned To</th>
                  <th scope="col">Earnings</th>
                  <th scope="col" className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : workOrders.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-5">
                        <div className="blank-icon mx-auto mb-3">
                          <i className="bi bi-inbox"></i>
                        </div>
                        <h5 className="text-muted">No Work Orders</h5>
                        <p className="text-muted small">Add your first work order to get started</p>
                      </td>
                    </tr>
                  ) : (
                    workOrders.map(order => (
                      <tr key={order._id}>
                        <td className="fw-semibold">{order.title}</td>
                        <td>
                          {order.customerName}<br />
                          <small className="text-muted">{order.customerPhone}</small>
                        </td>
                        <td>
                          {getStatusBadge(order.status)}
                        </td>
                        <td>
                          <span className="badge bg-secondary">
                            {order.priority}
                          </span>
                        </td>
                        <td>
                          {order.assignedTo ? `${order.assignedTo.firstName} ${order.assignedTo.lastName}` : 'Unassigned'}
                        </td>
                        <td>₹{order.earnings || 0}</td>
                        <td className="text-end">
                          <button
                            className="btn btn-light btn-sm me-1"
                            onClick={() => {
                              setEditingOrder(order);
                              setFormData(order);
                              setShowModal(true);
                            }}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => deleteOrder(order._id)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {showModal && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingOrder ? 'Edit Work Order' : 'Add New Work Order'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Title</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Service Type</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.serviceType}
                        onChange={e => setFormData({ ...formData, serviceType: e.target.value })}
                      />
                    </div>
                    <div className="col-md-12">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        required
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Customer Name</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={formData.customerName}
                        onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Customer Phone</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={formData.customerPhone}
                        onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Estimated Cost</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.estimatedCost}
                        onChange={e => setFormData({ ...formData, estimatedCost: Number(e.target.value) })}
                      />
                    </div>
                    <div className="col-md-12">
                      <label className="form-label">Customer Address</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        value={formData.customerAddress}
                        onChange={e => setFormData({ ...formData, customerAddress: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Status</label>
                      <select
                        className="form-select"
                        value={formData.status}
                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                      >
                        <option value="pending">Pending</option>
                        <option value="assigned">Assigned</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Priority</label>
                      <select
                        className="form-select"
                        value={formData.priority}
                        onChange={e => setFormData({ ...formData, priority: e.target.value })}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Assign To</label>
                      <select
                        className="form-select"
                        value={formData.assignedTo || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setFormData({
                            ...formData,
                            assignedTo: val ? val : null,
                            status: val ? 'assigned' : formData.status
                          });
                        }}
                      >
                        <option value="">Unassigned</option>
                        {users.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Earnings</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.earnings || 0}
                        onChange={e => setFormData({ ...formData, earnings: Number(e.target.value)})}
                        placeholder="0"
                      />
                    </div>
                    <div className="col-md-12">
                      <label className="form-label">Notes</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        value={formData.notes}
                        onChange={e => setFormData({ ...formData, notes: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Close
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingOrder ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkOrders;
