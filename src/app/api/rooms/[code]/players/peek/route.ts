import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serializeRoom, findPlayerByCode } from '@/lib/serialize'

export async function POST(
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

    const playerInfo = await findPlayerByCode(code, userId, guestToken)
    if (!playerInfo || !playerInfo.id) {
      return NextResponse.json({ ok: false, error: 'Not joined' }, { status: 403 })
    }

    const { data: room } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', code.toUpperCase())
      .single()

    if (!room || room.status !== 'playing') {
      return NextResponse.json({ ok: false, error: 'Game is not playing' }, { status: 400 })
    }

    await supabase
      .from('room_players')
      .update({ revealed: true })
      .eq('id', playerInfo.id)

    const data = await serializeRoom(code, playerInfo.id, playerInfo.isHost)
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    console.error('Error peeking:', error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
