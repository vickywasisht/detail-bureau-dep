import Navbar from '@/components/navbar'
import Link from 'next/link'

const PACKAGES = [
  {
    name: 'Basic',
    subtitle: 'Express Shine',
    price: { Sedan: 120, SUV: 150, Truck: 160, Van: 160, Convertible: 130 },
    duration: { Sedan: '1', SUV: '2.5', Truck: '2.5', Van: '2.5', Convertible: '1.5' },
    description: 'Get your vehicle looking fresh with our essential detailing service. Perfect for regular maintenance and light cleaning needs.',
    exterior: [
      'Complete exterior hand wash with premium soap',
      'Hand dry using soft microfibre towels',
      'Clean and shine all wheels and tires',
      'Apply tire dressing for that showroom look',
      'Clean all exterior windows and mirrors',
      'Wipe down all door jambs and trunk area',
    ],
    interior: [
      'Thorough vacuum of all carpets and seats',
      'Wipe down dashboard and center console',
      'Clean all interior windows and mirrors',
      'Dust and wipe all visible surfaces',
      'Basic floor mat cleaning',
      'Air freshener application',
    ],
    perfectFor: ['Weekly or bi-weekly maintenance', 'Light dirt and dust removal', 'Busy professionals on the go', 'Fleet vehicle upkeep'],
  },
  {
    name: 'Value',
    subtitle: 'Complete Care',
    price: { Sedan: 188, SUV: 230, Truck: 245, Van: 245, Convertible: 200 },
    duration: { Sedan: '3.5', SUV: '4.5', Truck: '4.5', Van: '4.5', Convertible: '3.5' },
    description: 'Our most popular service! A thorough inside-and-out detail that restores your vehicle\'s appearance and protects your investment.',
    popular: true,
    exterior: [
      'Premium hand wash and foam bath',
      'Clay bar treatment to remove contaminants',
      'Machine polish to remove minor swirls',
      'Apply high-quality wax or sealant protection',
      'Deep clean wheels, tires, and wheel wells',
      'Clean and protect all exterior trim',
      'Bug and tar removal',
      'Headlight restoration (if needed)',
    ],
    interior: [
      'Deep vacuum including under seats and crevices',
      'Shampoo and extract all carpets and floor mats',
      'Steam clean and condition all upholstery',
      'Leather cleaning and conditioning (if applicable)',
      'Deep clean all vents, cup holders, and storage areas',
      'UV protectant on dashboard and trim',
      'Clean and treat all interior plastics and vinyl',
      'Pet hair removal (if needed)',
      'Odor elimination treatment',
    ],
    perfectFor: ['Monthly or seasonal deep cleaning', 'Preparing vehicle for sale', 'Post-winter restoration', 'After road trips or family vacations'],
  },
  {
    name: 'Premium',
    subtitle: 'Ultimate Protection',
    price: { Sedan: 292, SUV: 350, Truck: 370, Van: 370, Convertible: 310 },
    duration: { Sedan: '5-7', SUV: '6-8', Truck: '6-8', Van: '6-8', Convertible: '5-7' },
    description: 'The ultimate detailing experience. We go beyond cleaning to provide long-lasting protection and that factory-fresh finish.',
    exterior: [
      'Premium foam bath with pH-neutral soap',
      'Complete clay bar decontamination',
      'Two-stage machine polish and paint correction',
      'Apply ceramic spray coating or premium sealant (6-month protection)',
      'Chrome and metal polishing',
      'Deep clean, polish, and seal all wheels',
      'Tire shine and rubber conditioning',
      'Engine bay detail and dressing',
      'Convertible top cleaning and protection (if applicable)',
    ],
    interior: [
      'Complete interior extraction and shampooing',
      'Multi-stage steam cleaning for all surfaces',
      'Premium leather treatment and UV protection',
      'Fabric protection application',
      'Deep clean and sanitize all vents',
      'Apply ceramic coating to interior surfaces',
      'Clean and protect all electronics and screens',
      'Trunk vacuum and organization',
      'Professional odor elimination and sanitization',
      'Long-lasting premium fragrance',
    ],
    perfectFor: ['Luxury and exotic vehicles', 'Pre-sale detailing for maximum value', 'Special events and occasions', 'Annual comprehensive restoration', 'Heavily soiled or neglected vehicles'],
  },
]

const VEHICLE_TYPES = ['Sedan', 'SUV', 'Truck', 'Van', 'Convertible'] as const

export default function PackagesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-black mb-4">Our Packages</h1>
          <p className="text-gray-500 text-lg">Pricing varies by vehicle type. All prices are estimates — final price confirmed at drop-off.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {PACKAGES.map(pkg => (
            <div key={pkg.name} className={`border-2 rounded-2xl overflow-hidden relative ${pkg.popular ? 'border-black' : 'border-gray-200'}`}>
              {pkg.popular && (
                <div className="bg-black text-white text-center text-xs font-bold py-2 tracking-widest uppercase">
                  Most Popular
                </div>
              )}
              <div className="p-6">
                <h2 className="text-2xl font-bold text-black">{pkg.name}</h2>
                <p className="text-gray-500 text-sm mb-4">{pkg.subtitle}</p>
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

                <p className="text-xs text-gray-400 mb-6">⏱ Service time: {Object.values(pkg.duration)[0]} hours (Sedan)</p>

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
                  href="/login"
                  className={`block text-center font-semibold py-3 rounded-xl transition-colors text-sm ${
                    pkg.popular
                      ? 'bg-black text-white hover:bg-gray-800'
                      : 'border border-black text-black hover:bg-black hover:text-white'
                  }`}
                >
                  Book Now
                </Link>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-gray-400 text-sm">* Prices shown are for a 2024 Sedan. Prices are specific to your vehicle type and size.</p>
      </main>
    </div>
  )
}