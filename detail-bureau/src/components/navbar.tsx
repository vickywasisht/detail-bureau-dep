'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/authContext'
import SiteHeader from '@/components/SiteHeader'
import { PUBLIC_NAV_LINKS } from '@/lib/site-navigation'

export default function Navbar() {
  const router = useRouter()
  const supabase = createClient()
  const { session } = useAuth()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <SiteHeader
      links={[
        ...PUBLIC_NAV_LINKS,
        ...(session
          ? [
              { label: 'My Vehicles', href: '/dashboard' },
              { label: 'My Account', href: '/profile' },
            ]
          : []),
      ]}
      action={
        session ? (
          <button className="header-secondary-link" type="button" onClick={handleSignOut}>
            Sign Out
          </button>
        ) : (
          <Link className="header-secondary-link" href="/login">
            Sign In
          </Link>
        )
      }
    />
  )
}