import React from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function PrivacyPage({ settings }) {
  return (
    <div className="page">
      <Header settings={settings} />
      <section style={{ padding: '100px 0', background: '#f9fafb' }}>
        <div className="container">
          <h1 style={{ fontSize: '2.5rem', color: '#111827', marginBottom: '40px', textAlign: 'center' }}>
            Privacy Policy
          </h1>
          <div style={{ background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color: '#111827', marginBottom: '16px' }}>1. Introduction</h2>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              Welcome to Gharoo Care. We respect your privacy and are committed to protecting your personal data.
            </p>

            <h2 style={{ color: '#111827', marginBottom: '16px' }}>2. Information We Collect</h2>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              We may collect personal information including but not limited to your name, email address, phone number,
              and device information when you use our services.
            </p>

            <h2 style={{ color: '#111827', marginBottom: '16px' }}>3. How We Use Your Information</h2>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              We use your information to provide, improve, and communicate about our services.
            </p>

            <h2 style={{ color: '#111827', marginBottom: '16px' }}>4. Contact Us</h2>
            <p style={{ color: '#6b7280' }}>
              If you have any questions about this Privacy Policy, please contact us at gharoocare@gmail.com.
            </p>
          </div>
        </div>
      </section>
      <Footer settings={settings} />
    </div>
  )
}
