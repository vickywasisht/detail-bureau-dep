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

export default async function EmployeeDashboardPage() {
  const employee = await getEmployeeFromToken()
  if (!employee) redirect('/employee/login')

  const { data: bookings } = await adminClient
    .from('bookings')
    .select('*, vehicles(*), customers(first_name, last_name, email)')
    .eq('employee_id', employee.id)
    .in('booking_status', ['pending', 'confirmed', 'in_progress'])
    .order('service_date', { ascending: true })

  const { data: stats } = await adminClient
    .from('bookings')
    .select('booking_status')
    .eq('employee_id', employee.id)

  const counts = { pending: 0, confirmed: 0, in_progress: 0, completed: 0 }
  stats?.forEach((b: BookingStatusRow) => {
    if (b.booking_status in counts) {
      counts[b.booking_status as keyof typeof counts]++
    }
  })

  return (
    <div>
      <h1 className="text-2xl font-semibold text-black mb-8">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Pending',     count: counts.pending,     color: 'text-yellow-600' },
          { label: 'Confirmed',   count: counts.confirmed,   color: 'text-green-600' },
          { label: 'In Progress', count: counts.in_progress, color: 'text-blue-600' },
          { label: 'Completed',   count: counts.completed,   color: 'text-gray-500' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-gray-500 text-sm">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.count}</p>
          </div>
        ))}
      </div>

      {/* Active bookings */}
      <h2 className="text-lg font-semibold text-black mb-4">Active Bookings</h2>
      {bookings && bookings.length > 0 ? (
        <div className="space-y-3">
          {bookings.map((b: BookingListItem) => (
            <Link
              key={b.id}
              href={`/employee/bookings/${b.id}`}
              className="block bg-white border border-gray-200 hover:border-gray-400 rounded-xl p-5 shadow-sm transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-black font-medium">
                    {b.customers?.first_name} {b.customers?.last_name}
                  </p>
                  <p className="text-gray-600 text-sm mt-0.5">
                    {b.vehicles?.year} {b.vehicles?.make} {b.vehicles?.model} · {b.package_label}
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    {new Date(`${b.service_date.slice(0, 10)}T00:00:00`).toLocaleDateString('en-US', {
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
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center shadow-sm">
          <p className="text-gray-500">No active bookings right now.</p>
        </div>
      )}
    </div>
  )
}