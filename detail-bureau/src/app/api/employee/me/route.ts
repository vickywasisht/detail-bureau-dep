import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { getEmployeeFromToken } from '@/lib/employee-auth'
import bcrypt from 'bcryptjs'

export async function GET() {
  const employee = await getEmployeeFromToken()
  if (!employee) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await adminClient
    .from('employees')
    .select('id, username, first_name, last_name, role, is_active, created_at')
    .eq('id', employee.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const employee = await getEmployeeFromToken()
  if (!employee) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { first_name, last_name, current_password, new_password } = body

  const updates: Record<string, unknown> = {}
  if (first_name !== undefined) updates.first_name = first_name
  if (last_name !== undefined) updates.last_name = last_name

  if (new_password) {
    if (!current_password) {
      return NextResponse.json({ error: 'Current password is required to set a new password.' }, { status: 400 })
    }
    if (new_password.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 400 })
    }

    const { data: row, error: fetchError } = await adminClient
      .from('employees')
      .select('password_hash')
      .eq('id', employee.id)
      .single()

    if (fetchError || !row) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const valid = await bcrypt.compare(current_password, row.password_hash)
    if (!valid) return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 })

    updates.password_hash = await bcrypt.hash(new_password, 10)
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No changes provided.' }, { status: 400 })
  }

  const { data, error } = await adminClient
    .from('employees')
    .update(updates)
    .eq('id', employee.id)
    .select('id, username, first_name, last_name, role, is_active, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
