import React from 'react'
import './PageLoader.css'

export default function PageLoader({ label = 'Loading Gharoo Care' }) {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <div className="page-loader-card">
        <img src="/gharoo-logo.png" alt="" className="page-loader-logo" loading="eager" decoding="async" fetchpriority="high" />
        <div className="page-loader-ring" aria-hidden="true" />
        <span>{label}</span>
      </div>
    </div>
  )
}
