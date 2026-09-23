'use client'

import { useAuth } from '@/context/authContext'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-gray-600 mb-4">Please sign in to view your profile.</p>
          <Link href="/login" className="text-blue-600 hover:text-blue-800 font-semibold">
            Go to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="bg-black text-white px-6 py-8">
            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="text-gray-400 mt-2">Manage your account details</p>
          </div>

          {/* Profile Content */}
          <div className="px-6 py-8">
            {/* Email Section */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-900 font-medium">{user.email}</p>
              </div>
            </div>

            {/* User ID Section */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-2">User ID</label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-900 font-medium text-sm break-all">{user.id}</p>
              </div>
            </div>

            {/* Account Created */}
            {user.created_at && (
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Account Created</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-900 font-medium">
                    {new Date(user.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            )}

            {/* Last Sign In */}
            {user.last_sign_in_at && (
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Last Sign In</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-900 font-medium">
                    {new Date(user.last_sign_in_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            )}

            {/* User Metadata */}
            {user.user_metadata && Object.keys(user.user_metadata).length > 0 && (
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Information</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="space-y-2">
                    {Object.entries(user.user_metadata).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                        <span className="text-gray-900 font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <Link
                href="/dashboard"
                className="flex-1 bg-gray-600 text-white font-semibold py-3 rounded-lg hover:bg-gray-700 transition-colors text-center"
              >
                Back to Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="flex-1 bg-red-600 text-white font-semibold py-3 rounded-lg hover:bg-red-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
