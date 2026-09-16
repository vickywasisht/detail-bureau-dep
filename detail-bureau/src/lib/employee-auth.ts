import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

export interface EmployeePayload {
  id: string
  username: string
  role: 'owner' | 'employee'
}

export async function getEmployeeFromToken(): Promise<EmployeePayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('employee_token')?.value
    if (!token) return null
    const payload = jwt.verify(token, process.env.EMPLOYEE_JWT_SECRET!) as EmployeePayload
    return payload
  } catch {
    return null
  }
}