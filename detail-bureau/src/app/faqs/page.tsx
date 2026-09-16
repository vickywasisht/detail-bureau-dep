'use client'

import Navbar from '@/components/navbar'
import { useState } from 'react'

const FAQS = [
  {
    q: 'How long does each service take?',
    a: 'Basic takes 1–2.5 hours depending on vehicle size. Value takes 3.5–4.5 hours. Premium takes 5–8 hours. Larger vehicles like trucks and vans take longer.',
  },
  {
    q: 'Where do I drop off my vehicle?',
    a: 'After booking, you\'ll receive our location details via email. Drop-off is by appointment only at your selected time slot.',
  },
  {
    q: 'Are the prices final?',
    a: 'Prices shown are estimates based on your vehicle type. Final pricing is confirmed at drop-off after inspecting the vehicle\'s condition.',
  },
  {
    q: 'What\'s your cancellation policy?',
    a: 'Cancellations made 24+ hours before your scheduled drop-off receive a full refund. Cancellations within 24 hours may be subject to a fee. No-shows are charged 50% of the quoted price.',
  },
  {
    q: 'Do you offer services for all vehicle types?',
    a: 'Yes — we service Sedans, SUVs, Trucks, Vans, and Convertibles. Pricing varies by vehicle type.',
  },
  {
    q: 'How do I track my booking?',
    a: 'After creating an account, you can view all your bookings and service history from your dashboard under "My Vehicles".',
  },
  {
    q: 'Is ceramic coating included in the Premium package?',
    a: 'Yes — Premium includes a ceramic spray coating or premium sealant that provides 6 months of protection.',
  },
  {
    q: 'Do you offer add-on services?',
    a: 'Additional services are coming soon. Contact us directly if you have a specific request.',
  },
]

export default function FAQsPage() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-black mb-4">Frequently Asked Questions</h1>
          <p className="text-gray-500">Everything you need to know before booking.</p>
        </div>

        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-black text-sm">{faq.q}</span>
                <span className="text-gray-400 ml-4 shrink-0">{open === i ? '−' : '+'}</span>
              </button>
              {open === i && (
                <div className="px-5 pb-4">
                  <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}