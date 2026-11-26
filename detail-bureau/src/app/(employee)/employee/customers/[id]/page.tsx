import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { adminClient } from '@/lib/supabase/admin'
import { getEmployeeFromToken } from '@/lib/employee-auth'
import ServiceDetailsButton from '@/components/ServiceDetails'
import CustomerNotes from '@/components/CustomerNotes'

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

const STATUS_STYLES: Record<string, string> = {
  pending:     'bg-yellow-50 text-yellow-700 border border-yellow-200',
  confirmed:   'bg-green-50 text-green-700 border border-green-200',
  in_progress: 'bg-blue-50 text-blue-700 border border-blue-200',
  completed:   'bg-gray-100 text-gray-600 border border-gray-200',
  cancelled:   'bg-red-50 text-red-700 border border-red-200',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
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
        <Link href="/employee/dashboard" className="text-gray-500 hover:text-black text-sm">
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-semibold text-black mt-3">
          {customer.first_name} {customer.last_name}
        </h1>
        <p className="text-gray-500 text-sm">Customer since {shortDate(customer.created_at)}</p>
      </div>

      <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Contact info</h2>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Email</span>
            <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">{customer.email}</a>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Phone</span>
            {customer.phone
              ? <a href={`tel:${customer.phone}`} className="text-blue-600 hover:underline">{customer.phone}</a>
              : <span className="text-gray-500">Not provided</span>}
          </div>
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Vehicles ({vehicles.length})
        </h2>
        {vehicles.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {vehicles.map(v => (
              <li key={v.id} className="py-2 flex justify-between gap-4 text-sm">
                <span className="text-black">{v.year} {v.make} {v.model}</span>
                <span className="text-gray-500">
                  {v.vehicle_type}{v.color ? ` · ${v.color}` : ''}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No vehicles on file.</p>
        )}
      </section>

      <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Service history ({bookings.length})
        </h2>
        {bookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-gray-500 border-b border-gray-200">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Service</th>
                  <th className="pb-2 font-medium">Vehicle</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium text-right">Cost</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map(b => {
                  const cost = b.final_price ?? b.quoted_price
                  return (
                    <tr key={b.id} className="text-gray-700">
                      <td className="py-2.5 pr-3">{shortDate(b.service_date)}</td>
                      <td className="py-2.5 pr-3">
                        {b.package_label}
                        {b.addons && b.addons.length > 0 && (
                          <span className="block text-xs text-gray-500">
                            +{b.addons.length} add-on{b.addons.length === 1 ? '' : 's'}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3">{vehicleName(b.vehicle_id)}</td>
                      <td className="py-2.5 pr-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[b.booking_status] ?? ''}`}>
                          {STATUS_LABELS[b.booking_status] ?? b.booking_status}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-right">
                        {cost != null ? `$${Number(cost).toFixed(2)}` : '—'}
                      </td>
                      <td className="py-2.5 text-right">
                        <ServiceDetailsButton
                          service={{
                            ...b,
                            customer: `${customer.first_name} ${customer.last_name}`,
                            vehicle: vehicleName(b.vehicle_id),
                          }}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No bookings yet.</p>
        )}
      </section>

      <CustomerNotes
        customerId={customer.id}
        vehicles={vehicles.map(v => ({ id: v.id, label: `${v.year} ${v.make} ${v.model}` }))}
      />
    </div>
  )
}
