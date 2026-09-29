import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [terms, setTerms] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add registration logic here
    console.log('Registration attempt:', { name, email, password, terms });
    // Navigate to login after successful registration
    navigate('/login');
  };

  return (
    <div className="auth-body">
      <main className="auth-page">
        <section className="auth-card">
          <Link className="auth-brand" to="/">
            <span className="brand-icon"><i className="bi bi-grid-1x2-fill" aria-hidden="true"></i></span>
            <span><strong>adminHMD</strong><small>Create your adminHMD account.</small></span>
          </Link>
          <form className="needs-validation" noValidate onSubmit={handleSubmit}>
            <div className="mb-4">
              <p className="eyebrow mb-1">Secure Access</p>
              <h1 className="h3 mb-1">Register</h1>
              <p className="text-muted mb-0">Create your adminHMD account.</p>
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="registerName">Full name</label>
              <input 
                className="form-control" 
                id="registerName" 
                type="text" 
                required 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <div className="invalid-feedback">Full name is required.</div>
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="registerEmail">Email address</label>
              <input 
                className="form-control" 
                id="registerEmail" 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div className="invalid-feedback">Enter a valid email.</div>
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="registerPassword">Password</label>
              <input 
                className="form-control" 
                id="registerPassword" 
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
                id="terms" 
                required 
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="terms">I agree to the terms</label>
              <div className="invalid-feedback">You must agree before continuing.</div>
            </div>
            <button className="btn btn-primary w-100" type="submit">
              <i className="bi bi-person-plus" aria-hidden="true"></i> Create Account
            </button>
          </form>
          <div className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></div>
        </section>
      </main>
    </div>
  );
}