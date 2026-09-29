export default function Alerts() {
  return (
    <div className="container-fluid px-3 px-lg-4 py-4">
      <div className="page-heading">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-exclamation-triangle" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">Feedback</p>
            <h1 className="h3 mb-1">Alerts</h1>
            <p className="text-muted mb-0">System feedback states for success, warning, info, and error messages.</p>
          </div>
        </div>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="h5 mb-1 section-title"><i className="bi bi-exclamation-triangle" aria-hidden="true"></i><span>Alert Styles</span></h2>
            <p className="text-muted mb-0">Common notification patterns for admin workflows.</p>
          </div>
        </div>
        <div className="alert alert-primary" role="alert"><strong>Info:</strong> New dashboard reports are ready to review.</div>
        <div className="alert alert-success" role="alert"><strong>Success:</strong> User permissions were updated successfully.</div>
        <div className="alert alert-warning" role="alert"><strong>Warning:</strong> Billing information needs attention.</div>
        <div className="alert alert-danger mb-0" role="alert"><strong>Error:</strong> Some integrations could not sync.</div>
      </section>
    </div>
  );
}
