import type { MetadataRoute } from 'next'
import { PUBLIC_ROUTES, SITE_URL } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.map(route => ({
    url: route === '/' ? SITE_URL : `${SITE_URL}${route}`,
    changeFrequency: route === '/' || route === '/packages' ? 'weekly' : 'monthly',
    priority: route === '/' ? 1 : route === '/packages' ? 0.9 : 0.6,
  }))
}
