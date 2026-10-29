import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireOwner } from '@/lib/employee-auth'

const sections = [
  {
    href: '/owner/employees',
    title: 'Employees',
    description: 'View, add, deactivate and assign roles to employee accounts.',
  },
]

export default async function OwnerDashboardPage() {
  const owner = await requireOwner()
  if (!owner) redirect('/owner-login')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Owner Dashboard</h1>
        <p className="text-gray-700">Welcome, {owner.username}</p>
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
