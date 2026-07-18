import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/login.css';
import { fetchGeoapifyAddressSuggestions } from '../utils/geoapify';

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  idProofType: '',
  address: '',
  city: '',
  state: '',
  pinCode: ''
};

export default function Register() {
  const [formData, setFormData] = useState(initialForm);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [frontImagePreview, setFrontImagePreview] = useState(null);
  const [backImagePreview, setBackImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const skipAddressFetch = useRef(false);

  useEffect(() => {
    const address = formData.address.trim();
    if (skipAddressFetch.current) {
      skipAddressFetch.current = false;
      return;
    }
    if (address.length < 3) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setAddressLoading(true);
      try {
        setAddressSuggestions(await fetchGeoapifyAddressSuggestions(address, controller.signal));
      } catch (err) {
        if (err.name !== 'AbortError') {
          setAddressSuggestions([]);
        }
      } finally {
        setAddressLoading(false);
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [formData.address]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'phone' ? value.replace(/\D/g, '').slice(0, 10) : value
    }));
    if (name === 'address') {
      setShowAddressSuggestions(true);
      if (value.trim().length < 3) {
        setAddressSuggestions([]);
        setAddressLoading(false);
      }
    }
  }

  function handleAddressSelect(feature) {
    skipAddressFetch.current = true;
    setFormData(prev => ({
      ...prev,
      address: feature.address,
      city: feature.city,
      state: feature.state,
      pinCode: feature.pinCode
    }));
    setAddressSuggestions([]);
    setShowAddressSuggestions(false);
  }

  function handleImageChange(e, side) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (side === 'front') {
        setFrontImage(file);
        setFrontImagePreview(reader.result);
      } else {
        setBackImage(file);
        setBackImagePreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (formData.phone.length !== 10) {
      setError('Phone number must be exactly 10 digits.');
      return;
    }

    if (!formData.address.trim()) {
      setError('Please enter your address.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6 || !/\d/.test(formData.password) || !/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      setError('Password must be 6+ characters and include a number and special character.');
      return;
    }

    if (!formData.idProofType || !frontImage || !backImage) {
      setError('Please select ID proof type and upload both proof images.');
      return;
    }

    setLoading(true);

    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => payload.append(key, value));
      if (frontImage) payload.append('frontIdProofImage', frontImage);
      if (backImage) payload.append('backIdProofImage', backImage);

      const res = await fetch('/api/service-man/register', {
        method: 'POST',
        body: payload
      });
      const data = await res.json();

      if (data.success) {
        setMessage('Registration successful. Redirecting to login...');
        setFormData(initialForm);
        setFrontImage(null);
        setBackImage(null);
        setFrontImagePreview(null);
        setBackImagePreview(null);
        setTimeout(() => {
          window.location.href = '/service/login';
        }, 1300);
      } else {
        setError(data.message || 'Registration failed.');
      }
    } catch {
      setError('Failed to connect to server. Please make sure backend is running.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-body auth-body-wide">
      <div className="animated-bg" aria-hidden="true">
        <div className="bg-blob blob-1"></div>
        <div className="bg-blob blob-2"></div>
        <div className="bg-blob blob-3"></div>
        <div className="bg-blob blob-4"></div>
      </div>

      <main className="auth-register-shell">
        <aside className="auth-side-panel">
          <Link className="auth-brand auth-brand-light" to="/login">
            <span className="brand-icon"><i className="bi bi-tools" aria-hidden="true"></i></span>
            <span><strong>GharooCare</strong><small>Service partner onboarding</small></span>
          </Link>
          <div>
            <p className="eyebrow mb-2">Join The Network</p>
            <h1>Register as a Service Partner</h1>
            <p>Submit your details and ID proof. After approval, you can manage leads, work orders, profile, and earnings from the service dashboard.</p>
          </div>
          <div className="auth-side-points">
            <span><i className="bi bi-shield-check"></i> Secure ID verification</span>
            <span><i className="bi bi-briefcase"></i> Lead and work order access</span>
            <span><i className="bi bi-graph-up-arrow"></i> Earnings visibility</span>
          </div>
        </aside>

        <section className="auth-card auth-register-card animate-fade-in-up">
          {message && <div className="alert alert-success" role="alert">{message}</div>}
          {error && <div className="alert alert-danger" role="alert">{error}</div>}

          <form noValidate onSubmit={handleSubmit}>
            <div className="auth-form-title">
              <span>Registration Details</span>
              <h2>Create Service Account</h2>
            </div>

            <div className="auth-form-grid">
              <div>
                <label className="form-label" htmlFor="firstName">First name</label>
                <input className="form-control" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required placeholder="First name" />
              </div>
              <div>
                <label className="form-label" htmlFor="lastName">Last name</label>
                <input className="form-control" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required placeholder="Last name" />
              </div>
              <div>
                <label className="form-label" htmlFor="email">Email</label>
                <input className="form-control" id="email" name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="name@example.com" />
              </div>
              <div>
                <label className="form-label" htmlFor="phone">Phone number</label>
                <input className="form-control" id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} required placeholder="10 digit mobile" />
              </div>
              <div className="auth-form-span address-autocomplete">
                <label className="form-label" htmlFor="address">Address</label>
                <textarea className="form-control" id="address" name="address" rows="3" value={formData.address} onChange={handleChange} onFocus={() => setShowAddressSuggestions(true)} onBlur={() => window.setTimeout(() => setShowAddressSuggestions(false), 150)} required placeholder="Search and select your address" />
                {showAddressSuggestions && (addressLoading || addressSuggestions.length > 0) && (
                  <div className="address-suggestions" role="listbox">
                    {addressLoading && <div className="address-suggestion muted">Searching address...</div>}
                    {!addressLoading && addressSuggestions.map((feature) => (
                      <button type="button" className="address-suggestion" key={feature.id} onMouseDown={() => handleAddressSelect(feature)}>
                        <span className="address-source-badge">{feature.source === 'places' ? 'Place' : 'Address'}</span>
                        <span>{feature.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="form-label" htmlFor="city">City</label>
                <input className="form-control" id="city" name="city" value={formData.city} onChange={handleChange} placeholder="City" />
              </div>
              <div>
                <label className="form-label" htmlFor="state">State</label>
                <input className="form-control" id="state" name="state" value={formData.state} onChange={handleChange} placeholder="State" />
              </div>
              <div>
                <label className="form-label" htmlFor="pinCode">Pin code</label>
                <input className="form-control" id="pinCode" name="pinCode" value={formData.pinCode} onChange={handleChange} placeholder="Pin code" />
              </div>
              <div>
                <label className="form-label" htmlFor="password">Password</label>
                <input className="form-control" id="password" name="password" type="password" value={formData.password} onChange={handleChange} required placeholder="Min 6 chars + number + symbol" />
              </div>
              <div>
                <label className="form-label" htmlFor="confirmPassword">Confirm password</label>
                <input className="form-control" id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required placeholder="Repeat password" />
              </div>
              <div className="auth-form-span">
                <label className="form-label" htmlFor="idProofType">ID proof type</label>
                <select className="form-select" id="idProofType" name="idProofType" value={formData.idProofType} onChange={handleChange} required>
                  <option value="">Select ID proof</option>
                  <option value="Pan Card">Pan Card</option>
                  <option value="Aadhaar Card">Aadhaar Card</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Election Card">Election Card</option>
                </select>
              </div>
            </div>

            {formData.idProofType && (
              <div className="auth-upload-grid">
                <label className="auth-upload-box">
                  <span><i className="bi bi-card-image"></i> Front side proof</span>
                  <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'front')} required />
                  {frontImagePreview && <img src={frontImagePreview} alt="Front ID proof preview" />}
                </label>
                <label className="auth-upload-box">
                  <span><i className="bi bi-card-image"></i> Back side proof</span>
                  <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'back')} required />
                  {backImagePreview && <img src={backImagePreview} alt="Back ID proof preview" />}
                </label>
              </div>
            )}

            <button className="btn btn-primary w-100 mt-4" type="submit" disabled={loading}>
              {loading ? 'Registering...' : 'Submit Registration'}
            </button>
            <div className="auth-footer">Already registered? <Link to="/login">Login here</Link></div>
          </form>
        </section>
      </main>
    </div>
  );
}
