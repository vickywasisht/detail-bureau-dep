'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ServiceDetailsButton from '@/components/ServiceDetails'
import { type PaymentStatus } from '@/lib/payments'
import { PaymentStatusBadge } from '@/components/StatusBadge'
import DataState from '@/components/DataState'

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

const selectClass = 'ui-input ui-input--compact'

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
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    setLoadError('')
    try {
      const [bookingResponse, employeeResponse] = await Promise.all([
        fetch('/api/owner/bookings'),
        fetch('/api/owner/employees'),
      ])
      if (!bookingResponse.ok || !employeeResponse.ok) throw new Error('Could not load bookings and team members.')
      const bookingData: unknown = await bookingResponse.json()
      const employeeData: unknown = await employeeResponse.json()
      if (!Array.isArray(bookingData) || !Array.isArray(employeeData)) {
        throw new Error('Booking data could not be displayed.')
      }
      setBookings(bookingData)
      setEmployees(employeeData)
    } catch (loadError) {
      setLoadError(loadError instanceof Error ? loadError.message : 'Could not load bookings.')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    let stale = false
    Promise.all([fetch('/api/owner/bookings'), fetch('/api/owner/employees')])
      .then(async ([bookingResponse, employeeResponse]) => {
        if (!bookingResponse.ok || !employeeResponse.ok) throw new Error('Could not load bookings and team members.')
        const bookingData: unknown = await bookingResponse.json()
        const employeeData: unknown = await employeeResponse.json()
        if (!Array.isArray(bookingData) || !Array.isArray(employeeData)) {
          throw new Error('Booking data could not be displayed.')
        }
        if (stale) return
        setBookings(bookingData)
        setEmployees(employeeData)
      })
      .catch(error => {
        if (!stale) setLoadError(error instanceof Error ? error.message : 'Could not load bookings.')
      })
      .finally(() => {
        if (!stale) setLoading(false)
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
        <Link href="/owner/dashboard" className="text-sm text-text-muted underline">
          ← Back to dashboard
        </Link>
        <p className="mb-1 mt-3 text-sm font-semibold uppercase tracking-wider text-sky-700">Service overview</p>
        <h1 className="text-3xl font-bold text-foreground">Bookings</h1>
        <p className="mt-1 text-sm text-text-muted">Keep appointments moving and make sure each one has a teammate.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search by customer, vehicle or package"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="ui-input max-w-sm"
        />
        <select value={filter} onChange={e => setFilter(e.target.value)} className="ui-input sm:w-auto">
          <option value="all">All statuses</option>
          {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={saveChanges}
          disabled={pendingCount === 0 || saving}
          className="ui-button ui-button--primary"
          aria-busy={saving}
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
        <button
          onClick={() => setPending({})}
          disabled={pendingCount === 0 || saving}
          className="ui-button ui-button--secondary"
        >
          Undo all changes
        </button>
        {pendingCount > 0 && (
          <span className="text-sm text-text-muted">
            {pendingCount} unsaved {pendingCount === 1 ? 'change' : 'changes'}
          </span>
        )}
      </div>

      {error && <p role="alert" className="ui-alert ui-alert--error">{error}</p>}

      {loading ? (
        <DataState kind="loading" title="Loading bookings..." />
      ) : loadError ? (
        <DataState
          kind="error"
          title="We couldn’t load bookings."
          description={loadError}
          action={<button onClick={load} className="ui-button ui-button--secondary">Try again</button>}
        />
      ) : visible.length === 0 ? (
        <DataState
          kind="empty"
          title={bookings.length === 0 ? 'No bookings yet' : 'No bookings match these filters'}
          description={bookings.length === 0 ? 'New customer appointments will appear here.' : 'Try adjusting the status or search.'}
        />
      ) : (
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="dashboard-table min-w-[1150px] text-left text-sm">
          <thead>
            <tr>
              <th className="p-3">Customer</th>
              <th className="p-3">Vehicle</th>
              <th className="p-3">Package</th>
              <th className="p-3">Date</th>
              <th className="p-3">Time</th>
              <th className="p-3">Status</th>
              <th className="p-3">Payment</th>
              <th className="p-3">Assigned to</th>
              <th className="p-3" />
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
                <tr key={b.id} className={pending[b.id] ? 'table-row-pending' : ''}>
                  <td className="p-3 font-semibold text-foreground">{b.customers?.first_name} {b.customers?.last_name}</td>
                  <td className="p-3">{b.vehicles?.year} {b.vehicles?.make} {b.vehicles?.model}</td>
                  <td className="p-3">
                    {b.package_label}
                    {b.addons && b.addons.length > 0 && (
                      <span className="mt-1 block text-xs text-text-muted">
                        +{b.addons.length} add-on{b.addons.length === 1 ? '' : 's'}
                      </span>
                    )}
                  </td>
                  <td className="p-3 whitespace-nowrap">{formatDate(b.service_date)}</td>
                  <td className="p-3 whitespace-nowrap">{b.dropoff_time}</td>
                  <td className="p-3">
                    <select
                      value={status}
                      onChange={e => stage(b, { booking_status: e.target.value })}
                      className={`${selectClass} ui-status-select--${status}`}
                      aria-label={`Booking status for ${b.customers?.first_name} ${b.customers?.last_name}`}
                    >
                      {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </td>
                  <td className="p-3 text-sm">
                    <PaymentStatusBadge status={b.payment_status ?? 'unpaid'} />
                    {Number(b.amount_paid) > 0 && (
                      <span className="mt-1 block text-xs text-text-muted">
                        ${Number(b.amount_paid).toFixed(2)} of ${Number(b.quoted_price ?? 0).toFixed(2)}
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <select
                      value={assigned ?? ''}
                      onChange={e => stage(b, { employee_id: e.target.value || null })}
                      className={selectClass}
                      aria-label={`Assigned employee for ${b.customers?.first_name} ${b.customers?.last_name}`}
                    >
                      <option value="">Unassigned</option>
                      {employees
                        .filter(emp => emp.is_active || emp.id === assigned)
                        .map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                        ))}
                    </select>
                  </td>
                  <td className="p-3">
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
          </tbody>
        </table>
      </div>
      )}
    </div>
  )
}
