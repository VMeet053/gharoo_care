import React from 'react'
import Header from '../components/Header'
import Services from '../components/Services'
import ServiceSlider from '../components/ServiceSlider'
import Footer from '../components/Footer'

export default function ServicesPage({ settings }) {
  return (
    <div className="page">
      <Header settings={settings} />
      <section style={{ padding: '100px 0', background: '#f9fafb' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h1 style={{ fontSize: '2.5rem', color: '#111827', marginBottom: '16px' }}>Our Services</h1>
            <p style={{ fontSize: '1.1rem', color: '#6b7280', maxWidth: '600px', margin: '0 auto' }}>
              Explore all the electronics repair services we offer at Gharoo Care
            </p>
          </div>
        </div>
      </section>
      <ServiceSlider settings={settings} />
      <Services settings={settings} />
      <Footer settings={settings} />
    </div>
  )
}
