import { useState, useEffect } from 'react';
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
  
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('adminHMD.sidebarMini');
      return saved !== null ? saved === 'true' : true; // Default to collapsed
    } catch {
      return true;
    }
  });
  
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 992);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 992);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const title = pageTitles[pathname] || 'Dashboard';
    document.title = `${title} | adminHMD`;
    // Auto close mobile sidebar on navigation
    setIsMobileOpen(false);
  }, [pathname]);

  // Sync classes to document.body
  useEffect(() => {
    if (isCollapsed && isDesktop) {
      document.body.classList.add('sidebar-mini');
    } else {
      document.body.classList.remove('sidebar-mini');
    }
    try {
      localStorage.setItem('adminHMD.sidebarMini', String(isCollapsed));
    } catch (e) {}
  }, [isCollapsed, isDesktop]);

  useEffect(() => {
    if (isMobileOpen && !isDesktop) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }
  }, [isMobileOpen, isDesktop]);

  const toggleSidebar = () => {
    if (isDesktop) {
      setIsCollapsed(prev => !prev);
    } else {
      setIsMobileOpen(prev => !prev);
    }
  };

  const closeMobileSidebar = () => {
    setIsMobileOpen(false);
  };

  const isOpen = isDesktop ? !isCollapsed : isMobileOpen;

  return (
    <div className="admin-shell">
      <div className="sidebar-backdrop" onClick={closeMobileSidebar} style={{ cursor: 'pointer' }}></div>
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} closeMobileSidebar={closeMobileSidebar} />
      <div className="admin-main">
        <Navbar isOpen={isOpen} toggleSidebar={toggleSidebar} />
        <main className="dashboard-content">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
