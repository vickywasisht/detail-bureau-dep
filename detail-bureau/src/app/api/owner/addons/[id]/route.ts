import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { requireOwner } from '@/lib/employee-auth'
import { addonSchema, parseBody } from '@/lib/validation'

export async function PATCH(
        req: NextRequest,
        { params }: { params: Promise<{ id: string }> }
    ) 
    {
    const owner = await requireOwner()
    if (!owner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const { data: body, error: validationError } = await parseBody(req, addonSchema)
    if (validationError) return validationError
    const { name, description, price } = body

    const { data, error } = await adminClient
        .from('addons')
        .update({ name, description: description || null, price })
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