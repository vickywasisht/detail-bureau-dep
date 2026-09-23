import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'


export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-black">My Vehicles</h1>
        <Link
          href="/vehicles/add"
          className="bg-black hover:bg-gray-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Add Vehicle
        </Link>
      </div>

      {vehicles && vehicles.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {vehicles.map(vehicle => (
            <Link
              key={vehicle.id}
              href={`/vehicles/${vehicle.id}`}
              className="bg-white border border-gray-200 hover:border-gray-400 rounded-xl p-5 transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-black font-semibold text-lg group-hover:text-gray-700 transition-colors">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">{vehicle.vehicle_type}</p>
                  {vehicle.color && (
                    <p className="text-gray-500 text-sm">{vehicle.color}</p>
                  )}
                </div>
                <span className="text-gray-400 group-hover:text-gray-600 text-lg transition-colors">→</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 border border-gray-200 rounded-xl">
          <p className="text-gray-700 text-lg mb-2">No vehicles yet</p>
          <p className="text-gray-600 text-sm mb-6">Add your first vehicle to get started</p>
          <Link
            href="/vehicles/add"
            className="bg-black hover:bg-gray-800 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            Add a vehicle
          </Link>
        </div>
      )}
    </div>
  )
}