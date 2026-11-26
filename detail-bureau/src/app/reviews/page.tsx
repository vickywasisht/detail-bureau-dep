import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/navbar'
import Stars from '@/components/Stars'
import ReviewCard from '@/components/ReviewCard'
import { getReviewSummary, getReviews } from '@/lib/reviews'
import DataState from '@/components/DataState'

export const metadata: Metadata = {
  title: 'Customer Reviews | The Detail Bureau',
  description: 'See what customers say about The Detail Bureau auto detailing.',
}

// Always fetch fresh so a new review shows up right after it's submitted
export const dynamic = 'force-dynamic'

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ thanks?: string }> }) {
  const { thanks } = await searchParams
  const [summaryResult, reviewsResult] = await Promise.allSettled([
    getReviewSummary(),
    getReviews({ limit: 50 }),
  ])
  const hasError = summaryResult.status === 'rejected' || reviewsResult.status === 'rejected'
  const summary = summaryResult.status === 'fulfilled'
    ? summaryResult.value
    : { count: 0, average: 0, distribution: [] }
  const reviews = reviewsResult.status === 'fulfilled' ? reviewsResult.value : []

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-black text-center mb-2">Customer Reviews</h1>
        <p className="text-gray-500 text-center mb-10">Real feedback from people who trusted us with their vehicle.</p>

        {thanks && (
          <div className="mb-8 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 text-center">
            Thank you! Your review has been published.
          </div>
        )}

        {hasError ? (
          <DataState
            kind="error"
            title="We couldn’t load customer reviews."
            description="Please refresh the page to try again."
            className="mx-auto max-w-2xl"
          />
        ) : summary.count > 0 ? (
          <>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-10 flex flex-col sm:flex-row items-center gap-8">
              <div className="text-center sm:w-48">
                <p className="text-5xl font-bold text-black">{summary.average.toFixed(1)}</p>
                <Stars rating={summary.average} className="text-2xl" />
                <p className="text-sm text-gray-500 mt-1">{summary.count} review{summary.count === 1 ? '' : 's'}</p>
              </div>
              <div className="flex-1 w-full space-y-1.5">
                {summary.distribution.map(d => (
                  <div key={d.star} className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="w-8">{d.star} ★</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400" style={{ width: `${(d.count / summary.count) * 100}%` }} />
                    </div>
                    <span className="w-6 text-right">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
            </div>
          </>
        ) : (
          <p className="text-center text-gray-500 py-12">No reviews yet. Be the first to share your experience!</p>
        )}

        <p className="text-center text-sm text-gray-500 mt-12">
          Had a service with us? <Link href="/dashboard" className="text-blue-600 hover:text-blue-700">Open your vehicles</Link> and
          choose “Leave a review” on a completed service.
        </p>
      </main>
    </div>
  )
}