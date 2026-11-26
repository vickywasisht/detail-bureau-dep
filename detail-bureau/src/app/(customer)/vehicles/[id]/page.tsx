import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import ServiceDetailsButton from '@/components/ServiceDetails'

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

const PACKAGE_LABELS: Record<string, string> = {
  basic: 'Basic – Express Shine',
  value: 'Value – Complete Care',
  premium: 'Premium – Ultimate Protection',
}

interface Booking {
  id: string
  package_slug: string
  package_label: string
  service_date: string
  dropoff_time: string
  duration_hours?: string
  quoted_price?: number
  final_price?: number
  special_notes?: string
  addons?: { id: string; name: string; description?: string | null; price: number }[]
  booking_status: string
  employee_id?: string
}

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .eq('customer_id', user.id)
    .single()

  if (!vehicle) notFound()

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('vehicle_id', id)
    .order('service_date', { ascending: false })

  const scheduled = (bookings ?? []).filter((b: Booking) =>
    ['pending', 'confirmed', 'in_progress'].includes(b.booking_status)
  )

  const history = (bookings ?? []).filter((b: Booking) =>
    b.booking_status === 'completed'
  )

  const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard" className="text-gray-500 hover:text-black text-sm transition-colors">
          ← Back to My Vehicles
        </Link>
        <div className="flex items-center justify-between mt-3">
          <div>
            <h1 className="text-2xl font-semibold text-black">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              {vehicle.vehicle_type}{vehicle.color ? ` · ${vehicle.color}` : ''}
            </p>
          </div>
          <Link
            href={`/book-service?vehicle_id=${vehicle.id}`}
            className="bg-black hover:bg-gray-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + Book a Service
          </Link>
        </div>
      </div>

      {/* Scheduled Bookings */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-black mb-4 pb-2 border-b border-gray-200">
          Scheduled
        </h2>
        {scheduled.length > 0 ? (
          <div className="space-y-3">
            {scheduled.map((booking: Booking) => (
              <div key={booking.id} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-black font-medium">
                    {PACKAGE_LABELS[booking.package_slug] ?? booking.package_label}
                  </h3>
                  {/* ------------------------------------------------------ */}
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[booking.booking_status]}`}>
                    {STATUS_LABELS[booking.booking_status]}
                  </span>
                  {/* ------------------------------------------------------ */}
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <span>
                    📅 {new Date(booking.service_date).toLocaleDateString('en-US', {
                      weekday: 'short', month: 'long', day: 'numeric', year: 'numeric'
                    })} at {booking.dropoff_time}
                  </span>
                  {booking.duration_hours && (
                    <span>⏱ {booking.duration_hours} hrs est.</span>
                  )}
                  {booking.quoted_price && (
                    <span>💰 ${Number(booking.quoted_price).toFixed(2)} quoted</span>
                  )}
                  {booking.addons && booking.addons.length > 0 && (
                    <span>
                      ➕ {booking.addons.length} add-on{booking.addons.length === 1 ? '' : 's'}
                    </span>
                  )}
                </div>
                {booking.special_notes && (
                  <p className="text-gray-500 text-sm mt-3 border-t border-gray-200 pt-3">
                    {booking.special_notes}
                  </p>
                )}
                <div className="mt-3 border-t border-gray-200 pt-3">
                  <ServiceDetailsButton
                    service={{ ...booking, vehicle: vehicleName }}
                    label="View full details"
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-gray-500 text-sm">No upcoming bookings.</p>
            <Link
              href={`/book-service?vehicle_id=${vehicle.id}`}
              className="text-blue-600 hover:text-blue-700 text-sm mt-1 inline-block"
            >
              Book a service →
            </Link>
          </div>
        )}
      </section>

      {/* Service History */}
      <section>
        <h2 className="text-lg font-semibold text-black mb-4 pb-2 border-b border-gray-200">
          Service History
        </h2>
        {history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Service</th>
                  <th className="pb-3 font-medium">Technician</th>
                  <th className="pb-3 font-medium text-right">Cost</th>
                  <th className="pb-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {history.map((booking: Booking) => (
                  <tr key={booking.id} className="text-gray-700">
                    <td className="py-3">
                      {new Date(booking.service_date).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </td>
                    <td className="py-3">
                      {PACKAGE_LABELS[booking.package_slug] ?? booking.package_label}
                    </td>
                    <td className="py-3 text-gray-500">
                      {booking.employee_id ? 'Assigned' : '—'}
                    </td>
                    <td className="py-3 text-right">
                      {booking.final_price
                        ? `$${Number(booking.final_price).toFixed(2)}`
                        : booking.quoted_price
                        ? `$${Number(booking.quoted_price).toFixed(2)}`
                        : '—'}
                    </td>
                    <td className="py-3 text-right">
                      <ServiceDetailsButton
                        service={{ ...booking, vehicle: vehicleName }}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-gray-500 text-sm">No completed services yet.</p>
          </div>
        )}
      </section>
    </div>
  )
}