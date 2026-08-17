import React from 'react'
import './StatsSection.css'
import Reveal from './Reveal'
import { useInView } from '../hooks/useInView'
import { useCountUp, formatStat } from '../hooks/useCountUp'

const defaultStats = [
  { icon: '🛠️', value: '1250', format: 'k', label: 'Successful Projects' },
  { icon: '👷', value: '500', format: 'plus', label: 'Experts Staffs' },
  { icon: '😊', value: '1330', format: 'k', label: 'Happy Customers' },
  { icon: '🏆', value: '100', format: 'percent', label: 'Quality Products' }
]

function StatCard({ item, delay }) {
  const [ref, inView] = useInView({ once: true, threshold: 0.3 })
  const targetValue = parseInt(item.value, 10) || 0
  const count = useCountUp(targetValue, inView, 2200)

  return (
    <Reveal delay={delay} direction="up">
      <div ref={ref} className="stat-card">
        <div className="stat-icon">{item.icon}</div>
        <div>
          <div className="stat-value">{formatStat(count, item.format)}</div>
          <div className="stat-label">{item.label}</div>
        </div>
      </div>
    </Reveal>
  )
}

export default function StatsSection({ settings }) {
  const stats = settings?.stats?.items || defaultStats

  return (
    <section className="stats-section">
      <div className="stats-bg-pattern" />
      <div className="container stats-grid">
        {stats.map((item, i) => (
          <StatCard key={item.label} item={item} delay={i * 120} />
        ))}
      </div>
    </section>
  )
}
