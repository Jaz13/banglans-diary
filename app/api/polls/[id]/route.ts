import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

function getAdmin() {
  return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// DELETE /api/polls/[id] — admin or creator only
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getAdmin()

  // Check ownership or admin
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  const { data: poll } = await admin.from('polls').select('created_by').eq('id', id).single()

  if (!poll) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (poll.created_by !== user.id && profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await admin.from('polls').delete().eq('id', id)
  return NextResponse.json({ success: true })
}

// PATCH /api/polls/[id] — admin only (pin/unpin, close)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getAdmin()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { data, error } = await admin
    .from('polls')
    .update(body)
    .eq('id', id)
    .select('*, creator:profiles!created_by(id, full_name, nickname)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
