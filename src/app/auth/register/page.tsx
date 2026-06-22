'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error: authErr } = await supabase.auth.signUp({ email, password })
      if (authErr) { setError(authErr.message); return }
      setSent(true)
    } catch {
      setError('Failed to register')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="panel center">
        <h2 className="mb">Check Your Email</h2>
        <p className="muted mb">
          We sent a verification link to <strong>{email}</strong>. Click it then come back to log in.
        </p>
        <Link href="/auth/login" className="btn mt">Go to Login</Link>
      </div>
    )
  }

  return (
    <div className="panel">
      <h1 className="mb">Register</h1>
      <p className="muted mb">Host your werewolf game.</p>

      <form onSubmit={handleRegister}>
        <div className="field">
          <label className="label" htmlFor="email">Email</label>
          <input
            className="input"
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
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
            autoComplete="new-password"
            required
            minLength={6}
          />
        </div>
        <button className="btn block blue mt" type="submit" disabled={loading}>
          {loading ? '…' : 'Register'}
        </button>
      </form>

      <p className="center mt">
        <Link href="/auth/login">Already have an account? Login</Link>
      </p>
    </div>
  )
}
