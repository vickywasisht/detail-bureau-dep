import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { adminClient } from '@/lib/supabase/admin'
import { requireOwner } from '@/lib/employee-auth'
import { parseBody, pricingUpdateSchema } from '@/lib/validation'

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

    const { data: body, error: validationError } = await parseBody(req, pricingUpdateSchema)
    if (validationError) return validationError
    const { packages, pricing } = body

    //update the pricing and packages
    for (const p of packages) {
        const { error } = await adminClient
        .from('service_packages').update({ description: p.description }).eq('slug', p.slug)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
    for (const r of pricing) {
        const { error } = await adminClient
        .from('service_pricing')
        .update({ price: r.price, duration_hours: r.duration_hours })
        .eq('id', r.id)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // static pages must be rebuilt so the change shows immediately
    revalidatePath('/')
    revalidatePath('/packages')
    return NextResponse.json({ success: true })
}