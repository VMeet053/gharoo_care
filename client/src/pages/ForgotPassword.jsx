import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  return (
    <div className="auth-body">
      <button className="icon-button theme-toggle auth-theme-toggle" type="button" data-theme-toggle aria-label="Switch color theme" title="Switch color theme">
        <i className="bi bi-moon-stars" data-theme-icon aria-hidden="true"></i>
      </button>
      <main className="auth-page">
        <section className="auth-card">
          <Link className="auth-brand" to="/">
            <span className="brand-icon"><i className="bi bi-grid-1x2-fill" aria-hidden="true"></i></span>
            <span><strong>adminHMD</strong><small>Get a reset link for your account.</small></span>
          </Link>
          <div className="auth-visual auth-features">
            <div className="auth-feature-item"><i className="bi bi-envelope-check" aria-hidden="true"></i><span>Secure email verification</span></div>
            <div className="auth-feature-item"><i className="bi bi-clock-history" aria-hidden="true"></i><span>Link expires in 30 minutes</span></div>
            <div className="auth-feature-item"><i className="bi bi-key" aria-hidden="true"></i><span>One-time password reset</span></div>
          </div>
          <form className="needs-validation" noValidate>
            <div className="mb-4">
              <p className="eyebrow mb-1">Secure Access</p>
              <h1 className="h3 mb-1">Forgot Password</h1>
              <p className="text-muted mb-0">Get a reset link for your account.</p>
            </div>
            <div className="mb-4">
              <label className="form-label" htmlFor="forgotEmail">Email address</label>
              <input className="form-control" id="forgotEmail" type="email" required />
              <div className="invalid-feedback">Enter a valid email.</div>
            </div>
            <button className="btn btn-primary w-100" type="submit">
              <i className="bi bi-envelope-arrow-up" aria-hidden="true"></i> Send Reset Link
            </button>
          </form>
          <p className="text-muted small mt-3 mb-0">Check your inbox and spam folder after submitting.</p>
          <div className="auth-footer">Remembered it? <Link to="/login">Back to login</Link></div>
        </section>
      </main>
    </div>
  );
}
