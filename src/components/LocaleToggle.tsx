'use client'

import { useState, useEffect } from 'react'

export function LocaleToggle() {
  const [locale, setLocale] = useState('en')

  useEffect(() => {
    const stored = document.cookie.split(';').find(c => c.trim().startsWith('locale='))
    if (stored) {
      const val = stored.split('=')[1]?.trim()
      if (val === 'id') setLocale('id')
    }
  }, [])

  const switchLocale = (newLocale: string) => {
    setLocale(newLocale)
    document.cookie = `locale=${newLocale};path=/;max-age=31536000`
    window.dispatchEvent(new CustomEvent('localechange', { detail: { locale: newLocale } }))
  }

  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      <a
        className={`tag ${locale === 'en' ? 'blue' : 'ghost'}`}
        style={{ textDecoration: 'none', cursor: 'pointer' }}
        onClick={() => switchLocale('en')}
      >
        EN
      </a>
      <a
        className={`tag ${locale === 'id' ? 'blue' : 'ghost'}`}
        style={{ textDecoration: 'none', cursor: 'pointer' }}
        onClick={() => switchLocale('id')}
      >
        ID
      </a>
    </div>
  )
}
