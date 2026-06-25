import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { broadcastRoomStateFireAndForget } from '@/lib/broadcast'

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

    if (room.status !== 'playing' || room.phase !== 'day') {
      return NextResponse.json({ ok: false, error: 'Not in day phase' }, { status: 400 })
    }

    const newDay = room.day_number + 1

    // Clear all votes when transitioning to night
    await supabase
      .from('room_players')
      .update({ voted_for_id: null })
      .eq('room_id', room.id)

    await supabase
      .from('rooms')
      .update({
        phase: 'night',
        day_number: newDay,
        voting_open: false,
        settings: {
          ...(room.settings as Record<string, unknown> || {}),
          resolved_day: null,
          doctor_used: false,
        },
        state_version: room.state_version + 1,
      })
      .eq('id', room.id)

    broadcastRoomStateFireAndForget(code)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error going to day:', error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
