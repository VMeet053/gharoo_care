import React from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function TermsAndConditionsPage({ settings }) {
  return (
    <div className="page">
      <Header settings={settings} />
      <section style={{ padding: '100px 0', background: '#f9fafb' }}>
        <div className="container">
          <h1 style={{ fontSize: '2.5rem', color: '#111827', marginBottom: '40px', textAlign: 'center' }}>
            Terms and Conditions
          </h1>
          <div style={{ background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color: '#111827', marginBottom: '16px' }}>1. Service Use</h2>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              By booking or using Gharoo Care services, you agree to provide accurate service details and cooperate with
              our team for inspection, repair, and delivery.
            </p>

            <h2 style={{ color: '#111827', marginBottom: '16px' }}>2. Pricing and Payments</h2>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              Service charges, parts costs, and additional work are communicated before confirmation. Payment is required
              as per the agreed service terms.
            </p>

            <h2 style={{ color: '#111827', marginBottom: '16px' }}>3. Warranty</h2>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              Warranty coverage, when applicable, depends on the service or part provided and does not cover misuse,
              accidental damage, liquid damage, or third-party repairs.
            </p>

            <h2 style={{ color: '#111827', marginBottom: '16px' }}>4. Contact Us</h2>
            <p style={{ color: '#6b7280' }}>
              For questions about these terms, contact us at gharoocare@gmail.com.
            </p>
          </div>
        </div>
      </section>
      <Footer settings={settings} />
    </div>
  )
}
