import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password required.' }, { status: 400 })
  }

  const { data: employee, error } = await adminClient
    .from('employees')
    .select('*')
    .eq('username', username)
    .eq('is_active', true)
    .single()

  if (error || !employee) {
    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, employee.password_hash)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
  }

  const token = jwt.sign(
    { id: employee.id, username: employee.username, role: employee.role },
    process.env.EMPLOYEE_JWT_SECRET!,
    { expiresIn: '8h' }
  )

  const response = NextResponse.json({
    success: true,
    employee: {
      id: employee.id,
      username: employee.username,
      first_name: employee.first_name,
      last_name: employee.last_name,
      role: employee.role,
    }
  })

  response.cookies.set('employee_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    path: '/',
  })

  return response
}