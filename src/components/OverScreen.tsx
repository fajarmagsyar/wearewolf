'use client'

import { SerializedRoom } from '@/lib/types'
import { t, Locale } from '@/lib/i18n'
import { PlayerChips } from './PlayerChips'

interface OverScreenProps {
  room: SerializedRoom
  locale: Locale
  onRestart?: () => Promise<void>
  onBack?: () => void
}

export function OverScreen({ room, locale, onRestart, onBack }: OverScreenProps) {
  const winner = room.winner

  const [winLabel, winClass] = winner === 'village'
    ? [t('ui.village_wins', locale), 'alive']
    : winner === 'tanner'
      ? [t('ui.tanner_wins', locale), 'tanner']
      : [t('ui.werewolf_wins', locale), 'dead']

  return (
    <>
      <div className="panel center">
        <h1 className="mb">{t('ui.game_over', locale)}</h1>
        <div className={`statusbig ${winClass}`}>{winLabel}</div>
      </div>

      <div className="panel">
        <div className="panel-title">
          <span className="bar" />
          <h2>{t('ui.players', locale)}</h2>
        </div>
        <PlayerChips players={room.players.filter(p => !p.isTableView)} isHost={room.isHost} mode="view" locale={locale} />
      </div>

      {onRestart && room.isHost && (
        <div className="panel center">
          <p className="muted mb">{t('ui.play_again_hint', locale)}</p>
          <button className="btn block green" onClick={onRestart}>{t('ui.play_again', locale)}</button>
        </div>
      )}

      <div className="panel center">
        <a href="/" className="btn paper">{t('ui.back', locale)}</a>
      </div>
    </>
  )
}
