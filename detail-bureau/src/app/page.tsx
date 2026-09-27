import Navbar from '@/components/navbar'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="bg-black text-white py-28 px-6 text-center">
        <p className="text-sm tracking-widest uppercase text-gray-400 mb-4">Professional Auto Detailing</p>
        <h1 className="text-5xl font-bold tracking-tight mb-6 max-w-2xl mx-auto leading-tight">
          Your Vehicle Deserves the Best
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto mb-10">
          From express shine to full ceramic coating — we restore and protect your vehicle to factory-fresh condition.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/packages"
            className="bg-white text-black font-semibold px-8 py-3 rounded-full hover:bg-gray-100 transition-colors"
          >
            View Packages
          </Link>
          {/* -----------------------------------------------------------------------Need to fix this current Implementation redirects to log in*/}
          <Link
            href="/book-service"
            className="border border-white text-white font-semibold px-8 py-3 rounded-full hover:bg-white hover:text-black transition-colors"
          >
            Book Now
          </Link>
        </div>
      </section>

      {/* Packages Preview */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-black mb-4">Our Packages</h2>
          <p className="text-gray-500 text-center mb-12">Pricing varies by vehicle type. Final price confirmed at drop-off.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Basic', subtitle: 'Express Shine', price: 'From $120', desc: 'Essential detailing for regular maintenance and light cleaning needs.', color: 'border-gray-200' },
              { name: 'Value', subtitle: 'Complete Care', price: 'From $188', desc: 'A thorough inside-and-out detail that restores your vehicle\'s appearance.', color: 'border-black', popular: true },
              { name: 'Premium', subtitle: 'Ultimate Protection', price: 'From $292', desc: 'The ultimate experience with ceramic coating and long-lasting protection.', color: 'border-gray-200' },
            ].map(pkg => (
              <div key={pkg.name} className={`bg-white border-2 ${pkg.color} rounded-2xl p-6 relative`}>
                {pkg.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-bold text-black">{pkg.name}</h3>
                <p className="text-gray-500 text-sm mb-3">{pkg.subtitle}</p>
                <p className="text-3xl font-bold text-black mb-4">{pkg.price}<span className="text-sm font-normal text-gray-400">*</span></p>
                <p className="text-gray-600 text-sm mb-6">{pkg.desc}</p>
                <Link
                  href="/packages"
                  className="block text-center border border-black text-black font-medium py-2 rounded-lg hover:bg-black hover:text-white transition-colors text-sm"
                >
                  Learn More
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-black mb-12">Why The Detail Bureau?</h2>
          <div className="grid sm:grid-cols-3 gap-10">
            {[
              { icon: '🛡️', title: 'Long-Lasting Protection', desc: 'Ceramic coatings and premium sealants that protect for months.' },
              { icon: '✨', title: 'Expert Technicians', desc: 'Trained professionals who treat your vehicle like their own.' },
              { icon: '📅', title: 'Easy Online Booking', desc: 'Book your service in minutes and track your history online.' },
            ].map(item => (
              <div key={item.title}>
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-semibold text-black mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-black text-white py-20 px-6 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Book?</h2>
        <p className="text-gray-400 mb-8">Create an account, add your vehicle, and book a service in minutes.</p>
        <Link
          href="/signup"
          className="bg-white text-black font-semibold px-8 py-3 rounded-full hover:bg-gray-100 transition-colors inline-block"
        >
          Get Started
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8 px-6 text-center text-gray-400 text-sm">
        <p>© {new Date().getFullYear()} The Detail Bureau. All rights reserved.</p>
        <div className="flex justify-center gap-6 mt-3">
          <Link href="/about" className="hover:text-black transition-colors">About</Link>
          <Link href="/packages" className="hover:text-black transition-colors">Packages</Link>
          <Link href="/gallery" className="hover:text-black transition-colors">Gallery</Link>
          <Link href="/faqs" className="hover:text-black transition-colors">FAQs</Link>
        </div>
      </footer>
    </div>
  )
}