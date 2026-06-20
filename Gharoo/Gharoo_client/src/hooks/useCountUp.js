import { useEffect, useState } from 'react'

export function useCountUp(target, inView, duration = 2000) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView) return

    let start = 0
    const startTime = performance.now()

    const tick = now => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(start + (target - start) * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }, [target, inView, duration])

  return value
}

export function formatStat(num, type) {
  if (type === 'k') {
    if (num >= 1000) {
      const k = num / 1000
      return `${k.toFixed(2).replace(/\.?0+$/, '')}K`
    }
    return String(num)
  }
  if (type === 'percent') return `${num}%`
  if (type === 'plus') return `${num}+`
  return String(num)
}
