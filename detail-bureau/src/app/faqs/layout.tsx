import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQs',
  description:
    'Answers to common questions about auto detailing at The Detail Bureau: service times, drop-off, pricing, cancellations and add-ons.',
  alternates: { canonical: '/faqs' },
}

export default function FAQsLayout({ children }: { children: React.ReactNode }) {
  return children
}
