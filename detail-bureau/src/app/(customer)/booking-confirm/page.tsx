'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const POLICY_TEXT = `Cancellations made 24+ hours before your scheduled drop-off will receive a full refund of any deposit paid. Cancellations within 24 hours may be subject to a cancellation fee. No-shows will be charged 50% of the quoted service price. Final pricing is confirmed at drop-off based on vehicle condition and may differ from the quoted price.`

function BookingConfirmForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const vehicleId    = searchParams.get('vehicle_id') ?? ''
  const vehicleType  = searchParams.get('vehicle_type') ?? ''
  const dropoffDate  = searchParams.get('dropoff_date') ?? ''
  const dropoffTime  = searchParams.get('dropoff_time') ?? ''
  const specialNotes = searchParams.get('special_notes') ?? ''
  const packageSlug  = searchParams.get('package_slug') ?? ''
  const packageLabel = searchParams.get('package_label') ?? ''
  const price        = searchParams.get('price') ?? '0'
  const duration     = searchParams.get('duration') ?? ''

  const [policyAccepted, setPolicyAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const formattedDate = dropoffDate
    ? new Date(dropoffDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : ''

  const handleConfirm = async () => {
    if (!policyAccepted) {
      setError('Please accept the cancellation policy to continue.')
      return
    }
    setLoading(true)

    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicle_id: vehicleId,
        package_slug: packageSlug,
        package_label: packageLabel,
        service_date: dropoffDate,
        dropoff_time: dropoffTime,
        duration_hours: duration,
        quoted_price: Number(price),
        special_notes: specialNotes,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Something went wrong.')
      setLoading(false)
      return
    }

    router.push(`/vehicles/${vehicleId}?booked=true`)
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <Link
          href={`/booking-pricing?vehicle_id=${vehicleId}&vehicle_type=${vehicleType}&dropoff_date=${dropoffDate}&dropoff_time=${encodeURIComponent(dropoffTime)}&special_notes=${encodeURIComponent(specialNotes)}`}
          className="text-gray-400 hover:text-white text-sm"
        >
          ← Change Package
        </Link>
        <h1 className="text-2xl font-semibold text-white mt-3">Confirm Booking</h1>
        <p className="text-gray-400 text-sm mt-1">Review your details before confirming.</p>
      </div>

      <div className="space-y-3 mb-6">
        {[
          { title: 'Service', rows: [
            ['Package', packageLabel],
            ['Date', formattedDate],
            ['Drop-off time', dropoffTime],
            ...(duration ? [['Est. duration', `${duration} hours`] as [string, string]] : []),
            ['Quoted price', `$${Number(price).toFixed(2)}*`],
          ]},
          ...(specialNotes ? [{ title: 'Notes', rows: [['', specialNotes]] }] : []),
        ].map(section => (
          <div key={section.title} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{section.title}</h2>
            <div className="space-y-2">
              {section.rows.map(([label, value]) => (
                <div key={label} className={`flex text-sm ${label ? 'justify-between' : ''}`}>
                  {label && <span className="text-gray-500">{label}</span>}
                  <span className={`text-gray-200 ${label === 'Quoted price' ? 'text-blue-400 font-semibold' : ''}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Cancellation Policy */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-4">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Cancellation & Refund Policy</h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-4">{POLICY_TEXT}</p>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={policyAccepted}
            onChange={e => { setPolicyAccepted(e.target.checked); setError('') }}
            className="mt-0.5 w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
          />
          <span className="text-sm text-gray-300">
            I have read and agree to the cancellation and refund policy.
          </span>
        </label>
      </div>

      <p className="text-gray-600 text-xs mb-4">* Final price confirmed at drop-off based on vehicle condition.</p>

      {error && (
        <p className="text-red-400 text-sm bg-red-950 border border-red-800 rounded-lg px-3 py-2 mb-4">{error}</p>
      )}

      <button
        onClick={handleConfirm}
        disabled={!policyAccepted || loading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-3 text-sm transition-colors"
      >
        {loading ? 'Confirming...' : 'Confirm Booking'}
      </button>
    </div>
  )
}

export default function BookingConfirmPage() {
  return <Suspense><BookingConfirmForm /></Suspense>
}