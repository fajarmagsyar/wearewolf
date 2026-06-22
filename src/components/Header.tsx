'use client'

import { t, Locale } from '@/lib/i18n'

interface HeaderProps {
  code: string
  phase: 'day' | 'night'
  dayNumber: number
  isHost: boolean
  locale: Locale
  onLeave?: () => void
}

export function Header({ code, phase, dayNumber, isHost, locale, onLeave }: HeaderProps) {
  const copyCode = () => {
    navigator.clipboard?.writeText(code)
    window.dispatchEvent(new CustomEvent('toast', { detail: { message: t('ui.copied', locale), type: 'ok' } }))
  }

  return (
    <div className="panel flat spread">
      <div role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={copyCode} title={t('ui.tap_to_copy', locale)}>
        <div className="muted" style={{ fontSize: '.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
          {t('ui.room_code', locale)}
        </div>
        <div style={{ fontFamily: 'var(--font)', fontSize: '1.6rem', letterSpacing: '.15em' }}>
          {code}
        </div>
      </div>
      <div className="row" style={{ flex: '0 0 auto', gap: '8px', alignItems: 'center' }}>
        <span className={`tag ${phase === 'night' ? 'blue' : ''}`}>
          {phase === 'night' ? t('ui.night', locale) : t('ui.day', locale)} {dayNumber}
        </span>
        {!isHost && onLeave && (
          <button className="btn sm paper" onClick={onLeave}>
            {t('ui.leave', locale)}
          </button>
        )}
      </div>
    </div>
  )
}
