import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

function getAdmin() {
  return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// POST /api/soundtrack/[id]/challenge/vote — Cast a vote on the active challenge
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: songId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getAdmin()

  // Verify admin role
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const { vote } = await request.json()
  if (typeof vote !== 'boolean') {
    return NextResponse.json({ error: 'Vote must be true or false' }, { status: 400 })
  }

  // Find active challenge for this song
  const { data: challenge } = await admin
    .from('signature_challenges')
    .select('*')
    .eq('song_id', songId)
    .eq('status', 'active')
    .maybeSingle()

  if (!challenge) {
    return NextResponse.json({ error: 'No active challenge for this song' }, { status: 404 })
  }

  // Check expiry
  if (new Date(challenge.expires_at) < new Date()) {
    // Auto-expire
    await admin
      .from('signature_challenges')
      .update({ status: 'expired', result: 'rejected', resolved_at: new Date().toISOString() })
      .eq('id', challenge.id)
    return NextResponse.json({ error: 'Challenge has expired' }, { status: 410 })
  }

  // Upsert vote
  const { error: voteError } = await admin
    .from('signature_challenge_votes')
    .upsert(
      { challenge_id: challenge.id, user_id: user.id, vote },
      { onConflict: 'challenge_id,user_id' }
    )

  if (voteError) {
    return NextResponse.json({ error: voteError.message }, { status: 500 })
  }

  // Re-count votes
  const { data: allVotes } = await admin
    .from('signature_challenge_votes')
    .select('vote')
    .eq('challenge_id', challenge.id)

  const votes = allVotes || []
  const agreeCount = votes.filter((v: any) => v.vote === true).length
  const disagreeCount = votes.filter((v: any) => v.vote === false).length
  const totalVotes = votes.length
  const threshold = Math.floor(challenge.total_admins / 2) + 1

  // Check if challenge should be resolved
  let status = 'active'
  let result = null

  if (agreeCount >= threshold) {
    // Approved — flip signature
    status = 'resolved'
    result = 'approved'

    await admin
      .from('signature_challenges')
      .update({ status: 'resolved', result: 'approved', resolved_at: new Date().toISOString() })
      .eq('id', challenge.id)

    // Flip is_signature
    const newSignature = challenge.challenge_type === 'add'
    await admin
      .from('soundtrack')
      .update({ is_signature: newSignature })
      .eq('id', songId)
  } else if (totalVotes >= challenge.total_admins) {
    // Everyone voted, but not enough agrees — rejected
    status = 'resolved'
    result = 'rejected'

    await admin
      .from('signature_challenges')
      .update({ status: 'resolved', result: 'rejected', resolved_at: new Date().toISOString() })
      .eq('id', challenge.id)
  }

  return NextResponse.json({
    challenge_id: challenge.id,
    status,
    result,
    agree_count: agreeCount,
    disagree_count: disagreeCount,
    total_votes: totalVotes,
    threshold,
    current_user_vote: vote,
  })
}
