import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const { token } = await request.json()
  if (!token) return NextResponse.json({ valid: false }, { status: 400 })

  const supabase = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: invite } = await supabase
    .from('invites')
    .select('*, inviter:profiles!invited_by(full_name)')
    .eq('token', token)
    .eq('status', 'pending')
    .single()

  if (!invite) return NextResponse.json({ valid: false, reason: 'Invalid or expired invite link' })
  if (new Date(invite.expires_at) < new Date()) {
    await supabase.from('invites').update({ status: 'expired' }).eq('id', invite.id)
    return NextResponse.json({ valid: false, reason: 'This invite has expired' })
  }

  return NextResponse.json({
    valid: true,
    email: invite.email,
    role: invite.role,
    inviter_name: (invite.inviter as any)?.full_name || 'A Banglan',
  })
}
