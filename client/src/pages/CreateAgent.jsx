import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { electronicsServices } from '../constants/services';

export default function CreateAgent() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'Service Man',
    team: 'Operations',
    service: '',
    notes: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      
      if (data.success) {
        navigate('/service-user-list');
      } else {
        setError(data.message || 'Failed to create service man');
      }
    } catch (err) {
      setError('Failed to create service man');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid px-3 px-lg-4 py-4">
      <div className="page-heading">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-person-gear" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">Service Man Management</p>
            <h1 className="h3 mb-1">Create Service Man</h1>
            <p className="text-muted mb-0">Add a new service man to your team with login credentials.</p>
          </div>
        </div>
        <div className="heading-actions">
          <Link className="btn btn-outline-secondary btn-sm" to="/service-user-list"><i className="bi bi-arrow-left" aria-hidden="true"></i> Back</Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <section className="row g-3">
        <div className="col-12 col-xl-8">
          <form className="panel needs-validation" noValidate onSubmit={handleSubmit}>
            <div className="panel-header">
              <div>
                <h2 className="h5 mb-1 section-title"><i className="bi bi-person-gear" aria-hidden="true"></i><span>Service Man Information</span></h2>
                <p className="text-muted mb-0">Enter the service man's details and login credentials.</p>
              </div>
            </div>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label" htmlFor="firstName">First Name</label>
                <input 
                  className="form-control" 
                  id="firstName" 
                  type="text" 
                  placeholder="e.g., John" 
                  required 
                  value={formData.firstName}
                  onChange={handleChange}
                />
                <div className="invalid-feedback">First name is required.</div>
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="lastName">Last Name</label>
                <input 
                  className="form-control" 
                  id="lastName" 
                  type="text" 
                  placeholder="e.g., Doe" 
                  required 
                  value={formData.lastName}
                  onChange={handleChange}
                />
                <div className="invalid-feedback">Last name is required.</div>
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="email">Email</label>
                <input 
                  className="form-control" 
                  id="email" 
                  type="email" 
                  placeholder="e.g., john@example.com" 
                  required 
                  value={formData.email}
                  onChange={handleChange}
                />
                <div className="invalid-feedback">Valid email is required.</div>
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="phone">Phone Number</label>
                <input 
                  className="form-control" 
                  id="phone" 
                  type="tel" 
                  placeholder="e.g., +91 9876543210" 
                  required 
                  value={formData.phone}
                  onChange={handleChange}
                />
                <div className="invalid-feedback">Phone number is required.</div>
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="password">Password</label>
                <input 
                  className="form-control" 
                  id="password" 
                  type="password" 
                  placeholder="Set a password (default: password123)" 
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="service">Service</label>
                <select
                  className="form-select"
                  id="service"
                  required
                  value={formData.service}
                  onChange={handleChange}
                >
                  <option value="">Choose service</option>
                  {electronicsServices.map((service) => (
                    <option key={service} value={service}>{service}</option>
                  ))}
                </select>
                <div className="invalid-feedback">Choose a service.</div>
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="team">Assigned Team</label>
                <select 
                  className="form-select" 
                  id="team" 
                  required 
                  value={formData.team}
                  onChange={handleChange}
                >
                  <option value="">Choose team</option>
                  <option>Operations</option>
                  <option>Support</option>
                  <option>Technical</option>
                </select>
                <div className="invalid-feedback">Choose a team.</div>
              </div>
              <div className="col-12">
                <label className="form-label" htmlFor="notes">Additional Notes</label>
                <textarea 
                  className="form-control" 
                  id="notes" 
                  rows="3" 
                  placeholder="Any additional information about this service man"
                  value={formData.notes}
                  onChange={handleChange}
                ></textarea>
              </div>
            </div>
            <div className="d-flex flex-wrap justify-content-end gap-2 mt-4">
              <Link className="btn btn-outline-secondary" to="/service-user-list">Cancel</Link>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> : <i className="bi bi-check-circle" aria-hidden="true"></i>}
                Create Service Man
              </button>
            </div>
          </form>
        </div>
        <div className="col-12 col-xl-4">
          <div className="panel h-100">
            <h2 className="h5 mb-3 section-title"><i className="bi bi-checklist" aria-hidden="true"></i><span>Setup Checklist</span></h2>
            <div className="activity-list">
              <div className="activity-item"><span className="activity-dot bg-success"></span><div><p className="mb-1 fw-semibold">Personal Details</p><p className="text-muted small mb-0">Enter first name, last name, phone number.</p></div></div>
              <div className="activity-item"><span className="activity-dot bg-primary"></span><div><p className="mb-1 fw-semibold">Login Credentials</p><p className="text-muted small mb-0">Set email and password for login.</p></div></div>
              <div className="activity-item"><span className="activity-dot bg-warning"></span><div><p className="mb-1 fw-semibold">Assign Service</p><p className="text-muted small mb-0">Select which repair service this person handles.</p></div></div>
              <div className="activity-item"><span className="activity-dot bg-info"></span><div><p className="mb-1 fw-semibold">Assign Team</p><p className="text-muted small mb-0">Link service man to appropriate team.</p></div></div>
              <div className="activity-item"><span className="activity-dot bg-secondary"></span><div><p className="mb-1 fw-semibold">Set Notes</p><p className="text-muted small mb-0">Add any additional information if needed.</p></div></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
