import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import DataState from '@/components/DataState'


export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: vehicles, error: vehiclesError } = await supabase
    .from('vehicles')
    .select('*')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-violet-700">Your garage</p>
          <h1 className="text-3xl font-bold text-foreground">My Vehicles</h1>
          <p className="mt-1 text-text-muted">Keep your vehicles and detailing history together.</p>
        </div>
        <Link
          href="/vehicles/add"
          className="dashboard-action"
        >
          <span aria-hidden="true">＋</span> Add Vehicle
        </Link>
      </div>

      {vehiclesError ? (
        <DataState
          kind="error"
          title="We couldn’t load your vehicles."
          description="Please try again in a moment."
          action={<a href="/dashboard" className="ui-button ui-button--secondary">Try again</a>}
        />
      ) : vehicles && vehicles.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {vehicles.map((vehicle, index) => (
            <Link
              key={vehicle.id}
              href={`/vehicles/${vehicle.id}`}
              className={`dashboard-card dashboard-card--${['sky', 'violet', 'rose', 'amber', 'teal'][index % 5]} dashboard-enter group block p-5`}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground transition-colors group-hover:text-violet-700">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h2>
                  <p className="mt-2 inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">
                    {vehicle.vehicle_type}
                  </p>
                  {vehicle.color && (
                    <p className="mt-2 text-sm text-text-muted">{vehicle.color}</p>
                  )}
                </div>
                <span className="dashboard-card__icon shrink-0" aria-hidden="true">🚘</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <DataState
          kind="empty"
          title="Your garage is ready for its first ride"
          description="Add a vehicle to start booking and tracking its care."
          action={<Link href="/vehicles/add" className="dashboard-action"><span aria-hidden="true">＋</span> Add a vehicle</Link>}
        />
      )}
    </div>
  )
}