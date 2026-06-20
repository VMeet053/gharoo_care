import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';

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

export default function Layout() {
  const { pathname } = useLocation();

  useEffect(() => {
    const title = pageTitles[pathname] || 'Dashboard';
    document.title = `${title} | adminHMD`;
  }, [pathname]);

  return (
    <div className="admin-shell">
      <div className="sidebar-backdrop" data-sidebar-close></div>
      <Sidebar />
      <div className="admin-main">
        <Navbar />
        <main className="dashboard-content">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
