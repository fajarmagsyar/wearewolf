import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { titleCase } from '@/lib/utils'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const supabase = await createClient()
    const body = await request.json()
    const { displayName, isTableView } = body as { displayName: string; isTableView?: boolean }

    if (!displayName || displayName.trim().length < 2) {
      return NextResponse.json({ ok: false, error: 'Display name required (min 2 chars)' }, { status: 400 })
    }

    const { data: room } = await supabase
      .from('rooms')
      .select('id, status')
      .eq('code', code.toUpperCase())
      .single()

    if (!room) {
      return NextResponse.json({ ok: false, error: 'Room not found' }, { status: 404 })
    }

    if (room.status !== 'lobby') {
      return NextResponse.json({ ok: false, error: 'Game already started' }, { status: 400 })
    }

    const { data: session } = await supabase.auth.getUser()
    const userId = session.user?.id || null

    // Generate guest token if not authenticated
    let guestToken: string | null = null
    if (!userId) {
      guestToken = crypto.randomUUID()
    }

    // Check if already joined (skip for table view - multiple table views allowed)
    if (userId && !isTableView) {
      const { data: existing } = await supabase
        .from('room_players')
        .select('id')
        .eq('room_id', room.id)
        .eq('user_id', userId)
        .single()

      if (existing) {
        return NextResponse.json({ ok: false, error: 'Already joined' }, { status: 400 })
      }
    }

    const { data: player, error } = await supabase
      .from('room_players')
      .insert({
        room_id: room.id,
        user_id: userId,
        guest_token: guestToken,
        display_name: titleCase(displayName.trim()),
        is_alive: true,
        is_table_view: isTableView || false,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    const response = NextResponse.json({ ok: true, data: { playerId: player.id } })

    if (guestToken) {
      response.cookies.set('guest_token', guestToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })
    }

    return response
  } catch (error) {
    console.error('Error joining room:', error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
