'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Stars from '@/components/Stars'

interface Review {
  id: string
  booking_id: string | null
  reviewer_name: string
  rating: number
  title: string | null
  comment: string
  is_visible: boolean
  created_at: string
}

const inputClass = 'border border-gray-300 p-2 rounded w-full placeholder-gray-500'
const empty = { reviewer_name: '', rating: '5', title: '', comment: '' }
const json = { 'Content-Type': 'application/json' }

export default function OwnerReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const res = await fetch('/api/owner/reviews')
    if (res.ok) setReviews(await res.json())
  }
  useEffect(() => {
    let stale = false
    fetch('/api/owner/reviews')
      .then(async response => response.ok ? response.json() : null)
      .then(data => {
        if (!stale && data) setReviews(data)
      })
      .catch(error => {
        if (!stale) setError(error instanceof Error ? error.message : 'Could not load reviews.')
      })

    return () => { stale = true }
  }, [])

  const toggle = async (r: Review) => {
    setError('')
    const res = await fetch(`/api/owner/reviews/${r.id}`, { method: 'PATCH', headers: json, body: JSON.stringify({ is_visible: !r.is_visible }) })
    if (!res.ok) setError((await res.json().catch(() => ({}))).error ?? 'Update failed.')
    load()
  }

  const remove = async (r: Review) => {
    if (!confirm(`Delete the review from ${r.reviewer_name}? This cannot be undone.`)) return
    setError('')
    const res = await fetch(`/api/owner/reviews/${r.id}`, { method: 'DELETE' })
    if (!res.ok) setError((await res.json().catch(() => ({}))).error ?? 'Delete failed.')
    load()
  }

  const addTestimonial = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    const res = await fetch('/api/owner/reviews', { method: 'POST', headers: json, body: JSON.stringify(form) })
    setSaving(false)
    if (!res.ok) return setError((await res.json().catch(() => ({}))).error ?? 'Could not add testimonial.')
    setForm(empty)
    load()
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/owner/dashboard" className="text-sm text-gray-700 underline">← Back to dashboard</Link>
        <h1 className="mt-2 text-2xl font-bold">Reviews</h1>
        <p className="text-gray-700 text-sm">Customer reviews appear on the site right away. Hide any that shouldn&apos;t be public.</p>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <form onSubmit={addTestimonial} className="border border-gray-300 rounded-lg p-5 space-y-3 max-w-xl">
        <h2 className="font-semibold">Add a testimonial</h2>
        <p className="text-xs text-gray-600">Only add feedback a real customer gave you, with their permission.</p>
        <div className="grid grid-cols-3 gap-3">
          <input className={`${inputClass} col-span-2`} placeholder="Customer name (e.g. Sam K.)" value={form.reviewer_name}
            onChange={e => setForm({ ...form, reviewer_name: e.target.value })} required />
          <select className={inputClass} value={form.rating} onChange={e => setForm({ ...form, rating: e.target.value })}>
            {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} stars</option>)}
          </select>
        </div>
        <input className={inputClass} placeholder="Title (optional)" value={form.title} maxLength={100}
          onChange={e => setForm({ ...form, title: e.target.value })} />
        <textarea className={inputClass} rows={3} placeholder="What the customer said (10-1000 characters)" value={form.comment}
          maxLength={1000} onChange={e => setForm({ ...form, comment: e.target.value })} required />
        <button disabled={saving} className="rounded bg-black px-4 py-2 text-white disabled:opacity-40">
          {saving ? 'Adding...' : 'Add testimonial'}
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="p-2">Customer</th>
              <th className="p-2">Rating</th>
              <th className="p-2">Review</th>
              <th className="p-2">Date</th>
              <th className="p-2">Status</th>
              <th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {reviews.map(r => (
              <tr key={r.id} className={`border-b border-gray-200 align-top ${r.is_visible ? '' : 'bg-gray-50 text-gray-500'}`}>
                <td className="p-2 whitespace-nowrap">
                  {r.reviewer_name}
                  {!r.booking_id && <span className="block text-xs text-gray-500">added by owner</span>}
                </td>
                <td className="p-2"><Stars rating={r.rating} /></td>
                <td className="p-2 max-w-md">
                  {r.title && <span className="block font-medium">{r.title}</span>}
                  {r.comment}
                </td>
                <td className="p-2 whitespace-nowrap">{new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                <td className="p-2">{r.is_visible ? 'Visible' : 'Hidden'}</td>
                <td className="p-2 whitespace-nowrap space-x-3">
                  <button onClick={() => toggle(r)} className="underline">{r.is_visible ? 'Hide' : 'Show'}</button>
                  <button onClick={() => remove(r)} className="underline text-red-600">Delete</button>
                </td>
              </tr>
            ))}
            {reviews.length === 0 && (
              <tr><td colSpan={6} className="p-4 text-center text-gray-700">No reviews yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}