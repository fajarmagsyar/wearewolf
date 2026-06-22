'use client'

import { useState, useEffect } from 'react'

export function LocalePicker() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const hasLocale = document.cookie.split(';').some(c => c.trim().startsWith('locale='))
    if (!hasLocale) setShow(true)
  }, [])

  const pick = (locale: string) => {
    document.cookie = `locale=${locale};path=/;max-age=31536000`
    window.dispatchEvent(new CustomEvent('localechange', { detail: { locale } }))
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="modal-back">
      <div className="modal" style={{ textAlign: 'center', maxWidth: 340 }}>
        <img src="/favicon.svg" alt="" width={56} height={56} style={{ display: 'block', margin: '0 auto 12px', boxShadow: 'var(--shadow-sm)' }} />
        <div style={{ fontFamily: 'var(--font)', fontSize: '2.2rem', textTransform: 'uppercase', fontWeight: 900, lineHeight: 1, marginBottom: 8 }}>
          WE&rsquo;RE WOLF
        </div>
        <p style={{ marginBottom: 20, color: 'var(--muted)', fontSize: '.95rem' }}>
          Choose your language / Pilih bahasa
        </p>
        <div className="row" style={{ gap: 12 }}>
          <button className="btn block" onClick={() => pick('en')}>
            English
          </button>
          <button className="btn block" onClick={() => pick('id')}>
            Indonesia
          </button>
        </div>
      </div>
    </div>
  )
}
