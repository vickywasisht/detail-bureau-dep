'use client'

import { useState, useEffect } from 'react'

interface Employee {
  id: string
  username: string
  first_name: string
  last_name: string
  role: 'owner' | 'employee'
  is_active: boolean
}

export default function OwnerEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    username: '', first_name: '', last_name: '', password: '', role: 'employee',
  })

  const load = async () => {
    const res = await fetch('/api/owner/employees')
    if (res.ok) setEmployees(await res.json())
  }
  useEffect(() => { load() }, [])

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const res = await fetch('/api/owner/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) return setError(data.error)
    setForm({ username: '', first_name: '', last_name: '', password: '', role: 'employee' })
    load()
  }

  const update = async (id: string, changes: Partial<Employee>) => {
    setError('')
    const res = await fetch(`/api/owner/employees/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes),
    })
    const data = await res.json()
    if (!res.ok) return setError(data.error)
    load()
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Employees</h1>
      {error && <p className="text-red-600">{error}</p>}

      <form onSubmit={create} className="grid grid-cols-2 gap-3 max-w-xl">
        <input required placeholder="First name" value={form.first_name}
          onChange={e => setForm({ ...form, first_name: e.target.value })} className="border p-2 rounded" />
        <input required placeholder="Last name" value={form.last_name}
          onChange={e => setForm({ ...form, last_name: e.target.value })} className="border p-2 rounded" />
        <input required placeholder="Username" value={form.username}
          onChange={e => setForm({ ...form, username: e.target.value })} className="border p-2 rounded" />
        <input required type="password" placeholder="Temporary password" value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })} className="border p-2 rounded" />
        <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
          className="border p-2 rounded">
          <option value="employee">Employee</option>
          <option value="owner">Owner</option>
        </select>
        <button type="submit" className="bg-black text-white rounded p-2">Create employee</button>
      </form>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b">
            <th className="p-2">Name</th><th className="p-2">Username</th>
            <th className="p-2">Role</th><th className="p-2">Status</th><th className="p-2" />
          </tr>
        </thead>
        <tbody>
          {employees.map(emp => (
            <tr key={emp.id} className="border-b">
              <td className="p-2">{emp.first_name} {emp.last_name}</td>
              <td className="p-2">{emp.username}</td>
              <td className="p-2">
                <select value={emp.role}
                  onChange={e => update(emp.id, { role: e.target.value as Employee['role'] })}
                  className="border p-1 rounded">
                  <option value="employee">Employee</option>
                  <option value="owner">Owner</option>
                </select>
              </td>
              <td className="p-2">{emp.is_active ? 'Active' : 'Deactivated'}</td>
              <td className="p-2">
                <button onClick={() => update(emp.id, { is_active: !emp.is_active })}
                  className="underline">
                  {emp.is_active ? 'Deactivate' : 'Reactivate'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
