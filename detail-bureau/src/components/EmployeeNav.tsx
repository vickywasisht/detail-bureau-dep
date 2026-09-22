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
    ]

    return (
        <nav className="border-b border-gray-800 bg-gray-900">
            <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <span className="text-white font-semibold tracking-widest text-sm uppercase">
                        Detail Bureau <span className="text-gray-500 font-normal">Staff</span>
                    </span>
                    <div className="flex items-center gap-1">
                        {links.map(link => (
                            <Link key={link.href} href={link.href}
                                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${pathname.startsWith(link.href) ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-gray-400 text-sm">{employee.username}</span>
                    <span className="text-gray-500 text-sm capitalize">{employee.role}</span>
                    <button onClick={handleSignOut} className="text-gray-500 hover:text-white text-sm transition-colors">Sign out</button>
                </div>
            </div>
        </nav>
    )
}