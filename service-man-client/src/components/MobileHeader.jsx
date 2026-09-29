import { useNavigate } from 'react-router-dom';

export default function MobileHeader() {
  const navigate = useNavigate();
  const user = JSON.parse(
    localStorage.getItem('serviceManUser') ||
    sessionStorage.getItem('serviceManUser') ||
    '{}'
  );

  const handleLogout = () => {
    localStorage.removeItem('serviceManUser');
    sessionStorage.removeItem('serviceManUser');
    navigate('/login');
  };

  return (
    <header className="mobile-header d-lg-none">
      <div className="mobile-header-brand" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span className="mobile-header-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/gharoo-logo.png" alt="GharooCare Logo" style={{ height: '56px', width: 'auto' }} />
        </span>
        <div>
          <strong>GharooCare</strong>
          <small>{user.firstName ? `${user.firstName} ${user.lastName}` : 'Service Man'}</small>
        </div>
      </div>
      <button type="button" className="btn btn-light btn-sm mobile-logout-btn" onClick={handleLogout} aria-label="Logout">
        <i className="bi bi-box-arrow-right"></i>
      </button>
    </header>
  );
}
