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
    <div className="bg-white rounded-2xl p-8 border border-gray-200">
      <h1 className="text-xl font-semibold text-black mb-6">Create an account</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="first_name" className="block text-sm text-gray-700 mb-1">First name</label>
            <input
              id="first_name"
              name="first_name"
              autoComplete="given-name"
              value={form.first_name}
              onChange={handleChange}
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-black text-sm focus:outline-none focus:border-black"
            />
          </div>
          <div>
            <label htmlFor="last_name" className="block text-sm text-gray-700 mb-1">Last name</label>
            <input
              id="last_name"
              name="last_name"
              autoComplete="family-name"
              value={form.last_name}
              onChange={handleChange}
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-black text-sm focus:outline-none focus:border-black"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm text-gray-700 mb-1">Email</label>
          <input
            id="email"
            name="email"
            autoComplete="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-black text-sm focus:outline-none focus:border-black"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm text-gray-700 mb-1">Phone (optional)</label>
          <input
            id="phone"
            name="phone"
            autoComplete="tel"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-black text-sm focus:outline-none focus:border-black"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm text-gray-700 mb-1">Password</label>
          <input
            id="password"
            name="password"
            autoComplete="new-password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-black text-sm focus:outline-none focus:border-black"
          />
        </div>

        <div>
          <label htmlFor="confirm_password" className="block text-sm text-gray-700 mb-1">Confirm password</label>
          <input
            id="confirm_password"
            name="confirm_password"
            autoComplete="new-password"
            type="password"
            value={form.confirm_password}
            onChange={handleChange}
            required
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
          className="w-full bg-black hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="text-center text-gray-600 text-sm mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-black hover:text-gray-700 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  )
}