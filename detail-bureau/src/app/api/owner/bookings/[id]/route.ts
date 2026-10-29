import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { requireOwner } from '@/lib/employee-auth'

const STATUSES = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']

export async function PATCH(
        req: NextRequest,
        { params }: { params: Promise<{ id: string }> }
    ) 
    {

    //filter out non-owner users
    const owner = await requireOwner()
    if (!owner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    //get info from request and the id
    const { id } = await params
    const { booking_status, employee_id } = await req.json()
    const updates: Record<string, unknown> = {}

    if (booking_status !== undefined) {
        if (!STATUSES.includes(booking_status)) {
        return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })
        }
        updates.booking_status = booking_status
    }

    if (employee_id !== undefined) {
        if (employee_id !== null) {
        const { data: emp } = await adminClient
            .from('employees').select('id').eq('id', employee_id).eq('is_active', true).maybeSingle()//employee must exist and be active
        if (!emp) return NextResponse.json({ error: 'Employee not found or inactive.' }, { status: 400 })
        }
        updates.employee_id = employee_id
    }

    if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: 'No changes provided.' }, { status: 400 })
    }

    const { data, error } = await adminClient
        .from('bookings').update(updates).eq('id', id).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}