'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error: authErr } = await supabase.auth.signInWithPassword({ email, password })
      if (authErr) { setError(authErr.message); return }
      router.push('/')
      router.refresh()
    } catch {
      setError('Failed to login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="panel">
      <h1 className="mb">Login</h1>
      <p className="muted mb">Host your werewolf game.</p>

      <form onSubmit={handleLogin}>
        <div className="field">
          <label className="label" htmlFor="email">Email</label>
          <input
            className="input"
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
          {error && <div className="tag red mt">{error}</div>}
        </div>
        <div className="field">
          <label className="label" htmlFor="password">Password</label>
          <input
            className="input"
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <button className="btn block blue mt" type="submit" disabled={loading}>
          {loading ? '…' : 'Login'}
        </button>
      </form>

      <p className="center mt">
        <Link href="/auth/register">Need an account? Register</Link>
      </p>
    </div>
  )
}
