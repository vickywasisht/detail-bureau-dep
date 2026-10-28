import { redirect } from 'next/navigation'
import { requireOwner } from '@/lib/employee-auth'

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const owner = await requireOwner()
  if (!owner) redirect('/owner-login')

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
