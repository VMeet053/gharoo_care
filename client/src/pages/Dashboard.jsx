import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <div className="container-fluid px-3 px-lg-4 py-4">
      {/* <div className="welcome-banner">
        <div>
          <h2>Welcome back, Admin Hasan</h2>
          <p>Here&apos;s what&apos;s happening across your workspace today.</p>
        </div>
        <div className="d-flex gap-3">
          <div className="welcome-stat">
            <strong>98.2%</strong>
            <span>Uptime</span>
          </div>
          <div className="welcome-stat">
            <strong>24</strong>
            <span>Active Tasks</span>
          </div>
        </div>
      </div> */}

      <div className="page-heading">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-speedometer2" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">Overview</p>
            <h1 className="h3 mb-1">Dashboard</h1>
            <p className="text-muted mb-0">Monitor performance, sales, users, and support from one clean workspace.</p>
          </div>
        </div>
        <div className="heading-actions"><button className="btn btn-outline-secondary btn-sm" type="button"><i className="bi bi-download" aria-hidden="true"></i> Export</button><button className="btn btn-primary btn-sm" type="button"><i className="bi bi-file-earmark-plus" aria-hidden="true"></i> Create Report</button></div>
      </div>

      <section className="row g-3 mt-1" aria-label="Dashboard metrics">
        <div className="col-12 col-sm-6 col-xl-3">
          <article className="metric-card metric-primary">
            <div className="metric-top">
              <span className="metric-label">Revenue</span>
              <span className="metric-icon"><i className="bi bi-currency-rupee" aria-hidden="true"></i></span>
            </div>
            <div className="metric-value">₹0</div>
            <div className="metric-meta">
              <span className="text-muted">-</span>
              <span>from last month</span>
            </div>
          </article>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <article className="metric-card metric-success">
            <div className="metric-top">
              <span className="metric-label">Orders</span>
              <span className="metric-icon"><i className="bi bi-bag-check" aria-hidden="true"></i></span>
            </div>
            <div className="metric-value">0</div>
            <div className="metric-meta">
              <span className="text-muted">-</span>
              <span>new orders</span>
            </div>
          </article>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <article className="metric-card metric-warning">
            <div className="metric-top">
              <span className="metric-label">Customers</span>
              <span className="metric-icon"><i className="bi bi-people" aria-hidden="true"></i></span>
            </div>
            <div className="metric-value">0</div>
            <div className="metric-meta">
              <span className="text-muted">-</span>
              <span>active users</span>
            </div>
          </article>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <article className="metric-card metric-danger">
            <div className="metric-top">
              <span className="metric-label">Tickets</span>
              <span className="metric-icon"><i className="bi bi-life-preserver" aria-hidden="true"></i></span>
            </div>
            <div className="metric-value">0</div>
            <div className="metric-meta">
              <span className="text-muted">-</span>
              <span>need review</span>
            </div>
          </article>
        </div>
      </section>

      <section className="row g-3 mt-1">
        <div className="col-12 col-xl-8">
          <div className="panel h-100">
            <div className="panel-header">
              <div>
                <h2 className="h5 mb-1 section-title"><i className="bi bi-graph-up-arrow" aria-hidden="true"></i><span>Sales Performance</span></h2>
                <p className="text-muted mb-0">Monthly revenue compared with operational targets.</p>
              </div>
              <Link className="btn btn-light btn-sm" to="/charts">View Details</Link>
            </div>

            <div className="text-center py-5">
              <div className="blank-icon mx-auto mb-3">
                <i className="bi bi-bar-chart-line"></i>
              </div>
              <h5 className="text-muted">No data available</h5>
              <p className="text-muted small">Sales data will appear here</p>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="panel h-100">
            <div className="panel-header">
              <div>
                <h2 className="h5 mb-1 section-title"><i className="bi bi-pie-chart" aria-hidden="true"></i><span>Channel Mix</span></h2>
                <p className="text-muted mb-0">Revenue contribution by source.</p>
              </div>
            </div>

            <div className="text-center py-5">
              <div className="blank-icon mx-auto mb-3">
                <i className="bi bi-pie-chart"></i>
              </div>
              <h5 className="text-muted">No data available</h5>
              <p className="text-muted small">Channel data will appear here</p>
            </div>
          </div>
        </div>
      </section>

      <section className="panel mt-3">
        <div className="panel-header">
          <div>
            <h2 className="h5 mb-1 section-title"><i className="bi bi-people" aria-hidden="true"></i><span>Recent Users</span></h2>
            <p className="text-muted mb-0">Latest account activity across the workspace.</p>
          </div>
          <Link className="btn btn-outline-secondary btn-sm" to="/users">Manage Users</Link>
        </div>
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead><tr><th scope="col">User</th><th scope="col">Role</th><th scope="col">Team</th><th scope="col">Status</th><th scope="col">Joined</th><th scope="col" className="text-end">Action</th></tr></thead>
            <tbody>
              <tr><td colSpan="6" className="text-center py-5">
                <div className="blank-icon mx-auto mb-3">
                  <i className="bi bi-inbox"></i>
                </div>
                <h5 className="text-muted">No recent users</h5>
                <p className="text-muted small">New user activity will appear here</p>
              </td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
