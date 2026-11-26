import { adminClient } from '@/lib/supabase/admin'

export interface NoteRow {
  id: string
  customer_id: string
  vehicle_id: string | null
  employee_id: string | null
  category: string
  body: string
  created_at: string
  updated_at?: string | null
}

// adds the author's name and whether the viewer wrote the note; the browser never sees employee ids
export async function serializeNotes(rows: NoteRow[], viewerId: string) {
  const ids = [...new Set(rows.map(r => r.employee_id).filter((x): x is string => !!x))]
  const names = new Map<string, string>()
  if (ids.length > 0) {
    const { data } = await adminClient
      .from('employees').select('id, first_name, last_name, username').in('id', ids)
    data?.forEach(e => {
      const full = `${e.first_name ?? ''} ${e.last_name ?? ''}`.trim()
      names.set(e.id, full || e.username)
    })
  }
  return rows.map(r => ({
    id: r.id,
    category: r.category,
    body: r.body,
    vehicle_id: r.vehicle_id,
    created_at: r.created_at,
    updated_at: r.updated_at ?? null,
    employee_name: (r.employee_id && names.get(r.employee_id)) || 'Former employee',
    is_mine: r.employee_id === viewerId,
  }))
}
