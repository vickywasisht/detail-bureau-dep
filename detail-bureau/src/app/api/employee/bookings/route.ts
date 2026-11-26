import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { getEmployeeFromToken } from '@/lib/employee-auth'

export async function GET() {
  const employee = await getEmployeeFromToken()
  if (!employee) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await adminClient
    .from('bookings')
    .select('*, vehicles(*), customers(first_name, last_name, email, phone)')
    .eq('employee_id', employee.id)//added this to show only bookings assigned to this employee, done by owner
    .order('service_date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}