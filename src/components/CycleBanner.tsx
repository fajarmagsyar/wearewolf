'use client'

import { useEffect, useRef } from 'react'
import { t, Locale } from '@/lib/i18n'

interface CycleBannerProps {
  phase: 'day' | 'night'
  dayNumber: number
  locale: Locale
}

export function CycleBanner({ phase, dayNumber, locale }: CycleBannerProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    ref.current.classList.add('transition', 'swept')
    const timer = setTimeout(() => {
      ref.current?.classList.remove('transition', 'swept')
    }, 1200)
    return () => clearTimeout(timer)
  }, [phase, dayNumber])

  return (
    <div ref={ref} className={`cycle ${phase}`}>
      <div className="stars" />
      <div className="clouds">
        <span className="cloud c1" />
        <span className="cloud c2" />
        <span className="cloud c3" />
      </div>
      <div className="orb" />
      <div className="sweep" />
      <div className="label">
        {phase === 'night' ? t('ui.night', locale) : t('ui.day', locale)} {dayNumber}
      </div>
    </div>
  )
}
