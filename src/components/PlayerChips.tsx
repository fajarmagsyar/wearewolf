import { SerializedPlayer, NightTools } from '@/lib/types'
import { t, Locale } from '@/lib/i18n'

interface PlayerChipsProps {
  players: SerializedPlayer[]
  isHost: boolean
  mode: 'view' | 'night' | 'day'
  locale: Locale
  nightTools?: NightTools | null
  onKill?: (playerId: number) => void
  onProtect?: (playerId: number) => void
  onEliminate?: (playerId: number) => void
  onKick?: (playerId: number) => void
}

export function PlayerChips({ players, isHost, mode, locale, nightTools, onKill, onProtect, onEliminate, onKick }: PlayerChipsProps) {
  const doctorUsed = nightTools?.doctorUsed ?? false
  const hasDoctorAlive = nightTools?.hasDoctorAlive ?? true
  const doctorLastSave = nightTools?.doctorLastSave ?? null

  return (
    <div className="players">
      {players.map(p => {
        const cls = ['pchip']
        if (!p.isAlive) cls.push('dead')
        if (isHost && p.markedKill) cls.push('marked')
        if (isHost && p.markedProtect) cls.push('protected')

        return (
          <div key={p.id} className={cls.join(' ')}>
            {p.seatNo !== null && p.seatNo !== undefined && (
              <span className="seat">#{p.seatNo}</span>
            )}
            <div className="pname">{p.displayName}{p.isSelf ? ` ${t('ui.you_marker', locale)}` : ''}</div>
            <div className="flags">
              {isHost && p.markedKill && (
                <span className="tag red">{t('ui.marked', locale)}</span>
              )}
              {isHost && p.markedProtect && (
                <span className="tag green">{t('ui.protected', locale)}</span>
              )}
              {!p.isAlive && (
                <span className="tag ghost">{t('ui.dead', locale)}</span>
              )}
              {p.votes > 0 && (
                <span className="tag blue">{p.votes} {t('ui.votes_suffix', locale)}</span>
              )}
              {p.role && (
                <span className="tag">{p.role.nameEn}</span>
              )}
            </div>

            {isHost && p.isAlive && mode === 'night' && (
              <div className="row mt" style={{ gap: '6px' }}>
                {p.role?.team !== 'werewolf' && (
                  <button
                    className={`btn sm ${p.markedKill ? 'red' : 'paper'}`}
                    onClick={() => onKill?.(p.id)}
                  >
                    {t('ui.mark_kill', locale)}
                  </button>
                )}
                {(!doctorUsed && hasDoctorAlive) ? (
                  p.id === doctorLastSave ? (
                    <span className="tag ghost" style={{ fontSize: '.62rem', padding: '3px 6px' }}>
                      {t('ui.protected_last_night', locale)}
                    </span>
                  ) : (
                    <button
                      className={`btn sm ${p.markedProtect ? 'green' : 'paper'}`}
                      onClick={() => onProtect?.(p.id)}
                    >
                      {t('ui.protect', locale)}
                    </button>
                  )
                ) : (
                  <span className="tag ghost" style={{ fontSize: '.62rem', padding: '3px 6px' }}>
                    {t('ui.save_used', locale)}
                  </span>
                )}
              </div>
            )}

            {isHost && p.isAlive && mode === 'day' && (
              <button
                className="btn sm red mt"
                onClick={() => onEliminate?.(p.id)}
              >
                {t('ui.eliminate', locale)}
              </button>
            )}

            {isHost && mode === 'view' && onKick && !p.isSelf && (
              <button
                className="btn sm paper mt"
                onClick={() => onKick(p.id)}
              >
                {t('ui.kick', locale)}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
