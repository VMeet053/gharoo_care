import React from 'react'
import './AboutSection.css'
import { IconCheck, IconPlay, IconArrow } from './Icons'
import Reveal from './Reveal'
import { about as defaultAboutImages } from '../constants/images'

export default function AboutSection({ settings }) {
  const aboutData = settings?.about || {}
  const features = aboutData?.features || []
  
  // Get images with defaults
  const mainImage = aboutData.mainImage || defaultAboutImages.main
  const subImage = aboutData.subImage || defaultAboutImages.sub
  const experience = aboutData.experience || { number: '25+', line1: 'Years Experiences', line2: 'Maintenance Services' }

  return (
    <section className="about-section">
      <div className="container about-grid">
        <Reveal direction="left">
          <div className="about-left">
            <div className="image-collage">
              <div className="collage-main img-zoom-wrap">
                <img src={mainImage} alt="Technician repairing electronics" loading="lazy" decoding="async" />
              </div>
              <div className="collage-sub img-zoom-wrap">
                <img src={subImage} alt="Circuit board repair work" loading="lazy" decoding="async" />
              </div>
              <div className="experience-badge pulse-badge">
                <div className="badge-content">
                  <h3>{experience.number}</h3>
                  <p>{experience.line1}<br />{experience.line2}</p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
        <Reveal direction="right" delay={150}>
          <div className="about-right">
            <div className="eyebrow">{aboutData.eyebrow || 'ABOUT US'}</div>
            <h2 className="section-title">{aboutData.title || 'Welcome To Repair & Installing Company'}</h2>
            <p className="section-desc">
              {aboutData.description || 'We are a trusted electronics repair company offering comprehensive solutions.'}
            </p>
            {features.length > 0 && (
              <div className="about-features">
                {features.map((feature, index) => (
                  <div key={index} className="about-feature-item">
                    <div className="feature-item-icon">{feature.icon}</div>
                    <div className="feature-item-text">
                      <h5>{feature.title}</h5>
                      <p>{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <ul className="about-list">
              <li><IconCheck size={18} /> Monotonically predominate next-generation.</li>
              <li><IconCheck size={18} /> Interactively predominate out-of-the-box best practices.</li>
              <li><IconCheck size={18} /> Skilled Technicians — invest in quality protection for your device.</li>
            </ul>
            <div className="about-actions">
              <button className="btn primary btn-shine">
                Discover More <IconArrow size={16} color="white" />
              </button>
              <div className="video-btn-wrapper">
                <button className="video-play-btn" aria-label="Watch video">
                  <IconPlay size={16} color="white" />
                </button>
                <span>Watch Our Support</span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
