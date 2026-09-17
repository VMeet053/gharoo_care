import React from 'react'
import { useNavigate } from 'react-router-dom'
import './Services.css'
import { IconArrow } from './Icons'
import Reveal from './Reveal'
import { services as serviceImages } from '../constants/images'

import { slugify } from '../utils/slug'
export default function Services({ settings }) {
  const navigate = useNavigate()
  const servicesData = settings?.services || {}
  const services = servicesData?.items || []
  const header = servicesData?.header || {}

  const handleLearnMore = (service) => {
    const href = service.link?.trim()
    if (!href) {
      navigate(`/service/${encodeURIComponent(slugify(service.title) || '1')}`)
      return
    }
    if (/^https?:\/\//i.test(href)) {
      window.open(href, '_blank', 'noopener,noreferrer')
    } else {
      navigate(href.startsWith('/') ? href : `/${href}`)
    }
  }

  return (
    <section className="services">
      <div className="services-blob blob blob-green" />
      <div className="container">
        <Reveal direction="up">
          <div className="services-header">
            <div className="section-label">{header.label || 'WHAT WE DO'}</div>
            <h2>{header.title || 'Our Core Repair Services'}</h2>
            <p>{header.description || 'Expert solutions for every device — fast, affordable, and warranty-backed.'}</p>
          </div>
        </Reveal>
        <div className="service-grid stagger-children">
          {services.map((s, i) => (
            <Reveal key={i} delay={i * 120} direction="up">
              <div className="service-card">
                <div className="service-card-img img-zoom-wrap">
                  <img src={s.image || serviceImages[i % serviceImages.length].image} alt={s.title} loading="lazy" decoding="async" />
                  <div className="service-card-overlay">
                    <span>{s.icon}</span>
                  </div>
                </div>
                <div className="service-card-body">
                  <h4>{s.title}</h4>
                  <p>{s.desc}</p>
                  <span className="service-link" onClick={() => handleLearnMore(s)} role="button" tabIndex={0}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleLearnMore(s)}>
                    Learn More <IconArrow size={14} color="#24b57a" />
                  </span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
