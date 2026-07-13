import { useState, useEffect, useRef } from 'react';
import '../styles/profile.css';

function getStoredUser() {
  const raw = localStorage.getItem('serviceManUser') || sessionStorage.getItem('serviceManUser');
  return raw ? JSON.parse(raw) : null;
}

function getUserId(user) {
  return user?._id || user?.id;
}

function updateStoredUser(updatedUser) {
  if (localStorage.getItem('serviceManUser')) {
    localStorage.setItem('serviceManUser', JSON.stringify(updatedUser));
  } else {
    sessionStorage.setItem('serviceManUser', JSON.stringify(updatedUser));
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

// QR SVG placeholder (simple static pattern)
function QRPlaceholder() {
  return (
    <svg width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="54" height="54" fill="#f5f5f5"/>
      {/* TL */}
      <rect x="2" y="2" width="18" height="18" rx="2" fill="#0d1f4e" opacity="0.9"/>
      <rect x="5" y="5" width="12" height="12" rx="1" fill="#fff"/>
      <rect x="7" y="7" width="8" height="8" rx="0.5" fill="#0d1f4e"/>
      {/* TR */}
      <rect x="34" y="2" width="18" height="18" rx="2" fill="#0d1f4e" opacity="0.9"/>
      <rect x="37" y="5" width="12" height="12" rx="1" fill="#fff"/>
      <rect x="39" y="7" width="8" height="8" rx="0.5" fill="#0d1f4e"/>
      {/* BL */}
      <rect x="2" y="34" width="18" height="18" rx="2" fill="#0d1f4e" opacity="0.9"/>
      <rect x="5" y="37" width="12" height="12" rx="1" fill="#fff"/>
      <rect x="7" y="39" width="8" height="8" rx="0.5" fill="#0d1f4e"/>
      {/* data cells */}
      <rect x="24" y="2"  width="4" height="4" fill="#0d1f4e"/>
      <rect x="30" y="2"  width="2" height="2" fill="#0d1f4e"/>
      <rect x="24" y="8"  width="2" height="6" fill="#0d1f4e"/>
      <rect x="28" y="8"  width="4" height="4" fill="#0d1f4e"/>
      <rect x="24" y="16" width="4" height="2" fill="#0d1f4e"/>
      <rect x="22" y="24" width="6" height="6" fill="#0d1f4e"/>
      <rect x="30" y="22" width="4" height="4" fill="#0d1f4e"/>
      <rect x="36" y="24" width="6" height="6" fill="#0d1f4e"/>
      <rect x="44" y="22" width="4" height="8" fill="#0d1f4e"/>
      <rect x="22" y="32" width="4" height="4" fill="#0d1f4e"/>
      <rect x="28" y="32" width="6" height="2" fill="#0d1f4e"/>
      <rect x="36" y="32" width="2" height="6" fill="#0d1f4e"/>
      <rect x="40" y="34" width="4" height="4" fill="#0d1f4e"/>
      <rect x="46" y="32" width="6" height="4" fill="#0d1f4e"/>
      <rect x="22" y="38" width="8" height="4" fill="#0d1f4e"/>
      <rect x="32" y="40" width="4" height="6" fill="#0d1f4e"/>
      <rect x="38" y="40" width="6" height="6" fill="#0d1f4e"/>
      <rect x="46" y="38" width="6" height="8" fill="#0d1f4e"/>
    </svg>
  );
}

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [flipped, setFlipped] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored || !getUserId(stored)) {
      setLoading(false);
      return;
    }
    setUser(stored);
    fetchProfile(getUserId(stored));
  }, []);

  const fetchProfile = async (id) => {
    try {
      const res = await fetch(`/api/service-man/profile/${id}`);
      const data = await res.json();
      if (data.success) {
        setProfile(data.user);
      }
    } catch (e) {
      console.error('Profile fetch error', e);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate: image only, max 5MB
    if (!file.type.startsWith('image/')) {
      setUploadError('Only image files are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be less than 5MB.');
      return;
    }

    setUploadError('');
    setUploadSuccess('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('profilePic', file);
      formData.append('userId', getUserId(user));

      const res = await fetch('/api/service-man/profile-pic', {
        method: 'PUT',
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        // Update local state + storage
        const updatedProfile = { ...profile, profilePic: data.profilePic };
        const updatedUser = { ...user, profilePic: data.profilePic };
        setProfile(updatedProfile);
        setUser(updatedUser);
        updateStoredUser(updatedUser);
        setUploadSuccess('Profile photo updated successfully!');
        // Clear success after 3s
        setTimeout(() => setUploadSuccess(''), 3000);
      } else {
        setUploadError(data.message || 'Upload failed. Try again.');
      }
    } catch {
      setUploadError('Failed to upload. Check your connection.');
    } finally {
      setUploading(false);
      // reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="page-wrap d-flex align-items-center justify-content-center" style={{ minHeight: 300 }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading profile…</span>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="page-wrap">
        <p className="text-muted">Could not load profile. Please try again.</p>
      </div>
    );
  }

  const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
  const designation = profile.designation || 'Service Technician';
  const employeeId = profile.employeeId || '—';
  const joiningDate = formatDate(profile.createdAt);
  const profilePic = profile.profilePic || null;
  const authStatus = profile.authorizationStatus || 'pending';
  const phone = profile.phone || '—';

  // Parse service code label from employeeId e.g. GRC-AC-2506001 → "AC Service"
  const serviceCodeReverseMap = {
    AC: 'AC Service', WM: 'Washing Machine', RF: 'Refrigerator',
    TV: 'Television', MW: 'Microwave', WP: 'Water Purifier',
    GY: 'Geyser', CH: 'Chimney', GN: 'General Service'
  };
  const codeMatch = employeeId.match(/^GRC-([A-Z]+)-/);
  const serviceLabel = codeMatch ? (serviceCodeReverseMap[codeMatch[1]] || 'Service') : 'Service';

  const hasProfilePic = !!profilePic;

  return (
    <div className="page-wrap">
      <div className="profile-page">
        {/* Page Header */}
        <div className="page-header mb-4">
          <div>
            <p className="eyebrow mb-1">My Profile</p>
            <h1>ID Card</h1>
            <p>Your official Gharoo Care identity card.</p>
          </div>
        </div>

        {/* Warning banner if no profile pic */}
        {!hasProfilePic && (
          <div className="profile-pic-banner">
            <span className="banner-icon">⚠️</span>
            <div className="banner-text">
              <strong>Profile photo required!</strong>
              <span>Upload your photo to complete your ID card. It is compulsory.</span>
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div className="profile-section-title">
          <i className="bi bi-camera-fill"></i>
          Profile Photo
        </div>
        <div className="upload-profile-section">
          {hasProfilePic ? (
            <div className="upload-preview-row">
              <div className="upload-preview-circle">
                <img src={profilePic} alt="Profile" />
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ marginBottom: '0.5rem', color: '#2e7d32', fontWeight: 700 }}>
                  <i className="bi bi-check-circle-fill me-1"></i>Photo uploaded
                </p>
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <i className="bi bi-arrow-repeat me-1"></i>
                  Change Photo
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="upload-icon">
                <i className="bi bi-person-circle"></i>
              </div>
              <h3>Upload Your Photo</h3>
              <p>Clear face photo required for your ID card. JPG / PNG · Max 5MB</p>
              <button
                className="btn btn-primary"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Uploading…</>
                ) : (
                  <><i className="bi bi-upload me-2"></i>Choose Photo</>
                )}
              </button>
            </>
          )}

          {uploading && hasProfilePic && (
            <div className="mt-2">
              <span className="spinner-border spinner-border-sm text-primary me-2" role="status"></span>
              <small>Uploading…</small>
            </div>
          )}

          {uploadError && (
            <div className="alert alert-danger mt-2 py-2" style={{ fontSize: '0.82rem' }}>
              <i className="bi bi-exclamation-circle me-1"></i>{uploadError}
            </div>
          )}
          {uploadSuccess && (
            <div className="alert alert-success mt-2 py-2" style={{ fontSize: '0.82rem' }}>
              <i className="bi bi-check-circle me-1"></i>{uploadSuccess}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="upload-input-hidden"
            onChange={handleFileChange}
            id="profilePicInput"
          />
        </div>

        {/* ID Card */}
        <div className="profile-section-title">
          <i className="bi bi-person-badge-fill"></i>
          Employee ID Card
        </div>

        <div className="id-card-wrapper">
          <p className="flip-hint">
            <i className="bi bi-hand-index"></i>
            Click card to flip
          </p>

          <div
            className={`flip-card${flipped ? ' flipped' : ''}`}
            onClick={() => setFlipped(f => !f)}
            role="button"
            aria-label="Flip ID card"
          >
            <div className="flip-card-inner">

              {/* ===== FRONT ===== */}
              <div className="flip-card-front">
                <div className="card-front-header">
                  <div className="card-logo-row">
                    <div className="card-logo-text">
                      <div className="brand-name">GHAR<span>OO</span></div>
                      <div className="brand-sub">— C A R E —</div>
                    </div>
                  </div>
                  <div className="card-service-badge">
                    <i className="bi bi-snow"></i>
                    {serviceLabel.toUpperCase()}
                  </div>
                </div>

                <div className="card-front-body">
                  <div className="card-photo-circle">
                    {hasProfilePic ? (
                      <img src={profilePic} alt={fullName} />
                    ) : (
                      <div className="photo-placeholder">
                        <i className="bi bi-person-circle"></i>
                        <span>No Photo</span>
                      </div>
                    )}
                  </div>

                  <div className="card-person-name">{fullName || '—'}</div>
                  <div className="card-person-role">{designation}</div>

                  <div className="card-emp-id-box">
                    <div className="card-emp-id-label">Employee ID</div>
                    <div className="card-emp-id-value">{employeeId}</div>
                  </div>

                  <div className="card-phones">
                    <div className="card-phone-row">
                      <i className="bi bi-telephone-fill"></i>
                      <span>{phone}</span>
                    </div>
                    <div className="card-phone-row">
                      <i className="bi bi-whatsapp phone-icon-whatsapp"></i>
                      <span>{phone}</span>
                    </div>
                  </div>
                </div>

                <div className="card-front-footer">
                  <i className="bi bi-shield-fill-check"></i>
                  <div className="footer-text">
                    <strong>Trusted Service</strong>
                    <small>Quality Assured</small>
                  </div>
                </div>
              </div>

              {/* ===== BACK ===== */}
              <div className="flip-card-back">
                <div className="card-back-header">
                  <div className="card-logo-row">
                    <div className="card-logo-text">
                      <div className="brand-name">GHAR<span>OO</span></div>
                      <div className="brand-sub">— C A R E —</div>
                    </div>
                  </div>
                </div>

                <div className="card-specialist-bar">
                  {serviceLabel.toUpperCase()} SPECIALIST
                </div>

                <div className="card-back-body">
                  <div className="card-info-row">
                    <div className="card-info-icon"><i className="bi bi-person-fill"></i></div>
                    <div className="card-info-text">
                      <span className="info-label">Name</span>
                      <span className="info-value">{fullName || '—'}</span>
                    </div>
                  </div>

                  <div className="card-info-row">
                    <div className="card-info-icon"><i className="bi bi-credit-card-2-front-fill"></i></div>
                    <div className="card-info-text">
                      <span className="info-label">Employee ID</span>
                      <span className="info-value">{employeeId}</span>
                    </div>
                  </div>

                  <div className="card-info-row">
                    <div className="card-info-icon"><i className="bi bi-briefcase-fill"></i></div>
                    <div className="card-info-text">
                      <span className="info-label">Designation</span>
                      <span className="info-value">{designation}</span>
                    </div>
                  </div>

                  <div className="card-info-row">
                    <div className="card-info-icon"><i className="bi bi-calendar3"></i></div>
                    <div className="card-info-text">
                      <span className="info-label">Joining Date</span>
                      <span className="info-value">{joiningDate}</span>
                    </div>
                  </div>

                  {/* Address Info */}
                  {(profile.address || profile.city || profile.state || profile.pinCode) && (
                    <>
                      <div className="card-info-row">
                        <div className="card-info-icon"><i className="bi bi-geo-alt-fill"></i></div>
                        <div className="card-info-text">
                          <span className="info-label">Address</span>
                          <span className="info-value">{profile.address || '—'}</span>
                        </div>
                      </div>
                      <div className="card-info-row">
                        <div className="card-info-icon"><i className="bi bi-geo-fill"></i></div>
                        <div className="card-info-text">
                          <span className="info-label">Location</span>
                          <span className="info-value">
                            {[profile.city, profile.state, profile.pinCode].filter(Boolean).join(', ') || '—'}
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Auth Section */}
                  <div className="card-auth-section">
                    <div className="card-auth-title">Authorised Signature</div>
                    <div className="card-auth-row">
                      <div>
                        {authStatus === 'authorized' ? (
                          <span className="auth-authorized-badge">
                            <i className="bi bi-patch-check-fill"></i> Authorized
                          </span>
                        ) : (
                          <span className="auth-pending-badge">
                            ⏳ PENDING
                          </span>
                        )}
                        <div className="auth-gharoo-label">Authorised by GHAROO CARE</div>
                      </div>
                      <QRPlaceholder />
                    </div>
                  </div>

                  <div className="card-property-text">
                    <strong>THIS IDENTITY CARD IS THE PROPERTY OF</strong>
                    GHAROO CARE<br />
                    If found, please return to the nearest Gharoo Care office.
                  </div>
                </div>

                <div className="card-back-footer">
                  <i className="bi bi-telephone-fill" style={{ color: '#90caf9', fontSize: '0.7rem' }}></i>
                  <span>{phone}</span>
                  <span className="footer-divider">|</span>
                  <span>{phone}</span>
                </div>
              </div>

            </div>
          </div>

          {/* Flip buttons */}
          <div className="card-action-row">
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={() => setFlipped(f => !f)}
            >
              <i className="bi bi-arrow-left-right me-1"></i>
              {flipped ? 'Show Front' : 'Show Back'}
            </button>
          </div>
        </div>

        {/* Status Info */}
        <div className="sm-card p-3 mt-2">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div>
              <p className="mb-0 fw-semibold" style={{ fontSize: '0.88rem' }}>Authorization Status</p>
              <small className="text-muted">Admin will authorize your card after verification.</small>
            </div>
            {authStatus === 'authorized' ? (
              <span className="badge bg-success">
                <i className="bi bi-patch-check-fill me-1"></i>Authorized
              </span>
            ) : (
              <span className="badge bg-warning text-dark">
                <i className="bi bi-hourglass-split me-1"></i>Pending Authorization
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
