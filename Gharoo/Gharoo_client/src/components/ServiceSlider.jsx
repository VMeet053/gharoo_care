import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './ServiceSlider.css'
import Reveal from './Reveal'
import { serviceSlider as sliderImages } from '../constants/images'
import { useBreakpoint } from '../hooks/useBreakpoint'

import { slugify } from '../utils/slug'
const defaultServiceSlider = {
  eyebrow: 'OUR SERVICES',
  title: "Let's Check Our Best Repair Services In City",
  description: 'At our company, we are committed to providing excellent customer service, transparent pricing, and fast, reliable service.',
  services: [
    { title: 'Hardware Update Service', desc: 'Upgrade components and boost performance with certified parts and expert installation.', icon: '⚙️' },
    { title: 'Tablets & iPad Services', desc: 'Screen, battery and software repairs for all tablet brands and models.', icon: '📱' },
    { title: 'Laptop & Desktop Repair', desc: 'Full diagnostics, logic board repair, and component replacement services.', icon: '💻' },
    { title: 'Software Installation', desc: 'OS installs, driver updates, and malware removal by trained technicians.', icon: '💿' },
    { title: 'Data Recovery', desc: 'Recover lost files from damaged drives, phones, and storage devices.', icon: '🛡️' }
  ]
}

const GAP_DESKTOP = 16
const GAP_MOBILE = 0

export default function ServiceSlider({ settings }) {
  const navigate = useNavigate()
  const data = settings?.serviceSlider || defaultServiceSlider
  const services = data.services

  const handleLearnMore = (service) => {
    const href = service.link?.trim()
    if (!href) {
      navigate(`/slider/${encodeURIComponent(slugify(service.title) || '1')}`)
      return
    }
    if (/^https?:\/\//i.test(href)) {
      window.open(href, '_blank', 'noopener,noreferrer')
    } else {
      navigate(href.startsWith('/') ? href : `/${href}`)
    }
  }

  const [current, setCurrent] = useState(0)
  const [translateX, setTranslateX] = useState(0)
  const [cardWidth, setCardWidth] = useState(0)
  const timerRef = useRef(null)
  const viewportRef = useRef(null)
  const { cardsPerView, isMobile } = useBreakpoint()

  const gap = isMobile ? GAP_MOBILE : GAP_DESKTOP
  const maxIndex = Math.max(0, services.length - cardsPerView)

  const measure = useCallback(() => {
    const vp = viewportRef.current
    if (!vp) return
    const vpWidth = vp.offsetWidth
    const cw = (vpWidth - gap * (cardsPerView - 1)) / cardsPerView
    setCardWidth(cw)
    setTranslateX(current * (cw + gap))
  }, [current, cardsPerView, gap])

  useEffect(() => {
    measure()
    window.addEventListener('resize', measure)

    const vp = viewportRef.current
    let observer
    if (vp && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(measure)
      observer.observe(vp)
    }

    return () => {
      window.removeEventListener('resize', measure)
      observer?.disconnect()
    }
  }, [measure])

  useEffect(() => {
    if (current > maxIndex) setCurrent(maxIndex)
  }, [maxIndex, current])

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrent(c => {
        const max = Math.max(0, services.length - cardsPerView)
        return c >= max ? 0 : c + 1
      })
    }, 5000)
    return () => clearInterval(timerRef.current)
  }, [cardsPerView, services.length])

  const resetTimer = () => {
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCurrent(c => {
        const max = Math.max(0, services.length - cardsPerView)
        return c >= max ? 0 : c + 1
      })
    }, 5000)
  }

  const goTo = (i) => {
    setCurrent(Math.min(i, maxIndex))
    resetTimer()
  }

  const handleNext = () => {
    setCurrent(c => (c >= maxIndex ? 0 : c + 1))
    resetTimer()
  }

  const handlePrev = () => {
    setCurrent(c => (c <= 0 ? maxIndex : c - 1))
    resetTimer()
  }

  return (
    <section className="service-slider-section">
      <div className="container slider-inner">
        <Reveal direction="left">
          <div className="slider-left">
            <div className="eyebrow">{data.eyebrow}</div>
            <h2 className="section-title">{data.title}</h2>
            <p className="section-desc">{data.description}</p>
            <div className="slider-nav">
              <button className="nav-btn prev" onClick={handlePrev} aria-label="Previous">←</button>
              <button className="nav-btn next" onClick={handleNext} aria-label="Next">→</button>
            </div>
            <div className="slider-dots-mobile">
              {services.map((_, i) => (
                <button
                  key={i}
                  className={`slider-dot ${i === current ? 'active' : ''}`}
                  onClick={() => goTo(i)}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </Reveal>
        <Reveal direction="right" delay={200}>
          <div className="slider-right">
            <div className="slider-viewport" ref={viewportRef}>
              <div
                className="slider-track"
                style={{
                  transform: `translateX(-${translateX}px)`,
                  gap: `${gap}px`
                }}
              >
                {services.map((s, i) => (
                  <div
                    key={i}
                    className="service-slide-card"
                    style={{ width: cardWidth > 0 ? `${cardWidth}px` : '100%', flexShrink: 0 }}
                  >
                    <div className="slide-card-img img-zoom-wrap">
                      <img src={s.image || sliderImages[i % sliderImages.length].image} alt={s.title} loading="lazy" decoding="async" />
                    </div>
                    <div className="slide-card-icon">{s.icon}</div>
                    <h4>{s.title}</h4>
                    <p>{s.desc}</p>
                    <span className="learn-more" onClick={() => handleLearnMore(s)} role="button" tabIndex={0}
                      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleLearnMore(s)}>
                      Learn More ➜
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
