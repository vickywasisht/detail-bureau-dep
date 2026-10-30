'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface BookingDetail {
  id: string
  package_slug: string
  package_label: string
  service_date: string
  dropoff_time: string
  duration_hours?: string
  quoted_price?: number
  final_price?: number
  special_notes?: string
  addons?: { id: string; name: string; price: number }[]
  booking_status: string
  vehicles?: {
    year: string
    make: string
    model: string
    vehicle_type: string
    color?: string
  }
  customers?: {
    first_name: string
    last_name: string
    email: string
    phone?: string
  }
}

const STATUSES = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export default function EmployeeBookingDetailPage() {
  const { id } = useParams()
  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [status, setStatus] = useState('')
  const [finalPrice, setFinalPrice] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/employee/bookings/${id}`)
      .then(async r => {
        if (!r.ok) {
          setNotFound(true)
          return null
        }
        return r.json() as Promise<BookingDetail>
      })
      .then(data => {
        if (!data) return
        setBooking(data)
        setStatus(data.booking_status)
        setFinalPrice(data.final_price ? String(data.final_price) : '')
      })
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch(`/api/employee/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_status: status,
        final_price: finalPrice ? Number(finalPrice) : undefined,
      }),
    })
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  if (notFound) return (
    <div className="max-w-2xl mx-auto py-20 text-center">
      <p className="text-gray-700 mb-4">This booking isn&apos;t assigned to you.</p>
      <Link href="/employee/bookings" className="text-gray-500 hover:text-black text-sm">
        ← My Bookings
      </Link>
    </div>
  )

  if (!booking) return (
    <div className="flex items-center justify-center py-20">
      <p className="text-gray-500">Loading...</p>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/employee/bookings" className="text-gray-500 hover:text-black text-sm">
          ← My Bookings
        </Link>
        <h1 className="text-2xl font-semibold text-black mt-3">Booking Details</h1>
      </div>

      <div className="space-y-4">
        {/* Customer */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Customer</h2>
          <p className="text-black">{booking.customers?.first_name} {booking.customers?.last_name}</p>
          <p className="text-gray-600 text-sm">{booking.customers?.email}</p>
          {booking.customers?.phone && (
            <p className="text-gray-600 text-sm">{booking.customers.phone}</p>
          )}
        </div>

        {/* Vehicle */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Vehicle</h2>
          <p className="text-black">
            {booking.vehicles?.year} {booking.vehicles?.make} {booking.vehicles?.model}
          </p>
          <p className="text-gray-600 text-sm">
            {booking.vehicles?.vehicle_type}
            {booking.vehicles?.color ? ` · ${booking.vehicles.color}` : ''}
          </p>
        </div>

        {/* Service */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Service</h2>
          <div className="space-y-2 text-sm">
            {[
              ['Package', booking.package_label],
              ['Date', new Date(`${booking.service_date.slice(0, 10)}T00:00:00`).toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
              })],
              ['Drop-off time', booking.dropoff_time],
              ['Est. duration', booking.duration_hours ? `${booking.duration_hours} hours` : '—'],
              ['Quoted price', `$${Number(booking.quoted_price).toFixed(2)}`],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-gray-500">{label}</span>
                <span className="text-gray-800">{value}</span>
              </div>
            ))}
          </div>
          {booking.addons && booking.addons.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Add-ons</p>
              <ul className="text-gray-700 text-sm">
                {booking.addons.map(a => <li key={a.id}>{a.name} (+${Number(a.price).toFixed(2)})</li>)}
              </ul>
            </div>
          )}
          {booking.special_notes && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Customer notes</p>
              <p className="text-gray-700 text-sm">{booking.special_notes}</p>
            </div>
          )}
        </div>

        {/* Update booking */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Update Booking</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-black text-sm focus:outline-none focus:border-black"
              >
                {STATUSES.map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Final Price (optional)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                <input
                  type="number"
                  value={finalPrice}
                  onChange={e => setFinalPrice(e.target.value)}
                  placeholder={String(booking.quoted_price ?? '')}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-7 pr-3 py-2.5 text-black text-sm focus:outline-none focus:border-black"
                />
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
            >
              {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}