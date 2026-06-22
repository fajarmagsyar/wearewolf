'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { t, Locale } from '@/lib/i18n'

function dispatchToast(message: string, type?: 'ok' | 'err') {
  window.dispatchEvent(new CustomEvent('toast', { detail: { message, type } }))
}

export default function JoinPage() {
  const params = useParams()
  const router = useRouter()
  const code = (params.code as string).toUpperCase()

  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [locale, setLocale] = useState<Locale>('en')

  useEffect(() => {
    const stored = document.cookie.split(';').find(c => c.trim().startsWith('locale='))
    if (stored) {
      const val = stored.split('=')[1]?.trim()
      if (val === 'id') setLocale('id')
    }
    const onLocaleChange = (e: Event) => {
      const loc = (e as CustomEvent).detail?.locale
      if (loc === 'id' || loc === 'en') setLocale(loc)
    }
    window.addEventListener('localechange', onLocaleChange)
    return () => window.removeEventListener('localechange', onLocaleChange)
  }, [])

  const handleJoin = async () => {
    if (!displayName.trim() || displayName.trim().length < 2) {
      dispatchToast(t('ui.enter_name', locale), 'err')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/rooms/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: displayName.trim() }),
        credentials: 'include',
      })
      const json = await res.json()
      if (json.ok) {
        router.push(`/room/${code}`)
      } else {
        dispatchToast(json.error || 'Failed to join room', 'err')
        setLoading(false)
      }
    } catch {
      dispatchToast('Failed to join room', 'err')
      setLoading(false)
    }
  }

  return (
    <div className="panel" style={{ maxWidth: 400, margin: '0 auto' }}>
      <div className="panel-title">
        <span className="bar" style={{ background: 'var(--yellow)' }} />
        <h2>{t('ui.join_room', locale)}</h2>
      </div>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div className="muted" style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '.75rem', marginBottom: 6 }}>
          {t('ui.room_code', locale)}
        </div>
        <div className="roomcode" style={{ fontSize: 'clamp(1.8rem, 8vw, 3rem)' }}>{code}</div>
      </div>
      <div className="field">
        <label className="label">{t('ui.display_name', locale)}</label>
        <input
          className="input"
          type="text"
          maxLength={40}
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleJoin()}
          placeholder={t('ui.enter_name', locale)}
          autoFocus
        />
      </div>
      <button className="btn block blue" onClick={handleJoin} disabled={loading}>
        {loading ? '...' : t('ui.join', locale)}
      </button>
    </div>
  )
}
