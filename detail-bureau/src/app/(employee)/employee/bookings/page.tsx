import { adminClient } from '@/lib/supabase/admin'
import { getEmployeeFromToken } from '@/lib/employee-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookingStatusBadge } from '@/components/StatusBadge'
import DataState from '@/components/DataState'

interface BookingListItem {
  id: string
  package_label: string
  service_date: string
  dropoff_time: string
  quoted_price?: number
  booking_status: string
  vehicles?: { year: string; make: string; model: string }
  customers?: { first_name: string; last_name: string; email: string }
}

export default async function EmployeeBookingsPage() {
  const employee = await getEmployeeFromToken()
  if (!employee) redirect('/employee/login')

  const { data: bookings, error: bookingsError } = await adminClient
    .from('bookings')
    .select('*, vehicles(*), customers(first_name, last_name, email)')
    .eq('employee_id', employee.id)
    .order('service_date', { ascending: false })

  return (
    <div>
      <div className="mb-8">
        <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-sky-700">Service schedule</p>
        <h1 className="text-3xl font-bold text-foreground">My Bookings</h1>
        <p className="mt-1 text-text-muted">Every appointment is a chance to leave a great impression.</p>
      </div>
      {bookingsError ? (
        <DataState
          kind="error"
          title="We couldn’t load your bookings."
          description="Please try again in a moment."
        />
      ) : bookings && bookings.length > 0 ? (
        <div className="space-y-3">
        {bookings.map((b: BookingListItem, index) => (
          <Link
            key={b.id}
            href={`/employee/bookings/${b.id}`}
            className={`dashboard-card dashboard-card--${index % 2 ? 'teal' : 'sky'} dashboard-enter block p-5`}
            style={{ animationDelay: `${index * 55}ms` }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="font-semibold text-foreground">
                    {b.customers?.first_name} {b.customers?.last_name}
                  </p>
                  <BookingStatusBadge status={b.booking_status} />
                </div>
                <p className="mt-1 text-sm text-text-muted">
                  {b.vehicles?.year} {b.vehicles?.make} {b.vehicles?.model} · {b.package_label}
                </p>
                <p className="mt-1 text-sm text-text-muted">
                  {new Date(`${b.service_date.slice(0, 10)}T00:00:00`).toLocaleDateString('en-US', {
                    weekday: 'short', month: 'long', day: 'numeric', year: 'numeric'
                  })} at {b.dropoff_time}
                </p>
              </div>
              <p className="ml-4 whitespace-nowrap text-sm font-semibold text-violet-700">
                ${Number(b.quoted_price ?? 0).toFixed(2)}
              </p>
            </div>
          </Link>
        ))}
        </div>
      ) : (
        <DataState kind="empty" title="No bookings yet" description="Appointments assigned to you will appear here." />
      )}
    </div>
  )
}