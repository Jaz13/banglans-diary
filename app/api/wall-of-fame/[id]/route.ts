import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

function getAdmin() {
  return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const admin = getAdmin()

  // Handle vote toggle
  if ('vote' in body) {
    if (body.vote) {
      await admin.from('wall_votes').upsert({ entry_id: id, user_id: user.id }, { onConflict: 'entry_id,user_id' })
    } else {
      await admin.from('wall_votes').delete().match({ entry_id: id, user_id: user.id })
    }
    const { count } = await admin.from('wall_votes').select('*', { count: 'exact', head: true }).eq('entry_id', id)
    await admin.from('wall_of_fame').update({ vote_count: count || 0 }).eq('id', id)
    return NextResponse.json({ success: true, vote_count: count || 0 })
  }

  const { data, error } = await admin.from('wall_of_fame').update({ ...body, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = getAdmin()
  await admin.from('wall_of_fame').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
