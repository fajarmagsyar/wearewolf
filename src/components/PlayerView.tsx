'use client'

import { useState, useEffect, useRef } from 'react'
import { SerializedRoom } from '@/lib/types'
import { t, Locale } from '@/lib/i18n'
import { CycleBanner } from './CycleBanner'
import { useGlobalConfirm } from './GlobalProviders'
import { TimerBroadcast } from '@/hooks/useRoom'

interface PlayerViewProps {
  room: SerializedRoom
  locale: Locale
  onVote: (playerId: number) => Promise<void>
  onPeek: () => Promise<void>
  timerBroadcast: TimerBroadcast | null
}

export function PlayerView({ room, locale, onVote, onPeek, timerBroadcast }: PlayerViewProps) {
  const { open: confirm } = useGlobalConfirm()
  const [flipped, setFlipped] = useState(false)
  const [peeked, setPeeked] = useState(false)
  const [timerDisplay, setTimerDisplay] = useState(0)
  const playerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const self = room.players.find(p => p.isSelf)
  const isAssigning = room.status === 'assigning'
  const isPlaying = room.status === 'playing'

  useEffect(() => {
    if (isPlaying) setFlipped(false)
  }, [isPlaying])

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

  const isAlive = self?.isAlive ?? true
  const isVoting = room.settings.votingOpen && isAlive
  const role = self?.role

  const desc = role
    ? (locale === 'id' ? (role.descriptionId || role.descriptionEn) : (role.descriptionEn || role.descriptionId))
    : null
  const teamColor = role?.faction === 'werewolf' ? 'red' : role?.faction === 'neutral' ? '' : 'blue'
  const teamLabel = role?.faction === 'werewolf'
    ? t('ui.team_villain', locale)
    : role?.faction === 'neutral'
      ? t('ui.team_neutral', locale)
      : t('ui.team_good', locale)

  const handleCardClick = () => {
    if (!role) return
    setFlipped(f => !f)
  }

  const handlePeekButton = async () => {
    if (flipped) { setFlipped(false); return }
    const ok = await confirm({
      message: t('ui.confirm_peek', locale),
      yes: t('ui.yes_reveal', locale),
      no: t('ui.cancel', locale),
    })
    if (ok) {
      setFlipped(true)
      if (!peeked) { setPeeked(true); await onPeek() }
    }
  }

  const timerFmt = (secs: number) =>
    String(Math.floor(secs / 60)).padStart(2, '0') + ':' + String(secs % 60).padStart(2, '0')

  const CardFront = () => role ? (
    <>
      {role.cardImage ? (
        <img className="card-art" src={`/img/cards/${role.cardImage}`} alt={role.nameEn} />
      ) : (
        <div className="placeholder">{role.nameEn}</div>
      )}
      <div className="role-name">{role.nameEn}</div>
      <div className={`role-team tag ${teamColor}`}>{teamLabel}</div>
    </>
  ) : null

  if (!role) return null

  return (
    <>
      {isPlaying && (
        <>
          {/* Status banner */}
          <div className="panel">
            <div className={`statusbig ${isAlive ? 'alive' : 'dead'}`}>
              {isAlive ? t('ui.alive', locale) : t('ui.dead', locale)}
            </div>
          </div>

          {/* Role indicator — always visible, no card reveal needed */}
          <div className="panel flat spread" style={{ padding: '10px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="muted" style={{ fontSize: '.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                {t('ui.your_role', locale)}
              </span>
              <span className={`tag ${teamColor}`} style={{ boxShadow: 'none' }}>{role.nameEn}</span>
              <span className="tag ghost" style={{ boxShadow: 'none', fontSize: '.6rem' }}>{teamLabel}</span>
            </div>
          </div>

          <CycleBanner phase={room.phase} dayNumber={room.dayNumber} locale={locale} />

          {/* Timer — shown when host has started it */}
          {room.phase === 'day' && timerBroadcast && timerBroadcast.action !== 'reset' && (
            <div className="panel center">
              <div className="muted" style={{ fontSize: '.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>
                {t('ui.timer', locale)}
              </div>
              <div style={{ fontFamily: 'var(--font)', fontSize: '2.8rem', letterSpacing: '.05em' }}>
                {timerFmt(timerDisplay)}
              </div>
            </div>
          )}

          {/* Voting panel */}
          {isVoting && (
            <div className="panel">
              <div className="panel-title">
                <span className="bar" style={{ background: 'var(--red)' }} />
                <h2>{t('ui.voting_live', locale)}</h2>
              </div>
              <p className="muted mb">{t('ui.cast_vote', locale)}</p>
              <div className="targets">
                {room.players.filter(p => p.isAlive && !p.isSelf && !p.isTableView).map(p => (
                  <button
                    key={p.id}
                    className={`target ${p.myVote ? 'sel' : ''}`}
                    onClick={() => onVote(p.id)}
                  >
                    {p.displayName}{(p.votes ?? 0) > 0 ? ` · ${p.votes}` : ''}
                  </button>
                ))}
              </div>
              {room.players.some(p => p.myVote) && (
                <p className="muted mt" style={{ fontSize: '.8rem' }}>{t('ui.change_vote', locale)}</p>
              )}
            </div>
          )}

          {!isAlive && !isVoting && (
            <div className="panel center">
              <p className="muted">{t('ui.voting_dead', locale)}</p>
            </div>
          )}

          {/* Card panel — hidden until peeked */}
          <div className={flipped ? 'panel center' : 'hidden'}>
            <div className="card-stage">
              <div className="card flipped">
                <div className="card-face card-back">
                  <div className="seal">?</div>
                  <div className="hint">{t('ui.tap_reveal', locale)}</div>
                </div>
                <div className="card-face card-front">
                  <CardFront />
                </div>
              </div>
            </div>
            {desc && flipped && (
              <div className="role-info">
                <div className="spread mb">
                  <span className="role-info-title">{t('ui.role_info', locale)}</span>
                  <span className={`tag ${role.actsNight ? 'blue' : 'ghost'}`} style={{ boxShadow: 'none', fontSize: '.6rem' }}>
                    {role.actsNight ? t('ui.acts_at_night', locale) : t('ui.no_night_action', locale)}
                  </span>
                </div>
                <p>{desc}</p>
              </div>
            )}
          </div>

          {/* Fixed peek button */}
          <div className="hide-toggle locked">
            <button className="btn red sm" onClick={handlePeekButton}>
              {t('ui.peek', locale)}
            </button>
          </div>
        </>
      )}

      {isAssigning && (
        <>
          <div className="panel center">
            <h2 className="mb">{t('ui.your_card', locale)}</h2>
            <div className="card-stage">
              <div className={`card ${flipped ? 'flipped' : ''}`} onClick={handleCardClick} style={{ cursor: 'pointer' }}>
                <div className="card-face card-back">
                  <div className="seal">?</div>
                  <div className="hint">{t('ui.tap_reveal', locale)}</div>
                </div>
                <div className="card-face card-front">
                  <CardFront />
                </div>
              </div>
            </div>
            {desc && flipped && (
              <div className="role-info">
                <div className="spread mb">
                  <span className="role-info-title">{t('ui.role_info', locale)}</span>
                  <span className={`tag ${role.actsNight ? 'blue' : 'ghost'}`} style={{ boxShadow: 'none', fontSize: '.6rem' }}>
                    {role.actsNight ? t('ui.acts_at_night', locale) : t('ui.no_night_action', locale)}
                  </span>
                </div>
                <p>{desc}</p>
              </div>
            )}
            <p className="muted mt center" style={{ fontSize: '.8rem' }}>{t('ui.tap_to_hide', locale)}</p>
          </div>
          <div className="panel center">
            <p className="muted">{t('ui.waiting_host', locale)}</p>
          </div>
        </>
      )}
    </>
  )
}
