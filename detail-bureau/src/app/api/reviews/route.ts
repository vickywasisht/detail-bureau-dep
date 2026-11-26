import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

// POST { booking_id, rating, title?, comment }  (logged-in customers only)
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const rating = Number(body.rating)
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const comment = typeof body.comment === 'string' ? body.comment.trim() : ''

  if (!body.booking_id) return NextResponse.json({ error: 'Missing booking.' }, { status: 400 })
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be between 1 and 5.' }, { status: 400 })
  }
  if (comment.length < 10 || comment.length > 1000) {
    return NextResponse.json({ error: 'Review must be between 10 and 1000 characters.' }, { status: 400 })
  }
  if (title.length > 100) return NextResponse.json({ error: 'Title is too long.' }, { status: 400 })

  // Only your own COMPLETED booking can be reviewed
  const { data: booking } = await adminClient
    .from('bookings')
    .select('id, booking_status')
    .eq('id', body.booking_id)
    .eq('customer_id', user.id)
    .single()
  if (!booking) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })
  if (booking.booking_status !== 'completed') {
    return NextResponse.json({ error: 'You can review a service once it is completed.' }, { status: 400 })
  }

  // Public display name = first name + last initial (never the email)
  const { data: customer } = await adminClient
    .from('customers').select('first_name, last_name').eq('id', user.id).single()
  const reviewer_name = customer
    ? `${customer.first_name}${customer.last_name ? ` ${customer.last_name[0]}.` : ''}`
    : 'Customer'

  const { error } = await adminClient.from('reviews').insert({
    booking_id: booking.id,
    customer_id: user.id,
    reviewer_name,
    rating,
    title: title || null,
    comment,
  })

  if (error) {
    // 23505 = unique violation => this booking already has a review
    if (error.code === '23505') return NextResponse.json({ error: 'You already reviewed this service.' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true }, { status: 201 })
} 