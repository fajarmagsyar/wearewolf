import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { broadcastRoomStateFireAndForget } from '@/lib/broadcast'

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

    if (room.status !== 'playing' || room.phase !== 'night') {
      return NextResponse.json({ ok: false, error: 'Not in night phase' }, { status: 400 })
    }

    const { data: target } = await supabase
      .from('room_players')
      .select('id, is_alive, role:roles(faction)')
      .eq('id', playerId)
      .eq('room_id', room.id)
      .single()

    if (!target || !target.is_alive) {
      return NextResponse.json({ ok: false, error: 'Invalid target' }, { status: 400 })
    }

    if ((target.role as Array<{ faction: string }> | null)?.[0]?.faction === 'werewolf') {
      return NextResponse.json({ ok: false, error: 'Cannot target a werewolf' }, { status: 400 })
    }

    // Clear other marks, set this one
    await supabase
      .from('room_players')
      .update({ marked_for_death: false })
      .eq('room_id', room.id)

    await supabase
      .from('room_players')
      .update({ marked_for_death: true })
      .eq('id', playerId)

    broadcastRoomStateFireAndForget(code)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error marking kill:', error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
