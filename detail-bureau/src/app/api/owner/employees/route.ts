import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { adminClient } from '@/lib/supabase/admin'
import { requireOwner } from '@/lib/employee-auth'

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

  const { username, first_name, last_name, email, password, role } = await req.json()

  if (!username || !first_name || !last_name || !email || !password) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }
  if (!['owner', 'employee'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role.' }, { status: 400 })
  }

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
