import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLink, setResetLink] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    setResetLink('');

    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();

      if (data.success) {
        setMessage(data.message || 'Password reset email sent successfully! Please check your inbox.');
        if (data.resetUrl) {
          setResetLink(data.resetUrl);
        }
        setEmail('');
      } else {
        setError(data.message || 'Email address not found.');
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
          <Link className="auth-brand" to="/">
            <span className="brand-icon"><i className="bi bi-grid-1x2-fill" aria-hidden="true"></i></span>
            <span><strong>Gharoo Admin</strong><small>Get a reset link for your account.</small></span>
          </Link>
          
          {error && (
            <div className="alert alert-danger" role="alert" style={{ background: 'rgba(220, 38, 38, 0.2)', borderColor: 'rgba(220, 38, 38, 0.4)', color: '#fca5a5' }}>
              {error}
            </div>
          )}

          {message && (
            <div className="alert alert-success" role="alert" style={{ background: 'rgba(16, 185, 129, 0.2)', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#a7f3d0' }}>
              <div>{message}</div>
              {resetLink && (
                <div className="mt-3 pt-3 border-top" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                  <p className="small mb-2 text-white-50">Use this link to reset your password:</p>
                  <a href={resetLink} className="btn btn-sm btn-light w-100 text-dark fw-semibold" style={{ textTransform: 'none' }}>
                    Reset Password Directly
                  </a>
                </div>
              )}
            </div>
          )}

          <form className="needs-validation" noValidate onSubmit={handleSubmit}>
            <div className="mb-4">
              <p className="eyebrow mb-1">Secure Access</p>
              <h1 className="h3 mb-1 text-white">Forgot Password</h1>
              <p className="text-muted mb-0">Get a reset link for your account.</p>
            </div>
            <div className="mb-4">
              <label className="form-label" htmlFor="forgotEmail">Email address</label>
              <input 
                className="form-control" 
                id="forgotEmail" 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
              />
              <div className="invalid-feedback">Enter a valid email.</div>
            </div>
            <button className="btn btn-primary w-100 text-white" type="submit" disabled={loading}>
              {loading ? (
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              ) : (
                <i className="bi bi-envelope-arrow-up me-2" aria-hidden="true"></i>
              )}
              {loading ? 'Sending link...' : 'Send Reset Link'}
            </button>
          </form>
          <p className="text-muted small mt-3 mb-0">Check your inbox and spam folder after submitting.</p>
          <div className="auth-footer">Remembered it? <Link to="/login">Back to login</Link></div>
        </section>
      </main>
    </div>
  );
}

