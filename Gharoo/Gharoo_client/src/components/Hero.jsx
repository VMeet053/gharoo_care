import React from 'react'
import { useNavigate } from 'react-router-dom'
import './Hero.css'
import acAmcBanner from '../assets/ac-amc-plan-banner.jpeg'

export default function Hero({ settings }) {
  const navigate = useNavigate()

  const bannerImage = settings?.heroBanner?.image || acAmcBanner
  const redirectUrl = settings?.heroBanner?.redirectUrl || '/booking'
  const altText = settings?.heroBanner?.altText || 'Gharoo Care banner'

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
