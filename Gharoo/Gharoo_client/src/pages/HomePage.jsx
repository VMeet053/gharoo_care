import React, { useState, useEffect } from 'react'
import Header from '../components/Header'
import Hero from '../components/Hero'
import NewSection from '../components/NewSection'
import AboutSection from '../components/AboutSection'
import WhyChooseUs from '../components/WhyChooseUs'
import ServiceSlider from '../components/ServiceSlider'
import StatsSection from '../components/StatsSection'
import Services from '../components/Services'
import Testimonials from '../components/Testimonials'
import Contact from '../components/Contact'
import CompletedProjects from '../components/CompletedProjects'
import BrandMarquee from '../components/BrandMarquee'
import Footer from '../components/Footer'
import WhatsAppFloating from '../components/WhatsAppFloating'
import PageLoader from '../components/PageLoader'
import '../styles/home.css'

export default function HomePage({ settings, loading }) {
  if (loading) {
    return <PageLoader label="Preparing your repair service" />
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
      <Testimonials settings={settings} />
      <Contact settings={settings} />
      <Footer settings={settings} />
      <WhatsAppFloating settings={settings} />
    </div>
  )
}
