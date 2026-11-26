'use client'

import { useState, useEffect } from 'react'
import { NOTE_CATEGORIES, NOTE_MAX_LENGTH, categoryLabel } from '@/lib/customer-notes'

interface Note {
  id: string
  category: string
  body: string
  vehicle_id: string | null
  created_at: string
  updated_at: string | null
  employee_name: string
  is_mine: boolean
}

interface VehicleOption {
  id: string
  label: string
}

interface Page {
  notes: Note[]
  total: number
  page: number
  totalPages: number
}

const PAGE_SIZE = 10

const inputClass = 'w-full border border-gray-300 bg-white text-black placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black'
const filterClass = 'border border-gray-300 bg-white text-black rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-black'

const CATEGORY_STYLES: Record<string, string> = {
  vehicle_condition:   'bg-purple-50 text-purple-700',
  customer_preference: 'bg-blue-50 text-blue-700',
  special_request:     'bg-yellow-50 text-yellow-700',
  general_observation: 'bg-gray-100 text-gray-700',
  other:               'bg-green-50 text-green-700',
}

const FALLBACK_STYLE = 'bg-gray-100 text-gray-700'

const formatTimestamp = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })

const PREVIEW_LENGTH = 150
// anywhere lets unbroken strings (like 1111...) wrap instead of overflowing the card
const wrapClass = 'whitespace-pre-wrap [overflow-wrap:anywhere]'

