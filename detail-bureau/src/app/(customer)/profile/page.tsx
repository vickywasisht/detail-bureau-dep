'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/authContext'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface CustomerProfile {
  first_name: string
  last_name: string
  email: string
  phone: string | null
}

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
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
    if (!user) return
    fetch('/api/auth/customer/me')
      .then(r => r.json())
      .then((data: CustomerProfile) => {
        setProfile(data)
        setFirstName(data.first_name ?? '')
        setLastName(data.last_name ?? '')
        setPhone(data.phone ?? '')
      })
  }, [user])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    setProfileError('')
    setProfileSaved(false)

    const res = await fetch('/api/auth/customer/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ first_name: firstName, last_name: lastName, phone: phone || null }),
    })
    const data = await res.json()

    if (!res.ok) {
      setProfileError(data.error || 'Failed to save changes.')
    } else {
      setProfile(data)
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
    const res = await fetch('/api/auth/customer/me', {
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

  if (loading || (user && !profile)) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-600 text-sm mb-4">Please sign in to view your profile.</p>
        <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
          Go to Sign In
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-black">My Profile</h1>
      </div>

      <div className="space-y-4">
        {/* Account info */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Account</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="text-gray-800">{profile.email}</span>
            </div>
            {user.created_at && (
              <div className="flex justify-between">
                <span className="text-gray-400 text-xs">Member since</span>
                <span className="text-gray-400 text-xs">
                  {new Date(user.created_at).toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric'
                  })}
                </span>
              </div>
            )}
            {user.last_sign_in_at && (
              <div className="flex justify-between">
                <span className="text-gray-400 text-xs">Last sign in</span>
                <span className="text-gray-400 text-xs">
                  {new Date(user.last_sign_in_at).toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric'
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Edit profile */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Edit Profile</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">First name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-black text-sm focus:outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Last name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-black text-sm focus:outline-none focus:border-black"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-black text-sm focus:outline-none focus:border-black"
              />
            </div>
            {profileError && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
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
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Change Password</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Current password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-black text-sm focus:outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-black text-sm focus:outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Confirm new password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-black text-sm focus:outline-none focus:border-black"
              />
            </div>
            {passwordError && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {passwordError}
              </p>
            )}
            <button
              onClick={handleChangePassword}
              disabled={savingPassword}
              className="w-full bg-black hover:bg-gray-800 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
            >
              {passwordSaved ? '✓ Password updated' : savingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-2">
          <Link href="/dashboard" className="text-gray-500 hover:text-black text-sm transition-colors">
            ← Back to Dashboard
          </Link>
          <button
            onClick={handleSignOut}
            className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
