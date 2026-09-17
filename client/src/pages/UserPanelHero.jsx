import { useState, useEffect } from 'react';

const DEFAULT_HERO_SECTION = {
  backgroundImage: '',
  eyebrow: 'Gharoo Care',
  title: 'AC Service & AMC Plans',
  subtitle: 'Doorstep service • 24/7 support',
  floatingPlanCards: [
    { image: '', price: '₹1249', planName: 'AC AMC Plan - Basic', redirectUrl: '/booking', altText: 'AC AMC Basic plan ₹1249' },
    { image: '', price: '₹499', planName: 'AC One Time Service', redirectUrl: '/booking', altText: 'AC One Time Service ₹499' }
  ]
};

export default function UserPanelHero() {
  const [slides, setSlides] = useState([]);
  const [heroBanner, setHeroBanner] = useState({ image: '', redirectUrl: '/booking', altText: 'Gharoo Care banner' });
  const [heroSection, setHeroSection] = useState(DEFAULT_HERO_SECTION);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState({ index: null, type: null });
  const [bannerUploading, setBannerUploading] = useState(false);
  const [heroBgUploading, setHeroBgUploading] = useState(false);
  const [planCardUploading, setPlanCardUploading] = useState(null);
  const [message, setMessage] = useState('');

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/panel-settings');
      const data = await res.json();
      if (data.success) {
        setSlides(data.data.hero.slides);
        setHeroBanner(data.data.heroBanner || { image: '', redirectUrl: '/booking', altText: 'Gharoo Care banner' });
        const savedHeroSection = data.data.heroSection || DEFAULT_HERO_SECTION;
        const cards = (savedHeroSection.floatingPlanCards && savedHeroSection.floatingPlanCards.length)
          ? savedHeroSection.floatingPlanCards
          : DEFAULT_HERO_SECTION.floatingPlanCards;
        setHeroSection({
          backgroundImage: savedHeroSection.backgroundImage || '',
          eyebrow: savedHeroSection.eyebrow || DEFAULT_HERO_SECTION.eyebrow,
          title: savedHeroSection.title || DEFAULT_HERO_SECTION.title,
          subtitle: savedHeroSection.subtitle || DEFAULT_HERO_SECTION.subtitle,
          floatingPlanCards: cards
        });
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

  const handleBannerImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setBannerUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        setHeroBanner({ ...heroBanner, image: data.url });
        setMessage('Banner image uploaded successfully!');
      }
    } catch (err) {
      console.error(err);
      setMessage('Error uploading image');
    } finally {
      setBannerUploading(false);
    }
  };

  const handleHeroBgUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setHeroBgUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/upload-image', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setHeroSection({ ...heroSection, backgroundImage: data.url });
        setMessage('Hero background image uploaded!');
      }
    } catch (err) {
      console.error(err);
      setMessage('Error uploading background image');
    } finally {
      setHeroBgUploading(false);
    }
  };

  const handlePlanCardImageUpload = async (e, cardIdx) => {
    const file = e.target.files[0];
    if (!file) return;

    setPlanCardUploading(cardIdx);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/upload-image', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        const newCards = [...heroSection.floatingPlanCards];
        newCards[cardIdx] = { ...newCards[cardIdx], image: data.url };
        setHeroSection({ ...heroSection, floatingPlanCards: newCards });
        setMessage(`Plan card ${cardIdx + 1} image uploaded!`);
      }
    } catch (err) {
      console.error(err);
      setMessage('Error uploading plan card image');
    } finally {
      setPlanCardUploading(null);
    }
  };

  const handleImageUpload = async (e, index, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading({ index, type });
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        const newSlides = [...slides];
        newSlides[index][type] = data.url;
        setSlides(newSlides);
        setMessage('Image uploaded successfully!');
      }
    } catch (err) {
      console.error(err);
      setMessage('Error uploading image');
    } finally {
      setUploading({ index: null, type: null });
    }
  };

  const handleChange = (index, field, value) => {
    const newSlides = [...slides];
    newSlides[index][field] = value;
    setSlides(newSlides);
  };

  const handleBannerChange = (field, value) => {
    setHeroBanner({ ...heroBanner, [field]: value });
  };

  const handleHeroSectionChange = (field, value) => {
    setHeroSection({ ...heroSection, [field]: value });
  };

  const handlePlanCardChange = (idx, field, value) => {
    const newCards = [...heroSection.floatingPlanCards];
    newCards[idx] = { ...newCards[idx], [field]: value };
    setHeroSection({ ...heroSection, floatingPlanCards: newCards });
  };

  const addPlanCard = () => {
    if (heroSection.floatingPlanCards.length >= 4) return;
    setHeroSection({
      ...heroSection,
      floatingPlanCards: [
        ...heroSection.floatingPlanCards,
        { image: '', price: '₹0', planName: 'New Plan', redirectUrl: '/booking', altText: 'New plan card' }
      ]
    });
  };

  const removePlanCard = (idx) => {
    if (heroSection.floatingPlanCards.length <= 1) return;
    setHeroSection({
      ...heroSection,
      floatingPlanCards: heroSection.floatingPlanCards.filter((_, i) => i !== idx)
    });
  };

  const addSlide = () => {
    const newSlides = [...slides, {
      eyebrow: 'New Slide',
      titleTop: 'Title',
      titleHighlight: 'Highlight',
      text: 'Description',
      bg: '',
      side: ''
    }];
    setSlides(newSlides);
  };

  const removeSlide = (index) => {
    const newSlides = slides.filter((_, i) => i !== index);
    setSlides(newSlides);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const getRes = await fetch('/api/panel-settings');
      const getResData = await getRes.json();
      if (!getResData.success) throw new Error('Failed to get settings');
      
      const updatedSettings = { ...getResData.data, hero: { slides }, heroBanner, heroSection };
      
      const res = await fetch('/api/panel-settings', {
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

  if (loading) return <div className="container py-5">Loading...</div>;

  return (
    <div className="container-fluid px-3 px-lg-4 py-4">
      <div className="page-heading mb-4">
        <div className="page-heading-copy">
          <span className="page-icon"><i className="bi bi-house-door" aria-hidden="true"></i></span>
          <div>
            <p className="eyebrow mb-1">User Panel</p>
            <h1 className="h3 mb-1">Hero Section</h1>
          </div>
        </div>
        <div className="heading-actions">
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
      {message && <div className={`alert ${message.includes('saved') || message.includes('uploaded') ? 'alert-success' : 'alert-danger'}`}>{message}</div>}

      <section className="panel mb-4">
        <div className="panel-header">
          <h2 className="h5 mb-0">Hero Banner</h2>
        </div>
        <div className="panel-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Banner Image</label>
              {heroBanner.image && <img src={heroBanner.image} alt="Hero Banner" className="img-fluid mb-2" style={{ maxHeight: '200px' }} />}
              <input
                type="file"
                className="form-control"
                accept="image/*"
                onChange={handleBannerImageUpload}
                disabled={bannerUploading}
              />
              {bannerUploading && <small className="text-muted">Uploading...</small>}
            </div>
            <div className="col-md-6">
              <label className="form-label">Redirect URL</label>
              <input
                type="text"
                className="form-control"
                placeholder="/booking or https://example.com"
                value={heroBanner.redirectUrl}
                onChange={(e) => handleBannerChange('redirectUrl', e.target.value)}
              />
              <small className="text-muted d-block mt-1">Internal path (e.g. /booking) or full URL (https://...)</small>
            </div>
            <div className="col-12">
              <label className="form-label">Alt Text</label>
              <input
                type="text"
                className="form-control"
                placeholder="Banner alt text"
                value={heroBanner.altText}
                onChange={(e) => handleBannerChange('altText', e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="panel mb-4">
        <div className="panel-header">
          <h2 className="h5 mb-0">Hero Section (Main Page)</h2>
          <small className="text-muted">Background image + 2/4 floating plan cards in center</small>
        </div>
        <div className="panel-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Eyebrow</label>
              <input
                type="text"
                className="form-control"
                placeholder="Gharoo Care"
                value={heroSection.eyebrow}
                onChange={(e) => handleHeroSectionChange('eyebrow', e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Title</label>
              <input
                type="text"
                className="form-control"
                placeholder="AC Service & AMC Plans"
                value={heroSection.title}
                onChange={(e) => handleHeroSectionChange('title', e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Subtitle</label>
              <input
                type="text"
                className="form-control"
                placeholder="Doorstep service • 24/7 support"
                value={heroSection.subtitle}
                onChange={(e) => handleHeroSectionChange('subtitle', e.target.value)}
              />
            </div>
            <div className="col-12">
              <label className="form-label">Hero Background Image</label>
              {heroSection.backgroundImage && (
                <a href={heroSection.backgroundImage} target="_blank" rel="noopener noreferrer">
                  <img src={heroSection.backgroundImage} alt="Hero bg preview" className="img-fluid mb-2 d-block" style={{ maxHeight: '220px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                </a>
              )}
              <input
                type="file"
                className="form-control"
                accept="image/*"
                onChange={handleHeroBgUpload}
                disabled={heroBgUploading}
              />
              {heroBgUploading && <small className="text-muted">Uploading...</small>}
            </div>
          </div>

          <hr className="my-4" />

          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <h6 className="mb-0">Floating Plan Cards (center)</h6>
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={addPlanCard}
              disabled={heroSection.floatingPlanCards.length >= 4}
            >
              <i className="bi bi-plus" /> Add Card (max 4)
            </button>
          </div>

          <div className="row g-3">
            {heroSection.floatingPlanCards.map((card, idx) => (
              <div className="col-md-6" key={idx}>
                <div className="p-3 border rounded-3 position-relative bg-light">
                  <button
                    type="button"
                    className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2"
                    onClick={() => removePlanCard(idx)}
                    disabled={heroSection.floatingPlanCards.length <= 1}
                    title="Remove card"
                    style={{ zIndex: 2 }}
                  >
                    <i className="bi bi-trash" />
                  </button>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="badge bg-success">Card {idx + 1}</span>
                  </div>
                  {card.image && (
                    <a href={card.image} target="_blank" rel="noopener noreferrer">
                      <img src={card.image} alt={`Plan card ${idx + 1}`} className="img-fluid mb-2 d-block w-100" style={{ maxHeight: '180px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                    </a>
                  )}
                  <div className="mb-2">
                    <label className="form-label">Plan Image</label>
                    <input
                      type="file"
                      className="form-control form-control-sm"
                      accept="image/*"
                      onChange={(e) => handlePlanCardImageUpload(e, idx)}
                      disabled={planCardUploading === idx}
                    />
                    {planCardUploading === idx && <small className="text-muted">Uploading...</small>}
                  </div>
                  <div className="row g-2">
                    <div className="col-md-4">
                      <label className="form-label">Price</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="₹1249"
                        value={card.price}
                        onChange={(e) => handlePlanCardChange(idx, 'price', e.target.value)}
                      />
                    </div>
                    <div className="col-md-8">
                      <label className="form-label">Plan Name</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="AC AMC Plan"
                        value={card.planName}
                        onChange={(e) => handlePlanCardChange(idx, 'planName', e.target.value)}
                      />
                    </div>
                    <div className="col-md-7">
                      <label className="form-label">Redirect URL</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="/booking"
                        value={card.redirectUrl}
                        onChange={(e) => handlePlanCardChange(idx, 'redirectUrl', e.target.value)}
                      />
                    </div>
                    <div className="col-md-5">
                      <label className="form-label">Alt Text</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Image alt text"
                        value={card.altText}
                        onChange={(e) => handlePlanCardChange(idx, 'altText', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2 className="h5 mb-0">Manage Hero Slides</h2>
          <button className="btn btn-outline-primary btn-sm" onClick={addSlide}>
            <i className="bi bi-plus" /> Add Slide
          </button>
        </div>
        <div className="panel-body">
          {slides.map((slide, index) => (
            <div key={index} className="mb-4 p-3 border rounded">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6>Slide {index + 1}</h6>
                <button className="btn btn-sm btn-danger" onClick={() => removeSlide(index)}>
                  <i className="bi bi-trash" />
                </button>
              </div>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Background Image</label>
                  {slide.bg && <img src={slide.bg} alt="Slide background" className="img-fluid mb-2" style={{ maxHeight: '150px' }} />}
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, index, 'bg')}
                    disabled={uploading.index === index && uploading.type === 'bg'}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Side Image</label>
                  {slide.side && <img src={slide.side} alt="Slide side" className="img-fluid mb-2" style={{ maxHeight: '150px' }} />}
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, index, 'side')}
                    disabled={uploading.index === index && uploading.type === 'side'}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Eyebrow</label>
                  <input type="text" className="form-control" value={slide.eyebrow} onChange={(e) => handleChange(index, 'eyebrow', e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Title Top</label>
                  <input type="text" className="form-control" value={slide.titleTop} onChange={(e) => handleChange(index, 'titleTop', e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Title Highlight</label>
                  <input type="text" className="form-control" value={slide.titleHighlight} onChange={(e) => handleChange(index, 'titleHighlight', e.target.value)} />
                </div>
                <div className="col-12">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" rows={3} value={slide.text} onChange={(e) => handleChange(index, 'text', e.target.value)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
