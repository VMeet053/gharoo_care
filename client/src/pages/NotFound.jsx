import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="auth-body">
      <button className="icon-button theme-toggle auth-theme-toggle" type="button" data-theme-toggle aria-label="Switch color theme" title="Switch color theme">
        <i className="bi bi-moon-stars" data-theme-icon aria-hidden="true"></i>
      </button>
      <main className="error-page">
        <section className="error-card">
          <Link className="auth-brand justify-content-center" to="/">
            <span className="brand-icon"><i className="bi bi-grid-1x2-fill" aria-hidden="true"></i></span>
            <span><strong>adminHMD</strong><small>Error Center</small></span>
          </Link>
          <div className="error-icon-wrap" aria-hidden="true"><i className="bi bi-compass"></i></div>
          <div className="error-code">404</div>
          <h1 className="h3 mb-2">Page Not Found</h1>
          <p className="text-muted mb-4">The page you are looking for does not exist or has been moved.</p>
          <div className="d-flex flex-wrap justify-content-center gap-2">
            <Link className="btn btn-primary" to="/"><i className="bi bi-speedometer2" aria-hidden="true"></i> Back to Dashboard</Link>
            <Link className="btn btn-outline-secondary" to="/login">Sign In</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
