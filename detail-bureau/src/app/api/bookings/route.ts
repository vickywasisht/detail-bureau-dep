import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import nodemailer from 'nodemailer'
import { bookingCreateSchema, escapeHtml, PACKAGE_LABELS, parseBody } from '@/lib/validation'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('bookings')
    .select('*, vehicles(*)')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: body, error: validationError } = await parseBody(req, bookingCreateSchema)
  if (validationError) return validationError
  const { vehicle_id, package_slug, service_date, dropoff_time, special_notes, addon_ids } = body

  // the vehicle must belong to the logged-in customer (never trust a vehicle_id across accounts)
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('id, vehicle_type')
    .eq('id', vehicle_id)
    .eq('customer_id', user.id)
    .single()
  if (!vehicle) return NextResponse.json({ error: 'Vehicle not found.' }, { status: 404 })

  // the base price and label always come from the server, never the client
  const { data: pricingRow } = await adminClient
    .from('service_pricing')
    .select('price, duration_hours')
    .eq('package_slug', package_slug)
    .eq('vehicle_type', vehicle.vehicle_type)
    .maybeSingle()
  if (!pricingRow) {
    return NextResponse.json({ error: 'Pricing is not available for this package and vehicle type.' }, { status: 400 })
  }
  const package_label = PACKAGE_LABELS[package_slug]
  const duration_hours = pricingRow.duration_hours

  // add-on prices are looked up server-side so a customer can't send their own
  let addons: { id: string; name: string; description: string | null; price: number }[] = []
  if (addon_ids && addon_ids.length > 0) {
    const { data } = await adminClient.from('addons').select('id, name, description, price').in('id', addon_ids)
    addons = (data ?? []).map(a => ({ id: a.id, name: a.name, description: a.description, price: Number(a.price) }))
  }
  const totalPrice = Number(pricingRow.price) + addons.reduce((n, a) => n + a.price, 0)

  const { data: booking, error } = await adminClient
    .from('bookings')
    .insert({
      customer_id: user.id,
      vehicle_id,
      package_slug,
      package_label,
      service_date,
      dropoff_time,
      duration_hours,
      quoted_price: totalPrice,
      special_notes,
      addons,
      booking_status: 'pending',
    })
    .select('*, vehicles(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Send confirmation email
  try {
    const { data: customer } = await adminClient
      .from('customers')
      .select('first_name, last_name, email')
      .eq('id', user.id)
      .single()

    if (customer) {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      })

      const formattedDate = new Date(service_date).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      })

      // escape anything the customer typed before it goes into the HTML email
      const safeFirstName = escapeHtml(customer.first_name)
      const safeNotes = special_notes ? escapeHtml(special_notes) : ''

      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: customer.email,
        subject: 'Your Booking is Confirmed – The Detail Bureau',
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="UTF-8">
          <style>
            body{margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif}
            .wrap{max-width:600px;margin:30px auto;background:#fff;border-radius:10px;overflow:hidden}
            .hdr{background:#111;padding:32px 40px;text-align:center}
            .hdr h1{color:#fff;margin:0;font-size:22px;letter-spacing:.05em}
            .hdr p{color:#aaa;margin:6px 0 0;font-size:13px}
            .body{padding:36px 40px}
            .sec-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#999;margin:24px 0 10px}
            table{width:100%;border-collapse:collapse}
            td{padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px}
            td:first-child{color:#888;width:40%}
            td:last-child{color:#111;font-weight:600}
            .price td:last-child{color:#2271b1;font-size:16px}
            .cta{text-align:center;margin:32px 0 8px}
            .btn{display:inline-block;padding:14px 32px;background:#2271b1;color:#fff!important;text-decoration:none;border-radius:6px;font-weight:700}
            .ftr{background:#f9f9f9;padding:20px 40px;text-align:center;border-top:1px solid #eee}
            .ftr p{font-size:12px;color:#aaa;margin:4px 0}
          </style>
          </head>
          <body>
          <div class="wrap">
            <div class="hdr">
              <h1>The Detail Bureau</h1>
              <p>Professional Auto Detailing</p>
            </div>
            <div class="body">
              <p style="font-size:16px;color:#333">Hi ${safeFirstName},</p>
              <p style="color:#555;font-size:15px;line-height:1.6">Your booking has been received! Here's your appointment summary.</p>
              <div class="sec-title">Vehicle</div>
              <table>
                <tr><td>Vehicle</td><td>${booking.vehicles?.year} ${escapeHtml(booking.vehicles?.make ?? '')} ${escapeHtml(booking.vehicles?.model ?? '')}</td></tr>
              </table>
              <div class="sec-title">Appointment</div>
              <table>
                <tr><td>Package</td><td>${package_label}</td></tr>
                <tr><td>Date</td><td>${formattedDate}</td></tr>
                <tr><td>Drop-off time</td><td>${dropoff_time}</td></tr>
                ${duration_hours ? `<tr><td>Est. duration</td><td>${duration_hours} hours</td></tr>` : ''}
                ${addons.map(a => `<tr><td>Add-on</td><td>${escapeHtml(a.name)} (+$${a.price.toFixed(2)})</td></tr>`).join('')}
                <tr class="price"><td>Quoted price</td><td>$${totalPrice.toFixed(2)}*</td></tr>
              </table>
              ${safeNotes ? `<div class="sec-title">Your notes</div><p style="background:#f9f9f9;border-left:3px solid #ddd;padding:12px 16px;font-size:14px;color:#555">${safeNotes}</p>` : ''}
              <div class="cta">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/vehicles" class="btn">View My Bookings</a>
              </div>
              <p style="font-size:12px;color:#aaa;text-align:center;margin-top:16px">* Final price confirmed at drop-off.</p>
            </div>
            <div class="ftr">
              <p>The Detail Bureau</p>
              <p>Questions? Reply to this email.</p>
            </div>
          </div>
          </body>
          </html>
        `,
      })

      await adminClient
        .from('bookings')
        .update({ email_sent: true })
        .eq('id', booking.id)
    }
  } catch (emailErr) {
    console.error('Email error:', emailErr)
  }

  return NextResponse.json(booking, { status: 201 })
}