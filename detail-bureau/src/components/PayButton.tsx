'use client'

import { useState } from 'react'
import type { PaymentType } from '@/lib/payments'

// Asks our server for a Stripe Checkout link, then sends the customer there.
export default function PayButton({
  bookingId, type, label, primary = false,
}: { bookingId: string; type: PaymentType; label: string; primary?: boolean }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const pay = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId, type }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.url) {
        setError(data.error || 'Could not start the payment.')
        setLoading(false)
        return
      }
      window.location.href = data.url
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <span className="inline-block">
      <button
        onClick={pay}
        disabled={loading}
        className={`text-sm font-medium rounded-lg px-3 py-1.5 disabled:opacity-50 transition-colors ${
          primary ? 'bg-black text-white hover:bg-gray-800' : 'border border-gray-300 text-black hover:border-black'
        }`}
      >
        {loading ? 'Redirecting...' : label}
      </button>
      {error && <span className="block text-red-600 text-xs mt-1">{error}</span>}
    </span>
  )
}