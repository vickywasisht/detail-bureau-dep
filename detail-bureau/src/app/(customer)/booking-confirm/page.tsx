'use client'

import { useState, useEffect, Suspense } from 'react'
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
  const [addons, setAddons] = useState<Array<{ id: string; name: string; description: string | null; price: number }>>([])
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/addons')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setAddons(d) })
  }, [])

  const toggleAddon = (id: string) =>
    setSelected(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]))

  const chosen = addons.filter(a => selected.includes(a.id))
  const total = Number(price) + chosen.reduce((n, a) => n + Number(a.price), 0)

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
        addon_ids: selected,
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
          className="text-gray-600 hover:text-black text-sm"
        >
          ← Change Package
        </Link>
        <h1 className="text-2xl font-semibold text-black mt-3">Confirm Booking</h1>
        <p className="text-gray-600 text-sm mt-1">Review your details before confirming.</p>
      </div>

      <div className="space-y-3 mb-6">
        {[
          { title: 'Service', rows: [
            ['Package', packageLabel],
            ['Date', formattedDate],
            ['Drop-off time', dropoffTime],
            ...(duration ? [['Est. duration', `${duration} hours`] as [string, string]] : []),
            ...chosen.map(a => [`+ ${a.name}`, `$${Number(a.price).toFixed(2)}`] as [string, string]),
            ['Quoted price', `$${total.toFixed(2)}*`],
          ]},
          ...(specialNotes ? [{ title: 'Notes', rows: [['', specialNotes]] }] : []),
        ].map(section => (
          <div key={section.title} className="bg-gray-50 border border-gray-200 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{section.title}</h2>
            <div className="space-y-2">
              {section.rows.map(([label, value]) => (
                <div key={label} className={`flex text-sm ${label ? 'justify-between' : ''}`}>
                  {label && <span className="text-gray-500">{label}</span>}
                  <span className={`text-black ${label === 'Quoted price' ? 'text-blue-600 font-semibold' : ''}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {addons.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Add-ons (optional)</h2>
          <div className="space-y-3">
            {addons.map(a => (
              <label key={a.id} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.includes(a.id)}
                  onChange={() => toggleAddon(a.id)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300"
                />
                <span className="flex-1 text-sm text-gray-700">
                  <span className="text-black">{a.name}</span>
                  {a.description && <span className="block text-gray-500 text-xs">{a.description}</span>}
                </span>
                <span className="text-sm text-black">+${Number(a.price).toFixed(2)}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Cancellation Policy */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-4">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Cancellation & Refund Policy</h2>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">{POLICY_TEXT}</p>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={policyAccepted}
            onChange={e => { setPolicyAccepted(e.target.checked); setError('') }}
            className="mt-0.5 w-4 h-4 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-500 focus:ring-offset-white"
          />
          <span className="text-sm text-gray-700">
            I have read and agree to the cancellation and refund policy.
          </span>
        </label>
      </div>

      <p className="text-gray-500 text-xs mb-4">* Final price confirmed at drop-off based on vehicle condition.</p>

      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>
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