import { useState, useEffect } from 'react';
import '../styles/leads.css';
import { useToast } from '../components/ToastProvider';

const statusBadges = {
  New: 'bg-primary',
  Accepted: 'bg-success',
  Contacted: 'bg-info text-dark',
  Qualified: 'bg-success',
  Lost: 'bg-danger'
};

function getStoredUser() {
  const raw = localStorage.getItem('serviceManUser') || sessionStorage.getItem('serviceManUser');
  return raw ? JSON.parse(raw) : null;
}

function getUserId(user) {
  return user?._id || user?.id;
}

function LeadCard({ lead, acceptingId, onAccept }) {
  const leadId = lead.id || lead._id;

  return (
    <article className="item-card">
      <div className="item-card-header">
        <div>
          <h2 className="item-card-title">{lead.name}</h2>
          <p className="item-card-subtitle">{lead.service}</p>
          {lead.isPremium && (
            <span className="badge text-bg-warning rounded-pill">
              <i className="bi bi-stars me-1"></i>
              Premium User{lead.premiumPlan ? ` - ${lead.premiumPlan}` : ''}
            </span>
          )}
        </div>
        <span className={`badge ${statusBadges[lead.status] || 'bg-secondary'} rounded-pill px-3 py-2`}>
          {lead.status}
        </span>
      </div>

      <div className="item-card-section">
        <p className="item-card-section-title">Contact</p>
        <div className="detail-row">
          <i className="bi bi-telephone"></i>
          <a href={`tel:${lead.phone}`}>{lead.phone}</a>
        </div>
        <div className="detail-row">
          <i className="bi bi-envelope"></i>
          <span>{lead.email}</span>
        </div>
      </div>

      <div className="item-card-section">
        <p className="item-card-section-title">Location</p>
        <div className="detail-row">
          <i className="bi bi-geo-alt"></i>
          <span>{lead.area ? `${lead.area}, ` : ''}{lead.city}</span>
        </div>
        <div className="detail-row">
          <i className="bi bi-calendar3"></i>
          <span>{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : '—'}</span>
        </div>
      </div>

      <div className="item-card-footer">
        {lead.status === 'New' ? (
          <button
            type="button"
            className="btn btn-success"
            disabled={acceptingId === leadId}
            onClick={() => onAccept(leadId)}
          >
            {acceptingId === leadId ? (
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            ) : (
              <i className="bi bi-check-lg me-2"></i>
            )}
            Accept Lead
          </button>
        ) : lead.status === 'Accepted' ? (
          <span className="text-success fw-medium w-100 text-center py-2">
            <i className="bi bi-check-circle-fill me-1"></i>
            Accepted — see Work Orders
          </span>
        ) : null}
      </div>
    </article>
  );
}

export default function Leads() {
  const { showToast } = useToast();
  const [user] = useState(getStoredUser);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [acceptingId, setAcceptingId] = useState(null);

  const fetchLeads = async (userId) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/leads/assigned/${userId}`);
      const data = await response.json();
      setLeads(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch leads:', err);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userId = getUserId(user);
    if (userId) {
      fetchLeads(userId);
    }
  }, [user]);

  const filteredLeads = leads.filter((lead) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      lead.name?.toLowerCase().includes(term) ||
      lead.email?.toLowerCase().includes(term) ||
      lead.phone?.includes(term) ||
      lead.service?.toLowerCase().includes(term) ||
      lead.city?.toLowerCase().includes(term) ||
      lead.area?.toLowerCase().includes(term);

    const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAccept = async (leadId) => {
    const userId = getUserId(user);
    if (!userId) return;
    setAcceptingId(leadId);
    try {
      const response = await fetch(`/api/leads/${leadId}/accept`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await response.json();
      if (data.success) {
        setLeads((prev) =>
          prev.map((lead) =>
            (lead.id || lead._id) === leadId ? { ...lead, status: 'Accepted' } : lead
          )
        );
        showToast('Lead accepted. Check Work Orders for full details.', 'success', 'Lead accepted');
      } else {
        showToast(data.message || 'Failed to accept lead', 'error', 'Accept failed');
      }
    } catch {
      showToast('Failed to accept lead. Please try again.', 'error', 'Network error');
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div>
          <p className="eyebrow mb-1">My Leads</p>
          <h1>Assigned Leads</h1>
          <p>Leads assigned to you by admin.</p>
        </div>
        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          onClick={() => getUserId(user) && fetchLeads(getUserId(user))}
        >
          <i className="bi bi-arrow-clockwise"></i>
          <span className="d-none d-sm-inline ms-1">Refresh</span>
        </button>
      </div>

      <div className="filter-card">
        <div className="filter-grid">
          <div>
            <label className="form-label" htmlFor="searchLeads">Search</label>
            <input
              id="searchLeads"
              type="search"
              className="form-control"
              placeholder="Name, phone, service, city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label" htmlFor="statusFilter">Status</label>
            <select
              id="statusFilter"
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All</option>
              <option value="New">New</option>
              <option value="Accepted">Accepted</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Lost">Lost</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="sm-card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <i className="bi bi-inbox"></i>
            </div>
            <h3 className="h5 fw-bold mb-2">No Assigned Leads</h3>
            <p className="text-muted mb-0">Admin has not assigned any leads to you yet.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="mobile-card-list item-list">
            {filteredLeads.map((lead) => (
              <LeadCard
                key={lead.id || lead._id}
                lead={lead}
                acceptingId={acceptingId}
                onAccept={handleAccept}
              />
            ))}
          </div>

          <div className="desktop-table-wrap sm-card">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Service</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id || lead._id}>
                      <td className="fw-medium">
                        <div>{lead.name}</div>
                        {lead.isPremium && (
                          <span className="badge text-bg-warning rounded-pill mt-1">
                            <i className="bi bi-stars me-1"></i>
                            Premium{lead.premiumPlan ? ` - ${lead.premiumPlan}` : ''}
                          </span>
                        )}
                      </td>
                      <td>
                        <div>{lead.email}</div>
                        <div className="text-muted small">{lead.phone}</div>
                      </td>
                      <td>{lead.service}</td>
                      <td>
                        <div>{lead.city}</div>
                        <div className="text-muted small">{lead.area}</div>
                      </td>
                      <td>
                        <span className={`badge ${statusBadges[lead.status] || 'bg-secondary'} rounded-pill px-3 py-2`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="text-muted small">
                        {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        {lead.status === 'New' ? (
                          <button
                            type="button"
                            className="btn btn-success btn-sm"
                            disabled={acceptingId === (lead.id || lead._id)}
                            onClick={() => handleAccept(lead.id || lead._id)}
                          >
                            Accept
                          </button>
                        ) : lead.status === 'Accepted' ? (
                          <span className="text-success small">
                            <i className="bi bi-check-circle-fill me-1"></i>
                            Accepted
                          </span>
                        ) : (
                          <span className="text-muted small">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
