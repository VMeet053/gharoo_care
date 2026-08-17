export default function Settings() {
  return (
    <div className="container-fluid px-3 px-lg-4 py-4">
      <div className="page-heading">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-gear" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">Workspace</p>
            <h1 className="h3 mb-1">Settings</h1>
            <p className="text-muted mb-0">Customize workspace defaults, security options, and notification preferences.</p>
          </div>
        </div>
      </div>

      <section className="row g-3">
        <div className="col-12 col-xl-6">
          <form className="panel needs-validation" noValidate>
            <div className="panel-header">
              <div>
                <h2 className="h5 mb-1 section-title"><i className="bi bi-sliders" aria-hidden="true"></i><span>General Settings</span></h2>
                <p className="text-muted mb-0">Configure workspace identity and defaults.</p>
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="workspaceName">Workspace name</label>
              <input className="form-control" id="workspaceName" type="text" defaultValue="adminHMD Workspace" required />
              <div className="invalid-feedback">Workspace name is required.</div>
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="defaultLanguage">Default language</label>
              <select className="form-select" id="defaultLanguage" defaultValue="English">
                <option>English</option>
                <option>Bangla</option>
                <option>Spanish</option>
              </select>
            </div>
            <button className="btn btn-primary" type="submit"><i className="bi bi-check2-circle" aria-hidden="true"></i> Save Settings</button>
          </form>
        </div>
        <div className="col-12 col-xl-6">
          <div className="panel h-100">
            <div className="panel-header">
              <div>
                <h2 className="h5 mb-1 section-title"><i className="bi bi-toggles2" aria-hidden="true"></i><span>Preferences</span></h2>
                <p className="text-muted mb-0">Control notifications and security options.</p>
              </div>
            </div>
            <div className="settings-list">
              <label className="settings-row">
                <span><strong>Email alerts</strong><small>Receive important account updates.</small></span>
                <input className="form-check-input" type="checkbox" defaultChecked />
              </label>
              <label className="settings-row">
                <span><strong>Weekly reports</strong><small>Send summary reports every Monday.</small></span>
                <input className="form-check-input" type="checkbox" defaultChecked />
              </label>
              <label className="settings-row">
                <span><strong>Two-factor authentication</strong><small>Require extra verification for admins.</small></span>
                <input className="form-check-input" type="checkbox" />
              </label>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
