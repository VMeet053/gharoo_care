import { Link } from 'react-router-dom';

const getStoredUser = () => {
  const raw = localStorage.getItem('adminUser') || sessionStorage.getItem('adminUser');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export default function Profile() {
  const user = getStoredUser();
  const fullName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';
  const email = user?.email || '';
  const role = user?.role || '';
  const team = user?.team || '';
  const phone = user?.phone || '';

  return (
    <div className="container-fluid px-3 px-lg-4 py-4">
      <div className="page-heading">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-person-badge" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">Account</p>
            <h1 className="h3 mb-1">Profile</h1>
            <p className="text-muted mb-0">Manage your personal details, bio, and contact preferences.</p>
          </div>
        </div>
        <div className="heading-actions">
          <button className="btn btn-outline-secondary btn-sm" type="button">
            <i className="bi bi-camera" aria-hidden="true"></i> Change Photo
          </button>
        </div>
      </div>

      <section className="row g-3">
        <div className="col-12 col-xl-4">
          <div className="panel h-100 text-center profile-card">
            <div className="profile-cover profile-cover-gradient" aria-hidden="true"></div>
            <img className="avatar-img avatar-xl profile-photo" src={user?.avatar || '/admin/assets/images/avatar/avatar.jpg'} alt={fullName || 'Admin'} />
            <h2 className="h5 mt-3 mb-1">{fullName || 'Admin User'}</h2>
            <p className="text-muted mb-3">{role || 'Administrator'}</p>
            <div className="d-flex justify-content-center gap-2">
              {role && <span className="badge text-bg-primary">{role}</span>}
              <span className="badge text-bg-success">Verified</span>
            </div>
            <div className="info-list mt-4 text-start">
              <div><span>Email</span><strong>{email || '-'}</strong></div>
              <div><span>Team</span><strong>{team || '-'}</strong></div>
              <div><span>Phone</span><strong>{phone || '-'}</strong></div>
            </div>
          </div>
        </div>
        <div className="col-12 col-xl-8">
          <form className="panel needs-validation" noValidate>
            <div className="panel-header">
              <div>
                <h2 className="h5 mb-1 section-title"><i className="bi bi-person-gear" aria-hidden="true"></i><span>Profile Settings</span></h2>
                <p className="text-muted mb-0">Update your account profile and contact details.</p>
              </div>
            </div>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label" htmlFor="profileName">Name</label>
                <input className="form-control" id="profileName" type="text" defaultValue={fullName} required />
                <div className="invalid-feedback">Name is required.</div>
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="profileEmail">Email</label>
                <input className="form-control" id="profileEmail" type="email" defaultValue={email} required />
                <div className="invalid-feedback">Enter a valid email.</div>
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="profilePhone">Phone</label>
                <input className="form-control" id="profilePhone" type="tel" defaultValue={phone} />
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="profileRole">Role</label>
                <input className="form-control" id="profileRole" type="text" defaultValue={role} readOnly />
              </div>
              <div className="col-12">
                <label className="form-label" htmlFor="profileBio">Bio</label>
                <textarea className="form-control" id="profileBio" rows="5" defaultValue=""></textarea>
              </div>
            </div>
            <div className="d-flex justify-content-end mt-4">
              <button className="btn btn-primary" type="submit"><i className="bi bi-check2-circle" aria-hidden="true"></i> Save Profile</button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
