import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { getEmployeeFromToken } from '@/lib/employee-auth'
import { validateNote } from '@/lib/customer-notes'
import { serializeNotes, type NoteRow } from '@/lib/note-serializer'

type Ctx = { params: Promise<{ id: string; noteId: string }> }

// loads the note and checks that the logged-in employee wrote it
async function loadOwnNote(customerId: string, noteId: string, employeeId: string) {
  const { data: note } = await adminClient
    .from('customer_notes')
    .select('*')
    .eq('id', noteId)
    .eq('customer_id', customerId)
    .maybeSingle()

  if (!note) return { error: NextResponse.json({ error: 'Note not found.' }, { status: 404 }) }
  if (note.employee_id !== employeeId) {
    return { error: NextResponse.json({ error: 'You can only change notes you wrote.' }, { status: 403 }) }
  }
  return { note: note as NoteRow }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const employee = await getEmployeeFromToken()
  if (!employee) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, noteId } = await params
  const { body, category, vehicle_id } = await req.json().catch(() => ({}))

  const loaded = await loadOwnNote(id, noteId, employee.id)
  if (loaded.error) return loaded.error
  const current = loaded.note!

  const invalid = validateNote(body, category)
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 })

  if (vehicle_id) {
    const { data: vehicle } = await adminClient
      .from('vehicles').select('id').eq('id', vehicle_id).eq('customer_id', id).maybeSingle()
    if (!vehicle) return NextResponse.json({ error: "That vehicle doesn't belong to this customer." }, { status: 400 })
  }

  const next = { body: body.trim(), category, vehicle_id: vehicle_id || null }
  const unchanged =
    next.body === current.body && next.category === current.category && next.vehicle_id === current.vehicle_id
  if (unchanged) {
    const [same] = await serializeNotes([current], employee.id)
    return NextResponse.json(same)
  }

  const { data, error } = await adminClient
    .from('customer_notes')
    .update({ ...next, updated_at: new Date().toISOString() })
    .eq('id', noteId)
    .eq('employee_id', employee.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const [note] = await serializeNotes([data as NoteRow], employee.id)
  return NextResponse.json(note)
}

export async function DELETE(_: NextRequest, { params }: Ctx) {
  const employee = await getEmployeeFromToken()
  if (!employee) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, noteId } = await params
  const loaded = await loadOwnNote(id, noteId, employee.id)
  if (loaded.error) return loaded.error

  const { error } = await adminClient
    .from('customer_notes')
    .delete()
    .eq('id', noteId)
    .eq('employee_id', employee.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
