import { Link, useLocation } from 'react-router-dom';

const pageTitles = {
  '/': 'Dashboard',
  '/users': 'Users',
  '/add-user': 'Add User',
  '/profile': 'Profile',
  '/charts': 'Charts',
  '/tables': 'Tables',
  '/forms': 'Forms',
  '/components': 'Components',
  '/alerts': 'Alerts',
  '/modals': 'Modals',
  '/settings': 'Settings',
  '/blank': 'Getting Started',
  '/user-details': 'User Details',
  '/create-agent': 'Create Agent',
};

export default function Navbar({ isOpen, toggleSidebar }) {
  const { pathname } = useLocation();
  const pageTitle = pageTitles[pathname] || 'Dashboard';

  return (
    <nav className="navbar admin-navbar navbar-expand bg-white">
      <div className="container-fluid px-3 px-lg-4">
        <button
          className="sidebar-toggle d-lg-none"
          type="button"
          onClick={toggleSidebar}
          aria-controls="adminSidebar"
          aria-expanded={isOpen}
          aria-label="Toggle sidebar"
        >
          {isOpen ? (
            <i className="bi bi-three-dots-vertical" style={{ fontSize: '20px', lineHeight: 1 }} aria-hidden="true"></i>
          ) : (
            <i className="bi bi-list" style={{ fontSize: '20px', lineHeight: 1 }} aria-hidden="true"></i>
          )}
        </button>

        <div className="navbar-breadcrumb d-none d-md-flex">
          <Link to="/"><i className="bi bi-house-door" aria-hidden="true"></i></Link>
          <span className="separator">/</span>
          <span className="current">{pageTitle}</span>
        </div>

        <div className="search-wrap d-none d-lg-flex ms-3">
          <i className="bi bi-search" aria-hidden="true"></i>
          <input
            className="form-control search-input"
            type="search"
            placeholder="Search users, orders, reports..."
            aria-label="Search"
          />
        </div>

        <div className="navbar-actions ms-auto">
          <div className="dropdown">
            <button
              className="icon-button"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              aria-label="Notifications"
            >
              <span className="notification-dot"></span>
              <i className="bi bi-bell" aria-hidden="true"></i>
            </button>
            <div className="dropdown-menu dropdown-menu-end notification-menu">
              <div className="dropdown-header fw-bold text-body">Notifications</div>
              <Link className="dropdown-item" to="/users">
                <span className="notification-title">New user registered</span>
                <span className="notification-time">4 minutes ago</span>
              </Link>
              <Link className="dropdown-item" to="/charts">
                <span className="notification-title">Revenue target reached</span>
                <span className="notification-time">32 minutes ago</span>
              </Link>
              <Link className="dropdown-item" to="/settings">
                <span className="notification-title">Security review completed</span>
                <span className="notification-time">1 hour ago</span>
              </Link>
            </div>
          </div>

          <div className="dropdown">
            <button
              className="profile-button dropdown-toggle"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <img className="avatar-img avatar-sm" src="/admin/assets/images/avatar/avatar.jpg" alt="Admin Hasan" />
              <span className="profile-name d-none d-sm-inline">Admin Hasan</span>
            </button>
            <ul className="dropdown-menu dropdown-menu-end">
              <li><Link className="dropdown-item" to="/profile"><i className="bi bi-person me-2"></i>Profile</Link></li>
              <li><Link className="dropdown-item" to="/settings"><i className="bi bi-gear me-2"></i>Settings</Link></li>
              <li><hr className="dropdown-divider" /></li>
              <li><Link className="dropdown-item" to="/login"><i className="bi bi-box-arrow-right me-2"></i>Sign out</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
}
