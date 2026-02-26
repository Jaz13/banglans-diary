import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

function getAdmin() {
  return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

/** POST /api/chat/reactions — Toggle a reaction (add or remove) */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { message_id, emoji } = await request.json()
  if (!message_id || !emoji) {
    return NextResponse.json({ error: 'Missing message_id or emoji' }, { status: 400 })
  }

  const admin = getAdmin()

  // Check if reaction already exists
  const { data: existing } = await admin
    .from('chat_reactions')
    .select('id')
    .eq('message_id', message_id)
    .eq('user_id', user.id)
    .eq('emoji', emoji)
    .maybeSingle()

  if (existing) {
    // Remove reaction (toggle off)
    await admin.from('chat_reactions').delete().eq('id', existing.id)
    return NextResponse.json({ action: 'removed' })
  }

  // Add reaction (toggle on)
  const { error } = await admin
    .from('chat_reactions')
    .insert({ message_id, user_id: user.id, emoji })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ action: 'added' })
}
