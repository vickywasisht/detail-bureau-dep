'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-xl font-semibold text-black tracking-widest uppercase">
            The Detail Bureau
          </p>
          <p className="text-gray-600 text-sm mt-1">Owner Portal</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-8">
          <h1 className="text-lg font-semibold text-black mb-6">Owner Sign In</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm text-gray-700 mb-1">Username</label>
              <input
                id="username"
                type="text"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                required
                autoComplete="username"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-black text-sm focus:outline-none focus:border-black"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm text-gray-700 mb-1">Password</label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                autoComplete="current-password"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-black text-sm focus:outline-none focus:border-black"
              />
            </div>
            {error && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black hover:bg-gray-800 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}