import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { customerCreateSchema, parseBody } from '@/lib/validation'

export async function POST(req: NextRequest) {
  try {
    const { data, error: validationError } = await parseBody(req, customerCreateSchema)
    if (validationError) return validationError
    const { id, first_name, last_name, email, phone } = data

    const { error } = await adminClient
      .from('customers')
      .insert({ id, first_name, last_name, email, phone: phone || null })

    if (error) {
      console.error('Customer insert error:', error)
      return NextResponse.json(
        { error: 'Failed to create customer profile.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    )
  }
}