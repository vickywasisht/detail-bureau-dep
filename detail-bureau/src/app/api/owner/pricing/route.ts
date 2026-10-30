import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { adminClient } from '@/lib/supabase/admin'
import { requireOwner } from '@/lib/employee-auth'

export async function GET() {
    const owner = await requireOwner()
    if (!owner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [pk, pr] = await Promise.all([
        adminClient.from('service_packages').select('*'),
        adminClient.from('service_pricing').select('*'),
    ])
    if (pk.error || pr.error) {
        return NextResponse.json({ error: (pk.error ?? pr.error)!.message }, { status: 500 })
    }
    return NextResponse.json({ packages: pk.data, pricing: pr.data })
}

export async function PATCH(req: NextRequest) {
    const owner = await requireOwner()
    if (!owner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { packages = [], pricing = [] } = await req.json()

    //make sure pricing and package values that you're changing are valid
    for (const r of pricing) {
        if (r.price === '' || r.price === null || !Number.isFinite(Number(r.price)) || Number(r.price) < 0) {
        return NextResponse.json({ error: 'Prices must be numbers of 0 or more.' }, { status: 400 })
        }
        if (!String(r.duration_hours ?? '').trim()) {
        return NextResponse.json({ error: 'Duration is required.' }, { status: 400 })
        }
    }
    for (const p of packages) {
        if (!String(p.description ?? '').trim()) {
        return NextResponse.json({ error: 'Descriptions cannot be empty.' }, { status: 400 })
        }
    }

    //update the pricing and packages
    for (const p of packages) {
        const { error } = await adminClient
        .from('service_packages').update({ description: p.description.trim() }).eq('slug', p.slug)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
    for (const r of pricing) {
        const { error } = await adminClient
        .from('service_pricing')
        .update({ price: Number(r.price), duration_hours: String(r.duration_hours).trim() })
        .eq('id', r.id)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // static pages must be rebuilt so the change shows immediately
    revalidatePath('/')
    revalidatePath('/packages')
    return NextResponse.json({ success: true })
}