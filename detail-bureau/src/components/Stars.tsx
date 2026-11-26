// Display-only stars. Works in server and client components.
export default function Stars({ rating, className = 'text-base' }: { rating: number; className?: string }) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)))
  return (
    <span className={`inline-flex text-amber-400 ${className}`} role="img" aria-label={`${filled} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} aria-hidden="true" className={n <= filled ? '' : 'text-gray-300'}>★</span>
      ))}
    </span>
  )
}