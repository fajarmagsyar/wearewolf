import { useState, useEffect, useCallback } from 'react'
import { t, Locale } from '@/lib/i18n'

interface CardFlipProps {
  role: {
    name: string
    nameEn: string
    faction: string
    cardImage: string
    descriptionEn: string | null
    descriptionId: string | null
    actsNight: boolean
  }
  locale: Locale
  onPeek?: () => Promise<void>
  showImmediately?: boolean
  locked?: boolean
}

export function CardFlip({ role, locale, onPeek, showImmediately, locked }: CardFlipProps) {
  const [flipped, setFlipped] = useState(showImmediately ?? false)
  const [peeked, setPeeked] = useState(showImmediately ?? false)

  useEffect(() => {
    if (locked) {
      setFlipped(false)
      setPeeked(false)
    } else if (showImmediately) {
      setFlipped(true)
      setPeeked(true)
    }
  }, [locked, showImmediately])

  const desc = locale === 'id' ? (role.descriptionId || role.descriptionEn) : (role.descriptionEn || role.descriptionId)

  const teamLabel = role.faction === 'werewolf'
    ? t('ui.team_villain', locale)
    : role.faction === 'neutral'
      ? t('ui.team_neutral', locale)
      : t('ui.team_good', locale)

  const teamColor = role.faction === 'werewolf' ? 'red' : role.faction === 'neutral' ? '' : 'blue'

  const handleCardClick = useCallback(async () => {
    if (showImmediately) return
    if (!flipped && !peeked) {
      setPeeked(true)
      setFlipped(true)
      await onPeek?.()
    } else if (flipped) {
      setFlipped(false)
    }
  }, [showImmediately, flipped, peeked, onPeek])

  return (
    <>
      <div className="card-stage">
        <div
          className={`card ${flipped ? 'flipped' : ''}`}
          onClick={handleCardClick}
        >
          <div className="card-face card-back">
            <div className="seal">?</div>
            <div className="hint">{t('ui.tap_reveal', locale)}</div>
          </div>
          <div className="card-face card-front">
            {role.cardImage ? (
              <img className="card-art" src={`/img/cards/${role.cardImage}.svg`} alt={role.nameEn} />
            ) : (
              <div className="placeholder">{role.nameEn}</div>
            )}
            <div className="role-name">{role.nameEn}</div>
            <div className={`role-team tag ${teamColor}`}>{teamLabel}</div>
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
    </>
  )
}
