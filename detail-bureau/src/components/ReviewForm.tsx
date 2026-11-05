'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import StarInput from '@/components/StarInput'

const MAX = 1000

export default function ReviewForm({ bookingId }: { bookingId: string }) {
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (rating < 1) return setError('Please choose a star rating.')
    if (comment.trim().length < 10) return setError('Please write at least 10 characters.')

    setLoading(true)
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: bookingId, rating, title, comment }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(data.error || 'Something went wrong.')
      setLoading(false)
      return
    }
    router.push('/reviews?thanks=1')
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Your rating</label>
        <StarInput value={rating} onChange={setRating} />
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
        <input
          id="title" value={title} maxLength={100} onChange={e => setTitle(e.target.value)}
          placeholder="Sum it up in a few words"
          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-black placeholder-gray-400"
        />
      </div>

      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">Your review</label>
        <textarea
          id="comment" value={comment} maxLength={MAX} rows={5} onChange={e => setComment(e.target.value)}
          placeholder="What did you like? How did your vehicle turn out?"
          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-black placeholder-gray-400"
        />
        <p className="text-xs text-gray-500 text-right">{comment.length}/{MAX}</p>
      </div>

      {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      <button
        type="submit" disabled={loading}
        className="w-full bg-black hover:bg-gray-800 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
      >
        {loading ? 'Submitting...' : 'Submit review'}
      </button>
    </form>
  )
}