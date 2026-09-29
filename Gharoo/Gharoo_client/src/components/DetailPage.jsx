import React from 'react'
import { useNavigate } from 'react-router-dom'
import { findItemBySlug, slugify } from '../utils/slug'
import { IconArrow, IconCheck } from './Icons'
import Header from './Header'
import Footer from './Footer'
import WhatsAppFloating from './WhatsAppFloating'
import './DetailPage.css'

const TYPE_META = {
  service: {
    eyebrow: 'SERVICE',
    homeLabel: '← Back to Home',
    listLabel: 'All Services',
    ctaText: 'Book This Service',
    listPath: '/services',
    titleFallback: 'Service Not Found',
    descFallback: 'The service you are looking for is not available at this time.',
    extract: (settings) => settings?.services?.items || []
  },
  feature: {
    eyebrow: 'OUR FEATURE',
    homeLabel: '← Back to Home',
    listLabel: 'All Features',
    ctaText: 'Know More',
    listPath: '/about',
    titleFallback: 'Feature Not Found',
    descFallback: 'The feature you are looking for is not available at this time.',
    extract: (settings) => settings?.newSection?.features || []
  },
  why: {
    eyebrow: 'WHY CHOOSE US',
    homeLabel: '← Back to Home',
    listLabel: 'All Reasons',
    ctaText: 'Get in Touch',
    listPath: '/about',
    titleFallback: 'Reason Not Found',
    descFallback: 'The page you are looking for is not available at this time.',
    extract: (settings) => settings?.whyChoose?.cards || []
  },
  project: {
    eyebrow: 'PROJECT',
    homeLabel: '← Back to Home',
    listLabel: 'All Projects',
    ctaText: 'Discuss Similar Project',
    listPath: '/projects',
    titleFallback: 'Project Not Found',
    descFallback: 'The project you are looking for is not available at this time.',
    extract: (settings) => settings?.completedProjects?.projects || []
  },
  slider: {
    eyebrow: 'SERVICE',
    homeLabel: '← Back to Home',
    listLabel: 'All Services',
    ctaText: 'Book This Service',
    listPath: '/services',
    titleFallback: 'Service Not Found',
    descFallback: 'The service you are looking for is not available at this time.',
    extract: (settings) => settings?.serviceSlider?.services || []
  }
}

