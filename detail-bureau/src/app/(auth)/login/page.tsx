'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (authError) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="ui-card p-6 sm:p-8">
      <h1 className="text-xl font-semibold text-foreground mb-6">Sign in</h1>

      <form onSubmit={handleSubmit} className="space-y-4" aria-busy={loading}>
        <div>
          <label htmlFor="email" className="ui-form-label">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            autoComplete="email"
            className="ui-input"
          />
        </div>

        <div>
          <label htmlFor="password" className="ui-form-label">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
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

      <p className="text-center text-text-muted text-sm mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-primary underline hover:opacity-75">
          Create one
        </Link>
      </p>

      <p className="text-center text-text-muted text-xs mt-3">
        Are you an employee?{' '}
        <Link href="/employee-login" className="text-primary underline hover:opacity-75">
          Employee login →
        </Link>
      </p>
    </div>
  )
}