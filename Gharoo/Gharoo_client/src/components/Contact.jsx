import React from 'react'
import './Contact.css'
import { IconPhone, IconMail, IconMapPin } from './Icons'
import Reveal from './Reveal'

export default function Contact({ settings }) {
  const contactData = settings?.contact || {}

  return (
    <section className="contact">
      <div className="container contact-inner">
        <Reveal direction="up">
          <div className="contact-header">
            <div className="section-label">CONTACT US</div>
            <h2>{contactData.title || 'Get In Touch With Our Service Team'}</h2>
            <p>{contactData.description || 'Fast support for device repairs, diagnostics and service estimates.'}</p>
          </div>
        </Reveal>

        <div className="contact-grid">
          <Reveal direction="left" delay={100}>
            <div className="contact-info">
              <p className="contact-note">
                Need immediate assistance? Call or email us directly and we'll respond within hours.
              </p>
              <div className="contact-item">
                <div className="contact-item-icon"><IconPhone size={20} color="#24b57a" /></div>
                <div>
                  <span>Phone</span>
                  <strong>{contactData.phone || '+91 9974389486'}</strong>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-item-icon"><IconMail size={20} color="#24b57a" /></div>
                <div>
                  <span>Email</span>
                  <strong>{contactData.email || 'gharoocare@gmail.com'}</strong>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-item-icon"><IconMapPin size={20} color="#24b57a" /></div>
                <div>
                  <span>Address</span>
                  <strong>{contactData.address || '244 avadh viceroy sarthana jakat naka surat 395006'}</strong>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal direction="right" delay={200}>
            <form className="contact-form" onSubmit={e => e.preventDefault()}>
              <h4>Send Us A Message</h4>
              <div className="form-row">
                <input placeholder="Your First Name" />
                <input placeholder="Your Last Name" />
               
              </div>
              <input placeholder="Your Email" />
              <input placeholder="Phone Number" />
              <textarea placeholder="Full Address" />
              <textarea placeholder="Describe the issue with your device..." />
              <button className="btn primary btn-shine" type="submit">Send Message</button>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
