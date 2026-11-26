export const SITE_NAME = 'The Detail Bureau'
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')
export const SITE_DESCRIPTION =
  'Premium auto detailing services, from express shine to full ceramic coating. Book online with The Detail Bureau today.'

// Public pages that belong in the sitemap
export const PUBLIC_ROUTES = ['/', '/packages', '/gallery', '/about', '/faqs'] as const

// Business details come from env vars so real values are never guessed.
// Set these in .env.local / the hosting dashboard. Google needs an address
// (or service area) and a phone number for LocalBusiness rich results.
const env = (name: string) => process.env[name]?.trim() || undefined

const SERVICES = [
  { name: 'Basic – Express Shine', description: 'Essential detailing for regular maintenance and light cleaning needs.' },
  { name: 'Value – Complete Care', description: 'A thorough inside-and-out detail that restores your vehicle’s appearance.' },
  { name: 'Premium – Ultimate Protection', description: 'Paint correction and ceramic coating for long-lasting protection.' },
]

export function buildLocalBusinessJsonLd() {
  const street = env('NEXT_PUBLIC_BUSINESS_STREET')
  const city = env('NEXT_PUBLIC_BUSINESS_CITY')
  const region = env('NEXT_PUBLIC_BUSINESS_REGION')
  const postalCode = env('NEXT_PUBLIC_BUSINESS_POSTAL_CODE')
  const country = env('NEXT_PUBLIC_BUSINESS_COUNTRY')
  const hasAddress = street || city || region || postalCode || country

  const data = {
    '@context': 'https://schema.org',
    '@type': 'AutomotiveBusiness',
    '@id': `${SITE_URL}/#business`,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    image: env('NEXT_PUBLIC_BUSINESS_IMAGE') ?? `${SITE_URL}/favicon.ico`,
    telephone: env('NEXT_PUBLIC_BUSINESS_PHONE'),
    email: env('NEXT_PUBLIC_BUSINESS_EMAIL'),
    priceRange: env('NEXT_PUBLIC_BUSINESS_PRICE_RANGE'),
    address: hasAddress
      ? {
          '@type': 'PostalAddress',
          streetAddress: street,
          addressLocality: city,
          addressRegion: region,
          postalCode,
          addressCountry: country,
        }
      : undefined,
    openingHours: env('NEXT_PUBLIC_BUSINESS_HOURS')?.split(';').map(h => h.trim()).filter(Boolean),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Auto detailing packages',
      itemListElement: SERVICES.map(s => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s.name, description: s.description },
      })),
    },
  }

  // JSON.stringify drops undefined values, so unset env vars simply disappear
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
