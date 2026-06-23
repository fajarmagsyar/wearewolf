'use client'

import { useState, useEffect, useRef } from 'react'
import { SerializedRoom } from '@/lib/types'
import { t, Locale } from '@/lib/i18n'
import { CycleBanner } from './CycleBanner'
import { TimerBroadcast } from '@/hooks/useRoom'

interface TableViewProps {
  room: SerializedRoom
  locale: Locale
  timerBroadcast: TimerBroadcast | null
}

export function TableView({ room, locale, timerBroadcast }: TableViewProps) {
  const [timerDisplay, setTimerDisplay] = useState(0)
  const [joinUrl, setJoinUrl] = useState('')
  const playerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setJoinUrl(`${window.location.origin}/join/${room.code}`)
  }, [room.code])

  useEffect(() => {
    if (!timerBroadcast) return
    if (playerTimerRef.current) {
      clearInterval(playerTimerRef.current)
      playerTimerRef.current = null
    }
    if (timerBroadcast.action === 'reset') {
      setTimerDisplay(0)
    } else if (timerBroadcast.action === 'pause') {
      setTimerDisplay(timerBroadcast.elapsedSecs)
    } else if (timerBroadcast.action === 'start') {
      const offset = Math.floor((Date.now() - timerBroadcast.startedAt) / 1000)
      const initial = timerBroadcast.elapsedSecs + offset
      setTimerDisplay(initial)
      playerTimerRef.current = setInterval(() => setTimerDisplay(s => s + 1), 1000)
    }
    return () => {
      if (playerTimerRef.current) clearInterval(playerTimerRef.current)
    }
  }, [timerBroadcast])

  const timerFmt = (secs: number) =>
    String(Math.floor(secs / 60)).padStart(2, '0') + ':' + String(secs % 60).padStart(2, '0')

  const humanPlayers = room.players.filter(p => !p.isTableView)
  const alivePlayers = humanPlayers.filter(p => p.isAlive)
  const deadPlayers = humanPlayers.filter(p => !p.isAlive)

  // Role distribution summary (counts only, no assignments)
  const roleCounts: Record<string, { count: number; faction: string }> = {}
  if (room.roles) {
    for (const role of room.roles) {
      roleCounts[role.name] = { count: role.count, faction: role.faction }
    }
  }

  const isLobby = room.status === 'lobby'
  const isPlaying = room.status === 'playing' || room.status === 'assigning'
  const isOver = room.status === 'over'

  return (
    <div className="tableview">
      {/* Phase Banner */}
      {isPlaying && (
        <CycleBanner phase={room.phase} dayNumber={room.dayNumber} locale={locale} />
      )}

      {/* Timer - Large and prominent */}
      {isPlaying && room.phase === 'day' && timerBroadcast && timerBroadcast.action !== 'reset' && (
        <div className="tv-timer">
          <div className="tv-timer-label">{t('ui.timer', locale)}</div>
          <div className="tv-timer-value">{timerFmt(timerDisplay)}</div>
        </div>
      )}

      {/* Lobby View - QR Code to join */}
      {isLobby && joinUrl && (
        <div className="tv-section tv-qr">
          <div className="tv-qr-label">{t('ui.scan_to_join', locale)}</div>
          <img
            className="tv-qr-image"
            src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(joinUrl)}&bgcolor=ffffff&color=111111`}
            alt="QR Code to join"
            width={260}
            height={260}
          />
          <div className="tv-qr-url">{joinUrl}</div>
        </div>
      )}

      {/* Playing View - Player Grid */}
      {isPlaying && (
        <div className="tv-section">
          <div className="tv-section-title">
            {t('ui.alive', locale)}: {alivePlayers.length} / {humanPlayers.length}
          </div>
          <div className="tv-player-grid">
            {alivePlayers.map(p => (
              <div key={p.id} className="tv-player-chip alive">
                {p.seatNo !== null && <div className="tv-player-seat">#{p.seatNo}</div>}
                <div className="tv-player-name">{p.displayName}</div>
                {p.votes > 0 && (
                  <div className="tv-player-votes">{p.votes} {t('ui.votes_suffix', locale)}</div>
                )}
              </div>
            ))}
            {deadPlayers.map(p => (
              <div key={p.id} className="tv-player-chip dead">
                {p.seatNo !== null && <div className="tv-player-seat">#{p.seatNo}</div>}
                <div className="tv-player-name">{p.displayName}</div>
                <div className="tv-player-status">{t('ui.dead', locale)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Voting Panel */}
      {isPlaying && room.settings.votingOpen && (
        <div className="tv-section tv-voting">
          <div className="tv-section-title">{t('ui.voting_live', locale)}</div>
          <div className="tv-vote-grid">
            {alivePlayers.map(p => (
              <div key={p.id} className="tv-vote-item">
                <div className="tv-vote-name">{p.displayName}</div>
                <div className="tv-vote-count">{p.votes}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Role Distribution Summary */}
      {isPlaying && Object.keys(roleCounts).length > 0 && (
        <div className="tv-section tv-roles">
          <div className="tv-section-title">{t('ui.role_distribution', locale)}</div>
          <div className="tv-role-grid">
            {Object.entries(roleCounts).map(([name, info]) => (
              <div key={name} className="tv-role-item">
                <span className={`tv-role-faction ${info.faction}`} />
                <span className="tv-role-name">{name}</span>
                <span className="tv-role-count">x{info.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Game Over */}
      {isOver && (
        <div className="tv-section tv-gameover">
          <div className="tv-gameover-label">{t('ui.game_over', locale)}</div>
          <div className={`tv-gameover-winner ${room.winner}`}>
            {room.winner === 'village'
              ? t('ui.village_wins', locale)
              : room.winner === 'tanner'
                ? t('ui.tanner_wins', locale)
                : t('ui.werewolf_wins', locale)}
          </div>
        </div>
      )}
    </div>
  )
}
