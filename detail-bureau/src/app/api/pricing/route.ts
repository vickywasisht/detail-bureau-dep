import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const vehicle_type = searchParams.get('vehicle_type')

  const supabase = await createClient()

  let query = supabase.from('service_pricing').select('*')
  if (vehicle_type) query = query.eq('vehicle_type', vehicle_type)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}