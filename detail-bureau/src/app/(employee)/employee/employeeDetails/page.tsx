'use client'

import { useState, useEffect } from 'react'

interface EmployeeDetails {
  id: string
  username: string
  first_name: string
  last_name: string
  role: string
  is_active: boolean
  created_at: string
}

export default function EmployeeDetailsPage() {
  const [employee, setEmployee] = useState<EmployeeDetails | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    fetch('/api/employee/me')
      .then(r => r.json())
      .then((data: EmployeeDetails) => {
        setEmployee(data)
        setFirstName(data.first_name)
        setLastName(data.last_name)
      })
  }, [])

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    setProfileError('')
    setProfileSaved(false)

    const res = await fetch('/api/employee/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ first_name: firstName, last_name: lastName }),
    })
    const data = await res.json()

    if (!res.ok) {
      setProfileError(data.error || 'Failed to save changes.')
    } else {
      setEmployee(data)
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 2000)
    }
    setSavingProfile(false)
  }

  const handleChangePassword = async () => {
    setPasswordError('')
    setPasswordSaved(false)

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.')
      return
    }

    setSavingPassword(true)
    const res = await fetch('/api/employee/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    })
    const data = await res.json()

    if (!res.ok) {
      setPasswordError(data.error || 'Failed to change password.')
    } else {
      setPasswordSaved(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSaved(false), 2000)
    }
    setSavingPassword(false)
  }

  if (!employee) return (
    <div className="flex items-center justify-center py-20">
      <p className="text-gray-500">Loading...</p>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">My Details</h1>
      </div>

      <div className="space-y-4">
        {/* Account info */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Account</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Username</span>
              <span className="text-gray-200">{employee.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Role</span>
              <span className="text-gray-200 capitalize">{employee.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Member since</span>
              <span className="text-gray-200">
                {new Date(employee.created_at).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Edit profile */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Edit Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">First name</label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Last name</label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            {profileError && (
              <p className="text-red-400 text-sm bg-red-950 border border-red-800 rounded-lg px-3 py-2">
                {profileError}
              </p>
            )}
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
            >
              {profileSaved ? '✓ Saved' : savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Change password */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Change Password</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Current password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Confirm new password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            {passwordError && (
              <p className="text-red-400 text-sm bg-red-950 border border-red-800 rounded-lg px-3 py-2">
                {passwordError}
              </p>
            )}
            <button
              onClick={handleChangePassword}
              disabled={savingPassword}
              className="w-full bg-black hover:bg-gray-800 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 text-sm transition-colors border border-gray-700"
            >
              {passwordSaved ? '✓ Password updated' : savingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
