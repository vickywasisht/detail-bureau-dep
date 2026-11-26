'use client'

import { useRouter } from 'next/navigation'
import SiteHeader from '@/components/SiteHeader'

interface Props {
  employee: { id: string; username: string; role: string }
}

const EMPLOYEE_LINKS = [
  { href: '/employee/dashboard', label: 'Dashboard' },
  { href: '/employee/bookings', label: 'Bookings' },
  { href: '/employee/employeeDetails', label: 'My Details' },
]

export default function EmployeeNav({ employee }: Props) {
  const router = useRouter()

  const handleSignOut = async () => {
    await fetch('/api/auth/employee/logout', { method: 'POST' })
    router.push('/employee-login')
    router.refresh()
  }

  return (
    <SiteHeader
      links={EMPLOYEE_LINKS}
      brandHref="/employee/dashboard"
      brandLabel="The Detail Bureau employee dashboard"
      action={
        <div className="site-header__account">
          <div className="site-account">
            {employee.username}
            <span className="site-account__role">{employee.role}</span>
          </div>
          <button className="header-secondary-link" type="button" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      }
    />
  )
}
