import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { requireOwner } from '@/lib/employee-auth'

export const metadata: Metadata = {
  title: 'Owner Portal',
  robots: { index: false, follow: false },
}

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const owner = await requireOwner()
  if (!owner) redirect('/owner-login')

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main id="main-content" tabIndex={-1} className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
