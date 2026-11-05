import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'
import { CURRENCY, PAYMENT_TYPES, getChargeCents, type PaymentType } from '@/lib/payments'

const TYPE_LABEL: Record<PaymentType, string> = {
  deposit: 'Deposit',
  full: 'Full payment',
  balance: 'Remaining balance',
}

// POST { booking_id, type: 'deposit' | 'full' | 'balance' }  ->  { url }
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { booking_id, type } = await req.json().catch(() => ({}))
  if (!booking_id || !PAYMENT_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  // The booking must belong to the logged-in customer
  const { data: booking } = await adminClient
    .from('bookings')
    .select('id, vehicle_id, package_label, service_date, quoted_price, amount_paid, booking_status')
    .eq('id', booking_id)
    .eq('customer_id', user.id)
    .single()

  if (!booking) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })
  if (booking.booking_status === 'cancelled') {
    return NextResponse.json({ error: 'This booking was cancelled.' }, { status: 400 })
  }

  // The amount is ALWAYS calculated here from the database, never taken from the browser.
  const cents = getChargeCents(type, Number(booking.quoted_price ?? 0), Number(booking.amount_paid ?? 0))
  if (!cents || cents < 50) {
    return NextResponse.json({ error: 'That payment option is not available for this booking.' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) return NextResponse.json({ error: 'Server is missing NEXT_PUBLIC_APP_URL.' }, { status: 500 })

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email ?? undefined,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: CURRENCY,
          unit_amount: cents,
          product_data: {
            name: `${TYPE_LABEL[type as PaymentType]} - ${booking.package_label}`,
            description: `The Detail Bureau appointment on ${booking.service_date}`,
          },
        },
      }],
      metadata: { booking_id: booking.id, payment_type: type, customer_id: user.id },
      success_url: `${appUrl}/vehicles/${booking.vehicle_id}?payment=success`,
      cancel_url: `${appUrl}/vehicles/${booking.vehicle_id}?payment=cancelled`,
    })

    // Record the attempt. The webhook flips it to "succeeded".
    const { error } = await adminClient.from('payments').insert({
      booking_id: booking.id,
      stripe_session_id: session.id,
      type,
      amount: cents / 100,
      currency: CURRENCY,
      status: 'pending',
    })
    if (error) console.error('payments insert error:', error.message)

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: 'Could not start the payment. Please try again.' }, { status: 502 })
  }
}