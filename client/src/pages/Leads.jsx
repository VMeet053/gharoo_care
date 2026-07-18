import { useState, useEffect } from 'react';
import { electronicsServices } from '../constants/services';
import '../styles/leads.css';

// Define city and area mappings
const cities = ['All', 'Surat', 'Navsari', 'Ankleshwar'];
const cityAreas = {
  Surat: ['All', 'Adajan', 'Athwa', 'Dumas', 'Vesu', 'Parle Point'],
  Navsari: ['All', 'Bilimora', 'Chikhli', 'Gandevi'],
  Ankleshwar: ['All', 'GIDC', 'Panoli', 'Valia'],
  All: ['All']
};

const leadCities = ['Surat', 'Navsari', 'Ankleshwar'];
const emptyLeadForm = {
  name: '',
  email: '',
  phone: '',
  status: 'New',
  service: '',
  houseNumber: '',
  address: '',
  currentLocation: '',
  city: '',
  area: ''
};

const toTitleCase = (value) => value
  .toLowerCase()
  .replace(/\b\w/g, (char) => char.toUpperCase());

const cleanAddressParts = (value = '') => String(value)
  .replace(/\b\d{5,6}\b/g, '')
  .replace(/\bgujarat\b/ig, '')
  .replace(/\bindia\b/ig, '')
  .replace(/\s*-\s*$/g, '')
  .split(',')
  .map((part) => part.trim().replace(/\s+/g, ' '))
  .filter(Boolean);

const getDisplayCity = (lead) => {
  const source = `${lead.city || ''}, ${lead.area || ''}`;
  const matchedCity = leadCities.find((city) => new RegExp(`\\b${city}\\b`, 'i').test(source));
  return matchedCity || cleanAddressParts(lead.city)[0] || '-';
};

