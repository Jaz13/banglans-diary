'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { ChevronLeft, Plus } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { PhotoCard } from '@/components/photos/PhotoCard'
import { PhotoLightbox } from '@/components/photos/PhotoLightbox'
import { UploadModal } from '@/components/photos/UploadModal'
import { useAuth } from '@/components/providers/AuthProvider'
import type { Photo, Album } from '@/types'

export default function AlbumDetailPage() {
  const { user: authUser, isAdmin } = useAuth()
  const params = useParams()
  const albumId = params.id as string

  const [album, setAlbum] = useState<Album | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/albums/${albumId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.album) setAlbum(data.album)
        if (data.photos) setPhotos(data.photos)
        setLoading(false)
        return
      }
    } catch { /* fall through */ }

    const supabase = createClient()

    const [{ data: albumData }, { data: photosData }] = await Promise.all([
      supabase.from('albums').select('*').eq('id', albumId).single(),
      supabase.from('photos').select('*, uploader:profiles(*), likes(user_id), comments(count)').eq('album_id', albumId).order('created_at', { ascending: false }),
    ])

    if (albumData) setAlbum(albumData)
    if (photosData) {
      setPhotos(photosData.map((p: any) => ({
        ...p,
        likes_count: p.likes?.length ?? 0,
        user_has_liked: authUser ? p.likes?.some((l: any) => l.user_id === authUser.id) : false,
        comments_count: p.comments?.[0]?.count ?? 0,
      })))
    }
    setLoading(false)
  }, [albumId, authUser])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    const handler = () => loadData()
    window.addEventListener('photos-updated', handler)
    return () => window.removeEventListener('photos-updated', handler)
  }, [loadData])

  return (
    <>
      <div className="mb-8">
        <Link href="/albums" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ChevronLeft className="w-4 h-4" />
          All Albums
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {loading && !album ? (
              <>
                <div className="h-9 w-48 bg-secondary rounded-xl animate-pulse mb-2" />
                <div className="h-4 w-32 bg-secondary rounded-lg animate-pulse" />
              </>
            ) : (
              <>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-1 font-rock tracking-wide">
                  {album?.title || 'Album'}
                </h1>
                <div className="rock-divider mb-2" />
                {album?.description && <p className="text-muted-foreground">{album.description}</p>}
                <p className="text-sm text-muted-foreground mt-1 font-mono">
                  {(() => {
                    const count = `${photos.length} ${photos.length === 1 ? 'moment' : 'moments'}`
                    if (!photos.length) return count
                    const dates = photos.map((p) => p.taken_at || p.created_at).filter(Boolean).sort()
                    if (!dates.length) return count
                    const earliest = format(new Date(dates[0]), 'MMM yyyy')
                    const latest = format(new Date(dates[dates.length - 1]), 'MMM yyyy')
                    const range = earliest === latest ? earliest : `${earliest} – ${latest}`
                    return `${count} · ${range}`
                  })()}
                </p>
              </>
            )}
          </div>
          {isAdmin && (
            <button onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full font-bold text-sm hover:bg-primary/90 transition-colors flex-shrink-0 font-rock tracking-widest">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:block">ADD</span>
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="masonry-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="masonry-grid-item rounded-2xl bg-secondary/80 animate-pulse"
              style={{ height: `${180 + (i % 4) * 50}px`, animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      )}

      {!loading && photos.length === 0 && (
        <div className="text-center py-20 animate-in fade-in duration-300">
          <p className="text-muted-foreground mb-4">No photos in this album yet</p>
          {isAdmin && (
            <button onClick={() => setShowUpload(true)}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold hover:bg-primary/90 transition-colors font-rock tracking-widest">
              <Plus className="w-4 h-4" />
              ADD FIRST PHOTO
            </button>
          )}
        </div>
      )}

      {!loading && photos.length > 0 && (
        <div className="masonry-grid animate-in fade-in duration-300">
          {photos.map((photo, i) => (
            <PhotoCard key={photo.id} photo={photo} onClick={setSelectedPhoto}
              currentUserId={authUser?.id || ''} userRole={isAdmin ? 'admin' : 'member'} index={i} />
          ))}
        </div>
      )}

      {selectedPhoto && (
        <PhotoLightbox
          photo={selectedPhoto} photos={photos}
          onClose={() => setSelectedPhoto(null)} onNavigate={setSelectedPhoto}
          currentUserId={authUser?.id || ''} userRole={isAdmin ? 'admin' : 'member'}
        />
      )}

      {showUpload && album && isAdmin && (
        <UploadModal
          albums={album ? [album] : []} defaultAlbumId={albumId}
          onClose={() => setShowUpload(false)}
          onUploadComplete={() => { setShowUpload(false); loadData() }}
        />
      )}
    </>
  )
}
