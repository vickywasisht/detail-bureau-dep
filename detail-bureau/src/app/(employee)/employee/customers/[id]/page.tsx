import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { adminClient } from '@/lib/supabase/admin'
import { getEmployeeFromToken } from '@/lib/employee-auth'
import ServiceDetailsButton from '@/components/ServiceDetails'
import CustomerNotes from '@/components/CustomerNotes'
import { BookingStatusBadge } from '@/components/StatusBadge'

interface Vehicle {
  id: string
  year: string
  make: string
  model: string
  color: string | null
  vehicle_type: string
}

interface Booking {
  id: string
  vehicle_id: string
  package_slug: string
  package_label: string
  service_date: string
  dropoff_time: string
  duration_hours: string | null
  quoted_price: number | null
  final_price: number | null
  special_notes: string | null
  booking_status: string
  addons: { id: string; name: string; description?: string | null; price: number }[] | null
}

const toDate = (d: string) => new Date(`${d.slice(0, 10)}T00:00:00`)
const shortDate = (d: string) =>
  toDate(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export default async function CustomerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const employee = await getEmployeeFromToken()
  if (!employee) redirect('/employee-login')

  const { data: customer } = await adminClient
    .from('customers')
    .select('id, first_name, last_name, email, phone, created_at')
    .eq('id', id)
    .maybeSingle()
  if (!customer) notFound()

  const [{ data: vehicleData }, { data: bookingData }] = await Promise.all([
    adminClient.from('vehicles').select('*').eq('customer_id', id).order('created_at'),
    adminClient.from('bookings').select('*').eq('customer_id', id).order('service_date', { ascending: false }),
  ])
  const vehicles = (vehicleData ?? []) as Vehicle[]
  const bookings = (bookingData ?? []) as Booking[]

  const vehicleName = (vehicleId: string) => {
    const v = vehicles.find(x => x.id === vehicleId)
    return v ? `${v.year} ${v.make} ${v.model}` : 'Unknown vehicle'
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/employee/dashboard" className="text-sm text-text-muted hover:text-foreground">
          ← Dashboard
        </Link>
        <p className="mb-1 mt-3 text-sm font-semibold uppercase tracking-wider text-violet-700">Customer profile</p>
        <h1 className="text-3xl font-bold text-foreground">
          {customer.first_name} {customer.last_name}
        </h1>
        <p className="text-sm text-text-muted">Customer since {shortDate(customer.created_at)}</p>
      </div>

      <section className="dashboard-card dashboard-card--sky dashboard-enter p-5">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-sky-800">Contact info</h2>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-text-muted">Email</span>
            <a href={`mailto:${customer.email}`} className="text-primary underline-offset-2 hover:underline">{customer.email}</a>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-text-muted">Phone</span>
            {customer.phone
              ? <a href={`tel:${customer.phone}`} className="text-primary underline-offset-2 hover:underline">{customer.phone}</a>
              : <span className="text-text-muted">Not provided</span>}
          </div>
        </div>
      </section>

      <section className="dashboard-card dashboard-card--teal dashboard-enter p-5" style={{ animationDelay: '55ms' }}>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-teal-800">
          Vehicles ({vehicles.length})
        </h2>
        {vehicles.length > 0 ? (
          <ul className="divide-y divide-teal-100">
            {vehicles.map(v => (
              <li key={v.id} className="flex flex-col justify-between gap-1 py-3 text-sm sm:flex-row sm:gap-4">
                <span className="font-semibold text-foreground">{v.year} {v.make} {v.model}</span>
                <span className="text-text-muted">
                  {v.vehicle_type}{v.color ? ` · ${v.color}` : ''}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-text-muted">No vehicles on file.</p>
        )}
      </section>

      <section className="dashboard-card dashboard-card--violet dashboard-enter p-5" style={{ animationDelay: '110ms' }}>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-violet-800">
          Service history ({bookings.length})
        </h2>
        {bookings.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="dashboard-table min-w-[820px] text-left text-sm">
              <thead>
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Service</th>
                  <th className="p-3">Vehicle</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Cost</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => {
                  const cost = b.final_price ?? b.quoted_price
                  return (
                    <tr key={b.id}>
                      <td className="whitespace-nowrap p-3 text-text-muted">{shortDate(b.service_date)}</td>
                      <td className="p-3">
                        {b.package_label}
                        {b.addons && b.addons.length > 0 && (
                          <span className="mt-1 block text-xs text-text-muted">
                            +{b.addons.length} add-on{b.addons.length === 1 ? '' : 's'}
                          </span>
                        )}
                      </td>
                      <td className="p-3">{vehicleName(b.vehicle_id)}</td>
                      <td className="p-3"><BookingStatusBadge status={b.booking_status} /></td>
                      <td className="p-3 text-right font-semibold text-foreground">
                        {cost != null ? `$${Number(cost).toFixed(2)}` : '—'}
                      </td>
                      <td className="p-3 text-right">
                        <ServiceDetailsButton
                          service={{
                            ...b,
                            customer: `${customer.first_name} ${customer.last_name}`,
                            vehicle: vehicleName(b.vehicle_id),
                          }}
                          className="text-sm text-primary hover:opacity-75"
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-violet-200 bg-violet-50/60 p-6 text-center">
            <p className="font-semibold text-foreground">No bookings yet</p>
            <p className="mt-1 text-sm text-text-muted">Service history will appear here after the first appointment.</p>
          </div>
        )}
      </section>

      <CustomerNotes
        customerId={customer.id}
        vehicles={vehicles.map(v => ({ id: v.id, label: `${v.year} ${v.make} ${v.model}` }))}
      />
    </div>
  )
}
