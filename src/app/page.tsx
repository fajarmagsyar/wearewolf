'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { t, Locale } from '@/lib/i18n'
import Link from 'next/link'

function dispatchToast(message: string, type?: 'ok' | 'err') {
  window.dispatchEvent(new CustomEvent('toast', { detail: { message, type } }))
}

export default function HomePage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [locale, setLocale] = useState<Locale>('en')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const stored = document.cookie.split(';').find(c => c.trim().startsWith('locale='))
    if (stored) {
      const val = stored.split('=')[1]?.trim()
      if (val === 'id') setLocale('id')
    }
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setIsLoggedIn(true)
    })

    const onLocaleChange = (e: Event) => {
      const locale = (e as CustomEvent).detail?.locale
      if (locale === 'id' || locale === 'en') setLocale(locale)
    }
    window.addEventListener('localechange', onLocaleChange)
    return () => window.removeEventListener('localechange', onLocaleChange)
  }, [])

  const handleCreate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/rooms', { method: 'POST', credentials: 'include' })
      const json = await res.json()
      if (json.ok) {
        router.push(`/room/${json.data.code}`)
      } else {
        dispatchToast(json.error || 'Failed to create room', 'err')
      }
    } catch {
      dispatchToast('Failed to create room', 'err')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!code.trim() || code.trim().length < 4) {
      dispatchToast('Enter a valid room code', 'err')
      return
    }
    if (!displayName.trim() || displayName.trim().length < 2) {
      dispatchToast('Enter your name', 'err')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/rooms/${code.trim().toUpperCase()}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: displayName.trim() }),
        credentials: 'include',
      })
      const json = await res.json()
      if (json.ok) {
        router.push(`/room/${code.trim().toUpperCase()}`)
      } else {
        dispatchToast(json.error || 'Failed to join room', 'err')
      }
    } catch {
      dispatchToast('Failed to join room', 'err')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut()
    setIsLoggedIn(false)
    router.refresh()
  }, [router])

  return (
    <div>
      {/* Join Room */}
      <div className="panel">
        <div className="panel-title">
          <span className="bar" style={{ background: 'var(--yellow)' }} />
          <h2>{t('ui.join_room', locale)}</h2>
        </div>
        <div className="field">
          <label className="label">{t('ui.room_code', locale)}</label>
          <input
            className="input"
            type="text"
            maxLength={6}
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            style={{ textTransform: 'uppercase', fontFamily: 'var(--font)', letterSpacing: '.2em' }}
          />
        </div>
        <div className="field">
          <label className="label">{t('ui.display_name', locale)}</label>
          <input
            className="input"
            type="text"
            maxLength={40}
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder={t('ui.display_name', locale)}
          />
        </div>
        <button className="btn block blue" onClick={handleJoin} disabled={loading}>
          {loading ? '...' : t('ui.join', locale)}
        </button>
        <p className="muted mt">{t('ui.no_account_needed', locale)}</p>
      </div>

      {/* Create Room */}
      <div className="panel">
        <div className="panel-title">
          <span className="bar" />
          <h2>{t('ui.create_room', locale)}</h2>
        </div>
        {isLoggedIn ? (
          <>
            <p className="muted mb">{t('ui.you_are_host', locale)}</p>
            <button className="btn block red" onClick={handleCreate} disabled={loading}>
              {loading ? '...' : t('ui.create', locale)}
            </button>
            <form onSubmit={async e => { e.preventDefault(); await handleLogout() }} style={{ margin: 0 }}>
              <button className="btn sm paper mt" type="submit">{t('ui.logout', locale)}</button>
            </form>
          </>
        ) : (
          <>
            <p className="muted mb">{t('ui.host_needs_account', locale)}</p>
            <div className="row">
              <Link href="/auth/login" className="btn blue">{t('ui.login', locale)}</Link>
              <Link href="/auth/register" className="btn paper">{t('ui.register', locale)}</Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
