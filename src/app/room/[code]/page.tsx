'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useRoom } from '@/hooks/useRoom'
import { useGlobalConfirm } from '@/components/GlobalProviders'
import { Header } from '@/components/Header'
import { Lobby } from '@/components/Lobby'
import { HostPanel } from '@/components/HostPanel'
import { PlayerView } from '@/components/PlayerView'
import { TableView } from '@/components/TableView'
import { OverScreen } from '@/components/OverScreen'
import { t, Locale } from '@/lib/i18n'

function dispatchToast(message: string, type?: 'ok' | 'err') {
  window.dispatchEvent(new CustomEvent('toast', { detail: { message, type } }))
}

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const code = (params.code as string).toUpperCase()

  const [locale, setLocale] = useState<Locale>('en')
  const { data, loading, error, setData, broadcastTimer, timerBroadcast } = useRoom(code)
  const { open: confirm } = useGlobalConfirm()
  const prevPlayersRef = useRef<{ id: number; displayName: string }[]>([])

  useEffect(() => {
    if (!data) return
    const prev = prevPlayersRef.current
    if (prev.length > 0 && !data.isHost) {
      const currentIds = new Set(data.players.map(p => p.id))
      prev.filter(p => !currentIds.has(p.id)).forEach(p => {
        dispatchToast(`${p.displayName} was removed from the lobby`)
      })
    }
    prevPlayersRef.current = data.players.map(p => ({ id: p.id, displayName: p.displayName }))
  }, [data])

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

  const apiCall = useCallback(async (url: string, body?: Record<string, unknown>) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    })
    const json = await res.json()
    if (!json.ok) {
      dispatchToast(json.error || 'Something went wrong', 'err')
      return null
    }
    if (json.data) setData(json.data)
    return json
  }, [setData])

  const handleDeal = useCallback(async () => {
    await apiCall(`/api/rooms/${code}/deal`)
  }, [apiCall, code])

  const handleSetRole = useCallback((roleId: number, qty: number) =>
    apiCall(`/api/rooms/${code}/roles`, { roleId, qty }), [apiCall, code])

  const handleSuggest = useCallback(async () => {
    if (!data) return
    const suggestions = getSuggestedRoles(data.players.filter(p => !p.isTableView).length)
    await apiCall(`/api/rooms/${code}/roles/batch`, { roles: suggestions })
  }, [data, apiCall, code])

  const handleStartNight = useCallback(() => {
    // assigning → playing/night (first night), or playing/day → playing/night (subsequent nights)
    const url = data?.status === 'assigning'
      ? `/api/rooms/${code}/night/start`
      : `/api/rooms/${code}/day/next`
    return apiCall(url)
  }, [apiCall, code, data])
  const handleResolveNight = useCallback(() => apiCall(`/api/rooms/${code}/night/resolve`), [apiCall, code])
  const handleOpenVoting = useCallback(() => apiCall(`/api/rooms/${code}/voting/open`), [apiCall, code])
  const handleCloseVoting = useCallback(() => apiCall(`/api/rooms/${code}/voting/close`), [apiCall, code])
  const handleClearVotes = useCallback(() => apiCall(`/api/rooms/${code}/voting/reset`), [apiCall, code])
  const handleVote = useCallback((playerId: number) => apiCall(`/api/rooms/${code}/players/${playerId}/vote`), [apiCall, code])
  const handlePeek = useCallback(() => apiCall(`/api/rooms/${code}/players/peek`), [apiCall, code])
  const handleMarkKill = useCallback((playerId: number) => apiCall(`/api/rooms/${code}/players/${playerId}/kill`), [apiCall, code])
  const handleMarkProtect = useCallback((playerId: number) => apiCall(`/api/rooms/${code}/players/${playerId}/protect`), [apiCall, code])

  const handleEliminate = useCallback(async (playerId: number) => {
    if (!data) return
    const player = data.players.find(p => p.id === playerId)
    if (!player) return
    const msg = `${t('ui.eliminate', locale)} ${player.displayName}?`
    const ok = await confirm({ message: msg, yes: t('ui.eliminate', locale), no: t('ui.cancel', locale) })
    if (ok) await apiCall(`/api/rooms/${code}/players/${playerId}/eliminate`)
  }, [data, confirm, locale, apiCall, code])

  const handleRestart = useCallback(async () => {
    const ok = await confirm({
      message: 'Reset game to lobby? Players will stay.',
      yes: t('ui.confirm', locale),
      no: t('ui.cancel', locale),
    })
    if (ok) await apiCall(`/api/rooms/${code}/restart`)
  }, [confirm, locale, apiCall, code])

  const handleKick = useCallback(async (playerId: number) => {
    if (!data) return
    const player = data.players.find(p => p.id === playerId)
    if (!player) return
    const msg = t('ui.kick_confirm', locale).replace('{name}', player.displayName)
    const ok = await confirm({ message: msg, yes: t('ui.kick', locale), no: t('ui.cancel', locale) })
    if (ok) await apiCall(`/api/rooms/${code}/players/${playerId}/kick`)
  }, [data, confirm, locale, apiCall, code])

  const handleLeave = useCallback(async () => {
    const ok = await confirm({
      message: t('ui.leave_confirm', locale),
      yes: t('ui.leave', locale),
      no: t('ui.cancel', locale),
    })
    if (ok) {
      await fetch(`/api/rooms/${code}/leave`, { method: 'POST', credentials: 'include' })
      router.push('/')
    }
  }, [confirm, locale, code, router])

  const handleSetCupidLovers = useCallback((playerIds: number[]) =>
    apiCall(`/api/rooms/${code}/cupid`, { playerIds }), [apiCall, code])

  const handleWitchHeal = useCallback((playerId: number) =>
    apiCall(`/api/rooms/${code}/witch/heal`, { playerId }), [apiCall, code])

  const handleWitchPoison = useCallback((playerId: number) =>
    apiCall(`/api/rooms/${code}/witch/poison`, { playerId }), [apiCall, code])

  if (loading) {
    return (
      <div className="panel center" style={{ marginTop: '10vh' }}>
        <p className="muted">Loading...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="panel center" style={{ marginTop: '10vh' }}>
        <h2>Room not found</h2>
        <p className="muted mt">{error}</p>
        <button className="btn mt" onClick={() => router.push('/')}>Go Home</button>
      </div>
    )
  }

  const availableRoles = [
    { id: 1, nameEn: 'Werewolf', faction: 'werewolf', description: 'Kill villagers at night' },
    { id: 2, nameEn: 'Villager', faction: 'village', description: 'Find and eliminate werewolves' },
    { id: 3, nameEn: 'Seer', faction: 'village', description: 'Learn one player\'s team each night' },
    { id: 4, nameEn: 'Doctor', faction: 'village', description: 'Protect one player from kills each night' },
    { id: 5, nameEn: 'Hunter', faction: 'village', description: 'Take someone with you when you die' },
    { id: 6, nameEn: 'Witch', faction: 'village', description: 'One heal and one poison potion' },
    { id: 7, nameEn: 'Cupid', faction: 'village', description: 'Link two players as lovers' },
    { id: 8, nameEn: 'Tanner', faction: 'neutral', description: 'Get eliminated to win' },
  ]

  return (
    <div>
      {/* Table View - TV/tablet display mode */}
      {data.isTableView ? (
        <>
          <Header
            code={data.code}
            phase={data.phase || 'day'}
            dayNumber={data.dayNumber || 1}
            isHost={false}
            locale={locale}
            onLeave={handleLeave}
          />
          <TableView
            room={data}
            locale={locale}
            timerBroadcast={timerBroadcast}
          />
        </>
      ) : (
        <>
          <Header
            code={data.code}
            phase={data.phase || 'day'}
            dayNumber={data.dayNumber || 1}
            isHost={data.isHost}
            locale={locale}
            onLeave={handleLeave}
          />

          {data.status === 'lobby' && (
            <Lobby
              room={data}
              locale={locale}
              onDeal={handleDeal}
              onSetRole={handleSetRole}
              onSuggest={handleSuggest}
              onKick={handleKick}
              availableRoles={availableRoles}
            />
          )}

          {(data.status === 'assigning' || data.status === 'playing') && (
            data.isHost ? (
              <HostPanel
                room={data}
                locale={locale}
                onStartNight={handleStartNight}
                onResolveNight={handleResolveNight}
                onOpenVoting={handleOpenVoting}
                onCloseVoting={handleCloseVoting}
                onClearVotes={handleClearVotes}
                onEliminate={handleEliminate}
                onMarkKill={handleMarkKill}
                onMarkProtect={handleMarkProtect}
                onSetCupidLovers={handleSetCupidLovers}
                onWitchHeal={handleWitchHeal}
                onWitchPoison={handleWitchPoison}
                onResetGame={handleRestart}
                broadcastTimer={broadcastTimer}
              />
            ) : (
              <PlayerView
                room={data}
                locale={locale}
                onVote={handleVote}
                onPeek={handlePeek}
                timerBroadcast={timerBroadcast}
              />
            )
          )}

          {data.status === 'over' && (
            <OverScreen
              room={data}
              locale={locale}
              onRestart={data.isHost ? handleRestart : undefined}
              onBack={() => router.push('/')}
            />
          )}
        </>
      )}
    </div>
  )
}

function getSuggestedRoles(playerCount: number) {
  let ww = 1
  const specials: Array<{ roleId: number; qty: number }> = []

  if (playerCount >= 18) ww = Math.round(playerCount * 0.27)
  else if (playerCount >= 17) ww = 4
  else if (playerCount >= 13) ww = 3
  else if (playerCount >= 7) ww = 2

  if (playerCount >= 5) specials.push({ roleId: 3, qty: 1 })
  if (playerCount >= 7) specials.push({ roleId: 4, qty: 1 })
  if (playerCount >= 9) specials.push({ roleId: 5, qty: 1 })
  if (playerCount >= 11) specials.push({ roleId: 6, qty: 1 })
  if (playerCount >= 13) specials.push({ roleId: 7, qty: 1 })

  const specialCount = specials.reduce((sum, s) => sum + s.qty, 0)
  const villagerCount = Math.max(0, playerCount - ww - specialCount)

  return [{ roleId: 1, qty: ww }, { roleId: 2, qty: villagerCount }, ...specials]
}
