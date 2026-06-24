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
    const body = await request.json()
    const { roles } = body as { roles: Array<{ roleId: number; qty: number }> }

    if (!Array.isArray(roles)) {
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

    // Upsert all roles in one batch
    const inserts: Array<{ room_id: number; role_id: number; qty: number }> = []
    const updates: Array<{ qty: number; room_id: number; role_id: number }> = []
    const deletes: Array<{ room_id: number; role_id: number }> = []

    for (const { roleId, qty } of roles) {
      if (qty === 0) {
        deletes.push({ room_id: room.id, role_id: roleId })
      } else {
        inserts.push({ room_id: room.id, role_id: roleId, qty })
      }
    }

    // Delete roles with qty 0
    for (const d of deletes) {
      await supabase
        .from('room_roles')
        .delete()
        .eq('room_id', d.room_id)
        .eq('role_id', d.role_id)
    }

    // Upsert remaining roles
    if (inserts.length > 0) {
      await supabase
        .from('room_roles')
        .upsert(inserts, { onConflict: 'room_id,role_id' })
    }

    const data = await serializeRoom(code, null, true)
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    console.error('Error batch setting roles:', error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
