import React from 'react'
import Header from '../components/Header'
import CompletedProjects from '../components/CompletedProjects'
import Footer from '../components/Footer'

export default function ProjectsPage({ settings }) {
  return (
    <div className="page">
      <Header settings={settings} />
      <section style={{ padding: '100px 0', background: '#f9fafb' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h1 style={{ fontSize: '2.5rem', color: '#111827', marginBottom: '16px' }}>Our Projects</h1>
            <p style={{ fontSize: '1.1rem', color: '#6b7280', maxWidth: '600px', margin: '0 auto' }}>
              Check out the electronics repair projects we've completed at Gharoo Care
            </p>
          </div>
        </div>
      </section>
      <CompletedProjects settings={settings} />
      <Footer settings={settings} />
    </div>
  )
}
