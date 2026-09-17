import { Link } from 'react-router-dom';

export default function Charts() {
  return (
    <div className="container-fluid px-3 px-lg-4 py-4">
      <div className="page-heading animate-fade-in">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-bar-chart-line" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">Analytics</p>
            <h1 className="h3 mb-1">Charts</h1>
            <p className="text-muted mb-0">Visualize revenue, channels, and operating performance.</p>
          </div>
        </div>
        <div className="heading-actions">
          <button className="btn btn-outline-secondary btn-sm" type="button">
            <i className="bi bi-calendar3" aria-hidden="true"></i> Last 30 Days
          </button>
        </div>
      </div>

      <div className="text-center py-5 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="blank-icon mx-auto mb-3">
          <i className="bi bi-bar-chart-line"></i>
        </div>
        <h5 className="text-muted">No Data Available</h5>
        <p className="text-muted small">Add your data sources to view charts</p>
      </div>
    </div>
  );
}
