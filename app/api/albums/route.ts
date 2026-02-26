import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const supabase = getAdmin()
  const { data, error } = await supabase
    .from('albums')
    .select('*, photos(cloudinary_url, thumbnail_url)')
    .order('updated_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const albums = (data || []).map((album: any) => {
    const photos = album.photos || []
    const coverPhotos = photos.slice(0, 5).map((p: any) => p.thumbnail_url || p.cloudinary_url).filter(Boolean)
    return {
      ...album,
      photo_count: photos.length,
      cover_photos: coverPhotos,
      first_photo_url: coverPhotos[0] || null,
      photos: undefined,
    }
  })
  return NextResponse.json(albums)
}

export async function POST(request: NextRequest) {
  const serverSupabase = await createServerClient()
  const { data: { user } } = await serverSupabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getAdmin()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Only admins can create albums' }, { status: 403 })
  const body = await request.json()
  const { title, description } = body
  if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  const { data, error } = await supabase
    .from('albums')
    .insert({ title: title.trim(), description: description?.trim() || null, created_by: user.id })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
