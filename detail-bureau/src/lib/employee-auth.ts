import { cache } from 'react'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { adminClient } from './supabase/admin'

export interface EmployeePayload {
  id: string
  username: string
  role: 'owner' | 'employee'
}

// cache() dedupes the DB check when a layout and page both call this in one request
export const getEmployeeFromToken = cache(async (): Promise<EmployeePayload | null> => {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('employee_token')?.value
    if (!token) return null
    const payload = jwt.verify(token, process.env.EMPLOYEE_JWT_SECRET!) as EmployeePayload
    //double check straight from db if the employee is still active
    const { data } = await adminClient
      .from('employees').select('id, username, role, is_active')
      .eq('id', payload.id).single()
    if (!data || !data.is_active) return null
    return { id: data.id, username: data.username, role: data.role } as EmployeePayload
  } catch {
    return null
  }
})

export async function requireOwner() {
  const e = await getEmployeeFromToken()
  return e?.role === 'owner' ? e : null
}
