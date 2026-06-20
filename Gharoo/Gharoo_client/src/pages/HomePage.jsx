import React, { useState, useEffect } from 'react'
import Header from '../components/Header'
import Hero from '../components/Hero'
import NewSection from '../components/NewSection'
import AboutSection from '../components/AboutSection'
import WhyChooseUs from '../components/WhyChooseUs'
import ServiceSlider from '../components/ServiceSlider'
import StatsSection from '../components/StatsSection'
import Services from '../components/Services'
import Pricing from '../components/Pricing'
import Testimonials from '../components/Testimonials'
import Contact from '../components/Contact'
import CompletedProjects from '../components/CompletedProjects'
import BrandMarquee from '../components/BrandMarquee'
import Footer from '../components/Footer'

export default function HomePage({ settings, loading }) {
  if (loading) {
    return <div className="d-flex justify-content-center align-items-center vh-100">Loading...</div>
  }

  return (
    <div className="page">
      <Header settings={settings} />
      <Hero settings={settings} />
      <BrandMarquee settings={settings} />
      <NewSection settings={settings} />
      <AboutSection settings={settings} />
      <WhyChooseUs settings={settings} />
      <CompletedProjects settings={settings} />
      <ServiceSlider settings={settings} />
      <StatsSection settings={settings} />
      <Services settings={settings} />
      <Pricing settings={settings} />
      <Testimonials settings={settings} />
      <Contact settings={settings} />
      <Footer settings={settings} />
    </div>
  )
}
