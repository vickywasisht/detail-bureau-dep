import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { requireOwner } from '@/lib/employee-auth'

// All reviews, including hidden ones
export async function GET() {
  const owner = await requireOwner()
  if (!owner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await adminClient
    .from('reviews')
    .select('id, booking_id, reviewer_name, rating, title, comment, is_visible, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// Owner adds a testimonial that didn't come through a booking
export async function POST(req: NextRequest) {
  const owner = await requireOwner()
  if (!owner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const rating = Number(body.rating)
  const reviewer_name = typeof body.reviewer_name === 'string' ? body.reviewer_name.trim() : ''
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const comment = typeof body.comment === 'string' ? body.comment.trim() : ''

  if (!reviewer_name) return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be between 1 and 5.' }, { status: 400 })
  }
  if (comment.length < 10 || comment.length > 1000) {
    return NextResponse.json({ error: 'Review must be between 10 and 1000 characters.' }, { status: 400 })
  }

  const { data, error } = await adminClient
    .from('reviews')
    .insert({ reviewer_name, rating, title: title || null, comment })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}