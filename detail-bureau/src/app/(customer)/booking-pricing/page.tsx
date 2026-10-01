'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const PACKAGES = [
  {
    slug: 'basic',
    label: 'Basic',
    fullLabel: 'Basic – Express Shine',
    description: 'Essential detailing for regular maintenance and light cleaning needs.',
    highlights: ['Complete exterior hand wash', 'Interior vacuum & wipe down', 'Window & mirror cleaning', 'Air freshener application'],
  },
  {
    slug: 'value',
    label: 'Value',
    fullLabel: 'Value – Complete Care',
    description: 'A thorough inside-and-out detail that restores your vehicle\'s appearance.',
    highlights: ['Clay bar treatment', 'Machine polish for minor swirls', 'Shampoo & steam interior', 'UV protectant & odor elimination'],
    popular: true,
  },
  {
    slug: 'premium',
    label: 'Premium',
    fullLabel: 'Premium – Ultimate Protection',
    description: 'The ultimate detailing experience with long-lasting protection.',
    highlights: ['Two-stage machine polish', 'Ceramic spray coating (6-month)', 'Premium leather treatment', 'Complete sanitization & fragrance'],
  },
]

function BookingPricingForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const vehicleId   = searchParams.get('vehicle_id') ?? ''
  const vehicleType = searchParams.get('vehicle_type') ?? 'Sedan'
  const dropoffDate = searchParams.get('dropoff_date') ?? ''
  const dropoffTime = searchParams.get('dropoff_time') ?? ''
  const specialNotes = searchParams.get('special_notes') ?? ''

  const [pricing, setPricing] = useState<Record<string, { price: number; duration_hours: string }>>({})

  useEffect(() => {
    fetch(`/api/pricing?vehicle_type=${vehicleType}`)
      .then(r => r.json())
      .then((data: Array<{ package_slug: string; price: number; duration_hours: string }>) => {
        const map: Record<string, { price: number; duration_hours: string }> = {}
        data.forEach(d => { map[d.package_slug] = { price: d.price, duration_hours: d.duration_hours } })
        setPricing(map)
      })
  }, [vehicleType])

  const handleSelect = (pkg: typeof PACKAGES[0]) => {
    const p = pricing[pkg.slug]
    if (!p) return
    const params = new URLSearchParams({
      vehicle_id: vehicleId,
      vehicle_type: vehicleType,
      dropoff_date: dropoffDate,
      dropoff_time: dropoffTime,
      special_notes: specialNotes,
      package_slug: pkg.slug,
      package_label: pkg.fullLabel,
      price: String(p.price),
      duration: p.duration_hours,
    })
    router.push(`/booking-confirm?${params.toString()}`)
  }

  return (
    <div>
      <div className="mb-8">
        <Link href={`/book-service?vehicle_id=${vehicleId}`} className="text-gray-600 hover:text-black text-sm">← Back</Link>
        <h1 className="text-2xl font-semibold text-black mt-3">Select a Package</h1>
        <p className="text-gray-600 text-sm mt-1">Prices shown for a <span className="text-black">{vehicleType}</span></p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {PACKAGES.map(pkg => {
          const p = pricing[pkg.slug]
          return (
            <div key={pkg.slug} className={`bg-white rounded-xl border ${pkg.popular ? 'border-blue-600' : 'border-gray-200'} flex flex-col relative`}>
              {pkg.popular && (
                <div className="bg-blue-600 text-white text-xs font-bold text-center py-1.5 rounded-t-xl tracking-wider">
                  MOST POPULAR
                </div>
              )}
              <div className="p-5 flex flex-col flex-1">
                <h2 className="text-black font-semibold text-lg">{pkg.label}</h2>
                <div className="mt-2 mb-1">
                  <span className="text-3xl font-bold text-black">{p ? `$${p.price}` : '—'}</span>
                  <span className="text-gray-500 text-sm">*</span>
                </div>
                <p className="text-gray-500 text-xs mb-4">⏱ {p?.duration_hours ?? '—'} hours est.</p>
                <p className="text-gray-600 text-sm mb-4">{pkg.description}</p>
                <ul className="space-y-1.5 mb-6 flex-1">
                  {pkg.highlights.map(h => (
                    <li key={h} className="text-gray-600 text-sm flex gap-2">
                      <span className="text-green-600 mt-0.5">✓</span> {h}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSelect(pkg)}
                  disabled={!p}
                  className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${
                    pkg.popular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-black hover:bg-gray-800 text-white'
                  }`}
                >
                  Select {pkg.label}
                </button>
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-gray-500 text-xs text-center mt-4">* Final price confirmed at drop-off based on vehicle condition.</p>
    </div>
  )
}

export default function BookingPricingPage() {
  return <Suspense><BookingPricingForm /></Suspense>
}