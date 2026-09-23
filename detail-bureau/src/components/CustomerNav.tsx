'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  customer: { first_name: string; last_name: string } | null
}

export default function CustomerNav({ customer }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-black font-medium text-base">
            The Detail Bureau
          </Link>
          <Link
            href="/dashboard"
            className={`text-sm transition-opacity ${pathname.startsWith('/dashboard') ? 'text-black' : 'text-gray-600 hover:opacity-60'}`}
          >
            My Vehicles
          </Link>
        </div>
        <div className="flex items-center gap-6">
          {customer && <span className="text-gray-700 text-sm">{customer.first_name} {customer.last_name}</span>}
          <Link href="/profile" className="text-sm text-gray-600 hover:text-black transition-colors">
            User
          </Link>
          <button onClick={handleSignOut} className="text-sm font-medium px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors">
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}