import React from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function RefundPolicyPage({ settings }) {
  return (
    <div className="page">
      <Header settings={settings} />
      <section style={{ padding: '100px 0', background: '#f9fafb' }}>
        <div className="container">
          <h1 style={{ fontSize: '2.5rem', color: '#111827', marginBottom: '40px', textAlign: 'center' }}>
            Refund Policy
          </h1>
          <div style={{ background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color: '#111827', marginBottom: '16px' }}>1. Refund Eligibility</h2>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              Refund requests are reviewed based on the service status, parts used, and the nature of the issue reported
              by the customer.
            </p>

            <h2 style={{ color: '#111827', marginBottom: '16px' }}>2. Completed Services</h2>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              Once a service is completed and delivered, refunds may not be available unless there is a verified service
              fault covered by our warranty terms.
            </p>

            <h2 style={{ color: '#111827', marginBottom: '16px' }}>3. Processing Time</h2>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              Approved refunds are processed to the original payment method or another agreed method within a reasonable
              processing period.
            </p>

            <h2 style={{ color: '#111827', marginBottom: '16px' }}>4. Contact Us</h2>
            <p style={{ color: '#6b7280' }}>
              For refund-related questions, contact us at gharoocare@gmail.com.
            </p>
          </div>
        </div>
      </section>
      <Footer settings={settings} />
    </div>
  )
}
