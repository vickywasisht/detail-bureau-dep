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

const inputClass = 'ui-input'
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
        <Link href="/owner/dashboard" className="text-sm text-text-muted underline">← Back to dashboard</Link>
        <p className="mb-1 mt-3 text-sm font-semibold uppercase tracking-wider text-rose-700">Customer love</p>
        <h1 className="text-3xl font-bold text-foreground">Reviews</h1>
        <p className="mt-1 text-sm text-text-muted">Customer reviews appear on the site right away. Hide any that shouldn&apos;t be public.</p>
      </div>

      {error && <p role="alert" className="ui-alert ui-alert--error">{error}</p>}

      <form onSubmit={addTestimonial} className="ui-card max-w-xl space-y-3 border-rose-100 bg-gradient-to-br from-rose-50/60 to-white p-5">
        <h2 className="font-bold text-foreground">Add a testimonial</h2>
        <p className="text-xs text-text-muted">Only add feedback a real customer gave you, with their permission.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input className={`${inputClass} sm:col-span-2`} placeholder="Customer name (e.g. Sam K.)" value={form.reviewer_name}
            onChange={e => setForm({ ...form, reviewer_name: e.target.value })} required />
          <select className={inputClass} value={form.rating} onChange={e => setForm({ ...form, rating: e.target.value })}>
            {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} stars</option>)}
          </select>
        </div>
        <input className={inputClass} placeholder="Title (optional)" value={form.title} maxLength={100}
          onChange={e => setForm({ ...form, title: e.target.value })} />
        <textarea className={inputClass} rows={3} placeholder="What the customer said (10-1000 characters)" value={form.comment}
          maxLength={1000} onChange={e => setForm({ ...form, comment: e.target.value })} required />
        <button disabled={saving} className="ui-button ui-button--primary" aria-busy={saving}>
          {saving ? 'Adding...' : 'Add testimonial'}
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="dashboard-table min-w-[760px] text-left text-sm">
          <thead>
            <tr>
              <th className="p-3">Customer</th>
              <th className="p-3">Rating</th>
              <th className="p-3">Review</th>
              <th className="p-3">Date</th>
              <th className="p-3">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {reviews.map(r => (
              <tr key={r.id} className={`align-top ${r.is_visible ? '' : 'text-text-muted'}`}>
                <td className="p-3 whitespace-nowrap font-semibold text-foreground">
                  {r.reviewer_name}
                  {!r.booking_id && <span className="mt-1 block text-xs font-normal text-text-muted">added by owner</span>}
                </td>
                <td className="p-3"><Stars rating={r.rating} /></td>
                <td className="max-w-md p-3">
                  {r.title && <span className="block font-medium">{r.title}</span>}
                  {r.comment}
                </td>
                <td className="whitespace-nowrap p-3 text-text-muted">{new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                <td className="p-3">
                  <span className={`ui-badge ${r.is_visible ? 'ui-badge--success' : 'ui-badge--neutral'}`}>
                    {r.is_visible ? 'Visible' : 'Hidden'}
                  </span>
                </td>
                <td className="whitespace-nowrap p-3">
                  <button onClick={() => toggle(r)} className="font-semibold text-primary underline underline-offset-2">{r.is_visible ? 'Hide' : 'Show'}</button>
                  <button onClick={() => remove(r)} className="ml-3 font-semibold text-danger underline underline-offset-2">Delete</button>
                </td>
              </tr>
            ))}
            {reviews.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-text-muted">No reviews yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}