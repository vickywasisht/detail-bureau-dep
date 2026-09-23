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
        <Link href={vehicleId ? `/vehicles/${vehicleId}` : '/dashboard'} className="text-gray-600 hover:text-black text-sm">
          ← Back
        </Link>
        <h1 className="text-2xl font-semibold text-black mt-3">Book a Service</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer info — readonly */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Your Information</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">First name</label>
              <input value={customer?.first_name ?? ''} readOnly className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-600 text-sm cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Last name</label>
              <input value={customer?.last_name ?? ''} readOnly className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-600 text-sm cursor-not-allowed" />
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-xs text-gray-600 mb-1">Email</label>
            <input value={customer?.email ?? ''} readOnly className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-600 text-sm cursor-not-allowed" />
          </div>
        </div>

        {/* Vehicle info — readonly */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Vehicle</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Vehicle</label>
              <input value={vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : ''} readOnly className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-600 text-sm cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Type</label>
              <input value={vehicle?.vehicle_type ?? ''} readOnly className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-600 text-sm cursor-not-allowed" />
            </div>
          </div>
        </div>

        {/* Drop-off */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Preferred Drop-off</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Date <span className="text-red-600">*</span></label>
              <input type="date" name="dropoff_date" value={form.dropoff_date} onChange={handleChange} min={today} required className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-black text-sm focus:outline-none focus:border-black" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Time <span className="text-red-600">*</span></label>
              <select name="dropoff_time" value={form.dropoff_time} onChange={handleChange} required className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-black text-sm focus:outline-none focus:border-black">
                <option value="">— Select —</option>
                {TIME_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Additional Notes</h2>
          <textarea name="special_notes" value={form.special_notes} onChange={handleChange} rows={3} placeholder="Any specific concerns or requests..." className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-black text-sm focus:outline-none focus:border-black resize-none" />
        </div>

        {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <button type="submit" className="w-full bg-black hover:bg-gray-800 text-white font-medium rounded-lg py-3 text-sm transition-colors">
          Continue to Select Package →
        </button>
      </form>
    </div>
  )
}

export default function BookServicePage() {
  return <Suspense><BookServiceForm /></Suspense>
}