import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import '../styles/login.css';

function getStoredServiceManUser() {
  const raw = localStorage.getItem('serviceManUser') || sessionStorage.getItem('serviceManUser');
  return raw ? JSON.parse(raw) : null;
}

export default function Login() {
  const user = getStoredServiceManUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/service-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      let data;
      try {
        data = await response.json();
      } catch {
        setError('Server error. Please restart the backend and try again.');
        return;
      }

      if (data.success) {
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('serviceManUser', JSON.stringify(data.user));
        navigate('/dashboard');
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-body">
      <div className="animated-bg">
        <div className="bg-blob blob-1"></div>
        <div className="bg-blob blob-2"></div>
        <div className="bg-blob blob-3"></div>
        <div className="bg-blob blob-4"></div>
      </div>
      <main className="auth-page">
        <section className="auth-card animate-fade-in-up">
          <Link className="auth-brand" to="/login">
            <span className="brand-icon"><i className="bi bi-person-workspace" aria-hidden="true"></i></span>
            <span><strong>GharooCare</strong><small>Service man workspace login.</small></span>
          </Link>
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          <form className="needs-validation" noValidate onSubmit={handleSubmit}>
            <div className="mb-4">
              <p className="eyebrow mb-1">Secure Access</p>
              <h1 className="mb-1">Login</h1>
              <p className="mb-0">Sign in with the ID and password assigned by admin.</p>
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="loginEmail">Email address</label>
              <input
                className="form-control"
                id="loginEmail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
              />
              <div className="invalid-feedback">Enter a valid email.</div>
            </div>
            <div className="mb-3">
              <div className="d-flex justify-content-between">
                <label className="form-label" htmlFor="loginPassword">Password</label>
                <Link className="fw-semibold" to="/forgot-password">Forgot?</Link>
              </div>
              <div className="position-relative">
                <input
                  className="form-control"
                  id="loginPassword"
                  type={showPassword ? "text" : "password"}
                  minLength="6"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ paddingRight: '3.5rem' }}
                />
                <button
                  type="button"
                  className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-decoration-none"
                  style={{ 
                    zIndex: 10, 
                    border: 'none', 
                    background: 'none',
                    color: 'var(--sm-muted)',
                    padding: '0.875rem 1rem'
                  }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: '1.125rem' }}></i>
                </button>
              </div>
              <div className="invalid-feedback">Password must be at least 6 characters.</div>
            </div>
            <div className="form-check mb-4">
              <input
                className="form-check-input"
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="rememberMe">Remember me</label>
            </div>
            <button className="btn btn-primary w-100" type="submit" disabled={loading}>
              {loading ? (
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              ) : (
                <i className="bi bi-box-arrow-in-right me-2" aria-hidden="true"></i>
              )}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <div className="auth-footer">
              New service partner? <Link to="/register">Create account</Link>
            </div>
            <div className="auth-footer compact">
              <a href="/">Back to website</a>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
