import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { requireOwner } from '@/lib/employee-auth'
import SiteHeader from '@/components/SiteHeader'

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

  const signOut = async () => {
    'use server'
    const cookieStore = await cookies()
    cookieStore.delete('employee_token')
    redirect('/owner-login')
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader
        links={[
          { href: '/owner/dashboard', label: 'Dashboard' },
          { href: '/owner/bookings', label: 'Bookings' },
          { href: '/owner/employees', label: 'Employees' },
          { href: '/owner/pricing', label: 'Content & Pricing' },
          { href: '/owner/reviews', label: 'Reviews' },
        ]}
        brandHref="/owner/dashboard"
        brandLabel="The Detail Bureau owner dashboard"
        action={
          <div className="site-header__account">
            <div className="site-account">
              {owner.username}
              <span className="site-account__role">Owner</span>
            </div>
            <form action={signOut}>
              <button className="header-secondary-link" type="submit">Sign out</button>
            </form>
          </div>
        }
      />
      <main id="main-content" tabIndex={-1} className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
