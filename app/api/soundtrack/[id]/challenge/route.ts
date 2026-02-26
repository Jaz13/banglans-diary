import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

function getAdmin() {
  return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// POST /api/soundtrack/[id]/challenge — Create a challenge
export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: songId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getAdmin()

  // Any authenticated member can create a challenge (not just admins)
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 403 })
  const isAdmin = profile.role === 'admin'

  // Get the song
  const { data: song } = await admin.from('soundtrack').select('*').eq('id', songId).single()
  if (!song) return NextResponse.json({ error: 'Song not found' }, { status: 404 })

  // Determine challenge type based on current status
  const challengeType = song.is_signature ? 'remove' : 'add'

  // Check no active challenge exists
  const { data: existing } = await admin
    .from('signature_challenges')
    .select('id')
    .eq('song_id', songId)
    .eq('status', 'active')
    .maybeSingle()
  if (existing) {
    return NextResponse.json({ error: 'A challenge is already active for this song' }, { status: 409 })
  }

  // Count total admins
  const { count: adminCount } = await admin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'admin')
  const totalAdmins = adminCount || 1

  // Calculate threshold
  const threshold = Math.floor(totalAdmins / 2) + 1

  // Set expiry to 48 hours from now
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

  // Create challenge
  const { data: challenge, error: challengeError } = await admin
    .from('signature_challenges')
    .insert({
      song_id: songId,
      challenger_id: user.id,
      challenge_type: challengeType,
      total_admins: totalAdmins,
      expires_at: expiresAt,
    })
    .select('*, challenger:profiles!challenger_id(id, full_name, nickname)')
    .single()

  if (challengeError) {
    // Likely unique constraint violation (race condition)
    if (challengeError.code === '23505') {
      return NextResponse.json({ error: 'A challenge is already active for this song' }, { status: 409 })
    }
    return NextResponse.json({ error: challengeError.message }, { status: 500 })
  }

  // Auto-insert challenger's vote only if they are an admin (only admin votes count)
  if (isAdmin) {
    await admin.from('signature_challenge_votes').insert({
      challenge_id: challenge.id,
      user_id: user.id,
      vote: true,
    })

    // Check if threshold already met (e.g., only 1 admin)
    if (1 >= threshold) {
      // Auto-resolve
      await admin
        .from('signature_challenges')
        .update({ status: 'resolved', result: 'approved', resolved_at: new Date().toISOString() })
        .eq('id', challenge.id)

      // Flip signature status
      await admin
        .from('soundtrack')
        .update({ is_signature: !song.is_signature })
        .eq('id', songId)

      return NextResponse.json({
        ...challenge,
        status: 'resolved',
        result: 'approved',
        agree_count: 1,
        disagree_count: 0,
        total_votes: 1,
        threshold,
        current_user_vote: true,
      })
    }
  }

  return NextResponse.json({
    ...challenge,
    agree_count: isAdmin ? 1 : 0,
    disagree_count: 0,
    total_votes: isAdmin ? 1 : 0,
    threshold,
    current_user_vote: isAdmin ? true : null,
  })
}
