'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'

interface Employee {
  id: string
  username: string
  first_name: string
  last_name: string
  role: 'owner' | 'employee'
  is_active: boolean
}

const emptyForm = { username: '', first_name: '', last_name: '', email: '', password: '', role: 'employee' }
const inputClass = 'border border-gray-300 p-2 rounded w-full placeholder-gray-500'

export default function OwnerEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [error, setError] = useState('')
  const [modalError, setModalError] = useState('')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [pending, setPending] = useState<Record<string, Partial<Pick<Employee, 'role' | 'is_active'>>>>({})
  const [savingChanges, setSavingChanges] = useState(false)

  const load = async () => {
    const res = await fetch('/api/owner/employees')
    if (res.ok) setEmployees(await res.json())
  }
  useEffect(() => {
    let stale = false
    fetch('/api/owner/employees')
      .then(async response => response.ok ? response.json() : null)
      .then(data => {
        if (!stale && data) setEmployees(data)
      })
      .catch(error => {
        if (!stale) setError(error instanceof Error ? error.message : 'Could not load employees.')
      })

    return () => { stale = true }
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return employees
    return employees.filter(e =>
      `${e.first_name} ${e.last_name} ${e.username} ${e.role} ${e.is_active ? 'active' : 'deactivated'}`
        .toLowerCase().includes(q)
    )
  }, [employees, search])

  const closeModal = () => {
    setShowModal(false)
    setModalError('')
    setForm(emptyForm)
  }

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalError('')
    setSaving(true)
    const res = await fetch('/api/owner/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) return setModalError(data.error)
    closeModal()
    load()
  }

  // Stage a change locally; nothing is sent until the owner clicks Save changes
  const stage = (emp: Employee, changes: Partial<Pick<Employee, 'role' | 'is_active'>>) => {
    setPending(prev => {
      const next = { ...prev[emp.id], ...changes }
      if (next.role === emp.role) delete next.role
      if (next.is_active === emp.is_active) delete next.is_active
      const copy = { ...prev }
      if (Object.keys(next).length === 0) delete copy[emp.id]
      else copy[emp.id] = next
      return copy
    })
  }

  const pendingCount = Object.values(pending).reduce((n, c) => n + Object.keys(c).length, 0)

  const saveChanges = async () => {
    setError('')
    setSavingChanges(true)
    const failures: string[] = []
    for (const [id, changes] of Object.entries(pending)) {
      const res = await fetch(`/api/owner/employees/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const emp = employees.find(e => e.id === id)
        failures.push(`${emp?.username ?? id}: ${data.error ?? 'Update failed.'}`)
      }
    }
    setSavingChanges(false)
    setPending({})
    if (failures.length) setError(failures.join(' '))
    load()
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/owner/dashboard" className="text-sm text-gray-700 underline">
          ← Back to dashboard
        </Link>
        <div className="mt-2 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Employees</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-black text-white rounded px-4 py-2"
          >
            Create employee
          </button>
        </div>
      </div>

      <input
        type="search"
        placeholder="Search by name, username, role or status"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className={`${inputClass} max-w-md`}
      />

      <div className="flex items-center gap-3">
        <button
          onClick={saveChanges}
          disabled={pendingCount === 0 || savingChanges}
          className="rounded bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {savingChanges ? 'Saving...' : 'Save changes'}
        </button>
        <button
          onClick={() => setPending({})}
          disabled={pendingCount === 0 || savingChanges}
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

      {error && <p className="text-red-600">{error}</p>}

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-300">
            <th className="p-2">Name</th>
            <th className="p-2">Username</th>
            <th className="p-2">Role</th>
            <th className="p-2">Status</th>
            <th className="p-2" />
          </tr>
        </thead>
        <tbody>
          {filtered.map(emp => {
            const role = pending[emp.id]?.role ?? emp.role
            const isActive = pending[emp.id]?.is_active ?? emp.is_active
            return (
              <tr
                key={emp.id}
                className={`border-b border-gray-200 ${pending[emp.id] ? 'bg-yellow-50' : ''}`}
              >
                <td className="p-2">{emp.first_name} {emp.last_name}</td>
                <td className="p-2">{emp.username}</td>
                <td className="p-2">
                  <select
                    value={role}
                    onChange={e => stage(emp, { role: e.target.value as Employee['role'] })}
                    className="border border-gray-300 p-1 rounded"
                  >
                    <option value="employee">Employee</option>
                    <option value="owner">Owner</option>
                  </select>
                </td>
                <td className="p-2">{isActive ? 'Active' : 'Deactivated'}</td>
                <td className="p-2">
                  <button
                    onClick={() => stage(emp, { is_active: !isActive })}
                    className="underline"
                  >
                    {isActive ? 'Deactivate' : 'Reactivate'}
                  </button>
                </td>
              </tr>
            )
          })}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={5} className="p-4 text-center text-gray-700">
                {employees.length === 0 ? 'No employees yet.' : 'No employees match your search.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-employee-title"
            className="w-full max-w-md rounded-lg bg-white p-6 text-black shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <h2 id="create-employee-title" className="text-xl font-semibold mb-4">
              Create employee
            </h2>
            <form onSubmit={create} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="First name" value={form.first_name}
                  onChange={e => setForm({ ...form, first_name: e.target.value })} className={inputClass} />
                <input required placeholder="Last name" value={form.last_name}
                  onChange={e => setForm({ ...form, last_name: e.target.value })} className={inputClass} />
              </div>
              <input required placeholder="Username" value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })} className={inputClass} />
              <input required type="email" placeholder="Email" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} />
              <input required type="password" placeholder="Temporary password (min 8 characters)" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} className={inputClass} />
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                className={inputClass}>
                <option value="employee">Employee</option>
                <option value="owner">Owner</option>
              </select>

              {modalError && <p className="text-red-600 text-sm">{modalError}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal}
                  className="rounded border border-gray-300 px-4 py-2">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="rounded bg-black px-4 py-2 text-white disabled:opacity-60">
                  {saving ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
