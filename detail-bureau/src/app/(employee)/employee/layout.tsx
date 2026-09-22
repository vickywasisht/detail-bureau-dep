import { redirect } from 'next/navigation'
import { getEmployeeFromToken } from '@/lib/employee-auth'
import EmployeeNav from '@/components/EmployeeNav'

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const employee = await getEmployeeFromToken()
  if (!employee) redirect('/employee/login')

  return (
    <div className="min-h-screen bg-gray-950">
      <EmployeeNav employee={employee} />
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}