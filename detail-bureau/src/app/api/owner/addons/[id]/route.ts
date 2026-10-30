import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { requireOwner } from '@/lib/employee-auth'

export async function PATCH(
        req: NextRequest,
        { params }: { params: Promise<{ id: string }> }
    ) 
    {
    const owner = await requireOwner()
    if (!owner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const { name, description, price } = await req.json()
    const p = Number(price)
    if (!name?.trim()) return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
    if (price === '' || price == null || !Number.isFinite(p) || p < 0) {
        return NextResponse.json({ error: 'Enter a valid price.' }, { status: 400 })
    }

    const { data, error } = await adminClient
        .from('addons')
        .update({ name: name.trim(), description: description?.trim() || null, price: p })
        .eq('id', id).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const owner = await requireOwner()
  if (!owner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { error } = await adminClient.from('addons').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}