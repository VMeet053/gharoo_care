import React from 'react'
import { useNavigate } from 'react-router-dom'
import './Hero.css'

const DEFAULT_HERO_SECTION = {
  backgroundImage: '',
  eyebrow: 'Gharoo Care',
  title: 'AC Service & AMC Plans',
  subtitle: 'Doorstep service • 24/7 support',
  floatingPlanCards: [
    { image: '', price: '₹1249', planName: 'AC AMC Plan - Basic', redirectUrl: '/booking', altText: 'AC AMC Basic plan ₹1249' },
    { image: '', price: '₹499', planName: 'AC One Time Service', redirectUrl: '/booking', altText: 'AC One Time Service ₹499' }
  ]
}

export default function Hero({ settings }) {
  const navigate = useNavigate()

  const hs = settings?.heroSection || DEFAULT_HERO_SECTION
  const backgroundImage = hs?.backgroundImage || ''
  const eyebrow = hs?.eyebrow || DEFAULT_HERO_SECTION.eyebrow
  const title = hs?.title || DEFAULT_HERO_SECTION.title
  const subtitle = hs?.subtitle || DEFAULT_HERO_SECTION.subtitle
  const cards = (hs?.floatingPlanCards && hs.floatingPlanCards.length)
    ? hs.floatingPlanCards
    : DEFAULT_HERO_SECTION.floatingPlanCards

  function handleCardClick(card) {
    const redirectUrl = card.redirectUrl || '/booking'
    if (redirectUrl.startsWith('http://') || redirectUrl.startsWith('https://')) {
      window.open(redirectUrl, '_blank', 'noopener,noreferrer')
      return
    }
    if (card.planName || card.price) {
      try {
        localStorage.setItem('selectedPlan', JSON.stringify({
          name: card.planName || 'AC Service Plan',
          price: card.price || ''
        }))
      } catch (_) {
        // ignore
      }
    }
    navigate(redirectUrl)
  }

  return (
    <section className="hero-v2" aria-label="Gharoo Care Hero">
      <div
        className="hero-v2-bg"
        style={backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : undefined}
      />
      <div className="hero-v2-overlay" />

      <div className="hero-v2-inner">
        <header className="hero-v2-copy">
          {eyebrow && <span className="hero-v2-eyebrow">{eyebrow}</span>}
          {title && <h1 className="hero-v2-title">{title}</h1>}
          {subtitle && <p className="hero-v2-subtitle">{subtitle}</p>}
        </header>

        <div className={`hero-v2-cards hero-v2-cards-${cards.length}`}>
          {cards.map((card, idx) => {
            const hasImage = !!card.image
            const price = card.price || ''
            const planName = card.planName || ''
            const altText = card.altText || planName || `Plan ${idx + 1}`

            return (
              <button
                key={idx}
                type="button"
                className={`hero-v2-card ${hasImage ? 'has-image' : 'no-image'}`}
                onClick={() => handleCardClick(card)}
                aria-label={altText}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleCardClick(card)
                  }
                }}
              >
                <div className="hero-v2-card-inner">
                  {hasImage ? (
                    <div className="hero-v2-card-media">
                      <img
                        src={card.image}
                        alt={altText}
                        className="hero-v2-card-img"
                        loading="eager"
                        decoding="async"
                        fetchPriority={idx === 0 ? 'high' : 'auto'}
                      />
                      {price && <span className="hero-v2-card-price-overlay">{price}</span>}
                    </div>
                  ) : (
                    <div className="hero-v2-card-placeholder">
                      {price && <span className="hero-v2-card-price-placeholder">{price}</span>}
                      <span className="hero-v2-card-placeholder-label">
                        {planName || `Plan ${idx + 1}`}
                      </span>
                      <span className="hero-v2-card-placeholder-hint">Upload plan image in Admin → Hero Section</span>
                    </div>
                  )}
                  {(price || planName) && (
                    <div className="hero-v2-card-meta">
                      {price && <span className="hero-v2-card-price">{price}</span>}
                      {planName && <span className="hero-v2-card-name">{planName}</span>}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
