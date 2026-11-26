import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { getEmployeeFromToken } from '@/lib/employee-auth'

interface VehicleRow {
  customer_id: string
  year: string | number
  make: string
  model: string
  color: string | null
}

interface CustomerRow {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
}

// strips characters that would break out of a PostgREST filter value
const clean = (s: string) => s.replace(/[,()*%\\:"']/g, ' ').replace(/\s+/g, ' ').trim()

export async function GET(req: NextRequest) {
  const employee = await getEmployeeFromToken()
  if (!employee) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = clean(req.nextUrl.searchParams.get('q') ?? '').slice(0, 80)
  if (q.length < 2) return NextResponse.json([])

  const tokens = q.toLowerCase().split(' ').filter(Boolean)
  // the database narrows candidates by the longest word; every word is then checked below
  const anchor = [...tokens].sort((a, b) => b.length - a.length)[0]
  const digits = anchor.replace(/\D/g, '')
  const phoneFilter = digits.length >= 3 ? `,phone.ilike.%${digits.split('').join('%')}%` : ''

  const [byCustomer, byVehicle] = await Promise.all([
    adminClient
      .from('customers')
      .select('id')
      .or(`first_name.ilike.%${anchor}%,last_name.ilike.%${anchor}%,email.ilike.%${anchor}%${phoneFilter}`)
      .limit(100),
    adminClient
      .from('vehicles')
      .select('customer_id')
      .or(`make.ilike.%${anchor}%,model.ilike.%${anchor}%,color.ilike.%${anchor}%,year.ilike.%${anchor}%`)
      .limit(100),
  ])
  if (byCustomer.error || byVehicle.error) {
    return NextResponse.json({ error: (byCustomer.error ?? byVehicle.error)!.message }, { status: 500 })
  }

  const ids = [...new Set([
    ...(byCustomer.data ?? []).map(r => r.id as string),
    ...(byVehicle.data ?? []).map(r => r.customer_id as string),
  ])]
  if (ids.length === 0) return NextResponse.json([])

  const [customers, vehicles] = await Promise.all([
    adminClient.from('customers').select('id, first_name, last_name, email, phone').in('id', ids),
    adminClient.from('vehicles').select('customer_id, year, make, model, color').in('customer_id', ids),
  ])
  if (customers.error || vehicles.error) {
    return NextResponse.json({ error: (customers.error ?? vehicles.error)!.message }, { status: 500 })
  }

  const results = ((customers.data ?? []) as CustomerRow[])
    .map(c => {
      const cars = ((vehicles.data ?? []) as VehicleRow[])
        .filter(v => v.customer_id === c.id)
        .map(v => `${v.year} ${v.make} ${v.model}`.trim())
      const vehicleText = ((vehicles.data ?? []) as VehicleRow[])
        .filter(v => v.customer_id === c.id)
        .map(v => `${v.year} ${v.make} ${v.model} ${v.color ?? ''}`)
        .join(' ')
      const haystack = `${c.first_name} ${c.last_name} ${c.email} ${c.phone ?? ''} ${(c.phone ?? '').replace(/\D/g, '')} ${vehicleText}`.toLowerCase()
      return { c, cars, haystack }
    })
    .filter(r => tokens.every(t => r.haystack.includes(t)))
    .sort((a, b) => `${a.c.first_name} ${a.c.last_name}`.localeCompare(`${b.c.first_name} ${b.c.last_name}`))
    .slice(0, 8)
    .map(r => ({
      id: r.c.id,
      name: `${r.c.first_name} ${r.c.last_name}`.trim(),
      email: r.c.email,
      phone: r.c.phone,
      vehicles: r.cars,
    }))

  return NextResponse.json(results)
}
