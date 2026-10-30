import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'


//this is j a public read route for the customer side to read all the add ons
export async function GET() {
    const { data, error } = await adminClient
        .from('addons').select('id, name, description, price').order('created_at')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

