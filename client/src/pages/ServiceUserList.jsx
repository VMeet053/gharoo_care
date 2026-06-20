import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function ServiceUserList() {
  const [serviceUsers, setServiceUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchServiceUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users/role/Service Man');
      const data = await response.json();
      setServiceUsers(data);
    } catch (err) {
      console.error('Failed to fetch service users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceUsers();
  }, []);

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
          <Link className="btn btn-primary btn-sm" to="/create-agent">
            <i className="bi bi-person-plus" aria-hidden="true"></i>
            Add Service Man
          </Link>
        </div>
      </div>

      <section className="panel mt-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Phone</th>
                <th scope="col">Service</th>
                <th scope="col">Team</th>
                <th scope="col">Status</th>
                <th scope="col">Joined</th>
                <th scope="col" className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-5">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : serviceUsers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-5">
                    <div className="blank-icon mx-auto mb-3">
                      <i className="bi bi-inbox"></i>
                    </div>
                    <h5 className="text-muted">No service men found</h5>
                    <p className="text-muted small">Add your first service man to get started</p>
                  </td>
                </tr>
              ) : (
                serviceUsers.map(user => (
                  <tr key={user.id}>
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
                      <span className={`badge ${user.status === 'Active' ? 'text-bg-success' : 'text-bg-secondary'}`}>
                        {user.status || 'Active'}
                      </span>
                    </td>
                    <td>{user.joined}</td>
                    <td className="text-end">
                      <Link className="btn btn-light btn-sm" to="#">View</Link>
                    </td>
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
