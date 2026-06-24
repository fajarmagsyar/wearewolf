'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function TablePage() {
  const params = useParams()
  const router = useRouter()
  const code = (params.code as string).toUpperCase()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const joinAsTable = async () => {
      try {
        const res = await fetch(`/api/rooms/${code}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ displayName: 'Table View', isTableView: true }),
          credentials: 'include',
        })
        const json = await res.json()
        if (!cancelled) {
          if (json.ok) {
            router.replace(`/room/${code}`)
          } else {
            setError(json.error || 'Failed to join')
          }
        }
      } catch {
        if (!cancelled) setError('Failed to join room')
      }
    }

    joinAsTable()
    return () => { cancelled = true }
  }, [code, router])

  if (error) {
    return (
      <div className="panel center" style={{ marginTop: '10vh' }}>
        <h2>Could not join</h2>
        <p className="muted mt">{error}</p>
        <a href="/" className="btn mt">Go Home</a>
      </div>
    )
  }

  return (
    <div className="panel center" style={{ marginTop: '10vh' }}>
      <p className="muted">Loading table view...</p>
    </div>
  )
}
