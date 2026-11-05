import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { requireOwner } from '@/lib/employee-auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const owner = await requireOwner()
  if (!owner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { is_active, role } = await req.json()

  // stops the owner from locking themselves out
  if (id === owner.id && (is_active === false || (role && role !== 'owner'))) {
    return NextResponse.json({ error: "You can't deactivate or demote yourself." }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (typeof is_active === 'boolean') updates.is_active = is_active
  if (role !== undefined) {
    if (!['owner', 'employee'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role.' }, { status: 400 })
    }
    updates.role = role
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No changes provided.' }, { status: 400 })
  }

  const { data, error } = await adminClient
    .from('employees').update(updates).eq('id', id)
    .select('id, username, first_name, last_name, role, is_active, created_at').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