function NoteMeta({ note, vehicle }: { note: Note; vehicle?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${CATEGORY_STYLES[note.category] ?? FALLBACK_STYLE}`}>
        {categoryLabel(note.category)}
      </span>
      <span className="text-xs text-gray-600">👤 {note.employee_name}</span>
      <span className="text-xs text-gray-600">🕒 {formatTimestamp(note.created_at)}</span>
      {note.updated_at && (
        <span className="text-xs text-gray-500 italic">(Edited {formatTimestamp(note.updated_at)})</span>
      )}
      {vehicle && <span className="text-xs text-gray-600">🚗 {vehicle}</span>}
    </div>
  )
}

export default function CustomerNotes({
  customerId,
  vehicles,
}: {
  customerId: string
  vehicles: VehicleOption[]
}) {
  const [data, setData] = useState<Page>({ notes: [], total: 0, page: 1, totalPages: 1 })
  const [loadedRequestKey, setLoadedRequestKey] = useState('')
  const [loadError, setLoadError] = useState('')
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')

  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [text, setText] = useState('')
  const [touched, setTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [viewing, setViewing] = useState<Note | null>(null)
  const [editing, setEditing] = useState<Note | null>(null)
  const [deleting, setDeleting] = useState<Note | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const badRange = !!filterFrom && !!filterTo && filterFrom > filterTo
  const filtersActive = !!filterCategory || !!filterFrom || !!filterTo

  const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
  if (filterCategory) params.set('category', filterCategory)
  // Send local-day boundaries; "to" is the start of the day after the chosen date.
  if (filterFrom) params.set('from', new Date(`${filterFrom}T00:00:00`).toISOString())
  if (filterTo) {
    const end = new Date(`${filterTo}T00:00:00`)
    end.setDate(end.getDate() + 1)
    params.set('to', end.toISOString())
  }
  const requestUrl = `/api/employee/customers/${customerId}/notes?${params}`
  const requestKey = `${requestUrl}|${reloadKey}`
  const loading = !badRange && loadedRequestKey !== requestKey

  useEffect(() => {
    if (!viewing) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setViewing(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [viewing])

  useEffect(() => {
    if (badRange) return
    // a newer request marks this one stale; its response is then ignored
    let stale = false
    fetch(requestUrl)
      .then(async r => {
        const body = await r.json().catch(() => null)
        if (!r.ok) throw new Error(body?.error ?? 'Could not load notes.')
        if (stale) return
        setData(body)
        setLoadError('')
        // the server clamps the page if it no longer exists, so stay in sync
        if (body.page !== page) setPage(body.page)
      })
      .catch(e => { if (!stale) setLoadError(e.message) })
      .finally(() => { if (!stale) setLoadedRequestKey(requestKey) })

    return () => { stale = true }
  }, [requestUrl, requestKey, page, badRange])

  const vehicleLabel = (id: string | null) => vehicles.find(v => v.id === id)?.label

  const clearFilters = () => {
    setFilterCategory('')
    setFilterFrom('')
    setFilterTo('')
    setPage(1)
  }

  const overLimit = text.length > NOTE_MAX_LENGTH
  const textMissing = text.trim().length === 0
  const unchanged =
    !!editing &&
    text.trim() === editing.body &&
    category === editing.category &&
    (vehicleId || null) === editing.vehicle_id
  const canSave = !textMissing && !overLimit && category !== '' && !saving && !unchanged

  const openModal = (note?: Note) => {
    setEditing(note ?? null)
    setCategory(note?.category ?? '')
    setVehicleId(note?.vehicle_id ?? '')
    setText(note?.body ?? '')
    setTouched(false)
    setError('')
    setOpen(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!canSave) return
    setError('')
    setSaving(true)
    const url = `/api/employee/customers/${customerId}/notes${editing ? `/${editing.id}` : ''}`
    const res = await fetch(url, {
      method: editing ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: text.trim(), category, vehicle_id: vehicleId || null }),
    })
    const body = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) return setError(body.error ?? 'Could not save note.')

    if (editing) {
      // keep the owner's filters and page; just swap in the updated note
      setData(d => ({ ...d, notes: d.notes.map(n => (n.id === body.id ? body : n)) }))
    } else {
      // jump to the newest notes with no filters so the saved note is visible
      setFilterCategory('')
      setFilterFrom('')
      setFilterTo('')
      setPage(1)
      setReloadKey(k => k + 1)
    }
    setOpen(false)
    setEditing(null)
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setDeleteBusy(true)
    setDeleteError('')
    const res = await fetch(`/api/employee/customers/${customerId}/notes/${deleting.id}`, { method: 'DELETE' })
    const body = await res.json().catch(() => ({}))
    setDeleteBusy(false)
    if (!res.ok) return setDeleteError(body.error ?? 'Could not delete note.')
    setViewing(v => (v?.id === deleting.id ? null : v))
    setDeleting(null)
    setReloadKey(k => k + 1)
  }

  const start = (data.page - 1) * PAGE_SIZE + 1
  const end = start + data.notes.length - 1

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Staff notes ({data.total})
        </h2>
        <button
          onClick={() => openModal()}
          className="bg-black hover:bg-gray-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Add Note
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-3 mb-4 pb-4 border-b border-gray-100">
        <label className="text-xs text-gray-600">
          <span className="block mb-1">Category</span>
          <select
            value={filterCategory}
            onChange={e => { setFilterCategory(e.target.value); setPage(1) }}
            className={filterClass}
          >
            <option value="">All categories</option>
            {NOTE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </label>
        <label className="text-xs text-gray-600">
          <span className="block mb-1">From</span>
          <input
            type="date"
            value={filterFrom}
            max={filterTo || undefined}
            onChange={e => { setFilterFrom(e.target.value); setPage(1) }}
            className={filterClass}
          />
        </label>
        <label className="text-xs text-gray-600">
          <span className="block mb-1">To</span>
          <input
            type="date"
            value={filterTo}
            min={filterFrom || undefined}
            onChange={e => { setFilterTo(e.target.value); setPage(1) }}
            className={filterClass}
          />
        </label>
        {filtersActive && (
          <button onClick={clearFilters} className="text-sm text-blue-600 hover:text-blue-700 pb-2">
            Clear filters
          </button>
        )}
      </div>

      {badRange && (
        <p className="text-sm text-red-600 mb-3">The From date must be on or before the To date.</p>
      )}
      {loadError && <p className="text-sm text-red-600 mb-3">{loadError}</p>}
      {loading && data.notes.length === 0 && <p className="text-sm text-gray-500">Loading notes...</p>}
      {!loading && !loadError && !badRange && data.notes.length === 0 && (
        <p className="text-sm text-gray-500">
          {filtersActive ? 'No notes match your filters.' : 'No staff notes yet.'}
        </p>
      )}

      <ul className={`space-y-4 transition-opacity ${loading ? 'opacity-60' : ''}`}>
        {data.notes.map(n => (
          <li key={n.id} className="border-l-2 border-gray-200 pl-3">
            <NoteMeta note={n} vehicle={vehicleLabel(n.vehicle_id)} />
            <p className={`text-sm text-gray-800 mt-1.5 ${wrapClass}`}>
              {n.body.length > PREVIEW_LENGTH ? `${n.body.slice(0, PREVIEW_LENGTH).trimEnd()}...` : n.body}
            </p>
            {(n.body.length > PREVIEW_LENGTH || n.is_mine) && (
              <div className="flex items-center gap-4 mt-1">
                {n.body.length > PREVIEW_LENGTH && (
                  <button
                    onClick={() => setViewing(n)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Read more
                  </button>
                )}
                {n.is_mine && (
                  <>
                    <button onClick={() => openModal(n)} className="text-sm text-gray-600 hover:text-black">
                      Edit
                    </button>
                    <button
                      onClick={() => { setDeleteError(''); setDeleting(n) }}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      {data.total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-600">
            Showing {start}–{end} of {data.total}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={data.page <= 1 || loading}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">Page {data.page} of {data.totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
              disabled={data.page >= data.totalPages || loading}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {viewing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setViewing(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="view-note-title"
            className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-xl bg-white p-6 text-black shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h2 id="view-note-title" className="sr-only">Note details</h2>
                <NoteMeta note={viewing} vehicle={vehicleLabel(viewing.vehicle_id)} />
              </div>
              <button
                onClick={() => setViewing(null)}
                aria-label="Close"
                autoFocus
                className="text-gray-500 hover:text-black text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="overflow-y-auto min-h-0">
              <p className={`text-sm text-gray-800 ${wrapClass}`}>{viewing.body}</p>
            </div>
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setViewing(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !saving && setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-note-title"
            className="w-full max-w-lg rounded-xl bg-white p-6 text-black shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <h2 id="add-note-title" className="text-xl font-semibold mb-4">
              {editing ? 'Edit note' : 'Add note'}
            </h2>
            <form onSubmit={save} className="space-y-4" noValidate>
              <div>
                <label htmlFor="note-category" className="block text-sm font-medium mb-1">
                  Category <span className="text-red-600">*</span>
                </label>
                <select
                  id="note-category"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select a category</option>
                  {NOTE_CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="note-vehicle" className="block text-sm font-medium mb-1">
                  Vehicle <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <select
                  id="note-vehicle"
                  value={vehicleId}
                  onChange={e => setVehicleId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">No specific vehicle</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="note-text" className="block text-sm font-medium mb-1">
                  Note <span className="text-red-600">*</span>
                </label>
                <textarea
                  id="note-text"
                  rows={6}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onBlur={() => setTouched(true)}
                  aria-invalid={(touched && textMissing) || overLimit}
                  aria-describedby="note-text-help"
                  placeholder="Write your note here..."
                  className={`${inputClass} resize-y ${(touched && textMissing) || overLimit ? 'border-red-500' : ''}`}
                />
                <div id="note-text-help" className="flex justify-between gap-3 mt-1 text-xs">
                  {overLimit
                    ? <span className="text-red-600">
                        Note is {(text.length - NOTE_MAX_LENGTH).toLocaleString()} characters over the limit. Shorten it to save.
                      </span>
                    : touched && textMissing
                    ? <span className="text-red-600">Note text is required.</span>
                    : <span />}
                  <span className={`shrink-0 ${overLimit ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                    {text.length.toLocaleString()} / {NOTE_MAX_LENGTH.toLocaleString()} characters
                  </span>
                </div>
              </div>

              {error && (
                <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSave}
                  className="rounded-lg bg-black px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {saving ? 'Saving...' : editing ? 'Save changes' : 'Save note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !deleteBusy && setDeleting(null)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-note-title"
            className="w-full max-w-sm rounded-xl bg-white p-6 text-black shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <h2 id="delete-note-title" className="text-lg font-semibold mb-2">Delete this note?</h2>
            <p className="text-sm text-gray-700 mb-1">This can&apos;t be undone.</p>
            <p className={`text-sm text-gray-500 mb-4 border-l-2 border-gray-200 pl-3 ${wrapClass}`}>
              {deleting.body.length > 80 ? `${deleting.body.slice(0, 80).trimEnd()}...` : deleting.body}
            </p>
            {deleteError && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{deleteError}</p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleting(null)}
                disabled={deleteBusy}
                autoFocus
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteBusy}
                className="rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 text-sm text-white disabled:opacity-60"
              >
                {deleteBusy ? 'Deleting...' : 'Delete note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
