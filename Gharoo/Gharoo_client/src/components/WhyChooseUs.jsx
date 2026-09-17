import React from 'react'
import './WhyChooseUs.css'
import { IconPlay } from './Icons'
import Reveal from './Reveal'
import { whyChoose as defaultWhyChooseImages } from '../constants/images'

const defaultWhyChoose = {
  eyebrow: 'WHY CHOOSE US',
  title: 'When You Need Repair We Are Always Here',
  description: 'At our company, we are committed to providing excellent customer service, transparent pricing, and fast, reliable service. We understand the importance of keeping your devices running smoothly.',
  mainImage: '',
  subImage: '',
  cards: [
    { title: 'Warranty Service', desc: 'All repairs come with a comprehensive warranty for your peace of mind.', icon: '📦' },
    { title: 'Customer Service', desc: 'Friendly support team ready to assist you at every step of the process.', icon: '🤝' },
    { title: 'Secured Device', desc: 'Your data and devices are handled with strict security protocols.', icon: '🔒' },
    { title: 'No Virus Threat', desc: 'Thorough malware scans and clean software installs on every device.', icon: '🛡️' }
  ]
}

export default function WhyChooseUs({ settings }) {
  const data = settings?.whyChoose || defaultWhyChoose
  const mainImage = data.mainImage || defaultWhyChooseImages.main
  const subImage = data.subImage || defaultWhyChooseImages.sub

  return (
    <section className="why-choose">
      <div className="why-blob blob blob-blue" />
      <div className="container why-choose-grid">
        <Reveal direction="left">
          <div className="why-copy">
            <div className="eyebrow accent">{data.eyebrow}</div>
            <h2>{data.title}</h2>
            <p className="section-desc">{data.description}</p>
            <div className="choose-cards stagger-children">
              {data.cards.map((item, i) => (
                <Reveal key={item.title} delay={i * 80} direction="up">
                  <div className="choose-card">
                    <div className="choose-icon">{item.icon}</div>
                    <div>
                      <h4>{item.title}</h4>
                      <p>{item.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal direction="right" delay={200}>
          <div className="why-media">
            <div className="why-media-grid">
              <div className="image-panel image-panel-large img-zoom-wrap">
                <img src={mainImage} alt="Repair technician at work" loading="lazy" decoding="async" />
                <div className="play-btn-wrap-media">
                  <span className="play-ring" />
                  <button className="play-overlay" aria-label="Watch video">
                    <IconPlay size={24} color="#24b57a" />
                  </button>
                </div>
              </div>
              <div className="image-panel image-panel-small img-zoom-wrap floating-slow">
                <img src={subImage} alt="Electronics repair close-up" loading="lazy" decoding="async" />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
