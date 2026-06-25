import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { findPlayerByCode } from '@/lib/serialize'
import { broadcastRoomState } from '@/lib/broadcast'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  try {
    const { code, id: playerIdStr } = await params
    const playerId = parseInt(playerIdStr, 10)

    const supabase = await createClient()

    const { data: session } = await supabase.auth.getUser()
    const userId = session.user?.id || null

    const guestToken = request.headers.get('cookie')
      ?.split(';')
      .map(c => c.trim())
      .find(c => c.startsWith('guest_token='))
      ?.split('=')[1] || null

    const playerInfo = await findPlayerByCode(code, userId, guestToken)
    if (!playerInfo || !playerInfo.id) {
      return NextResponse.json({ ok: false, error: 'Not joined' }, { status: 403 })
    }

    const { data: room } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', code.toUpperCase())
      .single()

    if (!room || room.status !== 'playing' || room.phase !== 'day' || !room.voting_open) {
      return NextResponse.json({ ok: false, error: 'Voting is not open' }, { status: 400 })
    }

    // Validate target
    const { data: target } = await supabase
      .from('room_players')
      .select('id, is_alive')
      .eq('id', playerId)
      .eq('room_id', room.id)
      .single()

    if (!target || !target.is_alive) {
      return NextResponse.json({ ok: false, error: 'Invalid target' }, { status: 400 })
    }

    if (target.id === playerInfo.id) {
      return NextResponse.json({ ok: false, error: 'Cannot vote for yourself' }, { status: 400 })
    }

    await supabase
      .from('room_players')
      .update({ voted_for_id: playerId })
      .eq('id', playerInfo.id)

    await supabase
      .from('rooms')
      .update({ state_version: room.state_version + 1 })
      .eq('id', room.id)

    broadcastRoomState(code)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error voting:', error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
