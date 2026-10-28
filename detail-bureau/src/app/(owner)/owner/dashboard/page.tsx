import { redirect } from 'next/navigation'
import { requireOwner } from '@/lib/employee-auth'

export default async function OwnerDashboardPage() {
  const owner = await requireOwner()
  if (!owner) redirect('/owner-login')

  return (
    <div>
      <h1 className="text-2xl font-bold">Owner Dashboard</h1>
      <p>Welcome, {owner.username}</p>
    </div>
  )
}
