'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ServiceDetailsButton from '@/components/ServiceDetails'
import { PAYMENT_LABELS, type PaymentStatus } from '@/lib/payments'

interface Booking {
  id: string
  package_slug: string
  package_label: string
  service_date: string
  dropoff_time: string
  duration_hours?: string | null
  quoted_price?: number | null
  final_price?: number | null
  special_notes?: string | null
  addons?: { id: string; name: string; description?: string | null; price: number }[] | null
  booking_status: string
  payment_status?: PaymentStatus
  amount_paid?: number | null
  employee_id: string | null
  vehicles?: { year: string; make: string; model: string }
  customers?: { first_name: string; last_name: string }
}

interface Employee {
  id: string
  first_name: string
  last_name: string
  is_active: boolean
}

type Changes = { booking_status?: string; employee_id?: string | null }

const STATUSES = [
  ['pending', 'Pending'],
  ['confirmed', 'Confirmed'],
  ['in_progress', 'In Progress'],
  ['completed', 'Completed'],
  ['cancelled', 'Cancelled'],
]

const selectClass = 'border border-gray-300 p-1 rounded'

const formatDate = (d: string) =>
  new Date(d.length === 10 ? `${d}T00:00:00` : d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })

export default function OwnerBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [pending, setPending] = useState<Record<string, Changes>>({})
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const [b, e] = await Promise.all([fetch('/api/owner/bookings'), fetch('/api/owner/employees')])
    if (b.ok) setBookings(await b.json())
    if (e.ok) setEmployees(await e.json())
  }
  useEffect(() => {
    let stale = false
    Promise.all([fetch('/api/owner/bookings'), fetch('/api/owner/employees')])
      .then(async ([bookingResponse, employeeResponse]) => {
        const bookingData = bookingResponse.ok ? await bookingResponse.json() : null
        const employeeData = employeeResponse.ok ? await employeeResponse.json() : null
        if (stale) return
        if (bookingData) setBookings(bookingData)
        if (employeeData) setEmployees(employeeData)
      })
      .catch(error => {
        if (!stale) setError(error instanceof Error ? error.message : 'Could not load bookings.')
      })

    return () => { stale = true }
  }, [])

  // Stage a change locally; nothing is sent until the owner clicks Save changes
  const stage = (b: Booking, changes: Changes) => {
    setPending(prev => {
      const next = { ...prev[b.id], ...changes }
      if (next.booking_status === b.booking_status) delete next.booking_status
      if (next.employee_id !== undefined && next.employee_id === b.employee_id) delete next.employee_id
      const copy = { ...prev }
      if (Object.keys(next).length === 0) delete copy[b.id]
      else copy[b.id] = next
      return copy
    })
  }

  const pendingCount = Object.values(pending).reduce((n, c) => n + Object.keys(c).length, 0)

  const saveChanges = async () => {
    setError('')
    setSaving(true)
    const failures: string[] = []
    for (const [id, changes] of Object.entries(pending)) {
      const res = await fetch(`/api/owner/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        failures.push(data.error ?? 'Update failed.')
      }
    }
    setSaving(false)
    setPending({})
    if (failures.length) setError(failures.join(' '))
    load()
  }

  const q = search.trim().toLowerCase()
  const visible = bookings.filter(b => {
    if (filter !== 'all' && b.booking_status !== filter) return false
    if (!q) return true
    return `${b.customers?.first_name} ${b.customers?.last_name} ${b.vehicles?.year} ${b.vehicles?.make} ${b.vehicles?.model} ${b.package_label}`
      .toLowerCase().includes(q)
  })

  return (
    <div className="space-y-6">
      <div>
        <Link href="/owner/dashboard" className="text-sm text-gray-700 underline">
          ← Back to dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Bookings</h1>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search by customer, vehicle or package"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 p-2 rounded w-full max-w-sm placeholder-gray-500"
        />
        <select value={filter} onChange={e => setFilter(e.target.value)} className="border border-gray-300 p-2 rounded">
          <option value="all">All statuses</option>
          {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={saveChanges}
          disabled={pendingCount === 0 || saving}
          className="rounded bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
        <button
          onClick={() => setPending({})}
          disabled={pendingCount === 0 || saving}
          className="rounded border border-gray-300 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Undo all changes
        </button>
        {pendingCount > 0 && (
          <span className="text-sm text-gray-700">
            {pendingCount} unsaved {pendingCount === 1 ? 'change' : 'changes'}
          </span>
        )}
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="p-2">Customer</th>
              <th className="p-2">Vehicle</th>
              <th className="p-2">Package</th>
              <th className="p-2">Date</th>
              <th className="p-2">Time</th>
              <th className="p-2">Status</th>
              <th className="p-2">Payment</th>
              <th className="p-2">Assigned to</th>
              <th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {visible.map(b => {
              const status = pending[b.id]?.booking_status ?? b.booking_status
              const assigned = pending[b.id]?.employee_id !== undefined
                ? pending[b.id].employee_id
                : b.employee_id
              const assignedEmp = employees.find(emp => emp.id === assigned)
              return (
                <tr key={b.id} className={`border-b border-gray-200 ${pending[b.id] ? 'bg-yellow-50' : ''}`}>
                  <td className="p-2">{b.customers?.first_name} {b.customers?.last_name}</td>
                  <td className="p-2">{b.vehicles?.year} {b.vehicles?.make} {b.vehicles?.model}</td>
                  <td className="p-2">
                    {b.package_label}
                    {b.addons && b.addons.length > 0 && (
                      <span className="block text-xs text-gray-600">
                        +{b.addons.length} add-on{b.addons.length === 1 ? '' : 's'}
                      </span>
                    )}
                  </td>
                  <td className="p-2">{formatDate(b.service_date)}</td>
                  <td className="p-2">{b.dropoff_time}</td>
                  <td className="p-2">
                    <select
                      value={status}
                      onChange={e => stage(b, { booking_status: e.target.value })}
                      className={selectClass}
                    >
                      {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </td>
                  <td className="p-2 text-sm">
                    {PAYMENT_LABELS[b.payment_status ?? 'unpaid']}
                    {Number(b.amount_paid) > 0 && (
                      <span className="block text-xs text-gray-600">
                        ${Number(b.amount_paid).toFixed(2)} of ${Number(b.quoted_price ?? 0).toFixed(2)}
                      </span>
                    )}
                  </td>
                  <td className="p-2">
                    <select
                      value={assigned ?? ''}
                      onChange={e => stage(b, { employee_id: e.target.value || null })}
                      className={selectClass}
                    >
                      <option value="">Unassigned</option>
                      {employees
                        .filter(emp => emp.is_active || emp.id === assigned)
                        .map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                        ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <ServiceDetailsButton
                      service={{
                        ...b,
                        booking_status: status,
                        customer: `${b.customers?.first_name ?? ''} ${b.customers?.last_name ?? ''}`.trim(),
                        vehicle: `${b.vehicles?.year ?? ''} ${b.vehicles?.make ?? ''} ${b.vehicles?.model ?? ''}`.trim(),
                        assignedTo: assignedEmp
                          ? `${assignedEmp.first_name} ${assignedEmp.last_name}`
                          : 'Unassigned',
                      }}
                    />
                  </td>
                </tr>
              )
            })}
            {visible.length === 0 && (
              <tr>
                <td colSpan={9} className="p-4 text-center text-gray-700">
                  {bookings.length === 0 ? 'No bookings yet.' : 'No bookings match your filters.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
