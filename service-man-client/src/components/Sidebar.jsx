import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';

const navItems = [
  { path: '/dashboard', icon: 'bi-speedometer2', label: 'Dashboard' },
  { path: '/leads', icon: 'bi-person-lines-fill', label: 'My Leads' },
  { path: '/work-orders', icon: 'bi-list-check', label: 'Work Orders' },
  { path: '/earnings', icon: 'bi-currency-rupee', label: 'Earnings' }
];

export default function Sidebar() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('serviceManUser');
    sessionStorage.removeItem('serviceManUser');
    navigate('/login');
  };

  const user = JSON.parse(
    localStorage.getItem('serviceManUser') ||
    sessionStorage.getItem('serviceManUser') ||
    '{}'
  );

  return (
    <aside className={`app-sidebar d-none d-lg-flex ${collapsed ? 'collapsed' : ''}`}>
      <div className="app-sidebar-header">
        <div className="app-sidebar-brand" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="app-sidebar-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/gharoo-logo.png" alt="GharooCare Logo" style={{ height: '64px', width: 'auto' }} />
          </span>
          {!collapsed && (
            <div>
              <strong>GharooCare</strong>
              <small>Service Man Portal</small>
            </div>
          )}
        </div>
        <button className="sidebar-toggle-btn" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          <i className={`bi ${collapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
        </button>
        {!collapsed && (
          <p className="app-sidebar-user mb-0">{user.firstName} {user.lastName}</p>
        )}
      </div>

      <ul className="app-sidebar-nav">
        {navItems.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              className={({ isActive }) => `app-sidebar-link${isActive ? ' active' : ''}`}
            >
              <i className={`bi ${item.icon}`} aria-hidden="true"></i>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          </li>
        ))}
      </ul>

      {!collapsed && (
        <div className="app-sidebar-footer">
          <button type="button" className="btn btn-outline-danger w-100" onClick={handleLogout}>
            <i className="bi bi-box-arrow-left me-2"></i>
            Logout
          </button>
        </div>
      )}
    </aside>
  );
}
