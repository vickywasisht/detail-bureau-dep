'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import DataState from '@/components/DataState'

interface Employee {
  id: string
  username: string
  first_name: string
  last_name: string
  role: 'owner' | 'employee'
  is_active: boolean
}

const emptyForm = { username: '', first_name: '', last_name: '', email: '', password: '', role: 'employee' }
const inputClass = 'ui-input'

export default function OwnerEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [error, setError] = useState('')
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalError, setModalError] = useState('')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [pending, setPending] = useState<Record<string, Partial<Pick<Employee, 'role' | 'is_active'>>>>({})
  const [savingChanges, setSavingChanges] = useState(false)

  const load = async () => {
    setLoading(true)
    setLoadError('')
    try {
      const res = await fetch('/api/owner/employees')
      if (!res.ok) throw new Error('Could not load employees.')
      const data: unknown = await res.json()
      if (!Array.isArray(data)) throw new Error('Employee data could not be displayed.')
      setEmployees(data)
    } catch (loadError) {
      setLoadError(loadError instanceof Error ? loadError.message : 'Could not load employees.')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    let stale = false
    fetch('/api/owner/employees')
      .then(async response => {
        if (!response.ok) throw new Error('Could not load employees.')
        const data: unknown = await response.json()
        if (!Array.isArray(data)) throw new Error('Employee data could not be displayed.')
        return data
      })
      .then(data => {
        if (!stale) setEmployees(data)
      })
      .catch(error => {
        if (!stale) setLoadError(error instanceof Error ? error.message : 'Could not load employees.')
      })
      .finally(() => {
        if (!stale) setLoading(false)
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
        <Link href="/owner/dashboard" className="text-sm text-text-muted underline">
          ← Back to dashboard
        </Link>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-violet-700">Team management</p>
            <h1 className="text-3xl font-bold text-foreground">Employees</h1>
            <p className="mt-1 text-sm text-text-muted">Manage the people who make every detail shine.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="dashboard-action self-start sm:self-auto"
          >
            <span aria-hidden="true">＋</span> Create employee
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

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={saveChanges}
          disabled={pendingCount === 0 || savingChanges}
          className="ui-button ui-button--primary"
          aria-busy={savingChanges}
        >
          {savingChanges ? 'Saving...' : 'Save changes'}
        </button>
        <button
          onClick={() => setPending({})}
          disabled={pendingCount === 0 || savingChanges}
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

      {error && <p role="alert" className="ui-alert ui-alert--error">{error}</p>}

      {loading ? (
        <DataState kind="loading" title="Loading your team..." />
      ) : loadError ? (
        <DataState
          kind="error"
          title="We couldn’t load employees."
          description={loadError}
          action={<button onClick={load} className="ui-button ui-button--secondary">Try again</button>}
        />
      ) : filtered.length === 0 ? (
        <DataState
          kind="empty"
          title={employees.length === 0 ? 'No employees yet' : 'No matches found'}
          description={employees.length === 0 ? 'Create an employee account to build your team.' : 'Try a different search term.'}
          action={employees.length === 0 ? (
            <button onClick={() => setShowModal(true)} className="dashboard-action">Create employee</button>
          ) : undefined}
        />
      ) : (
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="dashboard-table min-w-[680px] text-left text-sm">
          <thead>
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Username</th>
              <th className="p-3">Role</th>
              <th className="p-3">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
          {filtered.map(emp => {
            const role = pending[emp.id]?.role ?? emp.role
            const isActive = pending[emp.id]?.is_active ?? emp.is_active
            return (
              <tr
                key={emp.id}
                className={pending[emp.id] ? 'table-row-pending' : ''}
              >
                <td className="p-3 font-semibold text-foreground">{emp.first_name} {emp.last_name}</td>
                <td className="p-3 text-text-muted">{emp.username}</td>
                <td className="p-3">
                  <select
                    value={role}
                    onChange={e => stage(emp, { role: e.target.value as Employee['role'] })}
                    className="ui-input ui-input--compact"
                    aria-label={`Role for ${emp.first_name} ${emp.last_name}`}
                  >
                    <option value="employee">Employee</option>
                    <option value="owner">Owner</option>
                  </select>
                </td>
                <td className="p-3">
                  <span className={`ui-badge ${isActive ? 'ui-badge--success' : 'ui-badge--neutral'}`}>
                    {isActive ? 'Active' : 'Deactivated'}
                  </span>
                </td>
                <td className="p-3">
                  <button
                    onClick={() => stage(emp, { is_active: !isActive })}
                    className="text-sm font-semibold text-primary underline underline-offset-2 hover:opacity-75"
                  >
                    {isActive ? 'Deactivate' : 'Reactivate'}
                  </button>
                </td>
              </tr>
            )
          })}
          </tbody>
        </table>
      </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-employee-title"
            className="ui-card w-full max-w-md bg-surface p-6 text-foreground shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <h2 id="create-employee-title" className="mb-4 text-xl font-bold">
              Create employee
            </h2>
            <form onSubmit={create} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

              {modalError && <p role="alert" className="ui-alert ui-alert--error">{modalError}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal}
                  className="ui-button ui-button--secondary">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="ui-button ui-button--primary" aria-busy={saving}>
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
