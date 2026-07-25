import React from 'react'
import { useNavigate } from 'react-router-dom'
import './Hero.css'
import acAmcBanner from '../assets/ac-amc-plan-banner.jpeg'

const acAmcPlan = {
  name: 'Premium Care',
  price: '₹1499',
  features: ['Split AC 3 services', 'Jet service', '24x7 AC call support']
}

export default function Hero() {
  const navigate = useNavigate()

  function openAcPlanBooking() {
    localStorage.setItem('selectedPlan', JSON.stringify(acAmcPlan))
    navigate('/booking')
  }

  return (
    <section className="hero" aria-label="Gharoo Care AMC Plan">
      <button
        type="button"
        className="hero-banner-button"
        onClick={openAcPlanBooking}
        aria-label="Book Gharoo Care complete AC care plan for 1499"
      >
        <img
          src={acAmcBanner}
          alt="Gharoo Care complete AC care AMC plan for 1 year at 1499"
          className="hero-banner-image"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
      </button>
    </section>
  )
}
