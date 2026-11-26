import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { getEmployeeFromToken } from '@/lib/employee-auth'
import { validateNote } from '@/lib/customer-notes'
import { serializeNotes, type NoteRow } from '@/lib/note-serializer'
import { NOTE_CATEGORIES } from '@/lib/customer-notes'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const employee = await getEmployeeFromToken()
  if (!employee) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const sp = req.nextUrl.searchParams

  const pageSize = Math.min(50, Math.max(5, Number(sp.get('pageSize')) || 10))
  const requestedPage = Math.max(1, Math.floor(Number(sp.get('page'))) || 1)

  const category = sp.get('category')
  const from = sp.get('from') ? new Date(sp.get('from')!) : null
  const to = sp.get('to') ? new Date(sp.get('to')!) : null
  if ((from && isNaN(from.getTime())) || (to && isNaN(to.getTime()))) {
    return NextResponse.json({ error: 'Invalid date filter.' }, { status: 400 })
  }
  if (category && !NOTE_CATEGORIES.some(c => c.value === category)) {
    return NextResponse.json({ error: 'Invalid category filter.' }, { status: 400 })
  }

  // from is inclusive, to is exclusive (the client sends the start of the day after the chosen end date)
  const filtered = () => {
    let q = adminClient.from('customer_notes').select('*', { count: 'exact' }).eq('customer_id', id)
    if (category) q = q.eq('category', category)
    if (from) q = q.gte('created_at', from.toISOString())
    if (to) q = q.lt('created_at', to.toISOString())
    return q
  }

  const { count, error: countError } = await filtered().limit(1)
  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 })

  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(requestedPage, totalPages)
  const start = (page - 1) * pageSize

  const { data, error } = await filtered()
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(start, start + pageSize - 1)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    notes: await serializeNotes((data ?? []) as NoteRow[], employee.id),
    total,
    page,
    pageSize,
    totalPages,
  })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const employee = await getEmployeeFromToken()
  if (!employee) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { body, category, vehicle_id } = await req.json().catch(() => ({}))

  const text = typeof body === 'string' ? body.trim() : ''
  const invalid = validateNote(body, category)
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 })

  const { data: customer } = await adminClient
    .from('customers').select('id').eq('id', id).maybeSingle()
  if (!customer) return NextResponse.json({ error: 'Customer not found.' }, { status: 404 })

  if (vehicle_id) {
    const { data: vehicle } = await adminClient
      .from('vehicles').select('id').eq('id', vehicle_id).eq('customer_id', id).maybeSingle()
    if (!vehicle) return NextResponse.json({ error: "That vehicle doesn't belong to this customer." }, { status: 400 })
  }

  // the author always comes from the login token, never from the request
  const { data, error } = await adminClient
    .from('customer_notes')
    .insert({
      customer_id: id,
      vehicle_id: vehicle_id || null,
      employee_id: employee.id,
      category,
      body: text,
    })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const [note] = await serializeNotes([data as NoteRow], employee.id)
  return NextResponse.json(note, { status: 201 })
}
