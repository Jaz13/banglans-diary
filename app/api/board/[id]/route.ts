import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

function getAdmin() {
  return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// GET /api/board/[id] — return { post, comments: [...] }
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = getAdmin()

  const [postResult, commentsResult] = await Promise.all([
    admin
      .from('board_posts')
      .select('*, author:profiles!author_id(id, full_name, nickname)')
      .eq('id', id)
      .single(),
    admin
      .from('board_comments')
      .select('*, user:profiles!user_id(id, full_name, nickname)')
      .eq('post_id', id)
      .order('created_at', { ascending: true }),
  ])

  if (postResult.error) return NextResponse.json({ error: postResult.error.message }, { status: 500 })
  if (commentsResult.error) return NextResponse.json({ error: commentsResult.error.message }, { status: 500 })

  return NextResponse.json({ post: postResult.data, comments: commentsResult.data || [] })
}

// POST /api/board/[id] — add a comment to the post
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { content } = await request.json()
  if (!content?.trim()) return NextResponse.json({ error: 'Content is required' }, { status: 400 })

  const admin = getAdmin()
  const { data, error } = await admin
    .from('board_comments')
    .insert({ post_id: id, user_id: user.id, content })
    .select('*, user:profiles!user_id(id, full_name, nickname)')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PATCH /api/board/[id] — update post fields (e.g. is_pinned, title, content)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const admin = getAdmin()
  const { data, error } = await admin
    .from('board_posts')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, author:profiles!author_id(id, full_name, nickname)')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/board/[id] — delete a post
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getAdmin()
  await admin.from('board_posts').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
