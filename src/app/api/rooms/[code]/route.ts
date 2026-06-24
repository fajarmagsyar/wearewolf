import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serializeRoom } from '@/lib/serialize'

// Server-side cache: serialized room data keyed by "code:playerId"
// Only used when the client already has the latest stateVersion (via ETag check).
const roomCache = new Map<string, { data: unknown; expiresAt: number }>()
const CACHE_TTL_MS = 2000

function getCachedRoom(cacheKey: string) {
  const entry = roomCache.get(cacheKey)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    roomCache.delete(cacheKey)
    return null
  }
  return entry.data
}

function setCachedRoom(cacheKey: string, data: unknown) {
  roomCache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL_MS })
}

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
      .select('id, host_user_id, code, state_version')
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

    // ETag: client sends its current stateVersion — if match, skip serialization entirely
    const clientVersion = request.headers.get('if-none-match')
    if (clientVersion && parseInt(clientVersion, 10) === room.state_version) {
      return new NextResponse(null, { status: 304 })
    }

    const cacheKey = `${code}:${selfPlayerId ?? 'host'}`
    const cached = getCachedRoom(cacheKey)
    if (cached) {
      return NextResponse.json({ ok: true, data: cached })
    }

    const data = await serializeRoom(code, selfPlayerId, isHost)
    if (!data) {
      return NextResponse.json({ ok: false, error: 'Room not found' }, { status: 404 })
    }

    setCachedRoom(cacheKey, data)

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    console.error('Error serializing room:', error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
