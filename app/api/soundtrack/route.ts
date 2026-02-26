import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

function getAdmin() {
  return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET() {
  const admin = getAdmin()
  const { data, error } = await admin
    .from('soundtrack')
    .select('*, adder:profiles!added_by(id, full_name, nickname)')
    .order('is_signature', { ascending: false })
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const admin = getAdmin()
  const { count } = await admin.from('soundtrack').select('*', { count: 'exact', head: true })
  const { data, error } = await admin
    .from('soundtrack')
    .insert({ ...body, added_by: user.id, position: (count || 0) + 1 })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
