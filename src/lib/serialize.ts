import { createClient } from '@/lib/supabase/server'
import { SerializedRoom, PlayerStatus, NarrationData, NightTools } from '@/lib/types'
import { renderNarration } from '@/lib/narration'
import { getLocale } from '@/lib/i18n-server'

interface RoomRow {
  id: number
  code: string
  host_user_id: string | null
  status: string
  phase: string
  day_number: number
  locale: string
  settings: Record<string, unknown> | null
  voting_open: boolean
  state_version: number
  winner: string | null
}

interface PlayerRow {
  id: number
  room_id: number
  user_id: string | null
  guest_token: string | null
  display_name: string
  seat_no: number | null
  role_id: number | null
  is_alive: boolean
  is_protected: boolean
  marked_for_death: boolean
  revealed: boolean
  voted_for_id: number | null
  is_table_view: boolean
  role: {
    id: number
    role_key: string
    name_en: string
    name_id: string
    faction: string
    description_en: string | null
    description_id: string | null
    action_type: string
    acts_at_night: boolean
    card_image: string | null
  } | null
}

export async function serializeRoom(code: string, selfPlayerId: number | null, isHost: boolean): Promise<SerializedRoom | null> {
  const supabase = await createClient()
  const locale = await getLocale()

  const { data: room } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', code)
    .single()

  if (!room) return null

  const roomRow = room as RoomRow

  const { data: players } = await supabase
    .from('room_players')
    .select('*, role:roles(*)')
    .eq('room_id', roomRow.id)
    .order('seat_no', { ascending: true, nullsFirst: false })
    .order('id', { ascending: true })

  const { data: roomRoles } = await supabase
    .from('room_roles')
    .select('role_id, qty')
    .eq('room_id', roomRow.id)

  // Fetch role names separately for room_roles display
  let roleNames: Map<number, { name_en: string; name_id: string; description_en: string | null; description_id: string | null; faction: string }> = new Map()
  if (roomRoles && roomRoles.length > 0) {
    const roleIds = roomRoles.map(rr => rr.role_id)
    const { data: roleData } = await supabase
      .from('roles')
      .select('id, name_en, name_id, description_en, description_id, faction')
      .in('id', roleIds)
    if (roleData) {
      roleData.forEach(r => roleNames.set(r.id, {
        name_en: r.name_en,
        name_id: r.name_id,
        description_en: r.description_en,
        description_id: r.description_id,
        faction: r.faction,
      }))
    }
  }

  const settings = (roomRow.settings as Record<string, unknown>) || {}
  const resolvedDay = settings['resolved_day'] as number | undefined
  const nightResolved = roomRow.phase === 'day' || resolvedDay === roomRow.day_number

  // Build night_tools
  const playerList = players as PlayerRow[] || []
  const nightTools: NightTools | null = isHost && roomRow.status === 'playing' ? {
    doctorUsed: !!settings['doctor_used'],
    witchHealUsed: !!settings['witch_heal_used'],
    witchPoisonUsed: !!settings['witch_poison_used'],
    lovers: (settings['lovers'] as [number, number] | null) || null,
    hasDoctorAlive: playerList.some(p => p.is_alive && p.role?.role_key === 'doctor'),
    hasWitchAlive: playerList.some(p => p.is_alive && p.role?.role_key === 'witch'),
    hasCupidAlive: playerList.some(p => p.is_alive && p.role?.role_key === 'cupid'),
    doctorLastSave: (settings['doctor_last_save'] as number | null) ?? null,
  } : null

  const voteCounts: Record<number, number> = {}
  for (const p of playerList) {
    if (p.voted_for_id !== null) {
      voteCounts[p.voted_for_id] = (voteCounts[p.voted_for_id] || 0) + 1
    }
  }

  const aliveCount = playerList.filter(p => p.is_alive).length

  const serializedPlayers = playerList.map(p => {
    const showRole = isHost || p.id === selfPlayerId || !p.is_alive
    const role = showRole && p.role ? {
      name: locale === 'id' ? p.role.name_id : p.role.name_en,
      nameEn: p.role.name_en,
      faction: p.role.faction,
      team: p.role.faction,
      cardImage: (() => { const k = p.role.card_image || p.role.role_key; return k ? `${k}.svg` : '' })(),
      descriptionEn: p.role.description_en,
      descriptionId: p.role.description_id,
      actsNight: p.role.acts_at_night,
    } : null

    return {
      id: p.id,
      displayName: p.display_name,
      seatNo: p.seat_no,
      status: (p.is_alive ? 'alive' : 'dead') as PlayerStatus,
      isSelf: p.id === selfPlayerId,
      isTableView: p.is_table_view || false,
      role,
      votes: voteCounts[p.id] || 0,
      myVote: selfPlayerId !== null && playerList.find(sp => sp.id === selfPlayerId)?.voted_for_id === p.id,
      markedKill: isHost ? p.marked_for_death : undefined,
      markedProtect: isHost ? p.is_protected : undefined,
      isAlive: p.is_alive,
    }
  })

  const serializedRoles = isHost && roomRow.status === 'lobby' && roomRoles
    ? roomRoles.map((rr: { role_id: number; qty: number }) => {
        const rn = roleNames.get(rr.role_id)
        return {
          id: rr.role_id,
          name: locale === 'id' ? (rn?.name_id || '') : (rn?.name_en || ''),
          count: rr.qty,
          description: locale === 'id' ? (rn?.description_id || rn?.description_en || '') : (rn?.description_en || rn?.description_id || ''),
          faction: rn?.faction || '',
        }
      })
    : null

  const narration = isHost && settings['narr']
    ? renderNarration(settings['narr'] as NarrationData, locale)
    : null

  // Determine if current viewer is a table view device
  const currentViewer = selfPlayerId !== null ? playerList.find(p => p.id === selfPlayerId) : null
  const isTableView = currentViewer?.is_table_view || false

  return {
    id: roomRow.id,
    code: roomRow.code,
    status: roomRow.status as SerializedRoom['status'],
    phase: roomRow.phase as SerializedRoom['phase'],
    dayNumber: roomRow.day_number,
    locale: roomRow.locale,
    isHost,
    selfPlayerId,
    isTableView,
    settings: {
      nightResolved,
      votingOpen: roomRow.voting_open,
      narration,
    },
    players: serializedPlayers,
    roles: serializedRoles,
    winner: roomRow.winner as SerializedRoom['winner'],
    stateVersion: roomRow.state_version,
    playerCount: playerList.filter(p => !p.is_table_view).length,
    aliveCount,
    nightTools,
  }
}

export async function findPlayerByCode(code: string, userId: string | null, guestToken: string | null): Promise<{ id: number | null; isHost: boolean } | null> {
  const supabase = await createClient()

  const { data: room } = await supabase
    .from('rooms')
    .select('id, host_user_id')
    .eq('code', code)
    .single()

  if (!room) return null

  // Host is purely admin — not in room_players
  if (userId && room.host_user_id === userId) {
    return { id: null, isHost: true }
  }

  if (guestToken) {
    const { data: player } = await supabase
      .from('room_players')
      .select('id')
      .eq('room_id', room.id)
      .eq('guest_token', guestToken)
      .single()

    if (player) return { id: player.id, isHost: false }
  }

  // Also check if an authenticated user joined as a guest player
  if (userId) {
    const { data: player } = await supabase
      .from('room_players')
      .select('id')
      .eq('room_id', room.id)
      .eq('user_id', userId)
      .single()

    if (player) return { id: player.id, isHost: false }
  }

  return null
}
