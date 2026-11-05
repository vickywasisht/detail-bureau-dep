'use client'

import { useState, useEffect } from 'react'
import { PACKAGE_INCLUDES } from '@/lib/package-details'

export interface ServiceDetails {
  package_slug: string
  package_label: string
  booking_status?: string
  service_date?: string
  dropoff_time?: string
  duration_hours?: string | null
  quoted_price?: number | null
  final_price?: number | null
  special_notes?: string | null
  addons?: { id: string; name: string; description?: string | null; price: number }[] | null
  vehicle?: string
  customer?: string
  assignedTo?: string
}

const STATUS_STYLES: Record<string, string> = {
  pending:     'bg-yellow-50 text-yellow-700 border border-yellow-200',
  confirmed:   'bg-green-50 text-green-700 border border-green-200',
  in_progress: 'bg-blue-50 text-blue-700 border border-blue-200',
  completed:   'bg-gray-100 text-gray-600 border border-gray-200',
  cancelled:   'bg-red-50 text-red-700 border border-red-200',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const money = (n: number) => `$${n.toFixed(2)}`

const formatDate = (d: string) =>
  new Date(`${d.slice(0, 10)}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm py-1">
      <span className="text-gray-500">{label}</span>
      <span className="text-black text-right">{value}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-gray-200 pt-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{title}</h3>
      {children}
    </section>
  )
}

function Modal({ service, onClose }: { service: ServiceDetails; onClose: () => void }) {
  const [description, setDescription] = useState('')

  useEffect(() => {
    fetch('/api/packages')
      .then(r => r.json())
      .then((d: Array<{ slug: string; description: string }>) => {
        if (Array.isArray(d)) setDescription(d.find(x => x.slug === service.package_slug)?.description ?? '')
      })
      .catch(() => {})
  }, [service.package_slug])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const includes = (PACKAGE_INCLUDES as Record<string, { exterior: string[]; interior: string[] }>)[service.package_slug]
  const addons = service.addons ?? []
  const addonTotal = addons.reduce((n, a) => n + Number(a.price), 0)
  const hasQuote = service.quoted_price != null
  // quoted_price already includes add-ons, so the package's own price is what's left
  const basePrice = hasQuote ? Math.max(0, Number(service.quoted_price) - addonTotal) : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-details-title"
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 text-black shadow-xl space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="service-details-title" className="text-xl font-semibold">{service.package_label}</h2>
            {service.booking_status && (
              <span className={`inline-block mt-2 text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[service.booking_status] ?? ''}`}>
                {STATUS_LABELS[service.booking_status] ?? service.booking_status}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            autoFocus
            className="text-gray-500 hover:text-black text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <Section title="Package">
          {description && <p className="text-sm text-gray-700 mb-3">{description}</p>}
          {includes && (
            <div className="space-y-3">
              {([['Exterior', includes.exterior], ['Interior', includes.interior]] as const).map(([name, items]) => (
                <div key={name}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1">{name}</p>
                  <ul className="space-y-1">
                    {items.map(item => (
                      <li key={item} className="text-sm text-gray-700 flex gap-2">
                        <span className="text-green-600 shrink-0">✓</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Add-ons">
          {addons.length > 0 ? (
            <ul className="space-y-2">
              {addons.map(a => (
                <li key={a.id} className="flex justify-between gap-4 text-sm">
                  <span>
                    <span className="text-black">{a.name}</span>
                    {a.description && <span className="block text-gray-500 text-xs">{a.description}</span>}
                  </span>
                  <span className="text-black shrink-0">+{money(Number(a.price))}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No add-ons selected.</p>
          )}
        </Section>

        {(service.service_date || service.dropoff_time || service.duration_hours) && (
          <Section title="Schedule">
            {service.service_date && <Row label="Date" value={formatDate(service.service_date)} />}
            {service.dropoff_time && <Row label="Drop-off time" value={service.dropoff_time} />}
            {service.duration_hours && <Row label="Est. duration" value={`${service.duration_hours} hours`} />}
          </Section>
        )}

        {hasQuote && (
          <Section title="Price">
            <Row label="Package" value={money(basePrice!)} />
            {addons.map(a => <Row key={a.id} label={`+ ${a.name}`} value={money(Number(a.price))} />)}
            <div className="flex justify-between gap-4 text-sm py-1 border-t border-gray-200 mt-1 pt-2 font-semibold">
              <span>Quoted total</span>
              <span>{money(Number(service.quoted_price))}</span>
            </div>
            {service.final_price != null && (
              <Row label="Final price" value={money(Number(service.final_price))} />
            )}
            <p className="text-xs text-gray-500 mt-1">Final price is confirmed at drop-off.</p>
          </Section>
        )}

        {(service.vehicle || service.customer || service.assignedTo) && (
          <Section title="Details">
            {service.customer && <Row label="Customer" value={service.customer} />}
            {service.vehicle && <Row label="Vehicle" value={service.vehicle} />}
            {service.assignedTo && <Row label="Assigned to" value={service.assignedTo} />}
          </Section>
        )}

        {service.special_notes && (
          <Section title="Notes">
            <p className="text-sm text-gray-700">{service.special_notes}</p>
          </Section>
        )}

        <div className="flex justify-end pt-2">
          <button onClick={onClose} className="rounded border border-gray-300 px-4 py-2 text-sm">Close</button>
        </div>
      </div>
    </div>
  )
}

export default function ServiceDetailsButton({
  service,
  label = 'View details',
  className = 'underline text-sm',
}: {
  service: ServiceDetails
  label?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>{label}</button>
      {open && <Modal service={service} onClose={() => setOpen(false)} />}
    </>
  )
}
