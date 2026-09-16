import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CustomerNav from '@/components/CustomerNav'

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: customer } = await supabase
    .from('customers')
    .select('first_name, last_name')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-950">
      <CustomerNav customer={customer} />
      <main className="max-w-5xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}