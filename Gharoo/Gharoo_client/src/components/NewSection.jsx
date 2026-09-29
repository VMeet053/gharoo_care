import React from 'react'
import { useNavigate } from 'react-router-dom'
import './NewSection.css'
import { IconWrench, IconClock, IconShield, IconArrow } from './Icons'
import Reveal from './Reveal'
import { slugify } from '../utils/slug'

const defaultFeatures = [
  {
    title: 'Skilled Technicians',
    description: 'Our certified experts handle every repair with precision and care, using industry-standard tools and techniques.',
    icon: 'wrench'
  },
  {
    title: '24/7 Our Service',
    description: 'Round-the-clock support and emergency repair services so your devices are never out of action for long.',
    icon: 'clock'
  },
  {
    title: 'Quality Guarantee',
    description: 'Every repair is backed by our warranty — we stand behind our work with transparent pricing and honest service.',
    icon: 'shield'
  }
]

const IconMap = {
  wrench: IconWrench,
  clock: IconClock,
  shield: IconShield
}

export default function NewSection({ settings }) {
  const navigate = useNavigate()
  const features = settings?.newSection?.features?.length > 0 ? settings.newSection.features : defaultFeatures

  const getIcon = (iconKey) => {
    return IconMap[iconKey] || IconWrench
  }

  const handleReadMore = (feature) => {
    const href = feature.link?.trim()
    if (href) {
      if (/^https?:\/\//i.test(href)) {
        window.open(href, '_blank', 'noopener,noreferrer')
      } else {
        navigate(href.startsWith('/') ? href : `/${href}`)
      }
      return
    }
    navigate(`/feature/${encodeURIComponent(slugify(feature.title) || '1')}`)
  }

  return (
    <section className="new-section">
      <div className="container new-section-grid stagger-children">
        {features.map((feature, i) => (
          <Reveal key={feature.title} delay={i * 150} direction="up">
            <div className="feature-card">
              <div className="feature-icon">
                {(() => {
                  const IconComponent = getIcon(feature.icon)
                  return <IconComponent size={28} color="#24b57a" />
                })()}
              </div>
              <div className="feature-copy">
                <h4>{feature.title}</h4>
                <p>{feature.description}</p>
              </div>
              <div className="feature-card-glow" />
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
