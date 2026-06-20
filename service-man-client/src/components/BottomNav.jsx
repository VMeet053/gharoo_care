import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/dashboard', icon: 'bi-speedometer2', label: 'Home' },
  { path: '/leads', icon: 'bi-person-lines-fill', label: 'Leads' },
  { path: '/work-orders', icon: 'bi-list-check', label: 'Orders' },
  { path: '/earnings', icon: 'bi-currency-rupee', label: 'Earnings' }
];

export default function BottomNav({ unseenCount }) {
  return (
    <nav className="bottom-nav d-lg-none" aria-label="Main navigation">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
          style={{ position: 'relative' }}
        >
          <i className={`bi ${item.icon}`} aria-hidden="true"></i>
          <span>{item.label}</span>
          {item.path === '/leads' && unseenCount > 0 && (
            <span className="unseen-badge-bottom">
              {unseenCount}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
