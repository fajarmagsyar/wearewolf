import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateUniqueCode } from '@/lib/utils'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient()
    const { data: session } = await supabase.auth.getUser()

    if (!session.user) {
      return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })
    }

    const code = await generateUniqueCode()

    const { data: room, error } = await supabase
      .from('rooms')
      .insert({
        code,
        host_user_id: session.user.id,
        status: 'lobby',
        phase: 'night',
        day_number: 0,
        locale: 'en',
        settings: {},
        voting_open: false,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    // Host is purely admin — not added as a player
    return NextResponse.json({ ok: true, data: { code: room.code, id: room.id } })
  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