const getDisplayArea = (lead) => {
  const rawArea = String(lead.area || '').trim();
  const rawCity = String(lead.city || '').trim();
  const displayCity = getDisplayCity(lead);

  if (
    rawArea &&
    rawArea.length <= 45 &&
    !leadCities.some((city) => new RegExp(`\\b${city}\\b`, 'i').test(rawArea)) &&
    !/\bgujarat\b|\b\d{5,6}\b/i.test(rawArea)
  ) {
    return rawArea;
  }

  const parts = cleanAddressParts(rawArea || rawCity)
    .filter((part) => !leadCities.some((city) => city.toLowerCase() === part.toLowerCase()));

  if (parts.length >= 2) {
    return toTitleCase(parts[1]);
  }

  return parts[0] ? toTitleCase(parts[0]) : displayCity;
};

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState(emptyLeadForm);
  const [editingId, setEditingId] = useState(null);
  const [tempAssigned, setTempAssigned] = useState('');
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [cityFilter, setCityFilter] = useState('All');
  const [areaFilter, setAreaFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [assignedFilter, setAssignedFilter] = useState('All');
  const [bulkAssigned, setBulkAssigned] = useState('Unassigned');
  const [currentPage, setCurrentPage] = useState(1);
  const [serviceMen, setServiceMen] = useState([]);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const itemsPerPage = 10;

  const getServiceManName = (user) => (
    user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Service Man'
  );
  const getServiceManId = (user) => String(user.id || user._id || '');

  const activeServiceMen = serviceMen.filter((user) => (user.status || 'Active').toLowerCase() === 'active');

  const assignOptions = [
    { value: 'Unassigned', label: 'Unassigned' },
    ...activeServiceMen.map((user) => ({ value: getServiceManId(user), label: getServiceManName(user) })),
  ];

  const bulkAssignOptions = selectedLeads.length > 0 ? assignOptions : [{ value: 'Unassigned', label: 'Unassigned' }];

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/leads');
      const data = await response.json();
      setLeads(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchServiceMen = async () => {
      try {
        const response = await fetch('/api/users/role/Service%20Man');
        const data = await response.json();
        const users = Array.isArray(data) ? data : data?.value || data?.data || [];
        setServiceMen(users);
      } catch (err) {
        console.error('Failed to fetch service men:', err);
      }
    };

    fetchLeads();
    fetchServiceMen();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdownId) {
        if (
          !event.target.closest('.lead-assign-menu') &&
          !event.target.closest('.lead-assign-trigger')
        ) {
          setOpenDropdownId(null);
          setEditingId(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownId]);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'New':
        return { className: 'text-bg-primary', icon: 'bi-star' };
      case 'Accepted':
        return { className: 'text-bg-success', icon: 'bi-check-circle' };
      case 'Contacted':
        return { className: 'text-bg-info', icon: 'bi-chat-left' };
      case 'Qualified':
        return { className: 'text-bg-success', icon: 'bi-award' };
      case 'Lost':
        return { className: 'text-bg-danger', icon: 'bi-x-circle' };
      default:
        return { className: 'text-bg-secondary', icon: 'bi-circle' };
    }
  };

  const addLeadAreas = cityAreas[addForm.city] || [];

  const handleAddLead = async (e) => {
    e.preventDefault();
    if (!addForm.currentLocation.trim()) {
      alert('Please add current location before saving lead.');
      return;
    }
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm)
      });
      const data = await response.json();
      if (data.success) {
        setLeads((prev) => [data.lead, ...prev]);
        setAddForm(emptyLeadForm);
        setShowAddForm(false);
      }
    } catch (err) {
      console.error('Failed to add lead:', err);
    }
  };

  const fillCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Current location is not supported in this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setAddForm((prev) => ({
          ...prev,
          currentLocation: `https://www.google.com/maps?q=${latitude},${longitude}`
        }));
      },
      () => {
        alert('Could not get current location. Please allow location permission or paste a map link.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Get available areas based on selected city
  const availableAreas = cityAreas[cityFilter] || ['All'];

  // Filtered leads
  const filteredLeads = leads.filter(lead => {
    const displayCity = getDisplayCity(lead);
    const displayArea = getDisplayArea(lead);
    const matchesCity = cityFilter === 'All' || displayCity === cityFilter;
    const matchesArea = areaFilter === 'All' || displayArea === areaFilter;
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.houseNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.currentLocation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      displayCity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      displayArea.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAssigned = 
      assignedFilter === 'All' || 
      (assignedFilter === 'Assigned' && lead.assigned !== 'Unassigned') ||
      (assignedFilter === 'Not Assigned' && lead.assigned === 'Unassigned');
    return matchesCity && matchesArea && matchesSearch && matchesAssigned;
  });

  const totalLeads = leads.length;
  const newLeads = leads.filter((lead) => lead.status === 'New').length;
  const acceptedLeads = leads.filter((lead) => lead.status === 'Accepted' || lead.status === 'Qualified').length;
  const unassignedLeads = leads.filter((lead) => lead.assigned === 'Unassigned').length;

  // Pagination calculations
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentLeads = filteredLeads.slice(startIndex, startIndex + itemsPerPage);

  const startAssign = (lead, event) => {
    if (editingId === lead.id) {
      setEditingId(null);
      setOpenDropdownId(null);
    } else {
      setEditingId(lead.id);
      const currentAssignedId = lead.assignedTo
        ? String(lead.assignedTo)
        : activeServiceMen.find((user) => getServiceManName(user) === lead.assigned)?.id;
      setTempAssigned(currentAssignedId || 'Unassigned');
      const rect = event.currentTarget.getBoundingClientRect();
      const menuWidth = 330;
      const menuHeight = 420;
      const viewportPadding = 16;
      const nextLeft = Math.min(
        Math.max(viewportPadding, rect.right - menuWidth),
        window.innerWidth - menuWidth - viewportPadding
      );
      const belowTop = rect.bottom + 10;
      const nextTop = belowTop + menuHeight > window.innerHeight
        ? Math.max(viewportPadding, rect.top - menuHeight - 10)
        : belowTop;
      setDropdownPos({ top: nextTop, left: nextLeft });
      setOpenDropdownId(lead.id);
    }
  };

  const chooseAssign = (assignedValue) => {
    setTempAssigned(assignedValue);
  };

  const cancelAssign = () => {
    setEditingId(null);
    setOpenDropdownId(null);
  };

  const toggleSelectLead = (leadId) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId) 
        : [...prev, leadId]
    );
  };

  const selectAll = () => {
    const currentPageLeadIds = currentLeads.map(l => l.id);
    const allSelected = currentPageLeadIds.every(id => selectedLeads.includes(id));
    if (allSelected) {
      setSelectedLeads(prev => prev.filter(id => !currentPageLeadIds.includes(id)));
    } else {
      setSelectedLeads(prev => [...new Set([...prev, ...currentPageLeadIds])]);
    }
  };

  const bulkAssign = async () => {
    try {
      const selectedUser = activeServiceMen.find((user) => getServiceManId(user) === bulkAssigned);
      const response = await fetch('/api/leads/bulk-assign', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadIds: selectedLeads,
          assigned: selectedUser ? getServiceManName(selectedUser) : 'Unassigned',
          assignedUserId: selectedUser ? getServiceManId(selectedUser) : null
        })
      });
      const data = await response.json();
      if (data.success) {
        const updatedMap = new Map(data.leads.map((lead) => [lead.id, lead]));
        setLeads(leads.map(lead => updatedMap.get(lead.id) || lead));
        setSelectedLeads([]);
      }
    } catch (err) {
      console.error('Failed to bulk assign:', err);
    }
  };

  const saveAssign = async (leadId) => {
    const selectedUser = activeServiceMen.find((user) => getServiceManId(user) === tempAssigned);
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assigned: selectedUser ? getServiceManName(selectedUser) : 'Unassigned',
          assignedUserId: selectedUser ? getServiceManId(selectedUser) : null
        })
      });
      const data = await response.json();
      if (data.success) {
        setLeads(leads.map(lead =>
          lead.id === leadId ? data.lead : lead
        ));
        setEditingId(null);
        setOpenDropdownId(null);
      }
    } catch (err) {
      console.error('Failed to save assignment:', err);
    }
  };

  const exportToExcel = (dataToExport, filename) => {
    if (!dataToExport.length) return;
    const headers = ['Name', 'Email', 'Phone', 'Status', 'Service', 'House Number', 'Address', 'Current Location', 'City', 'Area', 'Assigned To'];
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(lead => [
        `"${lead.name}"`,
        `"${lead.email}"`,
        `"${lead.phone}"`,
        `"${lead.status}"`,
        `"${lead.service}"`,
        `"${lead.houseNumber || ''}"`,
        `"${lead.address || ''}"`,
        `"${lead.currentLocation || ''}"`,
        `"${getDisplayCity(lead)}"`,
        `"${getDisplayArea(lead)}"`,
        `"${lead.assigned}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = (dataToExport, filename) => {
    if (!dataToExport.length) return;
    let pdfContent = 'Leads Report\n' + '='.repeat(50) + '\n\n';
    dataToExport.forEach((lead, index) => {
      pdfContent += `${index + 1}. ${lead.name}\n`;
      pdfContent += `   Email: ${lead.email}\n`;
      pdfContent += `   Phone: ${lead.phone}\n`;
      pdfContent += `   Status: ${lead.status}\n`;
      pdfContent += `   Service: ${lead.service}\n`;
      pdfContent += `   House Number: ${lead.houseNumber || '-'}\n`;
      pdfContent += `   Address: ${lead.address || '-'}\n`;
      pdfContent += `   Current Location: ${lead.currentLocation || '-'}\n`;
      pdfContent += `   City: ${getDisplayCity(lead)}\n`;
      pdfContent += `   Area: ${getDisplayArea(lead)}\n`;
      pdfContent += `   Assigned To: ${lead.assigned}\n`;
      pdfContent += '-'.repeat(50) + '\n';
    });

    const blob = new Blob([pdfContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container-fluid px-3 px-lg-4 py-4">
      <div className="page-heading animate-fade-in">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-person-lines-fill" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">Customer pipeline</p>
            <h1 className="h3 mb-1">Leads Management</h1>
            <p className="text-muted mb-0">Track inquiries, filter by location, and assign the right service provider.</p>
          </div>
        </div>
        <div className="heading-actions">
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(!showAddForm)}>
            <i className="bi bi-plus-lg me-1"></i> Add Lead
          </button>
        </div>
      </div>

      <section className="leads-summary-grid animate-fade-in" aria-label="Lead summary">
        <article className="lead-summary-card lead-summary-primary">
          <span className="lead-summary-icon"><i className="bi bi-people" aria-hidden="true"></i></span>
          <div>
            <p>Total Leads</p>
            <strong>{totalLeads}</strong>
          </div>
        </article>
        <article className="lead-summary-card lead-summary-info">
          <span className="lead-summary-icon"><i className="bi bi-stars" aria-hidden="true"></i></span>
          <div>
            <p>New Leads</p>
            <strong>{newLeads}</strong>
          </div>
        </article>
        <article className="lead-summary-card lead-summary-success">
          <span className="lead-summary-icon"><i className="bi bi-check2-circle" aria-hidden="true"></i></span>
          <div>
            <p>Accepted / Qualified</p>
            <strong>{acceptedLeads}</strong>
          </div>
        </article>
        <article className="lead-summary-card lead-summary-warning">
          <span className="lead-summary-icon"><i className="bi bi-person-exclamation" aria-hidden="true"></i></span>
          <div>
            <p>Unassigned</p>
            <strong>{unassignedLeads}</strong>
          </div>
        </article>
      </section>

      {showAddForm && (
        <section className="panel leads-form-panel animate-fade-in mb-3">
          <div className="panel-header">
            <h2 className="h5 mb-0 section-title"><i className="bi bi-plus-circle" aria-hidden="true"></i><span>Add New Lead</span></h2>
          </div>
          <div className="panel-body">
            <form onSubmit={handleAddLead} className="row g-3">
              <div className="col-md-4">
                <label className="form-label" htmlFor="leadName">Name</label>
                <input className="form-control" id="leadName" required value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label" htmlFor="leadEmail">Email</label>
                <input className="form-control" id="leadEmail" type="email" required value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label" htmlFor="leadPhone">Phone</label>
                <input className="form-control" id="leadPhone" required value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} />
              </div>
              <div className="col-md-3">
                <label className="form-label" htmlFor="leadService">Service</label>
                <select className="form-select" id="leadService" required value={addForm.service} onChange={(e) => setAddForm({ ...addForm, service: e.target.value })}>
                  <option value="">Choose service</option>
                  {electronicsServices.map((service) => (
                    <option key={service} value={service}>{service}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label" htmlFor="leadHouseNumber">House / Flat Number</label>
                <input className="form-control" id="leadHouseNumber" value={addForm.houseNumber} onChange={(e) => setAddForm({ ...addForm, houseNumber: e.target.value })} placeholder="House, flat, floor" />
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="leadAddress">Address</label>
                <input className="form-control" id="leadAddress" required value={addForm.address} onChange={(e) => setAddForm({ ...addForm, address: e.target.value })} placeholder="Full customer address" />
              </div>
              <div className="col-md-3">
                <label className="form-label" htmlFor="leadCurrentLocation">Current Location</label>
                <div className="input-group">
                  <input className="form-control" id="leadCurrentLocation" required value={addForm.currentLocation} onChange={(e) => setAddForm({ ...addForm, currentLocation: e.target.value })} placeholder="Maps link or live location" />
                  <button className="btn btn-outline-primary" type="button" onClick={fillCurrentLocation}>
                    <i className="bi bi-crosshair"></i>
                  </button>
                </div>
              </div>
              <div className="col-md-3">
                <label className="form-label" htmlFor="leadCity">City</label>
                <select className="form-select" id="leadCity" required value={addForm.city} onChange={(e) => setAddForm({ ...addForm, city: e.target.value, area: '' })}>
                  <option value="">Choose city</option>
                  {leadCities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label" htmlFor="leadArea">Area</label>
                <select className="form-select" id="leadArea" required value={addForm.area} onChange={(e) => setAddForm({ ...addForm, area: e.target.value })} disabled={!addForm.city}>
                  <option value="">Choose area</option>
                  {addLeadAreas.filter((area) => area !== 'All').map((area) => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3 d-flex align-items-end gap-2">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Lead</button>
              </div>
            </form>
          </div>
        </section>
      )}

      <section className="panel leads-filter-panel animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="panel-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
          <div>
            <h2 className="h5 mb-1 section-title"><i className="bi bi-filter" aria-hidden="true"></i><span>Filters & Search</span></h2>
            <p className="text-muted mb-0">Search leads or filter by city, area, and assignment status.</p>
          </div>
          <div className="leads-export-actions">
            <button className="btn btn-outline-success btn-sm" onClick={() => exportToExcel(leads, 'all-leads.csv')}><i className="bi bi-file-earmark-excel"></i>All CSV</button>
            <button className="btn btn-outline-danger btn-sm" onClick={() => exportToPDF(leads, 'all-leads.txt')}><i className="bi bi-file-earmark-text"></i>All TXT</button>
            <button className="btn btn-success btn-sm" onClick={() => exportToExcel(filteredLeads, 'filtered-leads.csv')}><i className="bi bi-file-earmark-excel"></i>Filtered CSV</button>
            <button className="btn btn-danger btn-sm" onClick={() => exportToPDF(filteredLeads, 'filtered-leads.txt')}><i className="bi bi-file-earmark-text"></i>Filtered TXT</button>
          </div>
        </div>
        <div className="panel-body">
          <div className="row g-3">
            <div className="col-12 col-md-3">
              <div className="form-floating">
                <input
                  type="text"
                  className="form-control"
                  id="searchInput"
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <label htmlFor="searchInput"><i className="bi bi-search me-2"></i>Search leads...</label>
              </div>
            </div>
            <div className="col-12 col-md-3">
              <div className="form-floating">
                <select
                  className="form-select"
                  id="cityFilter"
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                >
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                <label htmlFor="cityFilter"><i className="bi bi-geo-alt me-2"></i>City</label>
              </div>
            </div>
            <div className="col-12 col-md-3">
              <div className="form-floating">
                <select
                  className="form-select"
                  id="areaFilter"
                  value={areaFilter}
                  onChange={(e) => setAreaFilter(e.target.value)}
                >
                  {availableAreas.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
                <label htmlFor="areaFilter"><i className="bi bi-pin-map me-2"></i>Area</label>
              </div>
            </div>
            <div className="col-12 col-md-3">
              <div className="form-floating">
                <select
                  className="form-select"
                  id="assignedFilter"
                  value={assignedFilter}
                  onChange={(e) => setAssignedFilter(e.target.value)}
                >
                  <option value="All">All</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Not Assigned">Not Assigned</option>
                </select>
                <label htmlFor="assignedFilter"><i className="bi bi-person-check me-2"></i>Assignment Status</label>
              </div>
            </div>
          </div>
        </div>
      </section>

      {selectedLeads.length > 0 && (
        <section className="panel mb-3 animate-fade-in" style={{ animationDelay: '0.15s' }}>
          <div className="panel-body">
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <span className="fw-semibold">
                <i className="bi bi-check2-square text-success me-2"></i>
                {selectedLeads.length} leads selected
              </span>
              <div className="vr d-none d-md-block"></div>
              <select
                className="form-select"
                style={{ maxWidth: '200px' }}
                value={bulkAssigned}
                onChange={(e) => setBulkAssigned(e.target.value)}
              >
                {bulkAssignOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <button
                className="btn btn-primary"
                onClick={bulkAssign}
              >
                <i className="bi bi-person-check me-1"></i> Assign Selected
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="panel leads-table-panel animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="panel-header">
          <div>
            <h2 className="h5 mb-1 section-title"><i className="bi bi-table" aria-hidden="true"></i><span>Leads List</span></h2>
            <p className="text-muted mb-0">Manage and assign service providers to new leads.</p>
          </div>
          <div className="text-muted small">
            <i className="bi bi-database me-1"></i>
            Showing {currentLeads.length} of {filteredLeads.length} leads
          </div>
        </div>
        <div className="panel-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" id="leadsTable">
              <thead className="table-light">
                <tr>
                  <th scope="col" style={{ width: '50px' }}>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={currentLeads.length > 0 && currentLeads.every(l => selectedLeads.includes(l.id))}
                      onChange={selectAll}
                    />
                  </th>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Phone</th>
                  <th scope="col">Status</th>
                  <th scope="col">Service</th>
                  <th scope="col">Address</th>
                  <th scope="col">City</th>
                  <th scope="col">Area</th>
                  <th scope="col" className="text-end">Assigned To</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="10" className="text-center py-5">
                      <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : currentLeads.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-5">
                      <div className="blank-icon mx-auto mb-3">
                        <i className="bi bi-inbox"></i>
                      </div>
                      <h5 className="text-muted">No leads found</h5>
                      <p className="text-muted small">Add a new lead to get started</p>
                    </td>
                  </tr>
                ) : (
                  currentLeads.map((lead, index) => (
                    <tr key={lead.id} className="animate-fade-in" style={{ animationDelay: `${0.25 + (index * 0.05)}s`, height: '60px' }}>
                      <td>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={() => toggleSelectLead(lead.id)}
                        />
                      </td>
                      <td>
                        <div className="lead-person">
                          <span className="lead-avatar">{lead.name?.charAt(0)?.toUpperCase() || 'L'}</span>
                          <div>
                            <p className="lead-name">{lead.name}</p>
                            <p className="lead-location">{getDisplayCity(lead)} - {getDisplayArea(lead)}</p>
                          </div>
                        </div>
                      </td>
                      <td><span className="lead-muted-text">{lead.email}</span></td>
                      <td><span className="lead-phone">{lead.phone}</span></td>
                      <td>
                        {(() => {
                          const style = getStatusStyle(lead.status);
                          return (
                            <span className={`badge rounded-pill ${style.className}`}>
                              <i className={`bi ${style.icon} me-1`}></i>
                              {lead.status}
                            </span>
                          );
                        })()}
                      </td>
                      <td><span className="lead-service-pill">{lead.service}</span></td>
                      <td>
                        <div className="lead-muted-text">{[lead.houseNumber, lead.address].filter(Boolean).join(', ') || '-'}</div>
                        {lead.currentLocation && (
                          <a className="small" href={lead.currentLocation} target="_blank" rel="noreferrer">
                            <i className="bi bi-geo-alt me-1"></i>Current location
                          </a>
                        )}
                      </td>
                      <td><span className="lead-location-chip">{getDisplayCity(lead)}</span></td>
                      <td><span className="lead-location-chip">{getDisplayArea(lead)}</span></td>
                      <td className="text-end">
                        <div className="lead-assign-cell">
                          <button
                            className={`btn btn-sm lead-assign-trigger ${lead.assigned === 'Unassigned' ? 'is-unassigned' : 'is-assigned'}`}
                            onClick={(event) => startAssign(lead, event)}
                          >
                            <i className={`bi ${lead.assigned === 'Unassigned' ? 'bi-person-plus' : 'bi-person-check'} me-2`}></i>
                            <span>{lead.assigned}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <nav aria-label="Page navigation">
            <ul className="pagination pagination-lg mb-0">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button 
                  className="page-link" 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
              </li>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                </li>
              ))}
              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button 
                  className="page-link" 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}

      {openDropdownId && (
        <div
          className="lead-assign-menu"
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
        >
          <div className="lead-assign-menu-header">
            <div>
              <strong>Assign service man</strong>
              <span>{activeServiceMen.length} available</span>
            </div>
            <button type="button" className="lead-assign-close" onClick={cancelAssign} aria-label="Close assign menu">
              <i className="bi bi-x"></i>
            </button>
          </div>

          <button
            type="button"
            className={`lead-assign-option ${tempAssigned === 'Unassigned' ? 'selected' : ''}`}
            onClick={() => chooseAssign('Unassigned')}
          >
            <span className="lead-assign-avatar muted"><i className="bi bi-person-dash"></i></span>
            <span className="lead-assign-info">
              <strong>Unassigned</strong>
              <small>No technician selected</small>
            </span>
            {tempAssigned === 'Unassigned' && <i className="bi bi-check2 lead-assign-check"></i>}
          </button>

          <div className="lead-assign-list">
            {activeServiceMen.length === 0 ? (
              <div className="lead-assign-empty">
                <i className="bi bi-person-x"></i>
                <span>No service man found</span>
              </div>
            ) : (
              activeServiceMen.map((user) => {
                const name = getServiceManName(user);
                return (
                  <button
                    type="button"
                    key={user.id || user._id || name}
                    className={`lead-assign-option ${tempAssigned === getServiceManId(user) ? 'selected' : ''}`}
                    onClick={() => chooseAssign(getServiceManId(user))}
                  >
                    <span className="lead-assign-avatar">{name.charAt(0).toUpperCase()}</span>
                    <span className="lead-assign-info">
                      <strong>{name}</strong>
                      <small>{user.service || user.team || user.phone || 'Service technician'}</small>
                    </span>
                    {tempAssigned === getServiceManId(user) && <i className="bi bi-check2 lead-assign-check"></i>}
                  </button>
                );
              })
            )}
          </div>

          <div className="lead-assign-footer">
            <button type="button" className="btn btn-light btn-sm" onClick={cancelAssign}>Cancel</button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => saveAssign(openDropdownId)}>
              <i className="bi bi-check2"></i> Assign
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
