import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { requireOwner } from '@/lib/employee-auth'
import { ownerReviewCreateSchema, parseBody } from '@/lib/validation'

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

  const { data: body, error: validationError } = await parseBody(req, ownerReviewCreateSchema)
  if (validationError) return validationError
  const { reviewer_name, rating, title, comment } = body

  const { data, error } = await adminClient
    .from('reviews')
    .insert({ reviewer_name, rating, title: title || null, comment })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}