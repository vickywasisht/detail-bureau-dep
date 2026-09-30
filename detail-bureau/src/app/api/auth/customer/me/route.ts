import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('customers')
    .select('first_name, last_name, email, phone')
    .eq('id', user.id)
    .single()

  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { first_name, last_name, phone, current_password, new_password } = body

  const updates: Record<string, unknown> = {}
  if (first_name !== undefined) updates.first_name = first_name
  if (last_name !== undefined) updates.last_name = last_name
  if (phone !== undefined) updates.phone = phone || null

  if (Object.keys(updates).length > 0) {
    const { error } = await adminClient
      .from('customers')
      .update(updates)
      .eq('id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (new_password) {
    if (!current_password) {
      return NextResponse.json({ error: 'Current password is required to set a new password.' }, { status: 400 })
    }
    if (new_password.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 400 })
    }
    if (!user.email) {
      return NextResponse.json({ error: 'No email on file for this account.' }, { status: 400 })
    }

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current_password,
    })
    if (verifyError) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 })
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: new_password })
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
  }

  const { data } = await adminClient
    .from('customers')
    .select('first_name, last_name, email, phone')
    .eq('id', user.id)
    .single()

  return NextResponse.json(data)
}