'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, type ReactNode } from 'react'

interface SiteHeaderProps {
  links: readonly { label: string; href: string }[]
  action?: ReactNode
  brandHref?: string
  brandLabel?: string
}

export default function SiteHeader({
  links,
  action,
  brandHref = '/',
  brandLabel = 'The Detail Bureau home',
}: SiteHeaderProps) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link
          className="site-brand"
          href={brandHref}
          aria-label={brandLabel}
          onClick={() => setMenuOpen(false)}
        >
          The Detail Bureau
        </Link>

        <button
          className="site-menu-toggle"
          type="button"
          aria-controls="site-navigation"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setMenuOpen(open => !open)}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            {menuOpen ? (
              <path d="m6 6 12 12M18 6 6 18" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        <div className={`site-header__content${menuOpen ? ' site-header__content--open' : ''}`}>
          <nav id="site-navigation" className="site-navigation" aria-label="Main navigation">
            <ul className="site-navigation__list">
              {links.map(link => {
                const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`)

                return (
                  <li className="site-navigation__item" key={link.href}>
                    <Link
                      className={`site-navigation__link${isActive ? ' active' : ''}`}
                      href={link.href}
                      aria-current={pathname === link.href ? 'page' : undefined}
                      onClick={() => setMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
          {action && (
            <div className="site-header__actions" onClick={() => setMenuOpen(false)}>
              {action}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
