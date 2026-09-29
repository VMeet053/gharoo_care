import React from 'react'
import { useInView } from '../hooks/useInView'

export default function Reveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  as: Tag = 'div'
}) {
  const [ref, inView] = useInView({ once: true, threshold: 0.12 })

  return (
    <Tag
      ref={ref}
      className={`aos ${direction} ${inView ? 'aos-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  )
}
