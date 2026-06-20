import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Active':
        return 'text-bg-success';
      case 'Pending':
        return 'text-bg-warning';
      case 'Suspended':
        return 'text-bg-secondary';
      default:
        return 'text-bg-secondary';
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'Active').length;
  const pendingUsers = users.filter(u => u.status === 'Pending').length;
  const suspendedUsers = users.filter(u => u.status === 'Suspended').length;

  return (
    <div className="container-fluid px-3 px-lg-4 py-4">
      <div className="page-heading">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-people" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">Management</p>
            <h1 className="h3 mb-1">Users</h1>
            <p className="text-muted mb-0">Review accounts, roles, account status, and team ownership.</p>
          </div>
        </div>
        <div className="heading-actions">
          <Link className="btn btn-outline-secondary btn-sm" to="/tables"><i className="bi bi-download" aria-hidden="true"></i> Export</Link>
          <Link className="btn btn-primary btn-sm" to="/add-user"><i className="bi bi-person-plus" aria-hidden="true"></i> Add User</Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <section className="row g-3 mt-1" aria-label="User summary">
        <div className="col-12 col-sm-6 col-xl-3">
          <article className="metric-card metric-primary">
            <div className="metric-top">
              <span className="metric-label">Total Users</span>
              <span className="metric-icon"><i className="bi bi-people" aria-hidden="true"></i></span>
            </div>
            <div className="metric-value">{totalUsers}</div>
            <div className="metric-meta">
              <span className="text-muted">-</span>
              <span>this month</span>
            </div>
          </article>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <article className="metric-card metric-success">
            <div className="metric-top">
              <span className="metric-label">Active</span>
              <span className="metric-icon"><i className="bi bi-check2-circle" aria-hidden="true"></i></span>
            </div>
            <div className="metric-value">{activeUsers}</div>
            <div className="metric-meta">
              <span className="text-muted">-</span>
              <span>healthy accounts</span>
            </div>
          </article>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <article className="metric-card metric-warning">
            <div className="metric-top">
              <span className="metric-label">Pending</span>
              <span className="metric-icon"><i className="bi bi-hourglass-split" aria-hidden="true"></i></span>
            </div>
            <div className="metric-value">{pendingUsers}</div>
            <div className="metric-meta">
              <span className="text-muted">-</span>
              <span>need approval</span>
            </div>
          </article>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <article className="metric-card metric-danger">
            <div className="metric-top">
              <span className="metric-label">Suspended</span>
              <span className="metric-icon"><i className="bi bi-slash-circle" aria-hidden="true"></i></span>
            </div>
            <div className="metric-value">{suspendedUsers}</div>
            <div className="metric-meta">
              <span className="text-muted">-</span>
              <span>flagged today</span>
            </div>
          </article>
        </div>
      </section>

      <section className="panel mt-3">
        <div className="panel-header">
          <div>
            <h2 className="h5 mb-1 section-title"><i className="bi bi-table" aria-hidden="true"></i><span>User List</span></h2>
            <p className="text-muted mb-0">Search, review, and manage team member accounts.</p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <input className="form-control form-control-sm table-search" type="search" placeholder="Search users" data-table-search="usersTable" aria-label="Search users" />
            <Link className="btn btn-primary btn-sm" to="/add-user"><i className="bi bi-person-plus" aria-hidden="true"></i> Add User</Link>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table align-middle mb-0" id="usersTable" data-searchable-table>
            <thead><tr><th scope="col">User</th><th scope="col">Role</th><th scope="col">Team</th><th scope="col">Status</th><th scope="col">Joined</th><th scope="col" className="text-end">Action</th></tr></thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <div className="blank-icon mx-auto mb-3">
                      <i className="bi bi-inbox"></i>
                    </div>
                    <h5 className="text-muted">No Users Found</h5>
                    <p className="text-muted small">Add your first user to get started</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <img className="avatar-img avatar-sm" src={user.avatar} alt={user.name} />
                        <div>
                          <p className="fw-semibold mb-0">{user.name}</p>
                          <p className="text-muted small mb-0">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>{user.role}</td>
                    <td>{user.team}</td>
                    <td><span className={`badge ${getStatusBadgeClass(user.status)}`}>{user.status}</span></td>
                    <td>{user.joined}</td>
                    <td className="text-end"><Link className="btn btn-light btn-sm" to="/user-details">View</Link></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mt-3">
          <p className="text-muted small mb-0">Showing 1 to {users.length} of {users.length} users</p>
          <nav aria-label="Users pagination">
            <ul className="pagination pagination-sm mb-0">
              <li className="page-item disabled"><Link className="page-link" to="#">Previous</Link></li>
              <li className="page-item active"><Link className="page-link" to="#">1</Link></li>
              <li className="page-item disabled"><Link className="page-link" to="#">2</Link></li>
              <li className="page-item disabled"><Link className="page-link" to="#">Next</Link></li>
            </ul>
          </nav>
        </div>
      </section>
    </div>
  );
}