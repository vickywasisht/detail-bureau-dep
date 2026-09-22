'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import './navbar.css'
import { useAuth } from '@/context/authContext'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  // const [user, setUser] = useState<null | { email: string }>(null)
  const { user, session } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)


  /// --------------------useEffect for user session is not needed anymore as we have implemented authContext.
  
  
  // useEffect(() => {
  //   supabase.auth.getUser().then(({ data }) => {
  //     setUser(data.user ? { email: data.user.email ?? '' } : null)
  //   })
  //   const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
  //     setUser(session?.user ? { email: session.user.email ?? '' } : null)
  //   })
  //   return () => listener.subscription.unsubscribe()
  // }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const publicLinks = [
    { label: 'About', href: '/about' },
    { label: 'Packages', href: '/packages' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'FAQs', href: '/faqs' },
  ]

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="site-brand" href="/" aria-label="The Detail Bureau home">
          The Detail Bureau
        </Link>

        <div className="site-header__actions">
          <nav className="site-navigation" aria-label="Main navigation">
            <ul className="site-navigation__list">
              {publicLinks.map(link => (
                <li className="site-navigation__item" key={link.href}>
                  <Link
                    className={`site-navigation__link ${pathname === link.href ? 'active' : ''}`}
                    href={link.href}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              {session && (
                <li className="site-navigation__item">
                  <Link className="site-navigation__link" href="/dashboard">
                    My Vehicles
                  </Link>
                </li>
              )}
            </ul>
          </nav>

          {session ? (
            <button className="header-secondary-link" onClick={handleSignOut}>
              Sign Out
            </button>
          ) : (
            <Link className="header-secondary-link" href="/login">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}