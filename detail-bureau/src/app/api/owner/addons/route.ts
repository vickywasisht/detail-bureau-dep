import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { requireOwner } from '@/lib/employee-auth'

export async function GET() {
  const owner = await requireOwner()
  if (!owner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await adminClient.from('addons').select('*').order('created_at')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const owner = await requireOwner()
  if (!owner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, description, price } = await req.json()
  const p = Number(price)
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
  if (price === '' || price == null || !Number.isFinite(p) || p < 0) {
    return NextResponse.json({ error: 'Enter a valid price.' }, { status: 400 })
  }

  const { data, error } = await adminClient
    .from('addons')
    .insert({ name: name.trim(), description: description?.trim() || null, price: p })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}