export default function DetailPage({ settings, type, slug }) {
  const navigate = useNavigate()
  const meta = TYPE_META[type] || TYPE_META.service
  const items = meta.extract(settings)
  const found = findItemBySlug(items, slug, type === 'project' ? 'title' : 'title')
  const item = found?.item
  const index = found?.index ?? -1

  const title = item?.title || meta.titleFallback
  const shortDesc = item?.desc || item?.description || item?.subtitle || meta.descFallback
  const icon = item?.icon
  const heroImage = item?.detailImage || item?.image || ''
  const body = item?.detailContent || ''
  const keyPoints = Array.isArray(item?.keyPoints) ? item.keyPoints.filter(Boolean) : []
  const price = item?.price || ''
  const duration = item?.duration || ''
  const clientName = item?.clientName || ''
  const completedDate = item?.completedDate || ''
  const projectLocation = item?.location || ''

  const hasMetaRow = price || duration || clientName || completedDate || projectLocation

  const handleCta = () => {
    if (item?.link) {
      if (/^https?:\/\//i.test(item.link)) {
        window.open(item.link, '_blank', 'noopener,noreferrer')
        return
      }
      navigate(item.link.startsWith('/') ? item.link : `/${item.link}`)
      return
    }
    if (type === 'project' || type === 'why' || type === 'feature') {
      navigate('/contact')
      return
    }
    try {
      localStorage.setItem('selectedService', JSON.stringify({
        id: `dp_${type}_${title}`,
        name: title,
        price: Number(price) || 0
      }))
    } catch (_) {}
    navigate('/booking')
  }

  return (
    <div className="page">
      <Header settings={settings} />
      <main className="detail-page">
        <div className="detail-page-breadcrumbs container">
          <button
            type="button"
            className="crumb-link"
            onClick={() => navigate('/')}
          >
            {meta.homeLabel}
          </button>
          <span className="crumb-sep">/</span>
          <button
            type="button"
            className="crumb-link"
            onClick={() => navigate(meta.listPath)}
          >
            {meta.listLabel}
          </button>
          <span className="crumb-sep">/</span>
          <span className="crumb-current">{title}</span>
        </div>

        <section className="detail-hero container">
          <div className="detail-hero-grid">
            <div className="detail-hero-copy">
              <span className="eyebrow accent">{meta.eyebrow}</span>
              <h1 className="detail-title">
                {icon && <span className="detail-title-icon" aria-hidden="true">{icon}</span>}
                {title}
              </h1>
              <p className="detail-short">{shortDesc}</p>

              {hasMetaRow && (
                <dl className="detail-meta-row">
                  {price && (
                    <div className="meta-pill">
                      <dt>Starting Price</dt>
                      <dd className="meta-price">{price}</dd>
                    </div>
                  )}
                  {duration && (
                    <div className="meta-pill">
                      <dt>Duration</dt>
                      <dd>{duration}</dd>
                    </div>
                  )}
                  {clientName && (
                    <div className="meta-pill">
                      <dt>Client</dt>
                      <dd>{clientName}</dd>
                    </div>
                  )}
                  {completedDate && (
                    <div className="meta-pill">
                      <dt>Completed</dt>
                      <dd>{completedDate}</dd>
                    </div>
                  )}
                  {projectLocation && (
                    <div className="meta-pill">
                      <dt>Location</dt>
                      <dd>{projectLocation}</dd>
                    </div>
                  )}
                </dl>
              )}

              <div className="detail-cta-row">
                <button className="btn primary btn-shine" onClick={handleCta}>
                  {meta.ctaText} <IconArrow size={16} color="white" />
                </button>
                <button className="btn outline" onClick={() => navigate(meta.listPath)}>
                  View All
                </button>
              </div>
            </div>

            <div className="detail-hero-media">
              {heroImage ? (
                <div className="detail-hero-image-wrap">
                  <img src={heroImage} alt={title} className="detail-hero-image" loading="eager" decoding="async" fetchPriority="high" />
                </div>
              ) : (
                <div className="detail-hero-placeholder">
                  <span className="detail-placeholder-eyebrow">{meta.eyebrow}</span>
                  <span className="detail-placeholder-icon">{icon || '📌'}</span>
                  <span className="detail-placeholder-label">Upload hero image from Admin</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {(body || keyPoints.length) && (
          <section className="detail-content container">
            <div className="detail-content-grid">
              <div className="detail-body prose">
                {!body && keyPoints.length === 0 && (
                  <p className="detail-body-empty">
                    Admin ma jaai ne aa {meta.eyebrow.toLowerCase()} mate <strong>Detail Content</strong> lakhso to ahiya show thase.
                  </p>
                )}
                {body && (
                  <div className="detail-body-text" dangerouslySetInnerHTML={{
                    __html: String(body)
                      .replace(/\n{3,}/g, '\n\n')
                      .split('\n\n')
                      .map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
                      .join('')
                  }} />
                )}
              </div>

              {keyPoints.length > 0 && (
                <aside className="detail-keypoints">
                  <h3>Key Highlights</h3>
                  <ul>
                    {keyPoints.map((pt, i) => (
                      <li key={i}><IconCheck size={18} /> <span>{pt}</span></li>
                    ))}
                  </ul>
                  <button className="btn primary block" onClick={handleCta}>
                    {meta.ctaText}
                  </button>
                </aside>
              )}
            </div>
          </section>
        )}

        {items.length > 1 && (
          <section className="detail-related container">
            <div className="detail-related-head">
              <h2>More {meta.eyebrow.charAt(0) + meta.eyebrow.slice(1).toLowerCase()}s</h2>
              <button className="btn outline btn-sm" onClick={() => navigate(meta.listPath)}>
                View All <IconArrow size={14} />
              </button>
            </div>
            <div className="detail-related-grid">
              {items
                .filter((_, i) => i !== index)
                .slice(0, 3)
                .map((other, i) => {
                  const otherTitle = other.title || 'Untitled'
                  const otherImage = other.detailImage || other.image || ''
                  const otherDesc = other.desc || other.description || other.subtitle || ''
                  const otherSlug = findItemBySlug(items, otherTitle)
                    ? encodeURIComponent(slugify(otherTitle))
                    : encodeURIComponent(String(items.indexOf(other) + 1))
                  return (
                    <article key={i} className="detail-related-card">
                      <button
                        type="button"
                        className="detail-related-card-btn"
                        onClick={() => navigate(`/${type}/${otherSlug}`)}
                      >
                        {otherImage ? (
                          <img src={otherImage} alt={otherTitle} loading="lazy" decoding="async" />
                        ) : (
                          <div className="detail-related-placeholder">{other.icon || '📌'}</div>
                        )}
                        <div className="detail-related-copy">
                          <h4>{otherTitle}</h4>
                          <p>{otherDesc}</p>
                          <span className="chip-link">Read more <IconArrow size={12} /></span>
                        </div>
                      </button>
                    </article>
                  )
                })}
            </div>
          </section>
        )}
      </main>
      <Footer settings={settings} />
      <WhatsAppFloating settings={settings} />
    </div>
  )
}
