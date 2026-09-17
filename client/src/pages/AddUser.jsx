import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function AddUser() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    team: '',
    notes: '',
    address: '',
    city: '',
    state: '',
    pinCode: ''
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
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (result.success) {
        navigate('/users');
      } else {
        setError(result.message || 'Failed to create user');
      }
    } catch (err) {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid px-3 px-lg-4 py-4">
      <div className="page-heading">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-person-plus" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">Management</p>
            <h1 className="h3 mb-1">Add User</h1>
            <p className="text-muted mb-0">Create a new user account with role and team assignments.</p>
          </div>
        </div>
        <div className="heading-actions">
          <Link className="btn btn-outline-secondary btn-sm" to="/users"><i className="bi bi-arrow-left" aria-hidden="true"></i> Back to Users</Link>
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
                <h2 className="h5 mb-1 section-title"><i className="bi bi-person-plus" aria-hidden="true"></i><span>User Information</span></h2>
                <p className="text-muted mb-0">Create a user account with validated fields.</p>
              </div>
            </div>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label" htmlFor="firstName">First name</label>
                <input 
                  className="form-control" 
                  id="firstName" 
                  type="text" 
                  required 
                  value={formData.firstName}
                  onChange={handleChange}
                />
                <div className="invalid-feedback">First name is required.</div>
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="lastName">Last name</label>
                <input 
                  className="form-control" 
                  id="lastName" 
                  type="text" 
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
                  required 
                  value={formData.email}
                  onChange={handleChange}
                />
                <div className="invalid-feedback">Enter a valid email.</div>
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="phone">Phone</label>
                <input 
                  className="form-control" 
                  id="phone" 
                  type="tel" 
                  required 
                  value={formData.phone}
                  onChange={handleChange}
                />
                <div className="invalid-feedback">Phone number is required.</div>
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="role">Role</label>
                <select 
                  className="form-select" 
                  id="role" 
                  required 
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="">Choose role</option>
                  <option>Admin</option>
                  <option>Manager</option>
                  <option>Editor</option>
                  <option>Viewer</option>
                </select>
                <div className="invalid-feedback">Choose a role.</div>
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="team">Team</label>
                <select 
                  className="form-select" 
                  id="team" 
                  required 
                  value={formData.team}
                  onChange={handleChange}
                >
                  <option value="">Choose team</option>
                  <option>Operations</option>
                  <option>Sales</option>
                  <option>Content</option>
                  <option>Finance</option>
                </select>
                <div className="invalid-feedback">Choose a team.</div>
              </div>
              <div className="col-12">
                <label className="form-label" htmlFor="address">Address</label>
                <textarea 
                  className="form-control" 
                  id="address" 
                  rows="3" 
                  placeholder="Enter address"
                  value={formData.address}
                  onChange={handleChange}
                ></textarea>
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="city">City</label>
                <input 
                  className="form-control" 
                  id="city" 
                  type="text" 
                  placeholder="City"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="state">State</label>
                <input 
                  className="form-control" 
                  id="state" 
                  type="text" 
                  placeholder="State"
                  value={formData.state}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="pinCode">Pin Code</label>
                <input 
                  className="form-control" 
                  id="pinCode" 
                  type="text" 
                  placeholder="Pin Code"
                  value={formData.pinCode}
                  onChange={handleChange}
                />
              </div>
              <div className="col-12">
                <label className="form-label" htmlFor="notes">Notes</label>
                <textarea 
                  className="form-control" 
                  id="notes" 
                  rows="4" 
                  placeholder="Optional onboarding notes"
                  value={formData.notes}
                  onChange={handleChange}
                ></textarea>
              </div>
            </div>
            <div className="d-flex flex-wrap justify-content-end gap-2 mt-4">
              <Link className="btn btn-outline-secondary" to="/users">Cancel</Link>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                ) : (
                  <i className="bi bi-person-check" aria-hidden="true"></i>
                )}
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
        <div className="col-12 col-xl-4">
          <div className="panel h-100">
            <h2 className="h5 mb-3 section-title"><i className="bi bi-list-check" aria-hidden="true"></i><span>Access Checklist</span></h2>
            <div className="activity-list">
              <div className="activity-item"><span className="activity-dot bg-success"></span><div><p className="mb-1 fw-semibold">Assign role</p><p className="text-muted small mb-0">Start with the least privileged role.</p></div></div>
              <div className="activity-item"><span className="activity-dot bg-primary"></span><div><p className="mb-1 fw-semibold">Add team</p><p className="text-muted small mb-0">Team ownership controls dashboards.</p></div></div>
              <div className="activity-item"><span className="activity-dot bg-warning"></span><div><p className="mb-1 fw-semibold">Send invite</p><p className="text-muted small mb-0">Users receive activation by email.</p></div></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
