'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)

    // 1. Sign up with Supabase Auth
    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (!data.user) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    // 2. Create customer profile via API route
    const res = await fetch('/api/auth/customer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: data.user.id,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
      }),
    })

    const result = await res.json()

    if (!res.ok) {
      setError(result.error || 'Failed to create profile.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="ui-card p-6 sm:p-8">
      <h1 className="text-xl font-semibold text-foreground mb-6">Create an account</h1>

      <form onSubmit={handleSubmit} className="space-y-4" aria-busy={loading}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="first_name" className="ui-form-label">First name</label>
            <input
              id="first_name"
              name="first_name"
              autoComplete="given-name"
              value={form.first_name}
              onChange={handleChange}
              required
              className="ui-input"
            />
          </div>
          <div>
            <label htmlFor="last_name" className="ui-form-label">Last name</label>
            <input
              id="last_name"
              name="last_name"
              autoComplete="family-name"
              value={form.last_name}
              onChange={handleChange}
              required
              className="ui-input"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="ui-form-label">Email</label>
          <input
            id="email"
            name="email"
            autoComplete="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            className="ui-input"
          />
        </div>

        <div>
          <label htmlFor="phone" className="ui-form-label">Phone (optional)</label>
          <input
            id="phone"
            name="phone"
            autoComplete="tel"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            className="ui-input"
          />
        </div>

        <div>
          <label htmlFor="password" className="ui-form-label">Password</label>
          <input
            id="password"
            name="password"
            autoComplete="new-password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
            className="ui-input"
          />
        </div>

        <div>
          <label htmlFor="confirm_password" className="ui-form-label">Confirm password</label>
          <input
            id="confirm_password"
            name="confirm_password"
            autoComplete="new-password"
            type="password"
            value={form.confirm_password}
            onChange={handleChange}
            required
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
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="text-center text-gray-600 text-sm mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:opacity-75 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  )
}