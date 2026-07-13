import { NavLink } from 'react-router-dom';
import { useState } from 'react';

const navSections = [
  {
    label: 'Main',
    items: [
      { to: '/', icon: 'bi-speedometer2', text: 'Dashboard', end: true },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/users', icon: 'bi-people', text: 'Users' },
      { to: '/work-orders', icon: 'bi-list-check', text: 'Work Orders' },
      { to: '/premium-user-list', icon: 'bi-award', text: 'Premium User List' },
      { to: '/service-user-list', icon: 'bi-person-check', text: 'Service User List' },
      { to: '/service-price', icon: 'bi-tags', text: 'Service Price' },
      { to: '/leads', icon: 'bi-person-add', text: 'Leads' },
      { to: '/profile', icon: 'bi-person-badge', text: 'Profile' },
    ],
  },
  {
    label: 'User Panel',
    items: [
      { to: '/user-panel/hero', icon: 'bi-house-door', text: 'Hero Section' },
      { to: '/user-panel/brand-marquee', icon: 'bi-tags', text: 'Brand Marquee' },
      { to: '/user-panel/new-section', icon: 'bi-stars', text: 'New Section' },
      { to: '/user-panel/about', icon: 'bi-info-circle', text: 'About Section' },
      { to: '/user-panel/why-choose', icon: 'bi-question-circle', text: 'Why Choose Us' },
      { to: '/user-panel/completed-projects', icon: 'bi-folder-check', text: 'Completed Projects' },
      { to: '/user-panel/service-slider', icon: 'bi-sliders', text: 'Service Slider' },
      { to: '/user-panel/stats', icon: 'bi-bar-chart', text: 'Stats Section' },
      { to: '/user-panel/services', icon: 'bi-briefcase', text: 'Services' },
      { to: '/user-panel/testimonials', icon: 'bi-chat-quote', text: 'Testimonials' },
      { to: '/user-panel/pricing', icon: 'bi-currency-rupee', text: 'Pricing' },
      { to: '/user-panel/contact', icon: 'bi-telephone', text: 'Contact' },
      { to: '/user-panel/header', icon: 'bi-header', text: 'Header' },
      { to: '/user-panel/footer', icon: 'bi-footer', text: 'Footer' },
    ],
  },
  {
    label: 'Transactions',
    items: [
      { to: '/status/pending', icon: 'bi-clock-history', text: 'Pending' },
      { to: '/status/completed', icon: 'bi-check-circle', text: 'Completed' },
      { to: '/payment', icon: 'bi-cash', text: 'Payment' },
    ],
  },
];

export default function Sidebar({ isCollapsed, setIsCollapsed, closeMobileSidebar }) {
  const [openSections, setOpenSections] = useState(() => navSections.map(section => section.label));

  const toggleSection = (label) => {
    setOpenSections((prev) => 
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  return (
    <aside className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''}`} id="adminSidebar" aria-label="Main navigation">
      <div className="sidebar-header" style={{ justifyContent: isCollapsed ? 'center' : 'space-between', padding: isCollapsed ? '20px 0' : '20px' }}>
        {!isCollapsed && (
          <NavLink className="brand-mark" to="/" aria-label="GharooCare dashboard" onClick={closeMobileSidebar}>
            <span className="brand-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/admin/assets/images/brand/logo/gharoo-logo.png" alt="GharooCare Logo" style={{ height: '64px', width: 'auto' }} />
            </span>
            <span className="brand-copy">
              <span className="brand-title">GharooCare</span>
              <span className="brand-subtitle">Admin Panel</span>
            </span>
          </NavLink>
        )}
        <button className="sidebar-toggle-btn" onClick={() => setIsCollapsed(!isCollapsed)} aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
          {isCollapsed ? (
            <i className="bi bi-list" style={{ fontSize: '18px' }}></i>
          ) : (
            <i className="bi bi-three-dots-vertical" style={{ fontSize: '18px' }}></i>
          )}
        </button>
      </div>

      <nav className="sidebar-nav">
        {navSections.map((section) => (
          <div key={section.label} className="nav-section">
            {!isCollapsed && (
              <div 
                className="nav-section-label" 
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={() => toggleSection(section.label)}
              >
                {section.label}
                <i className={`bi ${openSections.includes(section.label) ? 'bi-chevron-down' : 'bi-chevron-right'}`} style={{ fontSize: '12px' }}></i>
              </div>
            )}
            {(isCollapsed || openSections.includes(section.label)) && (
              <>
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    className="nav-link"
                    to={item.to}
                    end={item.end}
                    onClick={closeMobileSidebar}
                    title={item.text}
                  >
                    <span className="nav-icon"><i className={`bi ${item.icon}`} aria-hidden="true"></i></span>
                    {!isCollapsed && <span className="nav-text">{item.text}</span>}
                  </NavLink>
                ))}
              </>
            )}
          </div>
        ))}
      </nav>

      {!isCollapsed && (
        <div className="sidebar-footer">
          <span className="status-dot"></span>
          <span className="sidebar-footer-text">All systems operational</span>
        </div>
      )}
    </aside>
  );
}
