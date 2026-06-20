import React from 'react'
import './Testimonials.css'
import { IconStar } from './Icons'
import Reveal from './Reveal'
import { testimonials as testimonialAvatars } from '../constants/images'

export default function Testimonials({ settings }) {
  const testimonialsData = settings?.testimonials || {}
  const reviews = testimonialsData?.items || []

  return (
    <section className="testimonials">
      <div className="testimonials-bg" />
      <div className="container">
        <Reveal direction="up">
          <div className="testimonials-header">
            <div className="section-label light">TESTIMONIALS</div>
            <h2>What Our Customers Say</h2>
          </div>
        </Reveal>
        <div className="test-grid stagger-children">
          {reviews.map((r, i) => (
            <Reveal key={i} delay={i * 150} direction="up">
              <div className="test-card">
                <div className="test-stars">
                  {[...Array(r.rating || 5)].map((_, j) => <IconStar key={j} />)}
                </div>
                <p className="test-quote">"{r.text}"</p>
                <div className="test-author">
                  <img src={testimonialAvatars[i % testimonialAvatars.length].avatar} alt={r.name} className="test-avatar" />
                  <div>
                    <strong>{r.name}</strong>
                    <span>{r.role}</span>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
