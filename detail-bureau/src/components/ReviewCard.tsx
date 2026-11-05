import Stars from '@/components/Stars'
import type { PublicReview } from '@/lib/reviews'

export default function ReviewCard({ review }: { review: PublicReview }) {
  return (
    <figure className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col">
      <Stars rating={review.rating} className="text-lg" />
      {review.title && <p className="font-semibold text-black mt-3">{review.title}</p>}
      <blockquote className="text-gray-600 text-sm leading-relaxed mt-2 flex-1">{review.comment}</blockquote>
      <figcaption className="text-sm text-gray-500 mt-4">
        <span className="font-medium text-black">{review.reviewer_name}</span>
        {' · '}
        {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
      </figcaption>
    </figure>
  )
}