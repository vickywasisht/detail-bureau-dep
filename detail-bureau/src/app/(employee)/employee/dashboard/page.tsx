import { adminClient } from '@/lib/supabase/admin'
import { getEmployeeFromToken } from '@/lib/employee-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

interface BookingListItem {
  id: string
  package_label: string
  service_date: string
  dropoff_time: string
  booking_status: string
  vehicles?: { year: string; make: string; model: string }
  customers?: { first_name: string; last_name: string; email: string }
}

interface BookingStatusRow {
  booking_status: string
}

const STATUS_STYLES: Record<string, string> = {
  pending:     'bg-yellow-950 text-yellow-400 border border-yellow-800',
  confirmed:   'bg-green-950 text-green-400 border border-green-800',
  in_progress: 'bg-blue-950 text-blue-400 border border-blue-800',
  completed:   'bg-gray-800 text-gray-400 border border-gray-700',
  cancelled:   'bg-red-950 text-red-400 border border-red-800',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export default async function EmployeeDashboardPage() {
  const employee = await getEmployeeFromToken()
  if (!employee) redirect('/employee/login')

  const { data: bookings } = await adminClient
    .from('bookings')
    .select('*, vehicles(*), customers(first_name, last_name, email)')
    .in('booking_status', ['pending', 'confirmed', 'in_progress'])
    .order('service_date', { ascending: true })

  const { data: stats } = await adminClient
    .from('bookings')
    .select('booking_status')

  const counts = { pending: 0, confirmed: 0, in_progress: 0, completed: 0 }
  stats?.forEach((b: BookingStatusRow) => {
    if (b.booking_status in counts) {
      counts[b.booking_status as keyof typeof counts]++
    }
  })

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white mb-8">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Pending',     count: counts.pending,     color: 'text-yellow-400' },
          { label: 'Confirmed',   count: counts.confirmed,   color: 'text-green-400' },
          { label: 'In Progress', count: counts.in_progress, color: 'text-blue-400' },
          { label: 'Completed',   count: counts.completed,   color: 'text-gray-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-500 text-sm">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.count}</p>
          </div>
        ))}
      </div>

      {/* Active bookings */}
      <h2 className="text-lg font-semibold text-white mb-4">Active Bookings</h2>
      {bookings && bookings.length > 0 ? (
        <div className="space-y-3">
          {bookings.map((b: BookingListItem) => (
            <Link
              key={b.id}
              href={`/employee/bookings/${b.id}`}
              className="block bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl p-5 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white font-medium">
                    {b.customers?.first_name} {b.customers?.last_name}
                  </p>
                  <p className="text-gray-400 text-sm mt-0.5">
                    {b.vehicles?.year} {b.vehicles?.make} {b.vehicles?.model} · {b.package_label}
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    {new Date(b.service_date).toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric'
                    })} at {b.dropoff_time}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[b.booking_status]}`}>
                  {STATUS_LABELS[b.booking_status]}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center">
          <p className="text-gray-500">No active bookings right now.</p>
        </div>
      )}
    </div>
  )
}