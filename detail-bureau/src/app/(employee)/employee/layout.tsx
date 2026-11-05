import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getEmployeeFromToken } from '@/lib/employee-auth'
import EmployeeNav from '@/components/EmployeeNav'

export const metadata: Metadata = {
  title: 'Employee Portal',
  robots: { index: false, follow: false },
}

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const employee = await getEmployeeFromToken()
  if (!employee) redirect('/employee-login')
    
  return (
    <div className="min-h-screen bg-white">
      <EmployeeNav employee={employee} />
      <main id="main-content" tabIndex={-1} className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}