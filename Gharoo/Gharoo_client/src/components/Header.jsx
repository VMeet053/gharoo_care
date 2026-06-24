import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Header.css'
import { IconPhone, IconMail, IconMapPin } from './Icons'

const defaultHeader = {
  logo: '/gharoo-logo.png',
  navLinks: [
    { text: 'Home', link: '/' },
    { text: 'About Us', link: '/about' },
    { text: 'Services', link: '/services' },
    { text: 'Projects', link: '/projects' },
    { text: 'Pricing', link: '/pricing' },
    { text: 'Contact', link: '/contact' }
  ]
}

export default function Header({ settings }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const header = {
    ...defaultHeader,
    ...settings?.header,
    logo: '/gharoo-logo.png' // Always use our local logo from public folder
  }
  const navLinks = header.navLinks?.length > 0 ? header.navLinks : defaultHeader.navLinks

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <header className="site-header">
      <div className="topbar">
        <div className="container topbar-inner">
          <div className="top-left">
            <a href="tel:+91 99743 89486" className="top-item top-phone">
              <IconPhone size={14} color="white" />
              <span>+91 99743 89486</span>
            </a>
            <span className="sep hide-mobile">|</span>
            <span className="top-item hide-mobile">
              <IconMail size={14} color="white" />
              <span>gharoocare@gmail.com</span>
            </span>
            <span className="sep hide-tablet">|</span>
            <span className="top-item hide-tablet">
              <IconMapPin size={14} color="white" />
              <span> 244 avadh viceroy sarthana jakat naka surat 395006A</span>
            </span>
          </div>
          <div className="top-right hide-mobile">
            <span>Welcome to Gharoo Care </span>
            {/* <div className="socials">
              <a href="#" className="social-btn" aria-label="Facebook">f</a>
              <a href="#" className="social-btn" aria-label="Twitter">t</a>
              <a href="#" className="social-btn" aria-label="Pinterest">p</a>
            </div> */}
          </div>
        </div>
      </div>
      <div className="container header-inner main-header">
        <div className="brand">
          <Link to="/" onClick={closeMenu}>
            <h1 className="logo">
              <img src="/gharoo-logo.png" alt="Gharoo Care Logo" style={{ height: '60px', display: 'block', objectFit: 'contain' }} />
            </h1>
          </Link>
        </div>

        <nav className={`nav ${menuOpen ? 'nav-open' : ''}`} aria-label="Main navigation">
          {navLinks.map(link => (
            <Link key={link.text} to={link.link} onClick={closeMenu}>{link.text}</Link>
          ))}
          
          <div className="mobile-drawer-actions">
            <a href="/service/login" className="get-quote mobile-action-btn btn-outline-gray" onClick={closeMenu}>
              Service Login
            </a>
            <Link to="/service-man/register" className="get-quote mobile-action-btn btn-light-indigo" onClick={closeMenu}>
              Service Register
            </Link>
            {/* <Link to="/contact" className="get-quote mobile-action-btn" onClick={closeMenu} style={{ border: '1px solid transparent' }}>
              Get A Quote ➜
            </Link> */}
          </div>

          {/* <a href="tel:+91 9974389486" className="mobile-nav-call" onClick={closeMenu}>
            <IconPhone size={18} color="#24b57a" />
            Call +91 9974389486
          </a> */}
        </nav>

        <div className="header-actions">
          <a href="/service/login" className="get-quote btn-outline-gray hide-mobile-sm" onClick={closeMenu}>
            Service Login
          </a>
          <Link to="/service-man/register" className="get-quote btn-light-indigo hide-mobile-sm" onClick={closeMenu}>
            Service Register
          </Link>
          {/* <Link to="/contact" className="get-quote hide-mobile-sm" onClick={closeMenu} style={{ border: '1px solid transparent' }}>Get A Quote ➜</Link> */}
          <a href="tel:+91 9974389486" className="mobile-call-btn hide-desktop" aria-label="Call us">
            <IconPhone size={20} color="white" />
          </a>
          <button
            className={`menu-toggle ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      {menuOpen && <div className="nav-overlay" onClick={closeMenu} aria-hidden="true" />}
    </header>
  )
}
