import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';

const pageTitles = {
  '/': 'Dashboard',
  '/dashboard': 'Dashboard',
  '/users': 'Users',
  '/work-orders': 'Work Orders',
  '/premium-user-list': 'Premium User List',
  '/service-user-list': 'Service User List',
  '/service-price': 'Service Price',
  '/leads': 'Leads',
  '/status/pending': 'Pending Orders',
  '/status/completed': 'Completed Orders',
  '/payment': 'Payments',
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
  '/user-panel/header': 'Header',
  '/user-panel/hero': 'Hero Section',
  '/user-panel/services': 'Services',
  '/user-panel/service-slider': 'Service Slider',
  '/user-panel/pricing': 'Pricing',
  '/user-panel/about': 'About',
  '/user-panel/why-choose': 'Why Choose',
  '/user-panel/stats': 'Stats',
  '/user-panel/testimonials': 'Testimonials',
  '/user-panel/completed-projects': 'Completed Projects',
  '/user-panel/contact': 'Contact',
  '/user-panel/brand-marquee': 'Brand Marquee',
  '/user-panel/new-section': 'New Section',
  '/user-panel/footer': 'Footer',
};

export default function Layout() {
  const { pathname } = useLocation();
  
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('adminHMD.sidebarMini');
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
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
