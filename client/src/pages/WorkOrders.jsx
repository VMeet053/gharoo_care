import { useState, useEffect } from 'react';

function WorkOrders() {
  const [workOrders, setWorkOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
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
    fetch('http://localhost:5000/api/work-orders')
      .then(res => res.json())
      .then(data => setWorkOrders(data))
      .catch(err => console.error(err));
  };

  const fetchUsers = async () => {
    fetch('http://localhost:5000/api/users/role/Service Man')
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error(err));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingOrder
      ? `http://localhost:5000/api/work-orders/${editingOrder._id}`
      : 'http://localhost:5000/api/work-orders';
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
      estimatedCost: 0
    });
    setEditingOrder(null);
  };

  const deleteOrder = async (id) => {
    if (window.confirm('Are you sure you want to delete this work order?')) {
      fetch(`http://localhost:5000/api/work-orders/${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
          if (data.success) fetchWorkOrders();
        });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-warning',
      assigned: 'bg-primary',
      'in-progress': 'bg-info',
      completed: 'bg-success',
      cancelled: 'bg-danger'
    };
    return colors[status] || 'bg-secondary';
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
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0 text-gray-800">Work Orders</h1>
        <button className="btn btn-primary" onClick={() => {
          resetForm();
          setShowModal(true);
        }}>
          Add New Work Order
        </button>
      </div>

      <div className="card shadow mb-4">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-bordered" width="100%" cellSpacing="0">
              <thead>
                <tr>
                    <th>Title</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Assigned To</th>
                    <th>Earnings</th>
                    <th>Actions</th>
                  </tr>
              </thead>
              <tbody>
                {workOrders.map(order => (
                  <tr key={order._id}>
                    <td>{order.title}</td>
                    <td>
                      {order.customerName}<br />
                      <small className="text-muted">{order.customerPhone}</small>
                    </td>
                    <td>
                      {getStatusBadge(order.status)}
                    </td>
                    <td>{order.priority}</td>
                    <td>
                      {order.assignedTo ? `${order.assignedTo.firstName} ${order.assignedTo.lastName}` : 'Unassigned'}
                    </td>
                    <td>₹{order.earnings || 0}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-info mr-2"
                        onClick={() => {
                          setEditingOrder(order);
                          setFormData(order);
                          setShowModal(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => deleteOrder(order._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingOrder ? 'Edit Work Order' : 'Add New Work Order'}</h5>
                <button type="button" className="close" onClick={() => setShowModal(false)}>
                  <span>&times;</span>
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Title</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Service Type</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.serviceType}
                        onChange={e => setFormData({ ...formData, serviceType: e.target.value })}
                      />
                    </div>
                    <div className="col-md-12 mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        required
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Customer Name</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={formData.customerName}
                        onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Customer Phone</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={formData.customerPhone}
                        onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Estimated Cost</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.estimatedCost}
                        onChange={e => setFormData({ ...formData, estimatedCost: Number(e.target.value) })}
                      />
                    </div>
                    <div className="col-md-12 mb-3">
                      <label className="form-label">Customer Address</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        value={formData.customerAddress}
                        onChange={e => setFormData({ ...formData, customerAddress: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Status</label>
                      <select
                        className="form-control"
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
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Priority</label>
                      <select
                        className="form-control"
                        value={formData.priority}
                        onChange={e => setFormData({ ...formData, priority: e.target.value })}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Assign To</label>
                      <select
                        className="form-control"
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
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Earnings</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.earnings || 0}
                        onChange={e => setFormData({ ...formData, earnings: Number(e.target.value) })}
                        placeholder="0"
                      />
                    </div>
                    <div className="col-md-12 mb-3">
                      <label className="form-label">Notes</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        value={formData.notes}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
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
