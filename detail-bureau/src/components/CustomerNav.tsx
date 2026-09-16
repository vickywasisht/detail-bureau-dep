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
    <nav className="border-b border-gray-800 bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-white font-semibold tracking-widest text-sm uppercase">
            The Detail Bureau
          </Link>
          <Link
            href="/dashboard"
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${pathname.startsWith('/dashboard') ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            My Vehicles
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {customer && <span className="text-gray-400 text-sm">{customer.first_name} {customer.last_name}</span>}
          <button onClick={handleSignOut} className="text-gray-500 hover:text-white text-sm transition-colors">Sign out</button>
        </div>
      </div>
    </nav>
  )
}