import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

const STATUS_STYLES: Record<string, string> = {
  pending:     'bg-yellow-950 text-yellow-400 border border-yellow-800',
  confirmed:   'bg-green-950 text-green-400 border border-green-800',
  in_progress: 'bg-blue-950 text-blue-400 border border-blue-800',
  completed:   'bg-gray-800 text-gray-400 border border-gray-700',
  cancelled:   'bg-red-950 text-red-400 border border-red-800',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending', confirmed: 'Confirmed',
  in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled',
}

const PACKAGE_LABELS: Record<string, string> = {
  basic: 'Basic – Express Shine',
  value: 'Value – Complete Care',
  premium: 'Premium – Ultimate Protection',
}

export default async function VehicleDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', params.id)
    .eq('customer_id', user.id)
    .single()

  if (!vehicle) notFound()

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('vehicle_id', params.id)
    .order('service_date', { ascending: false })

  const scheduled = bookings?.filter(b =>
    ['pending', 'confirmed', 'in_progress'].includes(b.booking_status)
  ) ?? []

  const history = bookings?.filter(b => b.booking_status === 'completed') ?? []

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm transition-colors">
          ← Back to My Vehicles
        </Link>
        <div className="flex items-center justify-between mt-3">
          <div>
            <h1 className="text-2xl font-semibold text-white">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h1>
            <p className="text-gray-400 text-sm mt-1">{vehicle.vehicle_type}{vehicle.color ? ` · ${vehicle.color}` : ''}</p>
          </div>
          <Link
            href={`/book-service?vehicle_id=${vehicle.id}`}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + Book a Service
          </Link>
        </div>
      </div>

      {/* Scheduled Bookings */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-gray-800">
          Scheduled
        </h2>
        {scheduled.length > 0 ? (
          <div className="space-y-3">
            {scheduled.map(booking => (
              <div key={booking.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-white font-medium">
                    {PACKAGE_LABELS[booking.package_slug] ?? booking.package_label}
                  </h3>
                  {/* ------------------------------------------------------ */}
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[booking.booking_status]}`}>
                    {STATUS_LABELS[booking.booking_status]}
                  </span>
                  {/* ------------------------------------------------------ */}
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                  <span>📅 {new Date(booking.service_date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })} at {booking.dropoff_time}</span>
                  {booking.duration_hours && <span>⏱ {booking.duration_hours} hrs est.</span>}
                  {booking.quoted_price && <span>💰 ${Number(booking.quoted_price).toFixed(2)} quoted</span>}
                </div>
                {booking.special_notes && (
                  <p className="text-gray-500 text-sm mt-3 border-t border-gray-800 pt-3">
                    {booking.special_notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
            <p className="text-gray-500 text-sm">No upcoming bookings.</p>
            <Link href={`/book-service?vehicle_id=${vehicle.id}`} className="text-blue-400 hover:text-blue-300 text-sm mt-1 inline-block">
              Book a service →
            </Link>
          </div>
        )}
      </section>

      {/* Service History */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-gray-800">
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {history.map(booking => (
                  <tr key={booking.id} className="text-gray-300">
                    <td className="py-3">
                      {new Date(booking.service_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3">{PACKAGE_LABELS[booking.package_slug] ?? booking.package_label}</td>
                    <td className="py-3 text-gray-500">{booking.employee_id ? 'Assigned' : '—'}</td>
                    <td className="py-3 text-right">
                      {booking.final_price
                        ? `$${Number(booking.final_price).toFixed(2)}`
                        : booking.quoted_price
                        ? `$${Number(booking.quoted_price).toFixed(2)}`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
            <p className="text-gray-500 text-sm">No completed services yet.</p>
          </div>
        )}
      </section>
    </div>
  )
}