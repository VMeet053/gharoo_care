export default function Components() {
  return (
    <div className="container-fluid px-3 px-lg-4 py-4">
      <div className="page-heading">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-grid-3x3-gap" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">UI Kit</p>
            <h1 className="h3 mb-1">Components</h1>
            <p className="text-muted mb-0">Buttons, badges, progress, accordions, and reusable interface blocks.</p>
          </div>
        </div>
      </div>

      <section className="row g-3">
        <div className="col-12 col-xl-6">
          <div className="panel h-100">
            <h2 className="h5 mb-3 section-title"><i className="bi bi-cursor" aria-hidden="true"></i><span>Buttons</span></h2>
            <div className="d-flex flex-wrap gap-2">
              <button className="btn btn-primary" type="button">Primary</button>
              <button className="btn btn-outline-secondary" type="button">Secondary</button>
              <button className="btn btn-success" type="button">Success</button>
              <button className="btn btn-danger" type="button">Danger</button>
              <button className="btn btn-warning" type="button">Warning</button>
            </div>
            <h2 className="h5 mt-4 mb-3">Badges</h2>
            <div className="d-flex flex-wrap gap-2">
              <span className="badge text-bg-primary">Primary</span>
              <span className="badge text-bg-success">Success</span>
              <span className="badge text-bg-warning">Warning</span>
              <span className="badge text-bg-danger">Danger</span>
            </div>
          </div>
        </div>
        <div className="col-12 col-xl-6">
          <div className="panel h-100">
            <h2 className="h5 mb-3 section-title"><i className="bi bi-reception-4" aria-hidden="true"></i><span>Progress</span></h2>
            <div className="progress mb-3">
              <div className="progress-bar progress-72" role="progressbar" aria-valuenow="72" aria-valuemin="0" aria-valuemax="100">72%</div>
            </div>
            <div className="progress mb-3">
              <div className="progress-bar bg-success progress-58" role="progressbar" aria-valuenow="58" aria-valuemin="0" aria-valuemax="100">58%</div>
            </div>
            <div className="progress">
              <div className="progress-bar bg-warning progress-42" role="progressbar" aria-valuenow="42" aria-valuemin="0" aria-valuemax="100">42%</div>
            </div>
          </div>
        </div>
        <div className="col-12">
          <div className="panel">
            <h2 className="h5 mb-3 section-title"><i className="bi bi-menu-button-wide" aria-hidden="true"></i><span>Accordion</span></h2>
            <div className="accordion" id="componentAccordion">
              <div className="accordion-item">
                <h3 className="accordion-header">
                  <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">Reusable layout</button>
                </h3>
                <div id="collapseOne" className="accordion-collapse collapse show" data-bs-parent="#componentAccordion">
                  <div className="accordion-body">Use the admin shell, panel, metric-card, and table styles for consistent pages.</div>
                </div>
              </div>
              <div className="accordion-item">
                <h3 className="accordion-header">
                  <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">Responsive behavior</button>
                </h3>
                <div id="collapseTwo" className="accordion-collapse collapse" data-bs-parent="#componentAccordion">
                  <div className="accordion-body">The sidebar becomes a mobile overlay and a compact mini sidebar on desktop.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
