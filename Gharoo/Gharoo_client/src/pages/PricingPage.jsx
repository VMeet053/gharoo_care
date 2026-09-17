import React from 'react'
import Header from '../components/Header'
import Pricing from '../components/Pricing'
import Footer from '../components/Footer'

export default function PricingPage({ settings }) {
  return (
    <div className="page">
      <Header settings={settings} />
      <section style={{ padding: '0px 0', background: '#f9fafb' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            {/* <h1 style={{ fontSize: '2.5rem', color: '#111827', marginBottom: '16px' }}>Our Plans</h1> */}
            {/* <p style={{ fontSize: '1.1rem', color: '#6b7280', maxWidth: '600px', margin: '0 auto' }}>
              Choose the perfect plan for your electronics repair needs at Gharoo Care
            </p> */}
          </div>
        </div>
      </section>
      <Pricing settings={settings} />
      <Footer settings={settings} />
    </div>
  )
}
