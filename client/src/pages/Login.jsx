import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();

      if (data.success) {
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('adminUser', JSON.stringify(data.user));
        navigate('/dashboard');
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-body">
      <main className="auth-page">
        <section className="auth-card">
          <Link className="auth-brand" to="/">
            <span className="brand-icon"><i className="bi bi-grid-1x2-fill" aria-hidden="true"></i></span>
            <span><strong>adminHMD</strong><small>Sign in to your admin workspace.</small></span>
          </Link>
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          <form className="needs-validation" noValidate onSubmit={handleSubmit}>
            <div className="mb-4">
              <p className="eyebrow mb-1">Secure Access</p>
              <h1 className="h3 mb-1">Login</h1>
              <p className="text-muted mb-0">Sign in to your admin workspace.</p>
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
              />
              <div className="invalid-feedback">Enter a valid email.</div>
            </div>
            <div className="mb-3">
              <div className="d-flex justify-content-between">
                <label className="form-label" htmlFor="loginPassword">Password</label>
                <Link className="small fw-semibold" to="/forgot-password">Forgot?</Link>
              </div>
              <input 
                className="form-control" 
                id="loginPassword" 
                type="password" 
                minLength="6" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
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
                <i className="bi bi-box-arrow-in-right" aria-hidden="true"></i>
              )}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

        </section>
      </main>
    </div>
  );
}
