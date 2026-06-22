import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serializeRoom, findPlayerByCode } from '@/lib/serialize'

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

    const playerInfo = await findPlayerByCode(code, userId, guestToken)
    if (!playerInfo) {
      return NextResponse.json({ ok: false, error: 'Room not found or not joined' }, { status: 404 })
    }

    const data = await serializeRoom(code, playerInfo.id, playerInfo.isHost)
    if (!data) {
      return NextResponse.json({ ok: false, error: 'Room not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    console.error('Error serializing room:', error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
