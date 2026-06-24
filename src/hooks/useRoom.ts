import { useEffect, useState, useCallback, useRef } from 'react'
import { SerializedRoom } from '@/lib/types'
import { supabase } from '@/lib/supabase/client'

export interface TimerBroadcast {
  action: 'start' | 'pause' | 'reset'
  startedAt: number
  elapsedSecs: number
}

interface UseRoomReturn {
  data: SerializedRoom | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  setData: (data: SerializedRoom) => void
  broadcastTimer: (state: TimerBroadcast) => void
  timerBroadcast: TimerBroadcast | null
}

export function useRoom(code: string): UseRoomReturn {
  const [data, setDataRaw] = useState<SerializedRoom | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timerBroadcast, setTimerBroadcast] = useState<TimerBroadcast | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const skipNextFetchRef = useRef(false)

  const setData = useCallback((newData: SerializedRoom) => {
    setDataRaw(prev => {
      if (!prev || newData.stateVersion >= prev.stateVersion) return newData
      return prev
    })
    // API response already has fresh data — skip the next redundant realtime fetch
    skipNextFetchRef.current = true
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

  const onRealtimeChange = useCallback(() => {
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false
      return
    }
    fetchRoom()
  }, [fetchRoom])

  useEffect(() => {
    fetchRoom()
  }, [fetchRoom])

  useEffect(() => {
    if (!code) return

    const channel = supabase
      .channel(`room:${code}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `code=eq.${code}` }, onRealtimeChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_players' }, onRealtimeChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_roles' }, onRealtimeChange)
      .on('broadcast', { event: 'timer' }, ({ payload }) => {
        setTimerBroadcast(payload as TimerBroadcast)
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [code, onRealtimeChange])

  const broadcastTimer = useCallback((state: TimerBroadcast) => {
    channelRef.current?.send({ type: 'broadcast', event: 'timer', payload: state })
  }, [])

  return { data, loading, error, refresh: fetchRoom, setData, broadcastTimer, timerBroadcast }
}
