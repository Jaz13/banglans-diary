import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'
import { Resend } from 'resend'

function getAdmin() {
  return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = getAdmin()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { data, error } = await admin.from('invites').select('*, inviter:profiles!invited_by(full_name)').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = getAdmin()
  const { data: profile } = await admin.from('profiles').select('*').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { email, role = 'member' } = await request.json()
  if (!email?.trim()) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  const assignedRole = role === 'admin' ? 'admin' : 'member'

  const { data: invite, error } = await admin
    .from('invites')
    .insert({ email: email.trim().toLowerCase(), token, invited_by: user.id, role: assignedRole, expires_at: expiresAt })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`

  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'placeholder_add_later') {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'Banglans Diary <noreply@resend.dev>',
        to: email.trim(),
        subject: `${profile.full_name} invited you to Banglans Diary 🎸`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#0C0D11;color:#EBEBEB;border-radius:12px;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#1B1C22,#0C0D11);padding:32px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.08);">
              <h1 style="font-size:28px;margin:0;color:#D4882A;letter-spacing:2px;">🎸 BANGLANS DIARY</h1>
              <p style="color:rgba(235,235,235,0.5);font-size:13px;margin:8px 0 0;">Class of 92 — Calicut Medical College</p>
            </div>
            <div style="padding:32px;">
              <p style="font-size:16px;margin:0 0 16px;">Hey legend 👋</p>
              <p style="color:rgba(235,235,235,0.7);line-height:1.6;margin:0 0 24px;">
                <strong style="color:#D4882A;">${profile.full_name}</strong> has invited you to join the Banglans Diary — the private chronicles of the greatest batch to ever walk through Calicut Medical College.
              </p>
              <p style="color:rgba(235,235,235,0.7);line-height:1.6;margin:0 0 24px;">
                You're joining as a <strong style="color:${assignedRole === 'admin' ? '#D4882A' : '#3FA06B'}">${assignedRole}</strong>. Photos, memories, trip plans, the Wall of Fame — it's all waiting.
              </p>
              <div style="text-align:center;margin:32px 0;">
                <a href="${inviteUrl}" style="background:#D4882A;color:#0C0D11;text-decoration:none;padding:14px 32px;border-radius:100px;font-weight:bold;font-size:16px;display:inline-block;">
                  Join the Banglans 🔥
                </a>
              </div>
              <p style="color:rgba(235,235,235,0.4);font-size:12px;text-align:center;">This invite expires in 30 days.</p>
            </div>
          </div>
        `,
      })
    } catch (e) { console.error('Email send failed:', e) }
  }

  return NextResponse.json({ ...invite, inviteUrl })
}
