import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import ServiceDetailsButton from '@/components/ServiceDetails'
import BookingPayment from '@/components/BookingPayment'
import { BookingStatusBadge } from '@/components/StatusBadge'
import DataState from '@/components/DataState'
import type { PaymentStatus } from '@/lib/payments'

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
  payment_status?: PaymentStatus
  amount_paid?: number
}

export default async function VehicleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ payment?: string }>
}) {
  const { id } = await params
  const { payment } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: vehicle, error: vehicleError } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .eq('customer_id', user.id)
    .single()

  if (vehicleError && vehicleError.code !== 'PGRST116') {
    return <DataState kind="error" title="We couldn’t load this vehicle." description="Please try again in a moment." />
  }
  if (!vehicle) notFound()

  const { data: bookings, error: bookingsError } = await supabase
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

  // which completed bookings already have a review?
  const historyIds = history.map((b: Booking) => b.id)
  const { data: reviewed, error: reviewsError } = historyIds.length
    ? await supabase.from('reviews').select('booking_id').in('booking_id', historyIds)
    : { data: [] as { booking_id: string }[], error: null }
  const reviewedIds = new Set((reviewed ?? []).map(r => r.booking_id))

  const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`

  return (
    <div>
      {payment === 'success' && (
        <div role="status" className="ui-alert ui-alert--success mb-6">
          Payment received, thank you! It can take a few seconds to show up below.
        </div>
      )}
      {payment === 'cancelled' && (
        <div role="status" className="ui-alert ui-alert--warning mb-6">
          Payment was cancelled. Your booking is saved and you can pay any time below.
        </div>
      )}
      {payment === 'error' && (
        <div role="alert" className="ui-alert ui-alert--error mb-6">
          Your booking is saved, but we couldn&apos;t start the payment. Please try again below.
        </div>
      )}
      <div className="mb-6">
        <Link href="/dashboard" className="text-text-muted hover:text-foreground text-sm transition-colors">
          ← Back to My Vehicles
        </Link>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h1>
            <p className="mt-1 text-text-muted text-sm">
              {vehicle.vehicle_type}{vehicle.color ? ` · ${vehicle.color}` : ''}
            </p>
          </div>
          <Link
            href={`/book-service?vehicle_id=${vehicle.id}`}
            className="dashboard-action"
          >
            <span aria-hidden="true">✨</span> Book a Service
          </Link>
        </div>
      </div>

      {bookingsError ? (
        <DataState
          kind="error"
          title="We couldn’t load this vehicle’s bookings."
          description="Please try again in a moment."
        />
      ) : (
      <>
      {/* Scheduled Bookings */}
      <section className="mb-10">
        <h2 className="mb-4 border-b border-violet-100 pb-2 text-xl font-bold text-foreground">
          Scheduled
        </h2>
        {scheduled.length > 0 ? (
          <div className="space-y-3">
            {scheduled.map((booking: Booking, index) => (
              <div
                key={booking.id}
                className={`dashboard-card dashboard-card--${['sky', 'violet', 'teal'][index % 3]} dashboard-enter p-5`}
                style={{ animationDelay: `${index * 55}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-foreground">
                    {PACKAGE_LABELS[booking.package_slug] ?? booking.package_label}
                  </h3>
                  <BookingStatusBadge status={booking.booking_status} />
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-text-muted">
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
                <BookingPayment
                  bookingId={booking.id}
                  total={Number(booking.quoted_price ?? 0)}
                  amountPaid={Number(booking.amount_paid ?? 0)}
                  status={booking.payment_status ?? 'unpaid'}
                />
                {booking.special_notes && (
                  <p className="text-gray-500 text-sm mt-3 border-t border-gray-200 pt-3">
                    {booking.special_notes}
                  </p>
                )}
                <div className="mt-3 border-t border-gray-200 pt-3">
                  <ServiceDetailsButton
                    service={{ ...booking, vehicle: vehicleName }}
                    label="View full details"
                    className="text-primary hover:opacity-75 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="dashboard-empty">
            <div className="mb-3 text-4xl" aria-hidden="true">🗓️</div>
            <p className="font-semibold text-foreground">Nothing on the calendar yet</p>
            <p className="mt-1 text-sm text-text-muted">Book your next detail whenever you&apos;re ready.</p>
            <Link
              href={`/book-service?vehicle_id=${vehicle.id}`}
              className="dashboard-action mt-4"
            >
              Book a service →
            </Link>
          </div>
        )}
      </section>

      {/* Service History */}
      <section>
        <h2 className="mb-4 border-b border-violet-100 pb-2 text-xl font-bold text-foreground">
          Service History
        </h2>
        {reviewsError && (
          <DataState
            kind="error"
            title="Review status is unavailable."
            description="You can still view your history, but review links are temporarily hidden."
            className="mb-4"
          />
        )}
        {history.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="dashboard-table min-w-[640px] text-sm">
              <thead>
                <tr className="text-left">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Service</th>
                  <th className="pb-3 font-medium">Technician</th>
                  <th className="pb-3 font-medium text-right">Cost</th>
                  <th className="pb-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
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
                    <td className="py-3 text-right space-x-3">
                      {reviewsError ? (
                        <span className="text-sm text-text-muted">Review unavailable</span>
                      ) : reviewedIds.has(booking.id) ? (
                        <span className="text-gray-500 text-sm">Reviewed ✓</span>
                      ) : (
                        <Link href={`/write-review?booking_id=${booking.id}`} className="text-blue-600 hover:text-blue-700 text-sm">
                          Leave a review
                        </Link>
                      )}
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
          <DataState kind="empty" title="Your first shine is still ahead" description="Completed details will appear here." />
        )}
      </section>
      </>
      )}
    </div>
  )
}