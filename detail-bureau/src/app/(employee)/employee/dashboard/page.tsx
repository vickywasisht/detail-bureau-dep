import { adminClient } from '@/lib/supabase/admin'
import { getEmployeeFromToken } from '@/lib/employee-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CustomerSearch from '@/components/CustomerSearch'
import { BookingStatusBadge } from '@/components/StatusBadge'

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
      <div className="mb-8">
        <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-sky-700">Technician workspace</p>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-text-muted">Your schedule at a glance. Let&apos;s make every finish shine.</p>
      </div>

      <div className="mb-10">
        <CustomerSearch />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Pending', count: counts.pending, accent: 'amber', icon: '⏳' },
          { label: 'Confirmed', count: counts.confirmed, accent: 'green', icon: '✅' },
          { label: 'In Progress', count: counts.in_progress, accent: 'blue', icon: '✨' },
          { label: 'Completed', count: counts.completed, accent: 'violet', icon: '🏁' },
        ].map((s, index) => (
          <div
            key={s.label}
            className={`dashboard-stat dashboard-stat--${s.accent} dashboard-enter`}
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="dashboard-stat__label">{s.label}</p>
              <span aria-hidden="true" className="text-xl">{s.icon}</span>
            </div>
            <p className="dashboard-stat__value">{s.count}</p>
          </div>
        ))}
      </div>

      {/* Active bookings */}
      <h2 className="mb-4 text-xl font-bold text-foreground">Active Bookings</h2>
      {bookings && bookings.length > 0 ? (
        <div className="space-y-3">
          {bookings.map((b: BookingListItem, index) => (
            <Link
              key={b.id}
              href={`/employee/bookings/${b.id}`}
              className={`dashboard-card dashboard-card--${index % 2 ? 'teal' : 'sky'} dashboard-enter block p-5`}
              style={{ animationDelay: `${index * 55}ms` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-foreground">
                    {b.customers?.first_name} {b.customers?.last_name}
                  </p>
                  <p className="mt-1 text-sm text-text-muted">
                    {b.vehicles?.year} {b.vehicles?.make} {b.vehicles?.model} · {b.package_label}
                  </p>
                  <p className="mt-1 text-sm text-text-muted">
                    {new Date(`${b.service_date.slice(0, 10)}T00:00:00`).toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric'
                    })} at {b.dropoff_time}
                  </p>
                </div>
                <BookingStatusBadge status={b.booking_status} />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="dashboard-empty">
          <div className="mb-3 text-4xl" aria-hidden="true">🧽</div>
          <p className="font-semibold text-foreground">All caught up!</p>
          <p className="mt-1 text-sm text-text-muted">No active bookings right now.</p>
        </div>
      )}
    </div>
  )
}