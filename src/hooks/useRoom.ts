import { useEffect, useState, useCallback, useRef } from 'react'
import { SerializedRoom } from '@/lib/types'
import { supabase } from '@/lib/supabase/client'

interface UseRoomReturn {
  data: SerializedRoom | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  setData: (data: SerializedRoom) => void
}

export function useRoom(code: string): UseRoomReturn {
  const [data, setDataRaw] = useState<SerializedRoom | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // Only accept updates that are at least as recent as current state,
  // preventing stale realtime-triggered fetches from overwriting newer data.
  const setData = useCallback((newData: SerializedRoom) => {
    setDataRaw(prev => {
      if (!prev || newData.stateVersion >= prev.stateVersion) return newData
      return prev
    })
  }, [])

  const fetchRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${code}`, { credentials: 'include' })
      const json = await res.json()
      if (json.ok) {
        setData(json.data)
        setError(null)
      } else {
        setError(json.error || 'Failed to fetch room')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch room')
    } finally {
      setLoading(false)
    }
  }, [code, setData])

  useEffect(() => {
    fetchRoom()
  }, [fetchRoom])

  useEffect(() => {
    if (!code) return

    const channel = supabase
      .channel(`room:${code}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `code=eq.${code}` },
        () => fetchRoom()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_players' },
        () => fetchRoom()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_roles' },
        () => fetchRoom()
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [code, fetchRoom])

  return { data, loading, error, refresh: fetchRoom, setData }
}
