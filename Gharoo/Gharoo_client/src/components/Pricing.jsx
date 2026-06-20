import React from 'react'
import { useNavigate } from 'react-router-dom'
import './Pricing.css'
import { IconCheck } from './Icons'
import Reveal from './Reveal'

export default function Pricing({ settings }) {
  const navigate = useNavigate()
  const pricingData = settings?.pricing || {}
  const plans = pricingData?.plans || []
  const header = pricingData?.header || {}

  return (
    <section className="pricing">
      <div className="container">
        <Reveal direction="up">
          <div className="pricing-header">
            <div className="section-label">{header.label || 'PRICING PLANS'}</div>
            <h2>{header.title || 'Affordable Repair Packages'}</h2>
            <p>{header.description || 'Transparent pricing with no hidden fees — choose the plan that fits your needs.'}</p>
          </div>
        </Reveal>
        <div className="pricing-grid stagger-children">
          {plans.map((plan, i) => (
            <Reveal key={i} delay={i * 120} direction="up">
              <div className={`plan-card ${plan.popular ? 'featured' : ''}`}>
                {plan.popular && <div className="plan-badge">Most Popular</div>}
                <h4>{plan.name}</h4>
                <div className="plan-price">
                  <span className="price">{plan.price}</span>
                </div>
                <ul className="plan-features">
                  {plan.features?.map((f, j) => (
                    <li key={j}><IconCheck size={16} /> {f}</li>
                  ))}
                </ul>
                <button onClick={() => navigate('/booking')} className="btn plan-btn">Get Started</button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
