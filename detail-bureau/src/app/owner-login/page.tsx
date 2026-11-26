'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function OwnerLoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // portal: 'owner' makes the server reject non-owner accounts before setting a cookie
    const res = await fetch('/api/auth/employee/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, portal: 'owner' }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Login failed.')
      setLoading(false)
      return
    }

    router.push('/owner/dashboard')
    router.refresh()
  }

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block text-xl font-semibold text-foreground tracking-widest uppercase transition-colors hover:text-violet-700">
            The Detail Bureau
          </Link>
          <p className="text-text-muted text-sm mt-1">Owner Portal</p>
        </div>
        <div className="ui-card p-6 sm:p-8">
          <h1 className="text-lg font-semibold text-foreground mb-6">Owner Sign In</h1>
          <form onSubmit={handleSubmit} className="space-y-4" aria-busy={loading}>
            <div>
              <label htmlFor="username" className="ui-form-label">Username</label>
              <input
                id="username"
                type="text"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                required
                autoComplete="username"
                className="ui-input"
              />
            </div>
            <div>
              <label htmlFor="password" className="ui-form-label">Password</label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                autoComplete="current-password"
                className="ui-input"
              />
            </div>
            {error && (
              <p role="alert" className="ui-alert ui-alert--error">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="ui-button ui-button--primary w-full"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}