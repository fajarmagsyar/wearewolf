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
        <div style={{ fontFamily: 'var(--font)', fontSize: '1.6rem', textTransform: 'uppercase', marginBottom: 6 }}>
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
