import Link from 'next/link'
import { PUBLIC_NAV_LINKS } from '@/lib/site-navigation'
import { SITE_NAME } from '@/lib/site'

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <p>© {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</p>
        <nav aria-label="Footer navigation">
          <ul className="site-footer__links">
            {PUBLIC_NAV_LINKS.map(link => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  )
}
