import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
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

    if (room.status !== 'playing' || room.phase !== 'night') {
      return NextResponse.json({ ok: false, error: 'Not in night phase' }, { status: 400 })
    }

    const settings = (room.settings as Record<string, unknown>) || {}
    if (settings['resolved_day'] === room.day_number) {
      return NextResponse.json({ ok: false, error: 'Night already resolved' }, { status: 400 })
    }

    const { data: players } = await supabase
      .from('room_players')
      .select('*, role:roles(*)')
      .eq('room_id', room.id)

    if (!players) {
      return NextResponse.json({ ok: false, error: 'No players found' }, { status: 400 })
    }

    const protectedPlayer = players.find(p => p.is_protected) ?? null
    const hadProtection = !!protectedPlayer
    const dead: Array<{ id: number; name: string; roleEn: string | null; roleId: number | null }> = []

    // Kill marked players who aren't protected
    for (const p of players) {
      if (p.is_alive && p.marked_for_death && !p.is_protected) {
        await supabase
          .from('room_players')
          .update({ is_alive: false })
          .eq('id', p.id)

        dead.push({
          id: p.id,
          name: p.display_name,
          roleEn: (p.role as unknown as { name_en: string } | null)?.name_en || null,
          roleId: (p.role as unknown as { id: number } | null)?.id || null,
        })

        await supabase
          .from('game_events')
          .insert({
            room_id: room.id,
            day_number: room.day_number,
            phase: 'night',
            type: 'death',
            target_player_id: p.id,
          })
      }
    }

    // Kill lovers — only if the dead player IS one of the lovers
    const lovers = settings['lovers'] as [number, number] | null
    if (lovers) {
      for (const d of dead) {
        if (!lovers.includes(d.id)) continue
        const partnerId = lovers.find(l => l !== d.id)
        if (!partnerId) continue
        if (dead.some(dd => dd.id === partnerId)) continue  // already dying this night
        const partner = players.find(p => p.id === partnerId)
        if (partner && partner.is_alive) {
          await supabase
            .from('room_players')
            .update({ is_alive: false })
            .eq('id', partnerId)

          dead.push({
            id: partnerId,
            name: partner.display_name,
            roleEn: (partner.role as { name_en: string } | null)?.name_en || null,
            roleId: (partner.role as { id: number } | null)?.id || null,
          })
        }
      }
    }

    // Clear nightly flags
    await supabase
      .from('room_players')
      .update({ marked_for_death: false, is_protected: false })
      .eq('room_id', room.id)

    // Win condition — use alive players AFTER kills, excluding table views
    const aliveAfter = players.filter(p => p.is_alive && !dead.some(d => d.id === p.id) && !p.is_table_view)

    const tannerDied = dead.some(d => d.roleEn === 'Tanner')
    let winner: string | null = null

    if (tannerDied) {
      winner = 'tanner'
    } else {
      const wwCount = aliveAfter.filter(p => (p.role as unknown as { faction: string } | null)?.faction === 'werewolf').length
      const othersCount = aliveAfter.filter(p => (p.role as unknown as { faction: string } | null)?.faction !== 'werewolf').length

      if (wwCount === 0) winner = 'village'
      else if (wwCount >= othersCount) winner = 'werewolf'
    }

    const narrData = {
      kind: 'night' as const,
      seed: Math.floor(Math.random() * 100000),
      dead: dead.map(d => ({
        name: d.name,
        roleEn: d.roleEn || '',
        roleId: d.roleId,
      })),
      winner,
    }

    const newSettings = {
      ...settings,
      narr: narrData,
      resolved_day: room.day_number,
      ...(hadProtection ? { doctor_used: true, doctor_last_save: protectedPlayer!.id } : { doctor_last_save: null }),
      ...(winner ? { winner } : {}),
    }

    await supabase
      .from('rooms')
      .update({
        phase: 'day',
        settings: newSettings,
        voting_open: false,
        state_version: room.state_version + 1,
        status: winner ? 'over' : 'playing',
        winner,
      })
      .eq('id', room.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error resolving night:', error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
