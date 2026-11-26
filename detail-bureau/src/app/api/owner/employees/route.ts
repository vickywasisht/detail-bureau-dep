import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { adminClient } from '@/lib/supabase/admin'
import { requireOwner } from '@/lib/employee-auth'
import { employeeCreateSchema, parseBody } from '@/lib/validation'

const FIELDS = 'id, username, first_name, last_name, email, role, is_active, created_at'

export async function GET() {
  const owner = await requireOwner()
  if (!owner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await adminClient
    .from('employees').select(FIELDS).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const owner = await requireOwner()
  if (!owner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: body, error: validationError } = await parseBody(req, employeeCreateSchema)
  if (validationError) return validationError
  const { username, first_name, last_name, email, password, role } = body

  const { data: existing } = await adminClient
    .from('employees').select('id').eq('username', username).maybeSingle()
  if (existing) return NextResponse.json({ error: 'Username already taken.' }, { status: 409 })

  const password_hash = await bcrypt.hash(password, 10)
  const { data, error } = await adminClient
    .from('employees')
    .insert({ username, first_name, last_name, email: email.trim().toLowerCase(), role, password_hash, is_active: true })
    .select(FIELDS).single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
