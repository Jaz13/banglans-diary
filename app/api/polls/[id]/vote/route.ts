import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

function getAdmin() {
  return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// POST /api/polls/[id]/vote — cast or change a vote
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { option_index } = await request.json()
  if (typeof option_index !== 'number' || option_index < 0) {
    return NextResponse.json({ error: 'Invalid option' }, { status: 400 })
  }

  const admin = getAdmin()

  // Check poll exists and is open
  const { data: poll } = await admin.from('polls').select('*').eq('id', id).single()
  if (!poll) return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
  if (poll.is_closed) return NextResponse.json({ error: 'Poll is closed' }, { status: 400 })
  if (option_index >= poll.options.length) return NextResponse.json({ error: 'Invalid option index' }, { status: 400 })

  // Upsert vote (one vote per user per poll — change allowed)
  const { error } = await admin
    .from('poll_votes')
    .upsert(
      { poll_id: id, user_id: user.id, option_index },
      { onConflict: 'poll_id,user_id' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, option_index })
}

// DELETE /api/polls/[id]/vote — retract vote
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getAdmin()
  await admin.from('poll_votes').delete().eq('poll_id', id).eq('user_id', user.id)
  return NextResponse.json({ success: true })
}
