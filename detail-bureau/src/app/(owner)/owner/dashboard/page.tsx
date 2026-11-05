import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { requireOwner } from '@/lib/employee-auth'

const sections = [
  {
    href: '/owner/employees',
    title: 'Employees',
    description: 'View, add, deactivate and assign roles to employee accounts.',
  },
  {
    href: '/owner/bookings',
    title: 'Bookings',
    description: 'View all bookings, assign them to employees and update their status.',
  },
  {
    href: '/owner/pricing',
    title: 'Content & Pricing',
    description: 'Update service tier prices and descriptions, and manage add-on services.',
  },
]

export default async function OwnerDashboardPage() {
  const owner = await requireOwner()
  if (!owner) redirect('/owner-login')

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Owner Dashboard</h1>
          <p className="text-gray-700">Welcome, {owner.username}</p>
        </div>
        <form action={async () => {
          'use server'
          ;(await cookies()).delete('employee_token')
          redirect('/owner-login')
        }}>
          <button className="rounded bg-black px-4 py-2 text-white">Log out</button>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map(s => (
          <Link
            key={s.href}
            href={s.href}
            className="block rounded-lg border border-gray-300 p-5 hover:border-black hover:shadow-sm transition"
          >
            <h2 className="text-lg font-semibold">{s.title}</h2>
            <p className="mt-1 text-sm text-gray-700">{s.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
