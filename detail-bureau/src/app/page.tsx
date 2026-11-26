import type { Metadata } from 'next'
import Navbar from '@/components/navbar'
import Link from 'next/link'
import { adminClient } from '@/lib/supabase/admin'
import { getReviewSummary, getReviews } from '@/lib/reviews'
import ReviewsSection from '@/components/ReviewsSection'
import Stars from '@/components/Stars'

import { buildLocalBusinessJsonLd } from '@/lib/site'

export const metadata: Metadata = {
  title: { absolute: 'The Detail Bureau | Professional Auto Detailing & Ceramic Coating' },
  description:
    'Professional auto detailing from express shine to full ceramic coating. View packages and pricing, then book your vehicle online with The Detail Bureau.',
  alternates: { canonical: '/' },
}

export default async function HomePage() {
  const [{ data: info }, { data: rows }, reviewSummary, topReviews] = await Promise.all([
    adminClient.from('service_packages').select('slug, description'),
    adminClient.from('service_pricing').select('package_slug, price'),
    getReviewSummary(),
    getReviews({ minRating: 5, limit: 3 }), // recent five-star reviews
  ])
  const fromPrice = (slug: string, fallback: number) => {
    const prices = rows?.filter(r => r.package_slug === slug).map(r => Number(r.price)) ?? []
    return prices.length ? Math.min(...prices) : fallback
  }
  const describe = (slug: string, fallback: string) =>
    info?.find(i => i.slug === slug)?.description ?? fallback

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: buildLocalBusinessJsonLd() }}
      />

      <main id="main-content" tabIndex={-1}>
      {/* Hero */}
      <section className="bg-black text-white py-28 px-6 text-center">
        <p className="text-sm tracking-widest uppercase text-gray-400 mb-4">Professional Auto Detailing</p>
        <h1 className="text-5xl font-bold tracking-tight mb-6 max-w-2xl mx-auto leading-tight">
          Your Vehicle Deserves the Best
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto mb-10">
          From express shine to full ceramic coating — we restore and protect your vehicle to factory-fresh condition.
        </p>
        {reviewSummary.count > 0 && (
          <Link href="/reviews" className="inline-flex items-center gap-2 -mt-6 mb-8 text-sm text-gray-300 hover:text-white">
            <Stars rating={reviewSummary.average} />
            <span>{reviewSummary.average.toFixed(1)} · {reviewSummary.count} review{reviewSummary.count === 1 ? '' : 's'}</span>
          </Link>
        )}
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
              { name: 'Basic', subtitle: 'Express Shine', price: `From $${fromPrice('basic', 120)}`, desc: describe('basic', 'Essential detailing for regular maintenance and light cleaning needs.'), color: 'border-gray-200' },
              { name: 'Value', subtitle: 'Complete Care', price: `From $${fromPrice('value', 188)}`, desc: describe('value', 'A thorough inside-and-out detail that restores your vehicle\'s appearance.'), color: 'border-black', popular: true },
              { name: 'Premium', subtitle: 'Ultimate Protection', price: `From $${fromPrice('premium', 292)}`, desc: describe('premium', 'The ultimate experience with ceramic coating and long-lasting protection.'), color: 'border-gray-200' },
            ].map(pkg => (
              <div key={pkg.name} className={`bg-white border-2 ${pkg.color} rounded-2xl p-6 relative`}>
                {pkg.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-bold text-black">{pkg.name}</h3>
                <p className="text-gray-600 text-sm mb-3">{pkg.subtitle}</p>
                <p className="text-3xl font-bold text-black mb-4">{pkg.price}<span className="text-sm font-normal text-gray-600">*</span></p>
                <p className="text-gray-600 text-sm mb-6">{pkg.desc}</p>
                <Link
                  href={`/packages#${pkg.name.toLowerCase()}`}
                  className="block text-center border border-black text-black font-medium py-2 rounded-lg hover:bg-black hover:text-white transition-colors text-sm"
                >
                  View {pkg.name} details
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
                <div className="text-4xl mb-4" aria-hidden="true">{item.icon}</div>
                <h3 className="font-semibold text-black mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <ReviewsSection summary={reviewSummary} reviews={topReviews} />

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
      </main>

    </div>
  )
}