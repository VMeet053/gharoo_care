import { useState, useEffect } from 'react';

export default function ServicePrice() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', price: '', description: '' });
  const [addForm, setAddForm] = useState({ name: '', price: '', description: '' });
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/service-prices');
      const data = await response.json();
      setServices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch service prices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/service-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm)
      });
      const data = await response.json();
      if (data.success) {
        setServices([data.service, ...services]);
        setAddForm({ name: '', price: '', description: '' });
        setShowAddForm(false);
      }
    } catch (err) {
      console.error('Failed to add service:', err);
    }
  };

  const startEdit = (service) => {
    setEditingId(service.id);
    setEditForm({ name: service.name, price: service.price, description: service.description });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/service-prices/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data = await response.json();
      if (data.success) {
        setServices(services.map(service =>
          service.id === editingId ? data.service : service
        ));
        setEditingId(null);
      }
    } catch (err) {
      console.error('Failed to update service:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      const response = await fetch(`http://localhost:5000/api/service-prices/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        setServices(services.filter(service => service.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete service:', err);
    }
  };

  return (
    <div className="container-fluid px-3 px-lg-4 py-4">
      <div className="page-heading">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-tags" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">Management</p>
            <h1 className="h3 mb-1">Service Price</h1>
            <p className="text-muted mb-0">Manage service prices.</p>
          </div>
        </div>
        <div className="heading-actions">
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <i className="bi bi-plus" aria-hidden="true"></i> Add Service
          </button>
        </div>
      </div>

      {showAddForm && (
        <section className="panel mt-3">
          <h2 className="h5 mb-3 section-title"><i className="bi bi-plus-circle" aria-hidden="true"></i> Add Service</h2>
          <form onSubmit={handleAdd} className="row g-3">
            <div className="col-md-4">
              <label className="form-label" htmlFor="addName">Service Name</label>
              <input
                className="form-control"
                id="addName"
                required
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label" htmlFor="addPrice">Price</label>
              <input
                className="form-control"
                id="addPrice"
                required
                value={addForm.price}
                onChange={(e) => setAddForm({ ...addForm, price: e.target.value })}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label" htmlFor="addDesc">Description</label>
              <input
                className="form-control"
                id="addDesc"
                value={addForm.description}
                onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
              />
            </div>
            <div className="col-12">
              <div className="d-flex gap-2 justify-content-end">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">Add</button>
              </div>
            </div>
          </form>
        </section>
      )}

      <section className="panel mt-3">
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th scope="col">Service Name</th>
                <th scope="col">Price (₹)</th>
                <th scope="col">Description</th>
                <th scope="col" className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-5">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-5">
                    <div className="blank-icon mx-auto mb-3">
                      <i className="bi bi-inbox"></i>
                    </div>
                    <h5 className="text-muted">No services found</h5>
                    <p className="text-muted small">Add your first service to get started</p>
                  </td>
                </tr>
              ) : (
                services.map(service => (
                  <tr key={service.id}>
                    {editingId === service.id ? (
                      <td colSpan={4}>
                        <form onSubmit={handleEdit} className="row g-3">
                          <div className="col-md-3">
                            <input
                              className="form-control"
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            />
                          </div>
                          <div className="col-md-3">
                            <input
                              className="form-control"
                              value={editForm.price}
                              onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                            />
                          </div>
                          <div className="col-md-4">
                            <input
                              className="form-control"
                              value={editForm.description}
                              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            />
                          </div>
                          <div className="col-md-2 d-flex gap-2 justify-content-end">
                            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setEditingId(null)}>
                              Cancel
                            </button>
                            <button type="submit" className="btn btn-success btn-sm">
                              Save
                            </button>
                          </div>
                        </form>
                      </td>
                    ) : (
                      <>
                        <td>{service.name}</td>
                        <td>₹{service.price}</td>
                        <td>{service.description}</td>
                        <td className="text-end">
                          <div className="d-flex gap-2 justify-content-end">
                            <button
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => startEdit(service)}
                            >
                              <i className="bi bi-pencil" aria-hidden="true"></i> Edit
                            </button>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => handleDelete(service.id)}
                            >
                              <i className="bi bi-trash" aria-hidden="true"></i> Delete
                            </button>
                          </div>
                        </td>
                      </>
                    )}
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
