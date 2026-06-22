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

    if (room.status !== 'playing' || room.phase !== 'day') {
      return NextResponse.json({ ok: false, error: 'Not in day phase' }, { status: 400 })
    }

    await supabase
      .from('rooms')
      .update({ voting_open: true, state_version: room.state_version + 1 })
      .eq('id', room.id)

    const data = await serializeRoom(code, null, true)
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    console.error('Error opening voting:', error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
