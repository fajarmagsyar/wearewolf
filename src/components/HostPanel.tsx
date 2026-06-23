'use client'

import { useState, useRef } from 'react'
import { SerializedRoom } from '@/lib/types'
import { t, Locale } from '@/lib/i18n'
import { PlayerChips } from './PlayerChips'
import { CycleBanner } from './CycleBanner'
import { useGlobalConfirm } from './GlobalProviders'
import { TimerBroadcast } from '@/hooks/useRoom'

interface HostPanelProps {
  room: SerializedRoom
  locale: Locale
  onStartNight: () => Promise<void>
  onResolveNight: () => Promise<void>
  onOpenVoting: () => Promise<void>
  onCloseVoting: () => Promise<void>
  onEliminate: (playerId: number) => Promise<void>
  onMarkKill: (playerId: number) => Promise<void>
  onMarkProtect: (playerId: number) => Promise<void>
  onSetCupidLovers: (playerIds: number[]) => Promise<void>
  onWitchHeal: (playerId: number) => Promise<void>
  onWitchPoison: (playerId: number) => Promise<void>
  broadcastTimer: (state: TimerBroadcast) => void
}

export function HostPanel({
  room, locale,
  onStartNight, onResolveNight,
  onOpenVoting, onCloseVoting, onEliminate,
  onMarkKill, onMarkProtect,
  onSetCupidLovers, onWitchHeal, onWitchPoison,
  broadcastTimer,
}: HostPanelProps) {
  const { open: confirm } = useGlobalConfirm()
  const [cupidSel, setCupidSel] = useState<number[]>([])
  const [timerSecs, setTimerSecs] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerSecsRef = useRef(0)

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const timerStart = () => {
    if (timerRef.current) return
    const startedAt = Date.now()
    broadcastTimer({ action: 'start', startedAt, elapsedSecs: timerSecsRef.current })
    timerRef.current = setInterval(() => {
      setTimerSecs(s => {
        timerSecsRef.current = s + 1
        return s + 1
      })
    }, 1000)
  }

  const timerPause = () => {
    stopTimer()
    broadcastTimer({ action: 'pause', startedAt: 0, elapsedSecs: timerSecsRef.current })
  }

  const timerReset = () => {
    stopTimer()
    setTimerSecs(0)
    timerSecsRef.current = 0
    broadcastTimer({ action: 'reset', startedAt: 0, elapsedSecs: 0 })
  }

  const timerFmt = () => String(Math.floor(timerSecs / 60)).padStart(2, '0') + ':' + String(timerSecs % 60).padStart(2, '0')

  const isAssigning = room.status === 'assigning'
  const nt = room.nightTools
  const resolved = room.settings.nightResolved
  const lovers = nt?.lovers ?? null
  const marked = room.players.find(p => p.markedKill && p.isAlive)

  if (isAssigning) {
    return (
      <>
        <div className="panel">
          <div className="panel-title">
            <span className="bar" />
            <h2>{t('ui.tracking', locale)}</h2>
          </div>
          <p className="muted mb">{t('ui.players_start', locale)}</p>
          <PlayerChips players={room.players.filter(p => !p.isTableView)} isHost mode="view" locale={locale} />
        </div>
        <div className="panel center">
          <button className="btn block red" onClick={onStartNight}>
            {t('ui.start', locale)} · {t('ui.to_night', locale)}
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <CycleBanner phase={room.phase} dayNumber={room.dayNumber} locale={locale} />

      {/* Phase controls */}
      <div className="panel">
        <div className="panel-title">
          <span className="bar" />
          <h2>{t('ui.phase', locale)}</h2>
        </div>
        {room.phase === 'night' ? (
          <>
            <p className="muted mb">{t('ui.host_marks', locale)}</p>
            <button className="btn block green" onClick={onResolveNight} disabled={!!resolved}>
              {resolved ? t('ui.resolved', locale) : t('ui.resolve', locale)}
            </button>
            {!resolved && (
              <p className="muted mt" style={{ fontSize: '.8rem' }}>{t('ui.resolve_first', locale)}</p>
            )}
          </>
        ) : (
          <>
            <p className="muted mb">{t('ui.discuss_vote', locale)}</p>
            {room.settings.votingOpen ? (
              <>
                <div className="tag green mb" style={{ display: 'inline-block' }}>{t('ui.voting_live', locale)}</div>
                <button className="btn block red mb" onClick={onCloseVoting}>{t('ui.stop_voting', locale)}</button>
              </>
            ) : (
              <button className="btn block green mb" onClick={onOpenVoting}>{t('ui.start_voting', locale)}</button>
            )}
            <button className="btn block blue" onClick={onStartNight}>{t('ui.to_night', locale)}</button>
          </>
        )}
      </div>

      {/* Discussion timer — day only */}
      {room.phase === 'day' && (
        <div className="panel">
          <div className="panel-title">
            <span className="bar" style={{ background: 'var(--green)' }} />
            <h2>{t('ui.timer', locale)}</h2>
          </div>
          <div style={{ fontFamily: 'var(--font)', fontSize: '3.2rem', textAlign: 'center', letterSpacing: '.05em' }}>
            {timerFmt()}
          </div>
          <div className="row mt">
            <button className="btn green" type="button" onClick={timerStart}>{t('ui.timer_start', locale)}</button>
            <button className="btn paper" type="button" onClick={timerPause}>{t('ui.timer_pause', locale)}</button>
            <button className="btn red" type="button" onClick={timerReset}>{t('ui.timer_reset', locale)}</button>
          </div>
        </div>
      )}

      {/* Special role panels — night only */}
      {room.phase === 'night' && (
        <>
          {/* Cupid: link lovers */}
          {nt?.hasCupidAlive && !lovers && (
            <div className="panel">
              <div className="panel-title">
                <span className="bar" style={{ background: 'var(--red)' }} />
                <h2>{t('ui.cupid_link', locale)}</h2>
              </div>
              <p className="muted mb" style={{ fontSize: '.9rem' }}>{t('ui.cupid_hint', locale)}</p>
              <div className="players" style={{ gap: '8px', marginBottom: '12px' }}>
                {room.players.filter(p => p.isAlive).map(p => (
                  <button
                    key={p.id}
                    type="button"
                    className={`btn sm ${cupidSel.includes(p.id) ? 'red' : 'paper'}`}
                    onClick={() => setCupidSel(prev =>
                      prev.includes(p.id) ? prev.filter(x => x !== p.id) : prev.length < 2 ? [...prev, p.id] : prev
                    )}
                  >
                    {p.displayName}
                  </button>
                ))}
              </div>
              <button
                className="btn green block"
                disabled={cupidSel.length !== 2}
                onClick={() => { onSetCupidLovers(cupidSel); setCupidSel([]) }}
              >
                {t('ui.link_lovers', locale)}
              </button>
            </div>
          )}

          {lovers && (() => {
            const l1 = room.players.find(p => p.id === lovers[0])
            const l2 = room.players.find(p => p.id === lovers[1])
            return (
              <div className="panel flat" style={{ padding: '12px 16px' }}>
                <span className="tag red" style={{ marginRight: '6px' }}>{t('ui.lovers', locale)}</span>
                <strong>{l1?.displayName ?? '?'}</strong>
                <span style={{ margin: '0 6px', color: 'var(--muted)' }}>&amp;</span>
                <strong>{l2?.displayName ?? '?'}</strong>
              </div>
            )
          })()}

          {/* Witch: potions */}
          {nt?.hasWitchAlive && (
            <div className="panel">
              <div className="panel-title">
                <span className="bar" style={{ background: 'var(--purple)' }} />
                <h2>{t('ui.witch_potions', locale)}</h2>
              </div>

              {/* Heal */}
              <div className="mb" style={{ paddingBottom: '14px', borderBottom: '2px solid var(--ink)' }}>
                <p className="label" style={{ marginBottom: '8px' }}>
                  {t('ui.heal_potion', locale)}
                  {nt.witchHealUsed && <span className="tag ghost" style={{ fontSize: '.65rem', marginLeft: '6px' }}>{t('ui.used_tag', locale)}</span>}
                </p>
                {!nt.witchHealUsed ? (
                  marked ? (
                    <button className="btn green sm" onClick={() => onWitchHeal(marked.id)}>
                      {t('ui.save_player', locale).replace('{name}', marked.displayName)}
                    </button>
                  ) : (
                    <button className="btn sm paper" disabled>{t('ui.no_one_marked', locale)}</button>
                  )
                ) : (
                  <p className="muted" style={{ fontSize: '.85rem' }}>{t('ui.heal_used', locale)}</p>
                )}
              </div>

              {/* Poison */}
              <div className="mt">
                <p className="label" style={{ marginBottom: '8px' }}>
                  {t('ui.poison_potion', locale)}
                  {nt.witchPoisonUsed && <span className="tag ghost" style={{ fontSize: '.65rem', marginLeft: '6px' }}>{t('ui.used_tag', locale)}</span>}
                </p>
                {!nt.witchPoisonUsed ? (
                  <div className="players" style={{ gap: '6px' }}>
                {room.players.filter(p => p.isAlive && !p.isTableView).map(p => (
                      <button
                        key={p.id}
                        className="btn sm paper"
                        onClick={async () => {
                          const msg = t('ui.poison_confirm', locale).replace('{name}', p.displayName)
                          const ok = await confirm({ message: msg, yes: t('ui.poison', locale), no: t('ui.cancel', locale) })
                          if (ok) onWitchPoison(p.id)
                        }}
                      >
                        {p.displayName}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="muted" style={{ fontSize: '.85rem' }}>{t('ui.poison_used', locale)}</p>
                )}
              </div>
            </div>
          )}

          {/* Doctor save used indicator */}
          {nt?.doctorUsed && (
            <div className="panel flat" style={{ padding: '10px 16px' }}>
              <span className="tag ghost" style={{ fontSize: '.7rem' }}>{t('ui.doctor_save_used', locale)}</span>
            </div>
          )}
        </>
      )}

      {/* Tracking panel */}
      <div className="panel">
        <div className="panel-title">
          <span className="bar" style={{ background: 'var(--red)' }} />
          <h2>{t('ui.tracking', locale)}</h2>
        </div>
        <p className="muted mb">{t('ui.alive', locale)}: {room.aliveCount} / {room.playerCount}</p>
        <PlayerChips
          players={room.players.filter(p => !p.isTableView)}
          isHost
          mode={room.phase === 'night' ? 'night' : 'day'}
          locale={locale}
          nightTools={nt}
          onKill={onMarkKill}
          onProtect={onMarkProtect}
          onEliminate={onEliminate}
        />
      </div>

      {/* Narration panel */}
      {room.settings.narration && (
        <div className="panel">
          <div className="panel-title">
            <span className="bar" style={{ background: 'var(--yellow)' }} />
            <h2>{t('ui.narration', locale)}</h2>
          </div>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.5, marginBottom: '12px' }}>
            {room.settings.narration}
          </p>
          <button className="btn sm" onClick={() => {
            navigator.clipboard?.writeText(room.settings.narration!)
            window.dispatchEvent(new CustomEvent('toast', { detail: { message: t('ui.copied', locale), type: 'ok' } }))
          }}>
            {t('ui.copy', locale)}
          </button>
        </div>
      )}
    </>
  )
}
