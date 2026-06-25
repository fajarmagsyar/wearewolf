import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { findPlayerByCode } from '@/lib/serialize'
import { broadcastRoomState } from '@/lib/broadcast'

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

    if (room.status !== 'lobby') {
      return NextResponse.json({ ok: false, error: 'Game already started' }, { status: 400 })
    }

    // Get players count (exclude table view guests)
    const { data: players, error: playersError } = await supabase
      .from('room_players')
      .select('id')
      .eq('room_id', room.id)
      .eq('is_table_view', false)

    if (playersError) {
      return NextResponse.json({ ok: false, error: playersError.message }, { status: 500 })
    }

    if (players!.length < 3) {
      return NextResponse.json({ ok: false, error: 'Minimum 3 players required' }, { status: 400 })
    }

    // Get role config
    const { data: roomRoles, error: rolesError } = await supabase
      .from('room_roles')
      .select('role_id, qty')
      .eq('room_id', room.id)

    if (rolesError) {
      return NextResponse.json({ ok: false, error: rolesError.message }, { status: 500 })
    }

    // Get the werewolf role id
    const { data: werewolfRole } = await supabase
      .from('roles')
      .select('id')
      .eq('role_key', 'werewolf')
      .single()

    // Validate werewolf count
    const werewolfEntry = roomRoles!.find(r => r.role_id === werewolfRole?.id)
    const werewolfCount = werewolfEntry?.qty || 0
    if (werewolfCount < 1) {
      return NextResponse.json({ ok: false, error: 'At least 1 Werewolf required' }, { status: 400 })
    }
    if (werewolfCount * 2 >= players!.length) {
      return NextResponse.json({ ok: false, error: 'Werewolves cannot be half or more of players' }, { status: 400 })
    }

    // Validate total
    const totalRoles = roomRoles!.reduce((sum, r) => sum + r.qty, 0)
    if (totalRoles !== players!.length) {
      return NextResponse.json({ ok: false, error: `Total roles (${totalRoles}) must equal player count (${players!.length})` }, { status: 400 })
    }

    // Build role pool and shuffle
    const rolePool: number[] = []
    for (const rr of roomRoles!) {
      for (let i = 0; i < rr.qty; i++) {
        rolePool.push(rr.role_id)
      }
    }

    // Fisher-Yates shuffle
    for (let i = rolePool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[rolePool[i], rolePool[j]] = [rolePool[j], rolePool[i]]
    }

    // Assign roles (only to human players, not table views)
    await supabase
      .from('room_players')
      .update({ is_alive: true, is_protected: false, marked_for_death: false, revealed: false, voted_for_id: null, role_id: null })
      .eq('room_id', room.id)
      .eq('is_table_view', false)

    for (let i = 0; i < players!.length; i++) {
      await supabase
        .from('room_players')
        .update({ role_id: rolePool[i] })
        .eq('id', players![i].id)
    }

    // Update room
    await supabase
      .from('rooms')
      .update({
        status: 'assigning',
        phase: 'night',
        day_number: 1,
        state_version: room.state_version + 1,
      })
      .eq('id', room.id)

    broadcastRoomState(code)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error dealing:', error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
