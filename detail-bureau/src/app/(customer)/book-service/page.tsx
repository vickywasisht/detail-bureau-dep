'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

const TIME_SLOTS = ['9:00 AM', '11:00 AM', '1:00 PM', '3:00 PM']

function BookServiceForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const vehicleId = searchParams.get('vehicle_id') ?? ''

  const [vehicle, setVehicle] = useState<{ make: string; model: string; year: string; vehicle_type: string } | null>(null)
  const [customer, setCustomer] = useState<{ first_name: string; last_name: string; email: string } | null>(null)
  const [form, setForm] = useState({ dropoff_date: '', dropoff_time: '', special_notes: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    if (!vehicleId) return
    fetch(`/api/vehicles/${vehicleId}`).then(r => r.json()).then(setVehicle)
    fetch('/api/auth/customer/me').then(r => r.json()).then(setCustomer)
  }, [vehicleId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.dropoff_date || !form.dropoff_time) {
      setError('Please select a date and time.')
      return
    }
    const params = new URLSearchParams({
      vehicle_id: vehicleId,
      vehicle_type: vehicle?.vehicle_type ?? '',
      dropoff_date: form.dropoff_date,
      dropoff_time: form.dropoff_time,
      special_notes: form.special_notes,
    })
    router.push(`/booking-pricing?${params.toString()}`)
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <Link href={vehicleId ? `/vehicles/${vehicleId}` : '/dashboard'} className="text-text-muted hover:text-foreground text-sm">
          ← Back
        </Link>
        <h1 className="text-2xl font-semibold text-foreground mt-3">Book a Service</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer info — readonly */}
        <div className="ui-card ui-card--muted p-5">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Your Information</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="first_name" className="ui-form-label">First name</label>
              <input id="first_name" value={customer?.first_name ?? ''} readOnly className="ui-input" />
            </div>
            <div>
              <label htmlFor="last_name" className="ui-form-label">Last name</label>
              <input id="last_name" value={customer?.last_name ?? ''} readOnly className="ui-input" />
            </div>
          </div>
          <div className="mt-3">
            <label htmlFor="email" className="ui-form-label">Email</label>
            <input id="email" value={customer?.email ?? ''} readOnly className="ui-input" />
          </div>
        </div>

        {/* Vehicle info — readonly */}
        <div className="ui-card ui-card--muted p-5">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Vehicle</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="vehicle_name" className="ui-form-label">Vehicle</label>
              <input id="vehicle_name" value={vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : ''} readOnly className="ui-input" />
            </div>
            <div>
              <label htmlFor="vehicle_type" className="ui-form-label">Type</label>
              <input id="vehicle_type" value={vehicle?.vehicle_type ?? ''} readOnly className="ui-input" />
            </div>
          </div>
        </div>

        {/* Drop-off */}
        <div className="ui-card ui-card--muted p-5">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Preferred Drop-off</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="dropoff_date" className="ui-form-label">Date <span className="text-danger">*</span></label>
              <input id="dropoff_date" type="date" name="dropoff_date" value={form.dropoff_date} onChange={handleChange} min={today} required className="ui-input" />
            </div>
            <div>
              <label htmlFor="dropoff_time" className="ui-form-label">Time <span className="text-danger">*</span></label>
              <select id="dropoff_time" name="dropoff_time" value={form.dropoff_time} onChange={handleChange} required className="ui-input">
                <option value="">— Select —</option>
                {TIME_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="ui-card ui-card--muted p-5">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Additional Notes</h2>
          <textarea aria-label="Additional notes" name="special_notes" value={form.special_notes} onChange={handleChange} rows={3} placeholder="Any specific concerns or requests..." className="ui-input resize-none" />
        </div>

        {error && <p role="alert" className="ui-alert ui-alert--error">{error}</p>}

        <button type="submit" className="ui-button ui-button--primary w-full">
          Continue to Select Package →
        </button>
      </form>
    </div>
  )
}

export default function BookServicePage() {
  return <Suspense><BookServiceForm /></Suspense>
}