import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

function getAdmin() {
  return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getAdmin()
  const { data, error } = await admin
    .from('polls')
    .select('*, creator:profiles!created_by(id, full_name, nickname), votes:poll_votes(user_id, option_index)')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const polls = (data || []).map((poll: any) => {
    const votes = poll.votes || []
    const userVote = votes.find((v: any) => v.user_id === user.id)
    const optionVotes = poll.options.map((_: any, i: number) =>
      votes.filter((v: any) => v.option_index === i).length
    )
    return {
      ...poll,
      total_votes: votes.length,
      option_votes: optionVotes,
      user_vote: userVote ? userVote.option_index : null,
      votes: undefined,
    }
  })

  return NextResponse.json(polls)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { question, options, is_multiple_choice = false } = body

  if (!question?.trim() || !Array.isArray(options) || options.length < 2) {
    return NextResponse.json({ error: 'Question and at least 2 options required' }, { status: 400 })
  }

  const admin = getAdmin()
  const { data, error } = await admin
    .from('polls')
    .insert({
      question: question.trim(),
      options: options.map((o: string) => o.trim()).filter(Boolean),
      is_multiple_choice,
      created_by: user.id,
    })
    .select('*, creator:profiles!created_by(id, full_name, nickname)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ...data, total_votes: 0, option_votes: data.options.map(() => 0), user_vote: null })
}
