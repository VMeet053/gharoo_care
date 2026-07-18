import { useState, useEffect } from 'react';
import '../styles/service-user-list.css';

export default function ServiceUserList() {
  const [serviceUsers, setServiceUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchServiceUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users/role/Service Man');
      const data = await response.json();
      setServiceUsers(data);
      setFilteredUsers(data);
    } catch (err) {
      console.error('Failed to fetch service users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceUsers();
  }, []);

  // Filtering
  useEffect(() => {
    let filtered = [...serviceUsers];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.phone?.includes(term)
      );
    }
    
    if (statusFilter !== 'All') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }
    
    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, serviceUsers]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Handlers
  const handleView = async (id) => {
    try {
      const response = await fetch(`/api/users/${id}`);
      const data = await response.json();
      if (data.success) {
        setSelectedUser(data.user);
        setShowModal(true);
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    if (!confirm(`Are you sure you want to ${newStatus === 'Active' ? 'activate' : 'deactivate'} this user?`)) {
      return;
    }
    try {
      const response = await fetch(`/api/users/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (data.success) {
        fetchServiceUsers();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    try {
      const response = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        fetchServiceUsers();
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  return (
    <div className="container-fluid px-3 px-lg-4 py-4">
      <div className="page-heading animate-fade-in">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-person-check" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">Management</p>
            <h1 className="h3 mb-1">Service Man List</h1>
            <p className="text-muted mb-0">Manage all your service men and their login credentials.</p>
          </div>
        </div>
        <div className="heading-actions">
          <a href="/create-agent" className="btn btn-primary">
            <i className="bi bi-person-plus" aria-hidden="true"></i>
            Add Service Man
          </a>
        </div>
      </div>

      {/* Filters */}
      <div className="panel mt-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="d-flex flex-column flex-md-row gap-3">
          <div className="flex-grow-1">
            <label className="form-label">Search</label>
            <input
              type="text"
              className="form-control"
              placeholder="Search by name, email or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <section className="panel mt-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Phone</th>
                <th scope="col">Service</th>
                <th scope="col">Team</th>
                <th scope="col">ID Proof</th>
                <th scope="col">Status</th>
                <th scope="col">Joined</th>
                <th scope="col" className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="text-center py-5">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-5">
                    <div className="blank-icon mx-auto mb-3">
                      <i className="bi bi-inbox"></i>
                    </div>
                    <h5 className="text-muted">No service men found</h5>
                    <p className="text-muted small">Add your first service man to get started</p>
                  </td>
                </tr>
              ) : (
                currentItems.map((user, index) => (
                  <tr key={user.id || user._id}>
                    <td>{indexOfFirstItem + index + 1}</td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className="avatar-sm bg-primary text-white rounded-circle d-flex align-items-center justify-content-center">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </div>
                        <div>
                          <p className="fw-semibold mb-0">{user.name}</p>
                        </div>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>{user.phone || '-'}</td>
                    <td>{user.service || '-'}</td>
                    <td>{user.team}</td>
                    <td>
                      {user.idProofType ? (
                        <span className="fw-semibold">
                          {user.idProofType}: {user.idProofNumber}
                        </span>
                      ) : '-'}
                    </td>
                    <td>
                      <span className={`badge ${user.status === 'Active' ? 'text-bg-success' : 'text-bg-secondary'}`}>
                        {user.status || 'Active'}
                      </span>
                    </td>
                    <td>{user.joined}</td>
                    <td className="text-end">
                      <div className="d-flex gap-2 justify-content-end">
                        <button
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => handleView(user.id || user._id)}
                        >
                          <i className="bi bi-eye"></i> View
                        </button>
                        <button
                          className={`btn btn-sm ${user.status === 'Active' ? 'btn-outline-warning' : 'btn-outline-success'}`}
                          onClick={() => handleToggleStatus(user.id || user._id, user.status)}
                        >
                          <i className={`bi ${user.status === 'Active' ? 'bi-pause-circle' : 'bi-play-circle'}`}></i>
                          {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleDelete(user.id || user._id)}
                        >
                          <i className="bi bi-trash"></i> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && filteredUsers.length > 0 && (
          <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
            <div className="text-muted">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredUsers.length)} of {filteredUsers.length} entries
            </div>
            <nav>
              <ul className="pagination mb-0">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}>
                    Previous
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <li key={page} className={`page-item ${page === currentPage ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setCurrentPage(page)}>
                      {page}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}>
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </section>

      {/* View User Modal */}
      {showModal && selectedUser && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Service Man Details</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Full Name</label>
                    <p className="mb-0">{selectedUser.firstName} {selectedUser.lastName}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Email</label>
                    <p className="mb-0">{selectedUser.email}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Phone</label>
                    <p className="mb-0">{selectedUser.phone || '-'}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Service</label>
                    <p className="mb-0">{selectedUser.service || '-'}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Team</label>
                    <p className="mb-0">{selectedUser.team}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Status</label>
                    <p className="mb-0">
                      <span className={`badge ${selectedUser.status === 'Active' ? 'text-bg-success' : 'text-bg-secondary'}`}>
                        {selectedUser.status || 'Active'}
                      </span>
                    </p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">ID Proof Type</label>
                    <p className="mb-0">{selectedUser.idProofType || '-'}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">ID Proof Number</label>
                    <p className="mb-0">{selectedUser.idProofNumber || '-'}</p>
                  </div>
                  <div className="col-md-12 mb-3">
                    <label className="form-label fw-semibold">Address</label>
                    <p className="mb-0">{selectedUser.address || '-'}</p>
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-semibold">House / Flat Number</label>
                    <p className="mb-0">{selectedUser.houseNumber || '-'}</p>
                  </div>
                  <div className="col-md-8 mb-3">
                    <label className="form-label fw-semibold">Current Location</label>
                    {selectedUser.currentLocation ? (
                      <p className="mb-0"><a href={selectedUser.currentLocation} target="_blank" rel="noreferrer">Open map</a></p>
                    ) : (
                      <p className="mb-0">-</p>
                    )}
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-semibold">City</label>
                    <p className="mb-0">{selectedUser.city || '-'}</p>
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-semibold">State</label>
                    <p className="mb-0">{selectedUser.state || '-'}</p>
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-semibold">Pin Code</label>
                    <p className="mb-0">{selectedUser.pinCode || '-'}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Front Side ID Proof</label>
                    {selectedUser.frontIdProofImage ? (
                      <img 
                        src={selectedUser.frontIdProofImage} 
                        alt="Front ID Proof" 
                        className="img-thumbnail" 
                        style={{ maxWidth: '100%', maxHeight: '200px' }}
                      />
                    ) : <p className="mb-0">-</p>}
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Back Side ID Proof</label>
                    {selectedUser.backIdProofImage ? (
                      <img 
                        src={selectedUser.backIdProofImage} 
                        alt="Back ID Proof" 
                        className="img-thumbnail" 
                        style={{ maxWidth: '100%', maxHeight: '200px' }}
                      />
                    ) : <p className="mb-0">-</p>}
                  </div>
                  <div className="col-md-12 mb-3">
                    <label className="form-label fw-semibold">Notes</label>
                    <p className="mb-0">{selectedUser.notes || '-'}</p>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
