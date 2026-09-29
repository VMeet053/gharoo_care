import React from 'react'
import Header from '../components/Header'
import Contact from '../components/Contact'
import Footer from '../components/Footer'

export default function ContactPage({ settings }) {
  return (
    <div className="page">
      <Header settings={settings} />
      <section style={{ padding: '100px 0', background: '#f9fafb' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h1 style={{ fontSize: '2.5rem', color: '#111827', marginBottom: '16px' }}>Contact Us</h1>
            <p style={{ fontSize: '1.1rem', color: '#6b7280', maxWidth: '600px', margin: '0 auto' }}>
              Get in touch with Gharoo Care for all your electronics repair needs
            </p>
          </div>
        </div>
      </section>
      <Contact settings={settings} />
      <Footer settings={settings} />
    </div>
  )
}
