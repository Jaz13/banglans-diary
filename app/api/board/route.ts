import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

function getAdmin() {
  return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET() {
  const admin = getAdmin()
  const { data, error } = await admin
    .from('board_posts')
    .select('*, author:profiles!author_id(id, full_name, nickname), comments:board_comments(count)')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const posts = (data || []).map((p: any) => ({
    ...p,
    comment_count: p.comments?.[0]?.count || 0,
    comments: undefined,
  }))
  return NextResponse.json(posts)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const admin = getAdmin()
  const { data, error } = await admin
    .from('board_posts')
    .insert({ ...body, author_id: user.id })
    .select('*, author:profiles!author_id(id, full_name, nickname)')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
