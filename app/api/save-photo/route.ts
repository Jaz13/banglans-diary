import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import cloudinary from '@/lib/cloudinary'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Only admins can upload' }, { status: 403 })

  const body = await request.json()
  const { publicId, albumId, caption, memoryNote, takenAt, mediaType, width, height } = body

  const cloudinaryUrl = cloudinary.url(publicId, { fetch_format: 'auto', quality: 'auto', secure: true })
  const thumbnailUrl = cloudinary.url(publicId, { width: 400, height: 400, crop: 'fill', gravity: 'auto', fetch_format: 'auto', quality: 'auto', secure: true })

  const { data: photo, error } = await admin
    .from('photos')
    .insert({
      album_id: albumId,
      cloudinary_url: cloudinaryUrl,
      cloudinary_public_id: publicId,
      thumbnail_url: thumbnailUrl,
      width: width || null,
      height: height || null,
      caption: caption?.trim() || null,
      memory_note: memoryNote?.trim() || null,
      taken_at: takenAt || null,
      uploaded_by: user.id,
      media_type: mediaType || 'image',
    })
    .select('*, uploader:profiles(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update album cover if first photo
  const { count } = await admin.from('photos').select('*', { count: 'exact', head: true }).eq('album_id', albumId)
  if ((count || 0) <= 1) {
    await admin.from('albums').update({ cover_photo_url: thumbnailUrl, updated_at: new Date().toISOString() }).eq('id', albumId)
  } else {
    await admin.from('albums').update({ updated_at: new Date().toISOString() }).eq('id', albumId)
  }

  return NextResponse.json(photo)
}
