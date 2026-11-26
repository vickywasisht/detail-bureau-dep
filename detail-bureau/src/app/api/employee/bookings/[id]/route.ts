import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { getEmployeeFromToken } from '@/lib/employee-auth'
import { employeeBookingUpdateSchema, parseBody } from '@/lib/validation'

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const employee = await getEmployeeFromToken()
  if (!employee) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await adminClient
    .from('bookings')
    .select('*, vehicles(*), customers(first_name, last_name, email, phone)')
    .eq('id', id)
    .eq('employee_id', employee.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const employee = await getEmployeeFromToken()
  if (!employee) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await parseBody(req, employeeBookingUpdateSchema)
  if (body.error) return body.error
  const updates: Record<string, unknown> = {}
  if (body.data.booking_status !== undefined) updates.booking_status = body.data.booking_status
  if (body.data.final_price !== undefined) updates.final_price = body.data.final_price

  const { data, error } = await adminClient
    .from('bookings')
    .update(updates)
    .eq('id', id)
    .eq('employee_id', employee.id)//ensure employee can only update its own assigned services
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}