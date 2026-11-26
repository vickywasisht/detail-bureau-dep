import type { Metadata } from 'next'
import Navbar from '@/components/navbar'
import Link from 'next/link'
import { adminClient } from '@/lib/supabase/admin'
import { PACKAGE_INCLUDES } from '@/lib/package-details'

export const metadata: Metadata = {
  title: 'Auto Detailing Packages & Pricing',
  description:
    'Compare Basic, Value and Premium auto detailing packages with pricing by vehicle type: sedan, SUV, truck, van and convertible.',
  alternates: { canonical: '/packages' },
}

const PACKAGES = [
  {
    slug: 'basic',
    name: 'Basic',
    subtitle: 'Express Shine',
    price: { Sedan: 120, SUV: 150, Truck: 160, Van: 160, Convertible: 130 },
    duration: { Sedan: '1', SUV: '2.5', Truck: '2.5', Van: '2.5', Convertible: '1.5' },
    description: 'Get your vehicle looking fresh with our essential detailing service. Perfect for regular maintenance and light cleaning needs.',
    ...PACKAGE_INCLUDES.basic,
    perfectFor: ['Weekly or bi-weekly maintenance', 'Light dirt and dust removal', 'Busy professionals on the go', 'Fleet vehicle upkeep'],
  },
  {
    slug: 'value',
    name: 'Value',
    subtitle: 'Complete Care',
    price: { Sedan: 188, SUV: 230, Truck: 245, Van: 245, Convertible: 200 },
    duration: { Sedan: '3.5', SUV: '4.5', Truck: '4.5', Van: '4.5', Convertible: '3.5' },
    description: 'Our most popular service! A thorough inside-and-out detail that restores your vehicle\'s appearance and protects your investment.',
    popular: true,
    ...PACKAGE_INCLUDES.value,
    perfectFor: ['Monthly or seasonal deep cleaning', 'Preparing vehicle for sale', 'Post-winter restoration', 'After road trips or family vacations'],
  },
  {
    slug: 'premium',
    name: 'Premium',
    subtitle: 'Ultimate Protection',
    price: { Sedan: 292, SUV: 350, Truck: 370, Van: 370, Convertible: 310 },
    duration: { Sedan: '5-7', SUV: '6-8', Truck: '6-8', Van: '6-8', Convertible: '5-7' },
    description: 'The ultimate detailing experience. We go beyond cleaning to provide long-lasting protection and that factory-fresh finish.',
    ...PACKAGE_INCLUDES.premium,
    perfectFor: ['Luxury and exotic vehicles', 'Pre-sale detailing for maximum value', 'Special events and occasions', 'Annual comprehensive restoration', 'Heavily soiled or neglected vehicles'],
  },
]

const VEHICLE_TYPES = ['Sedan', 'SUV', 'Truck', 'Van', 'Convertible'] as const

export default async function PackagesPage() {
  const [{ data: info, error: packageError }, { data: rows, error: pricingError }] = await Promise.all([
    adminClient.from('service_packages').select('slug, description'),
    adminClient.from('service_pricing').select('package_slug, vehicle_type, price, duration_hours'),
  ])

  // fall back to the hardcoded values so the page never goes blank if a row is missing
  const live = PACKAGES.map(pkg => {
    const row = (type: string) =>
      rows?.find(r => r.package_slug === pkg.slug && r.vehicle_type === type)
    return {
      ...pkg,
      popular: (pkg as { popular?: boolean }).popular ?? false,
      description: info?.find(i => i.slug === pkg.slug)?.description ?? pkg.description,
      price: Object.fromEntries(VEHICLE_TYPES.map(t => [t, row(t)?.price ?? pkg.price[t]])),
      duration: Object.fromEntries(VEHICLE_TYPES.map(t => [t, row(t)?.duration_hours ?? pkg.duration[t]])),
    }
  })

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-black mb-4">Our Packages</h1>
          <p className="text-gray-500 text-lg">Pricing varies by vehicle type. All prices are estimates — final price confirmed at drop-off.</p>
        </div>

        {(packageError || pricingError) && (
          <div role="status" className="ui-alert ui-alert--warning mb-8 text-center">
            Live package details are temporarily unavailable, so these default estimates are shown. Please confirm pricing before booking.
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {live.map(pkg => (
            <div key={pkg.name} id={pkg.slug} className={`scroll-mt-6 border-2 rounded-2xl overflow-hidden relative ${pkg.popular ? 'border-black' : 'border-gray-200'}`}>
              {pkg.popular && (
                <div className="bg-black text-white text-center text-xs font-bold py-2 tracking-widest uppercase">
                  Most Popular
                </div>
              )}
              <div className="p-6">
                <h2 className="text-2xl font-bold text-black">{pkg.name}</h2>
                <p className="text-gray-600 text-sm mb-4">{pkg.subtitle}</p>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">{pkg.description}</p>

                {/* Pricing by vehicle type */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Pricing by Vehicle</p>
                  {VEHICLE_TYPES.map(type => (
                    <div key={type} className="flex justify-between text-sm py-1.5 border-b border-gray-100 last:border-0">
                      <span className="text-gray-600">{type}</span>
                      <span className="font-semibold text-black">${pkg.price[type]}</span>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-gray-600 mb-6">⏱ Service time: {Object.values(pkg.duration)[0]} hours (Sedan)</p>

                {/* Exterior */}
                <div className="mb-4">
                  <p className="text-xs font-bold text-black uppercase tracking-wider mb-2">Exterior Service</p>
                  <ul className="space-y-1">
                    {pkg.exterior.map(item => (
                      <li key={item} className="text-sm text-gray-600 flex gap-2">
                        <span className="text-green-500 mt-0.5 shrink-0">✓</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Interior */}
                <div className="mb-6">
                  <p className="text-xs font-bold text-black uppercase tracking-wider mb-2">Interior Service</p>
                  <ul className="space-y-1">
                    {pkg.interior.map(item => (
                      <li key={item} className="text-sm text-gray-600 flex gap-2">
                        <span className="text-green-500 mt-0.5 shrink-0">✓</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Perfect for */}
                <div className="mb-6">
                  <p className="text-xs font-bold text-black uppercase tracking-wider mb-2">Perfect For</p>
                  <ul className="space-y-1">
                    {pkg.perfectFor.map(item => (
                      <li key={item} className="text-sm text-gray-600 flex gap-2">
                        <span className="text-blue-500 mt-0.5 shrink-0">→</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href="/book-service"
                  className={`block text-center font-semibold py-3 rounded-xl transition-colors text-sm ${
                    pkg.popular
                      ? 'bg-black text-white hover:bg-gray-800'
                      : 'border border-black text-black hover:bg-black hover:text-white'
                  }`}
                >
                  Book {pkg.name} Package
                </Link>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-gray-600 text-sm">* Prices shown are for a 2024 Sedan. Prices are specific to your vehicle type and size.</p>
      </main>
    </div>
  )
}