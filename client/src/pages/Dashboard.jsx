import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/dashboard.css';

export default function Dashboard() {
  const [data, setData] = useState({
    users: [],
    premiumUsers: [],
    leads: [],
    workOrders: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [resUsers, resPremium, resLeads, resOrders] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/premium-users'),
          fetch('/api/leads'),
          fetch('/api/work-orders')
        ]);

        const users = await resUsers.json();
        const premiumRes = await resPremium.json();
        const leads = await resLeads.json();
        const workOrders = await resOrders.json();

        setData({
          users: Array.isArray(users) ? users : [],
          premiumUsers: premiumRes.success && Array.isArray(premiumRes.data) ? premiumRes.data : [],
          leads: Array.isArray(leads) ? leads : [],
          workOrders: Array.isArray(workOrders) ? workOrders : []
        });
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard metrics. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'text-bg-success';
      case 'pending':
        return 'text-bg-warning';
      case 'suspended':
        return 'text-bg-danger';
      default:
        return 'text-bg-secondary';
    }
  };

  // Calculations
  const totalRevenue = data.premiumUsers.reduce((sum, u) => {
    const priceStr = u.price || '';
    const val = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
    return sum + val;
  }, 0);

  const totalOrders = data.workOrders.length;
  const totalCustomers = data.users.length;
  const ticketsNeedReview = data.leads.filter(l => l.status === 'New').length;

  const recentUsers = [...data.users].reverse().slice(0, 5);

  // Sales Performance Chart Data (Last 6 Months)
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    monthlyData.push({
      month: d.toLocaleString('en-US', { month: 'short' }),
      revenue: 0
    });
  }

  data.premiumUsers.forEach(u => {
    const date = u.createdAt ? new Date(u.createdAt) : null;
    if (date) {
      const monthName = date.toLocaleString('en-US', { month: 'short' });
      const bucket = monthlyData.find(m => m.month === monthName);
      if (bucket) {
        const val = parseFloat((u.price || '').replace(/[^0-9.]/g, '')) || 0;
        bucket.revenue += val;
      }
    }
  });

  const isDemoSales = monthlyData.every(m => m.revenue === 0);
  const salesPoints = isDemoSales 
    ? [
        { month: 'Jan', revenue: 15000 },
        { month: 'Feb', revenue: 22000 },
        { month: 'Mar', revenue: 18000 },
        { month: 'Apr', revenue: 35000 },
        { month: 'May', revenue: 28000 },
        { month: 'Jun', revenue: 42000 }
      ]
    : monthlyData;

  const maxRevenue = Math.max(...salesPoints.map(p => p.revenue), 1000);

  // Chart layout calculations
  const chartWidth = 600;
  const chartHeight = 220;
  const paddingX = 50;
  const paddingY = 30;

  const svgPoints = salesPoints.map((pt, idx) => {
    const x = paddingX + (idx * (chartWidth - paddingX * 2)) / (salesPoints.length - 1);
    const y = chartHeight - paddingY - (pt.revenue * (chartHeight - paddingY * 2)) / maxRevenue;
    return { ...pt, x, y };
  });

  const linePath = svgPoints.reduce((acc, p, idx) => {
    return acc + `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
  }, '');

  const areaPath = svgPoints.length > 0 
    ? `${linePath} L ${svgPoints[svgPoints.length - 1].x} ${chartHeight - paddingY} L ${svgPoints[0].x} ${chartHeight - paddingY} Z` 
    : '';

  // Channel Mix Chart Data (Group by Premium Plans)
  const plans = {};
  data.premiumUsers.forEach(u => {
    const planName = u.plan || 'Premium';
    plans[planName] = (plans[planName] || 0) + 1;
  });

  const isDemoDonut = Object.keys(plans).length === 0;
  const donutData = isDemoDonut
    ? [
        { name: 'Premium', count: 12, color: 'var(--admin-primary)' },
        { name: 'Pro', count: 8, color: '#10b981' },
        { name: 'Basic', count: 5, color: '#f59e0b' }
      ]
    : Object.keys(plans).map((name, idx) => {
        const colors = ['var(--admin-primary)', '#10b981', '#f59e0b', '#3b82f6', '#ec4899'];
        return {
          name,
          count: plans[name],
          color: colors[idx % colors.length]
        };
      });

  const donutTotal = donutData.reduce((sum, d) => sum + d.count, 0);

  let currentStart = 0;
  const donutSlices = donutData.map(d => {
    const percent = donutTotal > 0 ? (d.count / donutTotal) * 100 : 0;
    const start = currentStart;
    currentStart += percent;
    return { ...d, percent, start };
  });

  const donutRadius = 40;
  const donutCircumference = 2 * Math.PI * donutRadius;

  if (loading) {
    return (
      <div className="container-fluid px-3 px-lg-4 py-5 text-center">
        <div className="spinner-border text-primary my-5" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-3 px-lg-4 py-4 animate-fade-in">
      <div className="page-heading">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-speedometer2" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">Overview</p>
            <h1 className="h3 mb-1">Dashboard</h1>
            <p className="text-muted mb-0">Monitor performance, sales, users, and support from one clean workspace.</p>
          </div>
        </div>
        <div className="heading-actions">
          <button className="btn btn-outline-secondary btn-sm" type="button"><i className="bi bi-download" aria-hidden="true"></i> Export</button>
          <button className="btn btn-primary btn-sm" type="button"><i className="bi bi-file-earmark-plus" aria-hidden="true"></i> Create Report</button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <section className="row g-3 mt-1" aria-label="Dashboard metrics">
        <div className="col-12 col-sm-6 col-xl-3">
          <article className="metric-card metric-primary">
            <div className="metric-top">
              <span className="metric-label">Revenue</span>
              <span className="metric-icon"><i className="bi bi-currency-rupee" aria-hidden="true"></i></span>
            </div>
            <div className="metric-value">₹{totalRevenue.toLocaleString('en-IN')}</div>
            <div className="metric-meta">
              <span className="text-muted">-</span>
              <span>from subscription sales</span>
            </div>
          </article>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <article className="metric-card metric-success">
            <div className="metric-top">
              <span className="metric-label">Orders</span>
              <span className="metric-icon"><i className="bi bi-bag-check" aria-hidden="true"></i></span>
            </div>
            <div className="metric-value">{totalOrders}</div>
            <div className="metric-meta">
              <span className="text-muted">-</span>
              <span>work orders assigned</span>
            </div>
          </article>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <article className="metric-card metric-warning">
            <div className="metric-top">
              <span className="metric-label">Customers</span>
              <span className="metric-icon"><i className="bi bi-people" aria-hidden="true"></i></span>
            </div>
            <div className="metric-value">{totalCustomers}</div>
            <div className="metric-meta">
              <span className="text-muted">-</span>
              <span>active user accounts</span>
            </div>
          </article>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <article className="metric-card metric-danger">
            <div className="metric-top">
              <span className="metric-label">Tickets</span>
              <span className="metric-icon"><i className="bi bi-life-preserver" aria-hidden="true"></i></span>
            </div>
            <div className="metric-value">{ticketsNeedReview}</div>
            <div className="metric-meta">
              <span className="text-muted">-</span>
              <span>new leads to review</span>
            </div>
          </article>
        </div>
      </section>

      <section className="row g-3 mt-1">
        <div className="col-12 col-xl-8">
          <div className="panel h-100">
            <div className="panel-header d-flex justify-content-between align-items-center">
              <div>
                <h2 className="h5 mb-1 section-title"><i className="bi bi-graph-up-arrow" aria-hidden="true"></i><span>Sales Performance</span></h2>
                <p className="text-muted mb-0">Monthly revenue compared with operational targets. {isDemoSales && <span className="badge text-bg-secondary ms-1">Demo Data</span>}</p>
              </div>
              <Link className="btn btn-light btn-sm" to="/charts">View Details</Link>
            </div>
            <div className="panel-body py-3">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-100 h-100" style={{ minHeight: '220px' }}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--admin-primary)" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="var(--admin-primary)" stopOpacity="0.00" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                  const y = paddingY + ratio * (chartHeight - paddingY * 2);
                  const val = Math.round(maxRevenue * (1 - ratio));
                  return (
                    <g key={idx}>
                      <line 
                        x1={paddingX} 
                        y1={y} 
                        x2={chartWidth - paddingX} 
                        y2={y} 
                        stroke="var(--admin-border)" 
                        strokeWidth="1" 
                        strokeDasharray="4 4" 
                      />
                      <text 
                        x={paddingX - 10} 
                        y={y + 4} 
                        fill="var(--admin-muted)" 
                        fontSize="10" 
                        textAnchor="end"
                      >
                        ₹{val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                      </text>
                    </g>
                  );
                })}

                {/* X Axis Labels */}
                {svgPoints.map((p, idx) => (
                  <text 
                    key={idx} 
                    x={p.x} 
                    y={chartHeight - 10} 
                    fill="var(--admin-muted)" 
                    fontSize="11" 
                    textAnchor="middle"
                    fontWeight="500"
                  >
                    {p.month}
                  </text>
                ))}

                {/* Area under the line */}
                {areaPath && <path d={areaPath} fill="url(#chartGradient)" />}

                {/* Line path */}
                {linePath && (
                  <path 
                    d={linePath} 
                    fill="transparent" 
                    stroke="var(--admin-primary)" 
                    strokeWidth="3" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
                )}

                {/* Dots on line */}
                {svgPoints.map((p, idx) => (
                  <g key={idx} className="chart-dot-group">
                    <circle 
                      cx={p.x} 
                      cy={p.y} 
                      r="6" 
                      fill="var(--admin-primary)" 
                      stroke="var(--admin-surface)" 
                      strokeWidth="2" 
                    />
                    <circle 
                      cx={p.x} 
                      cy={p.y} 
                      r="12" 
                      fill="var(--admin-primary)" 
                      fillOpacity="0" 
                    >
                      <title>{p.month}: ₹{p.revenue.toLocaleString('en-IN')}</title>
                    </circle>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="panel h-100">
            <div className="panel-header">
              <div>
                <h2 className="h5 mb-1 section-title"><i className="bi bi-pie-chart" aria-hidden="true"></i><span>Channel Mix</span></h2>
                <p className="text-muted mb-0">Revenue contribution by plan. {isDemoDonut && <span className="badge text-bg-secondary ms-1">Demo Data</span>}</p>
              </div>
            </div>
            <div className="panel-body">
              <div className="d-flex flex-column align-items-center justify-content-center h-100 py-3">
                <div className="position-relative" style={{ width: '130px', height: '130px' }}>
                  <svg width="130" height="130" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                    {donutSlices.map((slice, idx) => {
                      const strokeOffset = donutCircumference - (slice.percent / 100) * donutCircumference;
                      return (
                        <circle
                          key={idx}
                          cx="50"
                          cy="50"
                          r={donutRadius}
                          fill="transparent"
                          stroke={slice.color}
                          strokeWidth="10"
                          strokeDasharray={donutCircumference}
                          strokeDashoffset={strokeOffset}
                          style={{
                            transformOrigin: '50px 50px',
                            transform: `rotate(${(slice.start / 100) * 360}deg)`,
                            transition: 'stroke-dashoffset 0.5s ease-in-out'
                          }}
                        />
                      );
                    })}
                    <circle cx="50" cy="50" r="32" fill="var(--admin-surface)" />
                  </svg>
                  <div className="position-absolute top-50 start-50 translate-middle text-center">
                    <span className="h5 fw-bold mb-0">{donutTotal}</span>
                    <p className="text-muted small mb-0" style={{ fontSize: '0.7rem' }}>Total</p>
                  </div>
                </div>
                
                <div className="mt-3 w-100 px-3">
                  <div className="d-flex flex-column gap-2 justify-content-center">
                    {donutSlices.map((slice, idx) => (
                      <div key={idx} className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2">
                          <span 
                            className="d-inline-block rounded-circle" 
                            style={{ width: '10px', height: '10px', backgroundColor: slice.color }}
                          />
                          <span className="small text-muted">{slice.name}</span>
                        </div>
                        <span className="small fw-semibold">{slice.count} ({Math.round(slice.percent)}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
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
            <thead>
              <tr>
                <th scope="col">User</th>
                <th scope="col">Role</th>
                <th scope="col">Team</th>
                <th scope="col">Status</th>
                <th scope="col">Joined</th>
                <th scope="col" className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <div className="blank-icon mx-auto mb-3">
                      <i className="bi bi-inbox"></i>
                    </div>
                    <h5 className="text-muted">No recent users</h5>
                    <p className="text-muted small">New user activity will appear here</p>
                  </td>
                </tr>
              ) : (
                recentUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        {user.avatar ? (
                          <img className="avatar-img avatar-sm" src={user.avatar} alt={user.name} />
                        ) : (
                          <div className="avatar-img avatar-sm bg-primary text-white d-flex align-items-center justify-content-center">
                            {(user.name || '').charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="fw-semibold mb-0">{user.name}</p>
                          <p className="text-muted small mb-0">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>{user.role}</td>
                    <td>{user.team || '-'}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(user.status)}`}>
                        {user.status || 'Active'}
                      </span>
                    </td>
                    <td>{user.joined}</td>
                    <td className="text-end">
                      <Link className="btn btn-light btn-sm" to="/users">View</Link>
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

