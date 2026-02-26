'use client'
import { useEffect, useState } from 'react'
import { UploadModal } from '@/components/photos/UploadModal'
import { createClient } from '@/lib/supabase/client'
import type { Album } from '@/types'

export function GlobalUploadModal() {
  const [show, setShow] = useState(false)
  const [albums, setAlbums] = useState<Album[]>([])
  const [userId, setUserId] = useState<string>('')

  useEffect(() => {
    const open = () => setShow(true)
    window.addEventListener('open-upload-modal', open)
    return () => window.removeEventListener('open-upload-modal', open)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => { if (data.user) setUserId(data.user.id) })
  }, [])

  useEffect(() => {
    if (!show) return
    fetch('/api/albums').then(r => r.ok ? r.json() : null).then(data => { if (Array.isArray(data)) setAlbums(data) }).catch(() => {})
  }, [show])

  if (!show) return null
  return (
    <UploadModal
      albums={albums}
      onClose={() => setShow(false)}
      onUploadComplete={() => { window.dispatchEvent(new CustomEvent('photos-updated')); setShow(false) }}
    />
  )
}
