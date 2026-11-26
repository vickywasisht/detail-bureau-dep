import Link from 'next/link'
import Stars from '@/components/Stars'
import ReviewCard from '@/components/ReviewCard'
import type { PublicReview, ReviewSummary } from '@/lib/reviews'
import DataState from '@/components/DataState'

// Homepage block. Renders nothing until at least one review exists.
export default function ReviewsSection({
  summary,
  reviews,
  hasError = false,
}: {
  summary: ReviewSummary
  reviews: PublicReview[]
  hasError?: boolean
}) {
  if (hasError) {
    return (
      <section className="bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <DataState kind="error" title="Customer reviews are temporarily unavailable." />
        </div>
      </section>
    )
  }
  if (summary.count === 0 || reviews.length === 0) return null

  return (
    <section className="py-20 px-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-black mb-4">What Our Customers Say</h2>
        <div className="flex items-center justify-center gap-3 mb-12 text-gray-600">
          <Stars rating={summary.average} className="text-2xl" />
          <span>
            <strong className="text-black">{summary.average.toFixed(1)}</strong> out of 5 · {summary.count} review{summary.count === 1 ? '' : 's'}
          </span>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
        </div>
        <div className="text-center mt-10">
          <Link href="/reviews" className="inline-block border border-black text-black font-medium px-6 py-2 rounded-lg hover:bg-black hover:text-white transition-colors text-sm">
            Read all reviews
          </Link>
        </div>
      </div>
    </section>
  )
}