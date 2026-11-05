import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // login pages are left crawlable on purpose so their noindex tag can be read
      disallow: [
        '/api/',
        '/dashboard',
        '/vehicles',
        '/profile',
        '/book-service',
        '/booking-pricing',
        '/booking-confirm',
        '/employee/',
        '/owner/',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
