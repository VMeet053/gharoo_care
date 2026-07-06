import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './Hero.css'
import { IconCheck } from './Icons'
import { heroSlides as defaultHeroImages } from '../constants/images'

const fallbackHeroPlans = [
  {
    name: 'Basic Care',
    price: '₹499',
    features: ['Quick diagnosis', 'Pickup support', 'Service updates']
  },
  {
    name: 'Standard Care',
    price: '₹999',
    popular: true,
    features: ['Priority repair', 'Warranty support', 'Free pickup']
  },
  {
    name: 'Premium Care',
    price: '₹1499',
    features: ['Express repair', 'Extended support', 'Doorstep service']
  }
]

const defaultSlides = [
  {
    id: 1,
    eyebrow: 'Find The Best Support You Need Today.',
    titleTop: 'Current Solutions For',
    titleHighlight: 'Your Modern Problems',
    text: 'We provide expert repair services for all your electronic devices with fast turnaround and warranty-backed quality.',
    bg: defaultHeroImages[0].bg,
    side: defaultHeroImages[0].side
  },
  {
    id: 2,
    eyebrow: 'Fast & Reliable Service',
    titleTop: 'Repairing Devices',
    titleHighlight: 'With Expert Care',
    text: 'Quick turnarounds and warranty-backed repairs for phones, laptops and appliances by certified technicians.',
    bg: defaultHeroImages[1].bg,
    side: defaultHeroImages[1].side
  },
  {
    id: 3,
    eyebrow: 'Convenient Pickup & Delivery',
    titleTop: 'Doorstep Service',
    titleHighlight: 'For Your Convenience',
    text: 'Schedule a pickup and we will return your device fully tested and working — hassle-free service at your door.',
    bg: defaultHeroImages[2].bg,
    side: defaultHeroImages[2].side
  }
]

export default function Hero({ settings }) {
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)
  const [animKey, setAnimKey] = useState(0)
  const intervalRef = useRef(null)

  // Use slides from settings if available, else default
  const slides = settings?.hero?.slides?.length > 0 
    ? settings.hero.slides.map((slide, i) => ({ 
        ...slide, 
        id: i + 1,
        bg: slide.bg || defaultHeroImages[i % defaultHeroImages.length].bg,
        side: slide.side || defaultHeroImages[i % defaultHeroImages.length].side
      }))
    : defaultSlides

  useEffect(() => {
    startAuto()
    return stopAuto
  }, [index, slides.length])

  useEffect(() => {
    const next = slides[(index + 1) % slides.length]
    ;[slides[index]?.bg, slides[index]?.side, next?.bg].filter(Boolean).forEach(src => {
      const img = new Image()
      img.src = src
    })
  }, [index, slides])

  function startAuto() {
    stopAuto()
    intervalRef.current = setInterval(() => {
      setIndex(i => {
        const next = (i + 1) % slides.length
        setAnimKey(k => k + 1)
        return next
      })
    }, 5500)
  }

  function stopAuto() {
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  function goTo(i) {
    setIndex(i)
    setAnimKey(k => k + 1)
    startAuto()
  }

  const s = slides[index]
  const heroPlans = (settings?.pricing?.plans?.length ? settings.pricing.plans : fallbackHeroPlans).slice(0, 3)

  function selectPlan(plan) {
    localStorage.setItem('selectedPlan', JSON.stringify({ name: plan.name, price: plan.price }))
    navigate('/booking')
  }

  return (
    <section className="hero" onMouseEnter={stopAuto} onMouseLeave={startAuto}>
      <div className="hero-blob blob blob-green" />
      <div className="slides">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className={`slide ${i === index ? 'active' : ''}`}
          >
            <div
              className="hero-bg-inner"
              style={{ backgroundImage: i === index ? `url(${slide.bg})` : undefined }}
            />
            <div className="slide-overlay" />
          </div>
        ))}
        <div className="container hero-inner">
          <div className="hero-copy" key={animKey}>
            <div className="eyebrow hero-anim">{s.eyebrow}</div>
            <h1 className="hero-title hero-anim hero-anim-1">
              <span className="muted">{s.titleTop}</span>
              <span className="highlight">{s.titleHighlight}</span>
            </h1>
            <div className="hero-plans-strip hero-anim hero-anim-3">
              {heroPlans.map((plan, planIndex) => (
                <article
                  className={`hero-mini-plan ${plan.popular ? 'featured' : ''}`}
                  key={`${plan.name}-${planIndex}`}
                >
                  {plan.popular && <span className="hero-mini-badge">Popular</span>}
                  <div className="hero-mini-plan-top">
                    <h4>{plan.name}</h4>
                    <div className="hero-mini-price">{plan.price}</div>
                  </div>
                  <ul>
                    {(plan.features || []).slice(0, 3).map((feature, featureIndex) => (
                      <li key={featureIndex}>
                        <IconCheck size={14} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => selectPlan(plan)} className="btn primary hero-mini-btn">
                    Get Started
                  </button>
                </article>
              ))}
            </div>
          </div>
          <div className="hero-media" key={`img-${animKey}`}>
            <div className="hero-image-card floating-card">
              <img src={s.side} alt="Repair service" className="hero-side-img" loading="eager" decoding="async" fetchpriority="high" />
              <div className="hero-image-badge">
                <span className="badge-dot" />
                Expert Technicians
              </div>
            </div>
            <div className="hero-plan-card">
              <div className={`plan-card ${s.popular ? 'featured' : ''}`}>
                {s.popular && <div className="plan-badge">Most Popular</div>}
                <div className="hero-plan-header">
                  <h4>{s.planName || 'Premium Repair Plan'}</h4>
                  <div className="plan-price">
                    <span className="price">{s.planPrice || '₹999'}</span>
                  </div>
                </div>
                <ul className="plan-features">
                  {(s.planFeatures || ['Fast repair', 'Warranty support', 'Free pickup']).slice(0, 3).map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
                <button onClick={() => navigate('/booking')} className="btn primary hero-plan-btn">
                  Get Started
                </button>
              </div>
            </div>
            <div className="hero-float-card hero-float-1">
              <img src={slides[(index + 1) % slides.length].side} alt="" loading="lazy" decoding="async" />
            </div>
            <div className="hero-float-card hero-float-2">
              <span>✓</span> 24/7 Support
            </div>
          </div>
        </div>
      </div>
      <div className="slide-dots container">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`dot ${i === index ? 'active' : ''}`}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  )
}
