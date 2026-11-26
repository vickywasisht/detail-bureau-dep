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
  const [info, setInfo] = useState<Record<string, { description: string }>>({})

  useEffect(() => {
    fetch('/api/packages')
      .then(r => r.json())
      .then((d: Array<{ slug: string; description: string }>) => {
        if (Array.isArray(d)) setInfo(Object.fromEntries(d.map(x => [x.slug, x])))
      })
  }, [])

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
        <Link href={`/book-service?vehicle_id=${vehicleId}`} className="text-text-muted hover:text-foreground text-sm">← Back</Link>
        <h1 className="text-2xl font-semibold text-foreground mt-3">Select a Package</h1>
        <p className="text-text-muted text-sm mt-1">Prices shown for a <span className="text-foreground">{vehicleType}</span></p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {PACKAGES.map(pkg => {
          const p = pricing[pkg.slug]
          return (
            <div key={pkg.slug} className={`ui-card flex flex-col relative ${pkg.popular ? 'ui-card--featured' : ''}`}>
              {pkg.popular && (
                <div className="bg-primary text-primary-foreground text-xs font-bold text-center py-1.5 rounded-t-xl tracking-wider">
                  MOST POPULAR
                </div>
              )}
              <div className="p-5 flex flex-col flex-1">
                <h2 className="text-foreground font-semibold text-lg">{pkg.label}</h2>
                <div className="mt-2 mb-1">
                  <span className="text-3xl font-bold text-foreground">{p ? `$${p.price}` : '—'}</span>
                  <span className="text-text-muted text-sm">*</span>
                </div>
                <p className="text-text-muted text-xs mb-4">⏱ {p?.duration_hours ?? '—'} hours est.</p>
                <p className="text-text-muted text-sm mb-4">{info[pkg.slug]?.description ?? pkg.description}</p>
                <ul className="space-y-1.5 mb-6 flex-1">
                  {pkg.highlights.map(h => (
                    <li key={h} className="text-text-muted text-sm flex gap-2">
                      <span className="text-success mt-0.5">✓</span> {h}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSelect(pkg)}
                  disabled={!p}
                  className="ui-button ui-button--primary w-full"
                >
                  Select {pkg.label}
                </button>
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-text-muted text-xs text-center mt-4">* Final price confirmed at drop-off based on vehicle condition.</p>
    </div>
  )
}

export default function BookingPricingPage() {
  return <Suspense><BookingPricingForm /></Suspense>
}