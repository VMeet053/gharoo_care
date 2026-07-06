import React, { Suspense, lazy, useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './styles.css'
import PageLoader from './components/PageLoader'

const HomePage = lazy(() => import('./pages/HomePage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const ServicesPage = lazy(() => import('./pages/ServicesPage'))
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'))
const PricingPage = lazy(() => import('./pages/PricingPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const UserForm = lazy(() => import('./components/UserForm'))
const PaymentPage = lazy(() => import('./components/PaymentPage'))
const ServiceManRegistration = lazy(() => import('./pages/ServiceManRegistration'))

const SETTINGS_CACHE_KEY = 'gharoo-panel-settings'

export default function App() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchSettings = async (signal) => {
    try {
      const cached = sessionStorage.getItem(SETTINGS_CACHE_KEY)
      if (cached) {
        try {
          setSettings(JSON.parse(cached))
          setLoading(false)
        } catch {
          sessionStorage.removeItem(SETTINGS_CACHE_KEY)
        }
      }

      const res = await fetch('/api/panel-settings', { signal })
      const data = await res.json()
      if (data.success) {
        setSettings(data.data)
        sessionStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(data.data))
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching settings:', err)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    fetchSettings(controller.signal)

    return () => controller.abort()
  }, [])

  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
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
      </Suspense>
    </Router>
  )
}
