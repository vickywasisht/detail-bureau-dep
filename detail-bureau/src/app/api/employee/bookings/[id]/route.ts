import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { getEmployeeFromToken } from '@/lib/employee-auth'

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

  const body = await req.json()
  const allowed = ['booking_status', 'final_price']//no longer allowed to change emp id(aka assignment)
  const updates: Record<string, unknown> = {}
  allowed.forEach(key => { if (body[key] !== undefined) updates[key] = body[key] })

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