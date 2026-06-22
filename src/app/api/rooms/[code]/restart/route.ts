import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serializeRoom } from '@/lib/serialize'

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

    if (room.status !== 'over') {
      return NextResponse.json({ ok: false, error: 'Game not over yet' }, { status: 400 })
    }

    // Reset room to lobby
    await supabase
      .from('rooms')
      .update({
        status: 'lobby',
        phase: 'night',
        day_number: 0,
        voting_open: false,
        settings: {},
        winner: null,
        state_version: room.state_version + 1,
      })
      .eq('id', room.id)

    // Reset players (remove roles, clear flags, keep them in room)
    await supabase
      .from('room_players')
      .update({
        role_id: null,
        is_alive: true,
        is_protected: false,
        marked_for_death: false,
        revealed: false,
        voted_for_id: null,
      })
      .eq('room_id', room.id)

    const data = await serializeRoom(code, null, true)
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    console.error('Error restarting game:', error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
