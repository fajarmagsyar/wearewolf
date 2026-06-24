import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const supabase = await createClient()
    const body = await request.json()
    const { roleId, qty } = body as { roleId: number; qty: number }

    if (!roleId || qty < 0) {
      return NextResponse.json({ ok: false, error: 'Invalid parameters' }, { status: 400 })
    }

    const { data: session } = await supabase.auth.getUser()
    if (!session.user) {
      return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })
    }

    const { data: room } = await supabase
      .from('rooms')
      .select('id')
      .eq('code', code.toUpperCase())
      .eq('host_user_id', session.user.id)
      .single()

    if (!room) {
      return NextResponse.json({ ok: false, error: 'Room not found or not host' }, { status: 404 })
    }

    if (qty === 0) {
      await supabase
        .from('room_roles')
        .delete()
        .eq('room_id', room.id)
        .eq('role_id', roleId)
    } else {
      const { data: existing } = await supabase
        .from('room_roles')
        .select('role_id')
        .eq('room_id', room.id)
        .eq('role_id', roleId)
        .single()

      if (existing) {
        await supabase
          .from('room_roles')
          .update({ qty })
          .eq('room_id', room.id)
          .eq('role_id', roleId)
      } else {
        await supabase
          .from('room_roles')
          .insert({ room_id: room.id, role_id: roleId, qty })
      }
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error setting room role:', error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
