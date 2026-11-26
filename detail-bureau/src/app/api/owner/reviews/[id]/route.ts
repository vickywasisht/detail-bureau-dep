import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { requireOwner } from '@/lib/employee-auth'
import { parseBody, reviewVisibilitySchema } from '@/lib/validation'

// PATCH { is_visible: boolean }  -> hide / show a review on the public site
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const owner = await requireOwner()
  if (!owner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { data: body, error: validationError } = await parseBody(req, reviewVisibilitySchema)
  if (validationError) return validationError

  const { error } = await adminClient.from('reviews').update({ is_visible: body.is_visible }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const owner = await requireOwner()
  if (!owner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { error } = await adminClient.from('reviews').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}