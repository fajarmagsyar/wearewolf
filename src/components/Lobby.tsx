'use client'

import { SerializedRoom } from '@/lib/types'
import { t, Locale } from '@/lib/i18n'
import { PlayerChips } from './PlayerChips'

interface LobbyProps {
  room: SerializedRoom
  locale: Locale
  onDeal: () => Promise<void>
  onSetRole: (roleId: number, qty: number) => Promise<void>
  onSuggest: () => Promise<void>
  onKick: (playerId: number) => Promise<void>
  availableRoles: { id: number; nameEn: string; faction: string; description: string }[]
}

export function Lobby({ room, locale, onDeal, onSetRole, onSuggest, onKick, availableRoles }: LobbyProps) {
  const totalRoles = room.roles?.reduce((sum, r) => sum + r.count, 0) || 0
  const playerCount = room.playerCount
  const canDeal = totalRoles === playerCount && playerCount >= 3

  const copyCode = () => {
    navigator.clipboard?.writeText(room.code)
    window.dispatchEvent(new CustomEvent('toast', { detail: { message: t('ui.copied', locale), type: 'ok' } }))
  }

  const copyLink = () => {
    const url = `${window.location.origin}/join/${room.code}`
    navigator.clipboard?.writeText(url)
    window.dispatchEvent(new CustomEvent('toast', { detail: { message: t('ui.copied', locale), type: 'ok' } }))
  }

  return (
    <>
      <div className="panel center">
        <div className="muted mb" style={{ fontWeight: 800, textTransform: 'uppercase' }}>
          {t('ui.share', locale)}
        </div>
        <div
          className="roomcode"
          role="button"
          tabIndex={0}
          style={{ cursor: 'pointer' }}
          onClick={copyCode}
          title={t('ui.tap_to_copy', locale)}
        >
          {room.code}
        </div>
        <div className="muted mt" style={{ fontSize: '.8rem' }}>{t('ui.tap_to_copy', locale)}</div>
        <button className="btn sm paper mt" onClick={copyLink} style={{ marginTop: 12 }}>
          🔗 {t('ui.share', locale)} Link
        </button>
      </div>

      <div className="panel">
        <div className="panel-title">
          <span className="bar" />
          <h2>{t('ui.players', locale)} ({room.players.length})</h2>
        </div>
        {room.players.length > 0 ? (
          <PlayerChips players={room.players} isHost={room.isHost} mode="view" locale={locale} onKick={room.isHost ? onKick : undefined} />
        ) : (
          <p className="muted">{t('ui.waiting_host', locale)}</p>
        )}
      </div>

      {room.isHost && (
        <div className="panel">
          <div className="panel-title">
            <span className="bar" style={{ background: 'var(--red)' }} />
            <h2>{t('ui.roles', locale)}</h2>
          </div>

          <div className="spread mb">
            <span className={`tag ${totalRoles === playerCount ? 'green' : 'red'}`}>
              {t('ui.total', locale)}: {totalRoles} / {playerCount}
            </span>
            <button className="btn sm blue" onClick={onSuggest}>
              {t('ui.suggest', locale)}
            </button>
          </div>

          {availableRoles.map(role => {
            const current = room.roles?.find(r => r.id === role.id)?.count || 0
            const teamColor = role.faction === 'werewolf' ? 'red' : role.faction === 'neutral' ? '' : 'blue'
            const teamLabel = role.faction === 'werewolf'
              ? t('ui.team_villain', locale)
              : role.faction === 'neutral'
                ? t('ui.team_neutral', locale)
                : t('ui.team_good', locale)

            return (
              <div key={role.id} className="spread" style={{ borderBottom: '2px solid #eee', padding: '8px 0' }}>
                <div>
                  <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span>{role.nameEn}</span>
                    <span className={`tag ${teamColor}`} style={{ boxShadow: 'none', fontSize: '.6rem' }}>
                      {teamLabel}
                    </span>
                  </div>
                  <div className="muted" style={{ fontSize: '.75rem' }}>{role.description}</div>
                </div>
                <div className="row" style={{ flex: '0 0 auto', alignItems: 'center', gap: '6px' }}>
                  <button className="btn sm paper" disabled={current <= 0} onClick={() => onSetRole(role.id, current - 1)}>
                    &minus;
                  </button>
                  <span style={{ fontFamily: 'var(--font)', minWidth: '24px', textAlign: 'center' }}>{current}</span>
                  <button className="btn sm paper" onClick={() => onSetRole(role.id, current + 1)}>
                    +
                  </button>
                </div>
              </div>
            )
          })}

          <button className="btn block red mt" disabled={!canDeal} onClick={onDeal}>
            {t('ui.deal', locale)}
          </button>
          {playerCount < 3 && <p className="muted mt">{t('ui.need_players', locale)}</p>}
        </div>
      )}

      {!room.isHost && (
        <div className="panel center">
          <h3>{t('ui.waiting_host', locale)}</h3>
        </div>
      )}
    </>
  )
}
