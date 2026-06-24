import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serializeRoom } from '@/lib/serialize'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const supabase = await createClient()

    const { data: session } = await supabase.auth.getUser()
    const userId = session.user?.id || null

    const guestToken = request.headers.get('cookie')
      ?.split(';')
      .map(c => c.trim())
      .find(c => c.startsWith('guest_token='))
      ?.split('=')[1] || null

    // Resolve room + player identity in parallel
    const { data: room } = await supabase
      .from('rooms')
      .select('id, host_user_id, code')
      .eq('code', code.toUpperCase())
      .single()

    if (!room) {
      return NextResponse.json({ ok: false, error: 'Room not found or not joined' }, { status: 404 })
    }

    let isHost = false
    let selfPlayerId: number | null = null

    if (userId && room.host_user_id === userId) {
      isHost = true
    } else {
      // Check guest token and user id in parallel
      const [guestResult, userResult] = await Promise.all([
        guestToken
          ? supabase.from('room_players').select('id').eq('room_id', room.id).eq('guest_token', guestToken).single()
          : Promise.resolve({ data: null }),
        userId
          ? supabase.from('room_players').select('id').eq('room_id', room.id).eq('user_id', userId).single()
          : Promise.resolve({ data: null }),
      ])
      selfPlayerId = guestResult.data?.id ?? userResult.data?.id ?? null

      if (!selfPlayerId) {
        return NextResponse.json({ ok: false, error: 'Room not found or not joined' }, { status: 404 })
      }
    }

    const data = await serializeRoom(code, selfPlayerId, isHost)
    if (!data) {
      return NextResponse.json({ ok: false, error: 'Room not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    console.error('Error serializing room:', error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
