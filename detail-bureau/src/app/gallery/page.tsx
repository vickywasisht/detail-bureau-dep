import type { Metadata } from 'next'
import Image from 'next/image'
import Navbar from '@/components/navbar'

export const metadata: Metadata = {
  title: 'Before & After Gallery',
  description:
    'See real before and after auto detailing results from The Detail Bureau, from express shine washes to paint correction and ceramic coating.',
  alternates: { canonical: '/gallery' },
}

const CATEGORIES = [
  {
    name: 'Basic – Express Shine',
    description: 'Before and after results from our essential detailing service.',
    images: [
      { before: 'Dirty exterior, light dust buildup', after: 'Clean shine, dressed tires', beforeImage: 'shine-before.webp', afterImage: 'shine-after.webp' },
      { before: 'Dusty, neglected tires', after: 'Wiped down and dressed', beforeImage: 'tire-before.webp', afterImage: 'tire-after.webp' },
    ],
  },
  {
    name: 'Value – Complete Care',
    description: 'Full interior and exterior restoration results.',
    images: [
      { before: 'Swirl marks on paint, bug splatter', after: 'Machine polished, wax protected', beforeImage: 'oxidize-before.webp', afterImage: 'oxidize-after.webp' },
      { before: 'Stained carpets and seats', after: 'Steam cleaned and extracted', beforeImage: 'seat-before.webp', afterImage: 'seat-after.webp' },
    ],
  },
  {
    name: 'Premium – Ultimate Protection',
    description: 'Paint correction and ceramic coating transformations.',
    images: [
      { before: 'Heavy swirls and oxidation', after: 'Two-stage polish, ceramic coated', beforeImage: 'interior-before.webp', afterImage: 'interior-after.webp' },
      { before: 'Dull, neglected leather', after: 'Full extraction, leather treated', beforeImage: 'leather-seat-before.webp', afterImage: 'leather-seat-after.webp' },
    ],
  },
]

export default function GalleryPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-black mb-4">Our Work</h1>
          <p className="text-gray-500 text-lg">Before and after results organized by service type.</p>
        </div>

        <div className="space-y-16">
          {CATEGORIES.map((cat, ci) => (
            <section key={cat.name}>
              <h2 className="text-2xl font-bold text-black mb-2">{cat.name}</h2>
              <p className="text-gray-500 text-sm mb-6">{cat.description}</p>
              <div className="grid sm:grid-cols-2 gap-6">
                {cat.images.map((img, i) => (
                  <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="grid grid-cols-2 divide-x divide-gray-200">
                      <div className="p-4 bg-gray-50">
                        <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Before</p>
                        <div className="relative aspect-square rounded-lg overflow-hidden mb-2">
                          <Image
                            src={`/assets/${img.beforeImage}`}
                            alt={`Vehicle before detailing: ${img.before.toLowerCase()}`}
                            fill
                            preload={ci === 0 && i === 0}
                            sizes="(max-width: 640px) 50vw, 240px"
                            className="object-cover"
                          />
                        </div>
                        <p className="text-gray-600 text-xs text-center px-2">{img.before}</p>
                      </div>
                      <div className="p-4 bg-white">
                        <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2">After</p>
                        <div className="relative aspect-square rounded-lg overflow-hidden mb-2">
                          <Image
                            src={`/assets/${img.afterImage}`}
                            alt={`Vehicle after detailing: ${img.after.toLowerCase()}`}
                            fill
                            preload={ci === 0 && i === 0}
                            sizes="(max-width: 640px) 50vw, 240px"
                            className="object-cover"
                          />
                        </div>
                        <p className="text-green-700 text-xs text-center px-2">{img.after}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  )
}