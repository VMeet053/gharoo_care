import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './styles.css'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import ServicesPage from './pages/ServicesPage'
import ProjectsPage from './pages/ProjectsPage'
import PricingPage from './pages/PricingPage'
import PrivacyPage from './pages/PrivacyPage'
import UserForm from './components/UserForm'
import PaymentPage from './components/PaymentPage'
import ServiceManRegistration from './pages/ServiceManRegistration'

export default function App() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/panel-settings')
      const data = await res.json()
      if (data.success) {
        setSettings(data.data)
      }
    } catch (err) {
      console.error('Error fetching settings:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage settings={settings} loading={loading} />} />
        <Route path="/about" element={<AboutPage settings={settings} />} />
        <Route path="/contact" element={<ContactPage settings={settings} />} />
        <Route path="/services" element={<ServicesPage settings={settings} />} />
        <Route path="/projects" element={<ProjectsPage settings={settings} />} />
        <Route path="/pricing" element={<PricingPage settings={settings} />} />
        <Route path="/privacy" element={<PrivacyPage settings={settings} />} />
        <Route path="/booking" element={<UserForm />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/service-man/register" element={<ServiceManRegistration />} />
      </Routes>
    </Router>
  )
}
