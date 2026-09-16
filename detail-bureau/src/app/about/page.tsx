import Navbar from '@/components/navbar'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold text-black mb-6">About The Detail Bureau</h1>
        <p className="text-gray-600 text-lg leading-relaxed mb-6">
          The Detail Bureau is a professional auto detailing service dedicated to restoring and protecting vehicles to their factory-fresh condition. We combine premium products with expert techniques to deliver results that last.
        </p>
        <p className="text-gray-600 text-lg leading-relaxed mb-6">
          Whether you need a quick express shine or a full ceramic coating treatment, our trained technicians treat every vehicle with the same care and attention to detail.
        </p>
        <h2 className="text-2xl font-bold text-black mt-12 mb-4">Our Mission</h2>
        <p className="text-gray-600 text-lg leading-relaxed mb-10">
          To provide every customer with a transparent, reliable, and exceptional detailing experience — from the moment you book to the moment you drive away.
        </p>
        <Link href="/packages" className="bg-black text-white font-semibold px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors inline-block">
          View Our Packages
        </Link>
      </main>
    </div>
  )
}