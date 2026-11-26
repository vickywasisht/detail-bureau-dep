'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { BookingStatusBadge } from '@/components/StatusBadge'

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
    <div className="dashboard-empty mx-auto max-w-2xl">
      <div className="mb-3 text-4xl" aria-hidden="true">🔎</div>
      <p className="mb-4 font-semibold text-foreground">This booking isn&apos;t assigned to you.</p>
      <Link href="/employee/bookings" className="text-sm font-semibold text-primary underline underline-offset-2">
        ← My Bookings
      </Link>
    </div>
  )

  if (!booking) return (
    <div className="dashboard-empty mx-auto max-w-2xl" role="status">
      <div className="mb-3 text-4xl" aria-hidden="true">✨</div>
      <p className="font-semibold text-foreground">Loading your booking...</p>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/employee/bookings" className="text-sm text-text-muted hover:text-foreground">
          ← My Bookings
        </Link>
        <p className="mb-1 mt-3 text-sm font-semibold uppercase tracking-wider text-sky-700">Service appointment</p>
        <h1 className="text-3xl font-bold text-foreground">Booking Details</h1>
      </div>

      <div className="space-y-4">
        {/* Customer */}
        <div className="dashboard-card dashboard-card--sky dashboard-enter p-5">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-sky-800">Customer</h2>
          <p className="font-semibold text-foreground">{booking.customers?.first_name} {booking.customers?.last_name}</p>
          <p className="text-sm text-text-muted">{booking.customers?.email}</p>
          {booking.customers?.phone && (
            <p className="text-sm text-text-muted">{booking.customers.phone}</p>
          )}
        </div>

        {/* Vehicle */}
        <div className="dashboard-card dashboard-card--teal dashboard-enter p-5" style={{ animationDelay: '55ms' }}>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-teal-800">Vehicle</h2>
          <p className="font-semibold text-foreground">
            {booking.vehicles?.year} {booking.vehicles?.make} {booking.vehicles?.model}
          </p>
          <p className="text-sm text-text-muted">
            {booking.vehicles?.vehicle_type}
            {booking.vehicles?.color ? ` · ${booking.vehicles.color}` : ''}
          </p>
        </div>

        {/* Service */}
        <div className="dashboard-card dashboard-card--violet dashboard-enter p-5" style={{ animationDelay: '110ms' }}>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-violet-800">Service</h2>
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
              <div key={label} className="flex justify-between gap-4">
                <span className="text-text-muted">{label}</span>
                <span className="text-right font-medium text-foreground">{value}</span>
              </div>
            ))}
          </div>
          {booking.addons && booking.addons.length > 0 && (
            <div className="mt-3 border-t border-border pt-3">
              <p className="mb-1 text-xs uppercase tracking-wider text-text-muted">Add-ons</p>
              <ul className="text-sm text-foreground">
                {booking.addons.map(a => <li key={a.id}>{a.name} (+${Number(a.price).toFixed(2)})</li>)}
              </ul>
            </div>
          )}
          {booking.special_notes && (
            <div className="mt-3 border-t border-border pt-3">
              <p className="mb-1 text-xs uppercase tracking-wider text-text-muted">Customer notes</p>
              <p className="text-sm text-foreground">{booking.special_notes}</p>
            </div>
          )}
        </div>

        {/* Update booking */}
        <div className="dashboard-card dashboard-card--amber dashboard-enter p-5" style={{ animationDelay: '165ms' }}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-800">Update Booking</h2>
            <BookingStatusBadge status={status} />
          </div>
          <div className="space-y-4">
            <div>
              <label className="ui-form-label">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className={`ui-input ui-status-select ui-status-select--${status}`}
              >
                {STATUSES.map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="ui-form-label">Final Price (optional)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">$</span>
                <input
                  type="number"
                  value={finalPrice}
                  onChange={e => setFinalPrice(e.target.value)}
                  placeholder={String(booking.quoted_price ?? '')}
                  className="ui-input pl-7"
                />
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="dashboard-action w-full"
              aria-busy={saving}
            >
              {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save changes'}
            </button>
            {saved && <p role="status" className="ui-alert ui-alert--success">Booking details saved.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}