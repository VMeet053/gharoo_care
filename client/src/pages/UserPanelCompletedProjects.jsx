import { useState, useEffect } from 'react';

export default function UserPanelCompletedProjects() {
  const [projectsData, setProjectsData] = useState({ label: '', title: '', projects: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchSettings = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/panel-settings');
      const data = await res.json();
      if (data.success) {
        setProjectsData(data.data.completedProjects || { label: '', title: '', projects: [] });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleImageUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('http://localhost:5000/api/upload-image', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        const newProjects = [...projectsData.projects];
        newProjects[index].image = data.url;
        setProjectsData({ ...projectsData, projects: newProjects });
        setMessage('Image uploaded successfully!');
      }
    } catch (err) {
      console.error(err);
      setMessage('Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const getRes = await fetch('http://localhost:5000/api/panel-settings');
      const getResData = await getRes.json();
      if (!getResData.success) throw new Error('Failed to get settings');
      
      const updatedSettings = { ...getResData.data, completedProjects: projectsData };
      
      const res = await fetch('http://localhost:5000/api/panel-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings)
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Settings saved successfully!');
      }
    } catch (err) {
      setMessage('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setProjectsData({ ...projectsData, [field]: value });
  };

  const handleProjectChange = (index, field, value) => {
    const newProjects = [...projectsData.projects];
    newProjects[index][field] = value;
    setProjectsData({ ...projectsData, projects: newProjects });
  };

  const addProject = () => {
    setProjectsData({ ...projectsData, projects: [...projectsData.projects, { title: 'New Project', subtitle: 'Subtitle', image: '' }] });
  };

  const removeProject = (index) => {
    setProjectsData({ ...projectsData, projects: projectsData.projects.filter((_, i) => i !== index) });
  };

  if (loading) return <div className="container py-5">Loading...</div>;

  return (
    <div className="container-fluid px-3 px-lg-4 py-4">
      <div className="page-heading mb-4">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-folder-check" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">User Panel</p>
            <h1 className="h3 mb-1">Completed Projects</h1>
          </div>
        </div>
        <div className="heading-actions">
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
      {message && <div className={`alert ${message.includes('saved') ? 'alert-success' : 'alert-danger'}`}>{message}</div>}

      <section className="panel mb-4">
        <div className="panel-header">
          <h2 className="h5 mb-0">Header</h2>
        </div>
        <div className="panel-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Label</label>
              <input
                type="text"
                className="form-control"
                value={projectsData.label}
                onChange={(e) => handleChange('label', e.target.value)}
              />
            </div>
            <div className="col-md-8">
              <label className="form-label">Title</label>
              <input
                type="text"
                className="form-control"
                value={projectsData.title}
                onChange={(e) => handleChange('title', e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2 className="h5 mb-0">Projects</h2>
          <button className="btn btn-outline-primary btn-sm" onClick={addProject}>
            <i className="bi bi-plus"></i> Add Project
          </button>
        </div>
        <div className="panel-body">
          {projectsData.projects.map((project, index) => (
            <div key={index} className="mb-4 p-3 border rounded">
              <div className="d-flex justify-content-between mb-2">
                <span className="fw-semibold">Project {index + 1}</span>
                <button className="btn btn-sm btn-danger" onClick={() => removeProject(index)}>
                  <i className="bi bi-trash"></i>
                </button>
              </div>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">Project Image</label>
                  {project.image && <img src={project.image} alt={project.title} className="img-fluid mb-2" style={{ maxHeight: '150px' }} />}
                  <input 
                    type="file" 
                    className="form-control" 
                    accept="image/*" 
                    onChange={(e) => handleImageUpload(e, index)}
                    disabled={uploading}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Title</label>
                  <input
                    type="text"
                    className="form-control"
                    value={project.title}
                    onChange={(e) => handleProjectChange(index, 'title', e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Subtitle</label>
                  <input
                    type="text"
                    className="form-control"
                    value={project.subtitle}
                    onChange={(e) => handleProjectChange(index, 'subtitle', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
