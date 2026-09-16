import Navbar from '@/components/navbar'

const CATEGORIES = [
  {
    name: 'Basic – Express Shine',
    description: 'Before and after results from our essential detailing service.',
    images: [
      { before: 'Dirty exterior, light dust buildup', after: 'Clean shine, dressed tires' },
      { before: 'Dusty interior surfaces', after: 'Wiped down and vacuumed' },
    ],
  },
  {
    name: 'Value – Complete Care',
    description: 'Full interior and exterior restoration results.',
    images: [
      { before: 'Swirl marks on paint, bug splatter', after: 'Machine polished, wax protected' },
      { before: 'Stained carpets and seats', after: 'Steam cleaned and extracted' },
    ],
  },
  {
    name: 'Premium – Ultimate Protection',
    description: 'Paint correction and ceramic coating transformations.',
    images: [
      { before: 'Heavy swirls and oxidation', after: 'Two-stage polish, ceramic coated' },
      { before: 'Dull, neglected interior', after: 'Full extraction, leather treated' },
    ],
  },
]

export default function GalleryPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-black mb-4">Our Work</h1>
          <p className="text-gray-500 text-lg">Before and after results organized by service type.</p>
        </div>

        <div className="space-y-16">
          {CATEGORIES.map(cat => (
            <section key={cat.name}>
              <h2 className="text-2xl font-bold text-black mb-2">{cat.name}</h2>
              <p className="text-gray-500 text-sm mb-6">{cat.description}</p>
              <div className="grid sm:grid-cols-2 gap-6">
                {cat.images.map((img, i) => (
                  <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="grid grid-cols-2 divide-x divide-gray-200">
                      <div className="p-4 bg-gray-50">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Before</p>
                        <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center mb-2">
                          <span className="text-gray-400 text-xs text-center px-2">{img.before}</span>
                        </div>
                      </div>
                      <div className="p-4 bg-white">
                        <p className="text-xs font-bold text-green-500 uppercase tracking-wider mb-2">After</p>
                        <div className="aspect-square bg-green-50 rounded-lg flex items-center justify-center mb-2">
                          <span className="text-green-600 text-xs text-center px-2">{img.after}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-16 text-center bg-gray-50 rounded-2xl p-10">
          <p className="text-gray-500 text-sm">📸 Real photos coming soon — gallery is updated regularly with customer vehicle transformations.</p>
        </div>
      </main>
    </div>
  )
}