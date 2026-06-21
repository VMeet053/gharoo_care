import { useState, useEffect } from 'react';

export default function PremiumUserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchPremiumUsers = async () => {
      try {
        const res = await fetch('/api/premium-users');
        const data = await res.json();
        if (data.success) {
          setUsers(data.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch premium users:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPremiumUsers();
  }, []);

  const totalPremium = users.length;
  const activePremium = users.filter(u => u.status === 'Active').length;
  const expiringPremium = users.filter(u => u.status === 'Expiring Soon').length;
  const expiredPremium = users.filter(u => u.status === 'Expired').length;

  // Filter users
  const filteredUsers = users.filter(user => 
    (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.phone || '').includes(searchTerm)
  );

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Active':
        return 'text-bg-success';
      case 'Expiring Soon':
        return 'text-bg-warning';
      case 'Expired':
        return 'text-bg-danger';
      default:
        return 'text-bg-secondary';
    }
  };

  const getPlanBadgeClass = (plan) => {
    switch (plan) {
      case 'Premium':
        return 'text-bg-primary';
      case 'Pro':
        return 'text-bg-info';
      default:
        return 'text-bg-secondary';
    }
  };

  return (
    <div className="container-fluid px-3 px-lg-4 py-4">
      <div className="page-heading animate-fade-in">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-award" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">Management</p>
            <h1 className="h3 mb-1">Premium User List</h1>
            <p className="text-muted mb-0">Manage premium user accounts and subscription plans.</p>
          </div>
        </div>
        <div className="heading-actions">
          <button className="btn btn-outline-secondary btn-sm"><i className="bi bi-download" aria-hidden="true"></i> Export</button>
        </div>
      </div>

      {/* Metrics Cards */}
      <section className="row g-3 mt-1 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="col-12 col-sm-6 col-xl-3">
          <article className="metric-card metric-primary">
            <div className="metric-top">
              <span className="metric-label">Total Premium</span>
              <span className="metric-icon"><i className="bi bi-award" aria-hidden="true"></i></span>
            </div>
            <div className="metric-value">{totalPremium}</div>
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
            <div className="metric-value">{activePremium}</div>
            <div className="metric-meta">
              <span className="text-muted">-</span>
              <span>active subscriptions</span>
            </div>
          </article>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <article className="metric-card metric-warning">
            <div className="metric-top">
              <span className="metric-label">Expiring Soon</span>
              <span className="metric-icon"><i className="bi bi-hourglass-split" aria-hidden="true"></i></span>
            </div>
            <div className="metric-value">{expiringPremium}</div>
            <div className="metric-meta">
              <span className="text-muted">-</span>
              <span>next 7 days</span>
            </div>
          </article>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <article className="metric-card metric-danger">
            <div className="metric-top">
              <span className="metric-label">Expired</span>
              <span className="metric-icon"><i className="bi bi-slash-circle" aria-hidden="true"></i></span>
            </div>
            <div className="metric-value">{expiredPremium}</div>
            <div className="metric-meta">
              <span className="text-muted">-</span>
              <span>this week</span>
            </div>
          </article>
        </div>
      </section>

      {/* Premium Users Table */}
      <section className="panel mt-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="panel-header">
          <div>
            <h2 className="h5 mb-1 section-title"><i className="bi bi-table" aria-hidden="true"></i><span>Premium User List</span></h2>
            <p className="text-muted mb-0">Search, review, and manage premium user accounts.</p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <input 
              className="form-control form-control-sm table-search" 
              type="search" 
              placeholder="Search premium users" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              aria-label="Search premium users" 
            />
          </div>
        </div>
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th scope="col">User</th>
                <th scope="col">Plan</th>
                <th scope="col">City</th>
                <th scope="col">Expiry Date</th>
                <th scope="col">Status</th>
                <th scope="col" className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <div className="blank-icon mx-auto mb-3">
                      <i className="bi bi-inbox"></i>
                    </div>
                    <h5 className="text-muted">No premium users found</h5>
                    <p className="text-muted small">Add premium users to get started</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <tr key={user.id} className="animate-fade-in" style={{ animationDelay: `${0.25 + (index * 0.05)}s` }}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className="avatar-img avatar-sm bg-primary text-white d-flex align-items-center justify-content-center">
                          {(user.name || '').charAt(0)}
                        </div>
                        <div>
                          <p className="fw-semibold mb-0">{user.name}</p>
                          <p className="text-muted small mb-0">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge ${getPlanBadgeClass(user.plan)}`}>{user.plan}</span></td>
                    <td>{user.city}</td>
                    <td>{user.expiryDate ? new Date(user.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}</td>
                    <td><span className={`badge ${getStatusBadgeClass(user.status)}`}>{user.status}</span></td>
                    <td className="text-end">
                      <button className="btn btn-light btn-sm">View</button>
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
