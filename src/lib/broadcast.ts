import { createClient } from '@/lib/supabase/server'
import { serializeRoom } from '@/lib/serialize'

export async function broadcastRoomState(code: string): Promise<void> {
  try {
    const supabase = await createClient()

    const { data: room } = await supabase
      .from('rooms')
      .select('id, state_version')
      .eq('code', code.toUpperCase())
      .single()

    if (!room) return

    const serialized = await serializeRoom(code, null, true)
    if (!serialized) return

    const channel = supabase.channel(`room:${code}`)
    await channel.send({
      type: 'broadcast',
      event: 'room_state',
      payload: {
        stateVersion: room.state_version,
        data: serialized,
      },
    })
  } catch (err) {
    console.error('Broadcast error:', err)
  }
}
