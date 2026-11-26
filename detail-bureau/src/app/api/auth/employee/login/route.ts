import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { employeeLoginSchema, parseBody } from '@/lib/validation'
import { checkLoginLock, getClientIp, recordLoginFailure, recordLoginSuccess } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const { data, error: validationError } = await parseBody(req, employeeLoginSchema)
  if (validationError) return validationError
  const { username, password, portal } = data

  const throttleKey = `${getClientIp(req)}:${username.toLowerCase()}`
  const lock = checkLoginLock(throttleKey)
  if (lock.locked) {
    return NextResponse.json(
      { error: `Too many failed attempts. Try again in ${lock.retryAfterSeconds} seconds.` },
      { status: 429 }
    )
  }

  const { data: employee, error } = await adminClient
    .from('employees')
    .select('*')
    .eq('username', username)
    .eq('is_active', true)
    .single()

  if (error || !employee) {
    recordLoginFailure(throttleKey)
    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, employee.password_hash)
  if (!valid || (portal === 'owner' && employee.role !== 'owner')) {
    recordLoginFailure(throttleKey)
    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
  }

  recordLoginSuccess(throttleKey)

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