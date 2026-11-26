'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Result {
  id: string
  name: string
  email: string
  phone: string | null
  vehicles: string[]
}

export default function CustomerSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const box = useRef<HTMLDivElement>(null)

  const trimmed = query.trim()
  const searchable = trimmed.length >= 2

  useEffect(() => {
    if (!searchable) return
    // a newer keystroke marks this request stale; its response is then ignored
    let stale = false
    const timer = setTimeout(async () => {
      setLoading(true)
      setLoadError('')
      setResults([])
      try {
        const res = await fetch(`/api/employee/customers/search?q=${encodeURIComponent(trimmed)}`)
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error ?? 'Could not search customers.')
        }
        const data: unknown = await res.json()
        if (!Array.isArray(data)) throw new Error('Customer search results could not be displayed.')
        if (stale) return
        setResults(data)
        setActive(-1)
        setOpen(true)
      } catch (error) {
        if (!stale) setLoadError(error instanceof Error ? error.message : 'Could not search customers.')
      } finally {
        if (!stale) setLoading(false)
      }
    }, 250)
    return () => {
      stale = true
      clearTimeout(timer)
    }
  }, [trimmed, searchable])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const go = (r: Result) => {
    setOpen(false)
    router.push(`/employee/customers/${r.id}`)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      const pick = results[active >= 0 ? active : 0]
      if (pick) {
        e.preventDefault()
        go(pick)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const showList = open && searchable

  return (
    <div ref={box} className="relative max-w-xl">
      <label htmlFor="customer-search" className="block text-sm font-medium text-black mb-1">
        Find a customer
      </label>
      <input
        id="customer-search"
        type="search"
        role="combobox"
        aria-expanded={showList}
        aria-controls="customer-search-results"
        aria-autocomplete="list"
        autoComplete="off"
        placeholder="Search by name, email, phone or vehicle"
        value={query}
        onChange={e => {
          setQuery(e.target.value)
          setResults([])
          setLoading(false)
          setLoadError('')
          setActive(-1)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className="w-full border border-gray-300 bg-white text-black placeholder-gray-500 rounded-lg px-4 py-2.5 focus:outline-none focus:border-black"
      />

      {showList && (
        <ul
          id="customer-search-results"
          role="listbox"
          className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
        >
          {loading && (
            <li role="status" className="px-4 py-3 text-sm text-text-muted">Searching customers...</li>
          )}
          {!loading && loadError && (
            <li role="alert" className="px-4 py-3 text-sm text-danger">{loadError}</li>
          )}
          {!loading && !loadError && results.length === 0 && (
            <li className="px-4 py-3 text-sm text-text-muted">No customers found.</li>
          )}
          {results.map((r, i) => (
            <li
              key={r.id}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onMouseDown={e => e.preventDefault()}
              onClick={() => go(r)}
              className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-0 ${i === active ? 'bg-gray-100' : ''}`}
            >
              <p className="text-sm font-medium text-black">{r.name}</p>
              <p className="text-xs text-gray-600">
                {r.email}{r.phone ? ` · ${r.phone}` : ''}
              </p>
              {r.vehicles.length > 0 && (
                <p className="text-xs text-gray-500 mt-0.5">🚗 {r.vehicles.join(', ')}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
