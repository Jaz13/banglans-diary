import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const { token, userId } = await request.json()
  if (!token || !userId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const supabase = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: invite } = await supabase.from('invites').select('*').eq('token', token).eq('status', 'pending').single()
  if (!invite) return NextResponse.json({ error: 'Invalid invite' }, { status: 400 })

  await supabase.from('invites').update({ status: 'accepted' }).eq('id', invite.id)
  await supabase.from('profiles').upsert({ id: userId, email: invite.email, role: invite.role }, { onConflict: 'id' })

  return NextResponse.json({ success: true, role: invite.role })
}
