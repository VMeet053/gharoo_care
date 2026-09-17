import { Link } from 'react-router-dom';

export default function Blank() {
  return (
    <div className="container-fluid px-3 px-lg-4 py-4">
      <div className="page-heading">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-file-earmark" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">Starter</p>
            <h1 className="h3 mb-1">Getting Started</h1>
            <p className="text-muted mb-0">Build new admin screens using the existing layout and component system.</p>
          </div>
        </div>
      </div>

      <section className="panel blank-panel">
        <div className="blank-state">
          <div className="blank-icon"><i className="bi bi-layout-text-window-reverse" aria-hidden="true"></i></div>
          <h2 className="h4 mb-2">New Page Template</h2>
          <p className="text-muted mb-4">Use this page as a foundation for new admin screens. All layout components are ready to use.</p>
          <div className="d-flex flex-wrap justify-content-center gap-2">
            <Link className="btn btn-primary" to="/components"><i className="bi bi-grid-3x3-gap" aria-hidden="true"></i> UI Components</Link>
            <Link className="btn btn-outline-secondary" to="/forms"><i className="bi bi-ui-checks-grid" aria-hidden="true"></i> Forms</Link>
            <Link className="btn btn-outline-secondary" to="/tables"><i className="bi bi-table" aria-hidden="true"></i> Tables</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
