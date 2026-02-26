import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

function getAdmin() {
  return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function syncVoteCount(admin: ReturnType<typeof getAdmin>, entryId: string) {
  const { count } = await admin
    .from('wall_votes')
    .select('*', { count: 'exact', head: true })
    .eq('entry_id', entryId)
  await admin.from('wall_of_fame').update({ vote_count: count || 0 }).eq('id', entryId)
  return count || 0
}

// POST /api/wall-of-fame/[id]/vote — cast a vote (upvote)
export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getAdmin()
  const { error } = await admin
    .from('wall_votes')
    .upsert({ entry_id: id, user_id: user.id }, { onConflict: 'entry_id,user_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const vote_count = await syncVoteCount(admin, id)
  return NextResponse.json({ success: true, vote_count })
}

// DELETE /api/wall-of-fame/[id]/vote — remove vote
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getAdmin()
  const { error } = await admin
    .from('wall_votes')
    .delete()
    .match({ entry_id: id, user_id: user.id })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const vote_count = await syncVoteCount(admin, id)
  return NextResponse.json({ success: true, vote_count })
}
