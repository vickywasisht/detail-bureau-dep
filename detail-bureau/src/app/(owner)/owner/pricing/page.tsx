'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Pkg { slug: string; name: string; subtitle: string; description: string }
interface Price {
  id: string
  package_slug: string
  vehicle_type: string
  price: number | string
  duration_hours: string
}
interface Addon { id: string; name: string; description: string | null; price: number }

const VEHICLE_TYPES = ['Sedan', 'SUV', 'Truck', 'Van', 'Convertible']
const TIER_ORDER = ['basic', 'value', 'premium']
const inputClass = 'border border-gray-300 p-2 rounded w-full placeholder-gray-500'
const emptyAddon = { name: '', description: '', price: '' }
const json = { 'Content-Type': 'application/json' }

export default function OwnerPricingPage() {
  const [orig, setOrig] = useState<{ packages: Pkg[]; pricing: Price[] }>({ packages: [], pricing: [] })
  const [draft, setDraft] = useState(orig)
  const [addons, setAddons] = useState<Addon[]>([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState<{ id: string | null } | null>(null)
  const [addonForm, setAddonForm] = useState(emptyAddon)
  const [modalError, setModalError] = useState('')

  const loadTiers = async () => {
    const res = await fetch('/api/owner/pricing')
    if (!res.ok) return
    const data = await res.json()
    setOrig(data)
    setDraft(data)
  }
  const loadAddons = async () => {
    const res = await fetch('/api/owner/addons')
    if (res.ok) setAddons(await res.json())
  }
  useEffect(() => { loadTiers(); loadAddons() }, [])

  const changedPackages = draft.packages.filter(
    p => p.description !== orig.packages.find(o => o.slug === p.slug)?.description
  )
  const changedPricing = draft.pricing.filter(r => {
    const o = orig.pricing.find(x => x.id === r.id)
    return !o || String(r.price) !== String(o.price) || r.duration_hours !== o.duration_hours
  })
  const pendingCount = changedPackages.length + changedPricing.length

  const setDescription = (slug: string, description: string) =>
    setDraft(d => ({ ...d, packages: d.packages.map(p => (p.slug === slug ? { ...p, description } : p)) }))

  const setPriceField = (id: string, field: 'price' | 'duration_hours', value: string) =>
    setDraft(d => ({ ...d, pricing: d.pricing.map(r => (r.id === id ? { ...r, [field]: value } : r)) }))

  const saveChanges = async () => {
    setError('')
    if (changedPricing.some(r => String(r.price).trim() === '' || !(Number(r.price) >= 0))) {
      return setError('Prices must be numbers of 0 or more.')
    }
    if (changedPackages.some(p => !p.description.trim())) {
      return setError('Descriptions cannot be empty.')
    }
    setSaving(true)
    const res = await fetch('/api/owner/pricing', {
      method: 'PATCH',
      headers: json,
      body: JSON.stringify({
        packages: changedPackages.map(p => ({ slug: p.slug, description: p.description })),
        pricing: changedPricing.map(r => ({
          id: r.id, price: Number(r.price), duration_hours: r.duration_hours,
        })),
      }),
    })
    const data = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) return setError(data.error ?? 'Save failed.')
    loadTiers()
  }

  const openAddon = (a?: Addon) => {
    setModalError('')
    setAddonForm(a ? { name: a.name, description: a.description ?? '', price: String(a.price) } : emptyAddon)
    setModal({ id: a?.id ?? null })
  }

  const saveAddon = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalError('')
    const editing = modal?.id
    const res = await fetch(editing ? `/api/owner/addons/${editing}` : '/api/owner/addons', {
      method: editing ? 'PATCH' : 'POST',
      headers: json,
      body: JSON.stringify(addonForm),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return setModalError(data.error ?? 'Save failed.')
    setModal(null)
    loadAddons()
  }

  const removeAddon = async (a: Addon) => {
    if (!window.confirm(`Remove "${a.name}"? Past bookings keep their record of it.`)) return
    const res = await fetch(`/api/owner/addons/${a.id}`, { method: 'DELETE' })
    if (res.ok) loadAddons()
    else setError('Could not remove add-on.')
  }

  const tiers = [...draft.packages].sort(
    (a, b) => TIER_ORDER.indexOf(a.slug) - TIER_ORDER.indexOf(b.slug)
  )

  return (
    <div className="space-y-10">
      <div>
        <Link href="/owner/dashboard" className="text-sm text-gray-700 underline">
          ← Back to dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Content &amp; Pricing</h1>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {/* Service tiers */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Service tiers</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={saveChanges}
            disabled={pendingCount === 0 || saving}
            className="rounded bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
          <button
            onClick={() => setDraft(orig)}
            disabled={pendingCount === 0 || saving}
            className="rounded border border-gray-300 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Undo all changes
          </button>
          {pendingCount > 0 && (
            <span className="text-sm text-gray-700">
              {pendingCount} unsaved {pendingCount === 1 ? 'change' : 'changes'}
            </span>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {tiers.map(p => (
            <div key={p.slug} className="rounded-lg border border-gray-300 p-5 space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <p className="text-sm text-gray-700">{p.subtitle}</p>
              </div>

              <label className="block text-sm font-medium">
                Description
                <textarea
                  value={p.description}
                  onChange={e => setDescription(p.slug, e.target.value)}
                  rows={4}
                  className={`${inputClass} mt-1 font-normal`}
                />
              </label>

              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="py-1">Vehicle</th>
                    <th className="py-1">Price ($)</th>
                    <th className="py-1">Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {VEHICLE_TYPES.map(type => {
                    const r = draft.pricing.find(x => x.package_slug === p.slug && x.vehicle_type === type)
                    if (!r) return null
                    return (
                      <tr key={r.id} className="border-b border-gray-200">
                        <td className="py-1 pr-2">{type}</td>
                        <td className="py-1 pr-2">
                          <input
                            type="number" min="0" step="0.01"
                            value={r.price}
                            onChange={e => setPriceField(r.id, 'price', e.target.value)}
                            className="border border-gray-300 p-1 rounded w-24"
                          />
                        </td>
                        <td className="py-1">
                          <input
                            value={r.duration_hours}
                            onChange={e => setPriceField(r.id, 'duration_hours', e.target.value)}
                            className="border border-gray-300 p-1 rounded w-20"
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </section>

      {/* Add-ons */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Add-on services</h2>
          <button onClick={() => openAddon()} className="rounded bg-black px-4 py-2 text-white">
            Add add-on
          </button>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="p-2">Name</th>
              <th className="p-2">Description</th>
              <th className="p-2">Price</th>
              <th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {addons.map(a => (
              <tr key={a.id} className="border-b border-gray-200">
                <td className="p-2">{a.name}</td>
                <td className="p-2">{a.description}</td>
                <td className="p-2">${Number(a.price).toFixed(2)}</td>
                <td className="p-2 space-x-4 text-right">
                  <button onClick={() => openAddon(a)} className="underline">Edit</button>
                  <button onClick={() => removeAddon(a)} className="underline text-red-600">Remove</button>
                </td>
              </tr>
            ))}
            {addons.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-700">No add-ons yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setModal(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="addon-title"
            className="w-full max-w-md rounded-lg bg-white p-6 text-black shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <h2 id="addon-title" className="text-xl font-semibold mb-4">
              {modal.id ? 'Edit add-on' : 'Add add-on'}
            </h2>
            <form onSubmit={saveAddon} className="space-y-3">
              <input required placeholder="Name" value={addonForm.name}
                onChange={e => setAddonForm({ ...addonForm, name: e.target.value })} className={inputClass} />
              <textarea placeholder="Description (optional)" rows={3} value={addonForm.description}
                onChange={e => setAddonForm({ ...addonForm, description: e.target.value })} className={inputClass} />
              <input required type="number" min="0" step="0.01" placeholder="Price ($)" value={addonForm.price}
                onChange={e => setAddonForm({ ...addonForm, price: e.target.value })} className={inputClass} />

              {modalError && <p className="text-red-600 text-sm">{modalError}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)}
                  className="rounded border border-gray-300 px-4 py-2">Cancel</button>
                <button type="submit" className="rounded bg-black px-4 py-2 text-white">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
