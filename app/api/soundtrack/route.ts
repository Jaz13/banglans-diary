import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

function getAdmin() {
  return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const currentUserId = user?.id || ''

  const admin = getAdmin()

  // Auto-expire stale challenges
  const now = new Date().toISOString()
  await admin
    .from('signature_challenges')
    .update({ status: 'expired', result: 'rejected', resolved_at: now })
    .eq('status', 'active')
    .lt('expires_at', now)

  // Fetch songs
  const { data: songs, error } = await admin
    .from('soundtrack')
    .select('*, adder:profiles!added_by(id, full_name, nickname)')
    .order('is_signature', { ascending: false })
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch active challenges with votes
  const songIds = (songs || []).map((s: any) => s.id)
  let challengeMap: Record<string, any> = {}

  if (songIds.length > 0) {
    const { data: challenges } = await admin
      .from('signature_challenges')
      .select('*, challenger:profiles!challenger_id(id, full_name, nickname), votes:signature_challenge_votes(user_id, vote)')
      .eq('status', 'active')
      .in('song_id', songIds)

    if (challenges) {
      for (const ch of challenges) {
        const votes = ch.votes || []
        const agreeCount = votes.filter((v: any) => v.vote === true).length
        const disagreeCount = votes.filter((v: any) => v.vote === false).length
        const threshold = Math.floor(ch.total_admins / 2) + 1
        const userVote = votes.find((v: any) => v.user_id === currentUserId)

        challengeMap[ch.song_id] = {
          id: ch.id,
          song_id: ch.song_id,
          challenger_id: ch.challenger_id,
          challenger: ch.challenger,
          challenge_type: ch.challenge_type,
          status: ch.status,
          result: ch.result,
          total_admins: ch.total_admins,
          created_at: ch.created_at,
          resolved_at: ch.resolved_at,
          expires_at: ch.expires_at,
          agree_count: agreeCount,
          disagree_count: disagreeCount,
          total_votes: votes.length,
          threshold,
          current_user_vote: userVote ? userVote.vote : null,
          votes: undefined,
        }
      }
    }
  }

  // Attach challenges to songs
  const enriched = (songs || []).map((song: any) => ({
    ...song,
    active_challenge: challengeMap[song.id] || null,
  }))

  return NextResponse.json(enriched)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const admin = getAdmin()
  const { count } = await admin.from('soundtrack').select('*', { count: 'exact', head: true })
  const { data, error } = await admin
    .from('soundtrack')
    .insert({ ...body, added_by: user.id, position: (count || 0) + 1 })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
