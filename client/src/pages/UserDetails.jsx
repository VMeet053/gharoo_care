import { Link } from 'react-router-dom';

export default function UserDetails() {
  return (
    <div className="container-fluid px-3 px-lg-4 py-4">
      <div className="page-heading animate-fade-in">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-person-lines-fill" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">Management</p>
            <h1 className="h3 mb-1">User Details</h1>
            <p className="text-muted mb-0">Inspect account status, profile data, permissions, and recent activity.</p>
          </div>
        </div>
        <div className="heading-actions">
          <Link className="btn btn-outline-secondary btn-sm" to="/users"><i className="bi bi-arrow-left" aria-hidden="true"></i> Back to Users</Link>
          <Link className="btn btn-primary btn-sm" to="/add-user"><i className="bi bi-person-plus" aria-hidden="true"></i> Add User</Link>
        </div>
      </div>

      <div className="text-center py-5 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="blank-icon mx-auto mb-3">
          <i className="bi bi-person-x"></i>
        </div>
        <h5 className="text-muted">No user selected</h5>
        <p className="text-muted small">Select a user from the Users page to view details</p>
      </div>
    </div>
  );
}
