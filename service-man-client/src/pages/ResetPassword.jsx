import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const data = await response.json();

      if (data.success) {
        setMessage(data.message || 'Password reset successfully! Redirecting to login page...');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(data.message || 'Failed to reset password. The link may have expired.');
      }
    } catch (err) {
      setError('Failed to connect to server. Please try again.');
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
            <span><strong>GharooCare Service</strong><small>Set a new password for your account.</small></span>
          </Link>
          
          {error && (
            <div className="alert alert-danger" role="alert" style={{ background: 'rgba(220, 38, 38, 0.2)', borderColor: 'rgba(220, 38, 38, 0.4)', color: '#fca5a5' }}>
              {error}
            </div>
          )}

          {message && (
            <div className="alert alert-success" role="alert" style={{ background: 'rgba(16, 185, 129, 0.2)', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#a7f3d0' }}>
              {message}
            </div>
          )}

          <form className="needs-validation" noValidate onSubmit={handleSubmit}>
            <div className="mb-4">
              <p className="eyebrow mb-1">Secure Access</p>
              <h1 className="h3 mb-1 text-white">Reset Password</h1>
              <p className="text-muted mb-0">Enter a secure new password for your account.</p>
            </div>
            
            <div className="mb-3">
              <label className="form-label" htmlFor="newPassword">New Password</label>
              <div className="position-relative">
                <input 
                  className="form-control pe-5" 
                  id="newPassword" 
                  type={showPassword ? "text" : "password"} 
                  minLength="6" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-decoration-none pe-3 text-muted"
                  style={{ zIndex: 10, border: 'none', background: 'none' }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label" htmlFor="confirmPassword">Confirm New Password</label>
              <input 
                className="form-control" 
                id="confirmPassword" 
                type={showPassword ? "text" : "password"} 
                minLength="6" 
                required 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <button className="btn btn-primary w-100 text-white" type="submit" disabled={loading || !!message}>
              {loading ? (
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              ) : (
                <i className="bi bi-shield-check me-2" aria-hidden="true"></i>
              )}
              {loading ? 'Setting password...' : 'Set Password'}
            </button>
          </form>
          
          <div className="auth-footer">Remembered it? <Link to="/login">Back to login</Link></div>
        </section>
      </main>
    </div>
  );
}
