import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { adminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'

export const runtime = 'nodejs'

// Stripe calls this URL after every payment event. This (not the success page)
// is the only thing that marks a booking as paid.
export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!signature || !secret) return NextResponse.json({ error: 'Not configured.' }, { status: 400 })

  // Signature verification needs the RAW body, so use text(), not json()
  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, secret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.payment_status === 'paid') await markSessionPaid(session)
        break
      }
      case 'checkout.session.expired':
      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session
        await adminClient
          .from('payments')
          .update({ status: event.type === 'checkout.session.expired' ? 'expired' : 'failed' })
          .eq('stripe_session_id', session.id)
          .eq('status', 'pending')
        break
      }
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        const intentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id
        if (intentId && charge.refunded) await markIntentRefunded(intentId)
        break
      }
    }
  } catch (err) {
    // A non-200 makes Stripe retry later, which is what we want for a DB hiccup
    console.error('Stripe webhook error:', err)
    return NextResponse.json({ error: 'Webhook handler failed.' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function markSessionPaid(session: Stripe.Checkout.Session) {
  const bookingId = session.metadata?.booking_id
  if (!bookingId) return

  const intentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null

  // upsert on the unique session id => safe if Stripe sends the event twice
  const { error } = await adminClient.from('payments').upsert(
    {
      booking_id: bookingId,
      stripe_session_id: session.id,
      stripe_payment_intent_id: intentId,
      type: session.metadata?.payment_type ?? 'full',
      amount: (session.amount_total ?? 0) / 100,
      currency: session.currency ?? 'cad',
      status: 'succeeded',
    },
    { onConflict: 'stripe_session_id' }
  )
  if (error) throw error

  await recalcBooking(bookingId)
}

async function markIntentRefunded(intentId: string) {
  const { data, error } = await adminClient
    .from('payments')
    .update({ status: 'refunded' })
    .eq('stripe_payment_intent_id', intentId)
    .select('booking_id')
  if (error) throw error
  for (const row of data ?? []) await recalcBooking(row.booking_id)
}

// Rebuild the booking's payment fields from the payments table (idempotent)
async function recalcBooking(bookingId: string) {
  const [{ data: payments }, { data: booking }] = await Promise.all([
    adminClient.from('payments').select('amount, status').eq('booking_id', bookingId),
    adminClient.from('bookings').select('quoted_price').eq('id', bookingId).single(),
  ])

  const paid = (payments ?? []).filter(p => p.status === 'succeeded').reduce((n, p) => n + Number(p.amount), 0)
  const anyRefunded = (payments ?? []).some(p => p.status === 'refunded')
  const total = Number(booking?.quoted_price ?? 0)

  let status: 'unpaid' | 'deposit_paid' | 'paid' | 'refunded' = 'unpaid'
  if (paid > 0) status = paid + 0.001 >= total ? 'paid' : 'deposit_paid'
  else if (anyRefunded) status = 'refunded'

  const { error } = await adminClient
    .from('bookings')
    .update({ payment_status: status, amount_paid: paid })
    .eq('id', bookingId)
  if (error) throw error
}