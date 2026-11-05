import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ReviewForm from '@/components/ReviewForm'

export default async function WriteReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ booking_id?: string }>
}) {
  const { booking_id } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!booking_id) notFound()

  // Row-level security + the customer_id filter => you can only review your own bookings
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, package_label, service_date, booking_status, vehicle_id')
    .eq('id', booking_id)
    .eq('customer_id', user.id)
    .single()

  if (!booking || booking.booking_status !== 'completed') notFound()

  const { data: existing } = await supabase.from('reviews').select('id').eq('booking_id', booking.id).maybeSingle()

  return (
    <div className="max-w-lg mx-auto">
      <Link href={`/vehicles/${booking.vehicle_id}`} className="text-gray-600 hover:text-black text-sm">← Back to vehicle</Link>
      <h1 className="text-2xl font-semibold text-black mt-3">Leave a review</h1>
      <p className="text-gray-600 text-sm mt-1 mb-6">
        {booking.package_label} ·{' '}
        {new Date(booking.service_date.length === 10 ? `${booking.service_date}T00:00:00` : booking.service_date)
          .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
      </p>

      {existing ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-sm text-gray-700">
          You have already reviewed this service. Thank you!{' '}
          <Link href="/reviews" className="text-blue-600 hover:text-blue-700">See all reviews</Link>
        </div>
      ) : (
        <ReviewForm bookingId={booking.id} />
      )}
    </div>
  )
}