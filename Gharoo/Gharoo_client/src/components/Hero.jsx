import React from 'react'
import { useNavigate } from 'react-router-dom'
import './Hero.css'

export default function Hero({ settings }) {
  const navigate = useNavigate()

  const bannerImage = settings?.heroBanner?.image
  const redirectUrl = settings?.heroBanner?.redirectUrl || '/booking'
  const altText = settings?.heroBanner?.altText || 'Gharoo Care banner'

  if (!bannerImage) {
    return null
  }

  function handleBannerClick() {
    if (redirectUrl.startsWith('http://') || redirectUrl.startsWith('https://')) {
      window.open(redirectUrl, '_blank')
    } else {
      navigate(redirectUrl)
    }
  }

  return (
    <section className="hero" aria-label="Gharoo Care">
      <button
        type="button"
        className="hero-banner-button"
        onClick={handleBannerClick}
        aria-label={altText}
      >
        <img
          src={bannerImage}
          alt={altText}
          className="hero-banner-image"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
      </button>
    </section>
  )
}
