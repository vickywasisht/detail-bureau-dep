import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/navbar'

export const metadata: Metadata = {
  title: 'My Account',
  robots: { index: false, follow: false },
}

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="max-w-5xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}