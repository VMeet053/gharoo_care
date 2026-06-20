import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './Hero.css'
import { IconPlay, IconArrow } from './Icons'
import { heroSlides as defaultHeroImages } from '../constants/images'

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
              style={{ backgroundImage: `url(${slide.bg})` }}
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
            <p className="hero-desc hero-anim hero-anim-2">{s.text}</p>
            <div className="cta-row hero-anim hero-anim-3">
              <button onClick={() => navigate('/booking')} className="btn primary btn-shine">
                Get Started <IconArrow size={16} color="white" />
              </button>
              <div className="play-btn-wrap">
                <span className="play-ring" />
                <span className="play-ring play-ring-2" />
                <button className="btn play-btn" aria-label="Watch video">
                  <IconPlay size={18} color="#24b57a" />
                </button>
              </div>
            </div>
          </div>
          <div className="hero-media" key={`img-${animKey}`}>
            <div className="hero-image-card floating-card">
              <img src={s.side} alt="Repair service" className="hero-side-img" />
              <div className="hero-image-badge">
                <span className="badge-dot" />
                Expert Technicians
              </div>
            </div>
            <div className="hero-float-card hero-float-1">
              <img src={slides[(index + 1) % slides.length].side} alt="" />
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
