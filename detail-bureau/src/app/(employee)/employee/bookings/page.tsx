import { adminClient } from '@/lib/supabase/admin'
import { getEmployeeFromToken } from '@/lib/employee-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

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

export default async function EmployeeBookingsPage() {
  const employee = await getEmployeeFromToken()
  if (!employee) redirect('/employee/login')

  const { data: bookings } = await adminClient
    .from('bookings')
    .select('*, vehicles(*), customers(first_name, last_name, email)')
    .order('service_date', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-semibold text-black mb-8">All Bookings</h1>
      <div className="space-y-3">
        {bookings?.map((b: BookingListItem) => (
          <Link
            key={b.id}
            href={`/employee/bookings/${b.id}`}
            className="block bg-white border border-gray-200 hover:border-gray-400 rounded-xl p-5 shadow-sm transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-black font-medium">
                    {b.customers?.first_name} {b.customers?.last_name}
                  </p>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[b.booking_status]}`}>
                    {STATUS_LABELS[b.booking_status]}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mt-1">
                  {b.vehicles?.year} {b.vehicles?.make} {b.vehicles?.model} · {b.package_label}
                </p>
                <p className="text-gray-500 text-sm mt-0.5">
                  {new Date(b.service_date).toLocaleDateString('en-US', {
                    weekday: 'short', month: 'long', day: 'numeric', year: 'numeric'
                  })} at {b.dropoff_time}
                </p>
              </div>
              <p className="text-gray-600 text-sm ml-4">
                ${Number(b.quoted_price ?? 0).toFixed(2)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}