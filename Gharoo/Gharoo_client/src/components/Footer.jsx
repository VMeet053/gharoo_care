import React from 'react'
import { Link } from 'react-router-dom'
import './Footer.css'
import { IconPhone, IconMail, IconMapPin } from './Icons'

const defaultFooter = {
  description: 'Professional electronics repair services for phones, laptops, tablets and home appliances. Fast, reliable, and warranty-backed.',
  copyright: '© 2026 Gharoo Care — All rights reserved.',
  socialLinks: [
    { platform: 'Facebook', url: '#' },
    { platform: 'Twitter', url: '#' },
    { platform: 'Instagram', url: '#' },
    { platform: 'LinkedIn', url: '#' }
  ]
}

export default function Footer({ settings }) {
  const footer = settings?.footer || defaultFooter

  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="container footer-grid">
          <div className="footer-brand">
            <Link to="/" className="footer-logo-link">
              <h3 className="footer-logo">
                <img src="/gharoo-logo.png" alt="Gharoo Care Logo" className="footer-logo-img" loading="lazy" decoding="async" />
              </h3>
            </Link>
            <p>{footer.description}</p>
            <div className="footer-socials">
              {footer.socialLinks.map(link => (
                <a key={link.platform} href={link.url} aria-label={link.platform}>
                  {link.platform.charAt(0).toUpperCase()}
                </a>
              ))}
            </div>
          </div>
          <div className="footer-links">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/services">Our Services</Link></li>
              <li><Link to="/projects">Projects</Link></li>
              <li><Link to="/pricing">Pricing</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>
          {/* <div className="footer-links">
            <h4>Our Services</h4>
            <ul>
              <li><Link to="/services">Phone Repair</Link></li>
              <li><Link to="/services">Laptop Repair</Link></li>
              <li><Link to="/services">Tablet Repair</Link></li>
              <li><Link to="/services">Data Recovery</Link></li>
              <li><Link to="/services">Software Install</Link></li>
            </ul>
          </div> */}
          <div className="footer-contact">
            <h4>Contact Info</h4>
            <div className="footer-contact-item">
              <IconPhone size={18} color="#24b57a" />
              <a href="tel:+91 9974389486">+91 9974389486</a>
            </div>
            <div className="footer-contact-item">
              <IconMail size={18} color="#24b57a" />
              <a href="mailto:gharoocare@gmail.com">gharoocare@gmail.com</a>
            </div>
            <div className="footer-contact-item">
              <IconMapPin size={18} color="#24b57a" />
              <span> 244 avadh viceroy sarthana jakat naka surat 395006</span>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <span>{footer.copyright}</span>
          <div className="footer-bottom-links">
            <Link to="/terms-and-conditions">Terms and Conditions</Link>
            <Link to="/refund-policy">Refund Policy</Link>
            <Link to="/privacy-policy">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
