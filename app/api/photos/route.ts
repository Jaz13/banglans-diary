import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

function getAdmin() {
  return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET() {
  // Verify user is authenticated
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Use service role to bypass RLS
  const admin = getAdmin()
  const { data: photos, error } = await admin
    .from('photos')
    .select('*, uploader:profiles!uploaded_by(id, full_name, nickname, avatar_url, role), likes(user_id), comments(count)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Enrich with user-specific data
  const enriched = (photos || []).map((p: any) => ({
    ...p,
    likes_count: p.likes?.length ?? 0,
    user_has_liked: p.likes?.some((l: any) => l.user_id === user.id) ?? false,
    comments_count: p.comments?.[0]?.count ?? 0,
  }))

  return NextResponse.json(enriched)
}
