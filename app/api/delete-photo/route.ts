import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import cloudinary from '@/lib/cloudinary'

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { photoId } = await request.json()
  const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: photo } = await admin.from('photos').select('*').eq('id', photoId).single()
  if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (photo.uploaded_by !== user.id && profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try { await cloudinary.uploader.destroy(photo.cloudinary_public_id) } catch {}
  await admin.from('photos').delete().eq('id', photoId)
  return NextResponse.json({ success: true })
}
