import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  try {
    const { code, id: playerIdStr } = await params
    const playerId = parseInt(playerIdStr, 10)

    const supabase = await createClient()

    const { data: session } = await supabase.auth.getUser()
    if (!session.user) {
      return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })
    }

    const { data: room } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('host_user_id', session.user.id)
      .single()

    if (!room) {
      return NextResponse.json({ ok: false, error: 'Room not found or not host' }, { status: 404 })
    }

    if (room.status !== 'playing') {
      return NextResponse.json({ ok: false, error: 'Game not in progress' }, { status: 400 })
    }

    const { data: target } = await supabase
      .from('room_players')
      .select('*, role:roles(*)')
      .eq('id', playerId)
      .eq('room_id', room.id)
      .single()

    if (!target || !target.is_alive) {
      return NextResponse.json({ ok: false, error: 'Invalid target' }, { status: 400 })
    }

    await supabase
      .from('room_players')
      .update({ is_alive: false })
      .eq('id', playerId)

    // Reset all votes in the room after elimination
    await supabase
      .from('room_players')
      .update({ voted_for_id: null })
      .eq('room_id', room.id)

    await supabase
      .from('game_events')
      .insert({
        room_id: room.id,
        day_number: room.day_number,
        phase: 'day',
        type: 'death',
        target_player_id: playerId,
      })

    // Kill lover partner — only if the eliminated player IS one of the lovers
    const settings = (room.settings as Record<string, unknown>) || {}
    const lovers = settings['lovers'] as [number, number] | null
    let loverPartnerId: number | null = null

    if (lovers && lovers.includes(playerId)) {
      const partnerId = lovers.find(l => l !== playerId) ?? null
      if (partnerId) {
        const { data: partner } = await supabase
          .from('room_players')
          .select('id, is_alive')
          .eq('id', partnerId)
          .single()

        if (partner && partner.is_alive) {
          await supabase
            .from('room_players')
            .update({ is_alive: false })
            .eq('id', partnerId)
          loverPartnerId = partnerId
        }
      }
    }

    // Win condition — re-fetch alive players after kills (exclude table views)
    const { data: alivePlayers } = await supabase
      .from('room_players')
      .select('role:roles(faction)')
      .eq('room_id', room.id)
      .eq('is_alive', true)
      .eq('is_table_view', false)

    const targetRole = target.role as unknown as { role_key: string; name_en: string; id: number } | null
    let tannerDied = targetRole?.role_key === 'tanner'

    if (loverPartnerId && !tannerDied) {
      const { data: loverPlayer } = await supabase
        .from('room_players')
        .select('role:roles(role_key)')
        .eq('id', loverPartnerId)
        .single()
      const loverRole = loverPlayer?.role as unknown as { role_key: string } | null
      tannerDied = loverRole?.role_key === 'tanner'
    }

    let winner: string | null = null
    if (tannerDied) {
      winner = 'tanner'
    } else {
      const wwCount = alivePlayers?.filter(p => (p.role as unknown as { faction: string } | null)?.faction === 'werewolf').length || 0
      const othersCount = alivePlayers?.filter(p => (p.role as unknown as { faction: string } | null)?.faction !== 'werewolf').length || 0

      if (wwCount === 0) winner = 'village'
      else if (wwCount >= othersCount) winner = 'werewolf'
    }

    // Build narration
    const deadInfo: Array<{ name: string; roleEn: string; roleId: number | null }> = [{
      name: target.display_name,
      roleEn: targetRole?.name_en || '',
      roleId: targetRole?.id || null,
    }]

    if (loverPartnerId) {
      const { data: partner } = await supabase
        .from('room_players')
        .select('display_name, role:roles(name_en, id)')
        .eq('id', loverPartnerId)
        .single()
      if (partner) {
        const partnerRole = partner.role as unknown as { name_en: string; id: number } | null
        deadInfo.push({
          name: partner.display_name,
          roleEn: partnerRole?.name_en || '',
          roleId: partnerRole?.id || null,
        })
      }
    }

    const narrData = {
      kind: 'execution' as const,
      seed: Math.floor(Math.random() * 100000),
      dead: deadInfo,
      winner,
    }

    const newSettings = {
      ...settings,
      narr: narrData,
      ...(winner ? { winner } : {}),
    }

    await supabase
      .from('rooms')
      .update({
        voting_open: false,
        settings: newSettings,
        state_version: room.state_version + 1,
        status: winner ? 'over' : 'playing',
        winner,
      })
      .eq('id', room.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error eliminating player:', error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
