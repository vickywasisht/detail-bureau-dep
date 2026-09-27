'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

interface Props {
    employee: { id: string; username: string; role: string }
}

export default function EmployeeNav({ employee }: Props) {
    const pathname = usePathname()
    const router = useRouter()

    const handleSignOut = async () => {
        await fetch('/api/auth/employee/logout', { method: 'POST' })
        router.push('/employee-login')
        router.refresh()
    }

    const links = [
        { href: '/employee/dashboard', label: 'Dashboard' },
        { href: '/employee/bookings', label: 'Bookings' },
        { href: '/employee/employeeDetails', label: 'My Details' },
    ]

    return (
        <header className="bg-white border-b border-gray-200">
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <Link href="/employee/dashboard" className="text-black font-medium text-base">
                        The Detail Bureau
                    </Link>
                    <div className="flex items-center gap-6">
                        {links.map(link => (
                            <Link key={link.href} href={link.href}
                                className={`text-sm transition-opacity ${pathname.startsWith(link.href) ? 'text-black' : 'text-gray-600 hover:opacity-60'}`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <div className="text-sm text-black font-medium">{employee.username}</div>
                        <div className="text-xs text-gray-600 capitalize">{employee.role}</div>
                    </div>
                    <button onClick={handleSignOut} className="text-sm font-medium px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors">
                        Sign out
                    </button>
                </div>
            </div>
        </header>
    )
}