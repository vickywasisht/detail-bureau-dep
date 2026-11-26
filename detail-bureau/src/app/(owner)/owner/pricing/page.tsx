'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import DataState from '@/components/DataState'

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
const inputClass = 'ui-input'
const emptyAddon = { name: '', description: '', price: '' }
const json = { 'Content-Type': 'application/json' }

export default function OwnerPricingPage() {
  const [orig, setOrig] = useState<{ packages: Pkg[]; pricing: Price[] }>({ packages: [], pricing: [] })
  const [draft, setDraft] = useState(orig)
  const [addons, setAddons] = useState<Addon[]>([])
  const [error, setError] = useState('')
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState<{ id: string | null } | null>(null)
  const [addonForm, setAddonForm] = useState(emptyAddon)
  const [modalError, setModalError] = useState('')

  const loadTiers = async () => {
    try {
      const res = await fetch('/api/owner/pricing')
      if (!res.ok) throw new Error('Could not reload service tiers.')
      const data: { packages: Pkg[]; pricing: Price[] } = await res.json()
      setOrig(data)
      setDraft(data)
    } catch (loadError) {
      setLoadError(loadError instanceof Error ? loadError.message : 'Could not reload service tiers.')
    }
  }
  const loadAddons = async () => {
    try {
      const res = await fetch('/api/owner/addons')
      if (!res.ok) throw new Error('Could not reload add-on services.')
      const data: Addon[] = await res.json()
      setAddons(data)
    } catch (loadError) {
      setLoadError(loadError instanceof Error ? loadError.message : 'Could not reload add-on services.')
    }
  }
  useEffect(() => {
    let stale = false
    const tiersRequest = fetch('/api/owner/pricing')
      .then(async response => {
        if (!response.ok) throw new Error('Could not load service tiers.')
        return response.json()
      })
      .then(data => {
        if (stale) return
        setOrig(data)
        setDraft(data)
      })
    const addonsRequest = fetch('/api/owner/addons')
      .then(async response => {
        if (!response.ok) throw new Error('Could not load add-on services.')
        return response.json()
      })
      .then(data => {
        if (!stale) setAddons(data)
      })
    Promise.all([tiersRequest, addonsRequest]).catch(error => {
      if (!stale) setLoadError(error instanceof Error ? error.message : 'Could not load pricing.')
    }).finally(() => {
      if (!stale) setLoading(false)
    })

    return () => { stale = true }
  }, [])

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
        <Link href="/owner/dashboard" className="text-sm text-text-muted underline">
          ← Back to dashboard
        </Link>
        <p className="mb-1 mt-3 text-sm font-semibold uppercase tracking-wider text-amber-700">Service menu</p>
        <h1 className="text-3xl font-bold text-foreground">Content &amp; Pricing</h1>
        <p className="mt-1 text-sm text-text-muted">Keep packages and add-ons clear, current, and ready to book.</p>
      </div>

      {error && <p role="alert" className="ui-alert ui-alert--error">{error}</p>}

      {loading ? (
        <DataState kind="loading" title="Loading service menu..." />
      ) : loadError ? (
        <DataState
          kind="error"
          title="We couldn’t load the service menu."
          description={loadError}
          action={<button onClick={() => window.location.reload()} className="ui-button ui-button--secondary">Try again</button>}
        />
      ) : (
      <>
      {/* Service tiers */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">Service tiers</h2>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={saveChanges}
            disabled={pendingCount === 0 || saving}
            className="ui-button ui-button--primary"
            aria-busy={saving}
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
          <button
            onClick={() => setDraft(orig)}
            disabled={pendingCount === 0 || saving}
            className="ui-button ui-button--secondary"
          >
            Undo all changes
          </button>
          {pendingCount > 0 && (
            <span className="text-sm text-text-muted">
              {pendingCount} unsaved {pendingCount === 1 ? 'change' : 'changes'}
            </span>
          )}
        </div>

        {tiers.length === 0 ? (
          <DataState kind="empty" title="No service tiers available" description="Service packages will appear here once they are configured." />
        ) : <div className="grid gap-4 lg:grid-cols-3">
          {tiers.map(p => (
            <div key={p.slug} className={`dashboard-card dashboard-card--${p.slug === 'basic' ? 'sky' : p.slug === 'value' ? 'violet' : 'amber'} space-y-4 p-5`}>
              <div>
                <h3 className="text-lg font-bold text-foreground">{p.name}</h3>
                <p className="text-sm text-text-muted">{p.subtitle}</p>
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

              <table className="w-full min-w-[300px] text-left text-sm">
                <thead>
                <tr className="border-b border-violet-100 text-text-muted">
                  <th className="py-2">Vehicle</th>
                  <th className="py-2">Price ($)</th>
                  <th className="py-2">Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {VEHICLE_TYPES.map(type => {
                    const r = draft.pricing.find(x => x.package_slug === p.slug && x.vehicle_type === type)
                    if (!r) return null
                    return (
                      <tr key={r.id} className="border-b border-border">
                        <td className="py-2 pr-2 text-foreground">{type}</td>
                        <td className="py-2 pr-2">
                          <input
                            type="number" min="0" step="0.01"
                            value={r.price}
                            onChange={e => setPriceField(r.id, 'price', e.target.value)}
                            className="ui-input ui-input--compact"
                            aria-label={`${p.name} price for ${type}`}
                          />
                        </td>
                        <td className="py-2">
                          <input
                            value={r.duration_hours}
                            onChange={e => setPriceField(r.id, 'duration_hours', e.target.value)}
                            className="ui-input ui-input--compact"
                            aria-label={`${p.name} duration for ${type}`}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>}
      </section>

      {/* Add-ons */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Add-on services</h2>
          <button onClick={() => openAddon()} className="dashboard-action">
            <span aria-hidden="true">＋</span> Add add-on
          </button>
        </div>

        {addons.length === 0 ? (
          <DataState kind="empty" title="No add-ons yet" description="Add-on services you create will appear here." />
        ) : <div className="overflow-x-auto rounded-xl border border-border">
          <table className="dashboard-table min-w-[640px] text-left text-sm">
            <thead>
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Description</th>
                <th className="p-3">Price</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
            {addons.map(a => (
              <tr key={a.id}>
                <td className="p-3 font-semibold text-foreground">{a.name}</td>
                <td className="p-3 text-text-muted">{a.description}</td>
                <td className="p-3 font-semibold text-violet-700">${Number(a.price).toFixed(2)}</td>
                <td className="space-x-4 p-3 text-right">
                  <button onClick={() => openAddon(a)} className="font-semibold text-primary underline underline-offset-2">Edit</button>
                  <button onClick={() => removeAddon(a)} className="font-semibold text-danger underline underline-offset-2">Remove</button>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>}
      </section>
      </>
      )}

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setModal(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="addon-title"
            className="ui-card w-full max-w-md bg-surface p-6 text-foreground shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <h2 id="addon-title" className="mb-4 text-xl font-bold">
              {modal.id ? 'Edit add-on' : 'Add add-on'}
            </h2>
            <form onSubmit={saveAddon} className="space-y-3">
              <input required placeholder="Name" value={addonForm.name}
                onChange={e => setAddonForm({ ...addonForm, name: e.target.value })} className={inputClass} />
              <textarea placeholder="Description (optional)" rows={3} value={addonForm.description}
                onChange={e => setAddonForm({ ...addonForm, description: e.target.value })} className={inputClass} />
              <input required type="number" min="0" step="0.01" placeholder="Price ($)" value={addonForm.price}
                onChange={e => setAddonForm({ ...addonForm, price: e.target.value })} className={inputClass} />

              {modalError && <p role="alert" className="ui-alert ui-alert--error">{modalError}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)}
                  className="ui-button ui-button--secondary">Cancel</button>
                <button type="submit" className="ui-button ui-button--primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
