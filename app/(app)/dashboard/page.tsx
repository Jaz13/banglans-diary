'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Zap, Image as ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PhotoCard } from '@/components/photos/PhotoCard'
import { PhotoLightbox } from '@/components/photos/PhotoLightbox'
import { UploadModal } from '@/components/photos/UploadModal'
import { OnThisDay } from '@/components/photos/OnThisDay'
import { BirthdayBanner } from '@/components/dashboard/BirthdayBanner'
import { useAuth } from '@/components/providers/AuthProvider'
import type { Photo, Album } from '@/types'

type FilterType = 'all' | 'photos' | 'videos' | 'liked'

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all',    label: 'All' },
  { key: 'photos', label: 'Photos' },
  { key: 'videos', label: 'Videos' },
  { key: 'liked',  label: 'Liked' },
]

export default function DashboardPage() {
  const { user: authUser, isAdmin } = useAuth()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [albums, setAlbums] = useState<Album[]>([])
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [selectedPhotos, setSelectedPhotos] = useState<Photo[]>([])
  const [showUpload, setShowUpload] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    const supabase = createClient()

    const [photosResult, albumsResult] = await Promise.all([
      supabase
        .from('photos')
        .select('*, uploader:profiles(*), likes(user_id), comments(count)')
        .order('created_at', { ascending: false })
        .limit(50),
      fetch('/api/albums').then(r => r.ok ? r.json() : null).catch(() => null),
    ])

    if (photosResult.data) {
      const enriched = photosResult.data.map((p: any) => ({
        ...p,
        likes_count: p.likes?.length ?? 0,
        user_has_liked: authUser ? p.likes?.some((l: any) => l.user_id === authUser.id) : false,
        comments_count: p.comments?.[0]?.count ?? 0,
      }))
      setPhotos(enriched)
    }
    if (Array.isArray(albumsResult)) {
      setAlbums(albumsResult.map((a: any) => ({ ...a, photo_count: a.photo_count ?? 0 })))
    }
    setLoading(false)
  }, [authUser])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    const handler = () => loadData(true)
    window.addEventListener('photos-updated', handler)
    return () => window.removeEventListener('photos-updated', handler)
  }, [loadData])

  const filteredPhotos = useMemo(() => {
    switch (activeFilter) {
      case 'photos': return photos.filter((p) => p.media_type !== 'video')
      case 'videos': return photos.filter((p) => p.media_type === 'video')
      case 'liked':  return photos.filter((p) => p.user_has_liked)
      default:       return photos
    }
  }, [photos, activeFilter])

  const openPhoto = (photo: Photo, context?: Photo[]) => {
    setSelectedPhoto(photo)
    setSelectedPhotos(context ?? filteredPhotos)
  }

  return (
    <>
      {/* Hero greeting */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-1 font-rock tracking-wide neon-flicker">
              BANGLAN&apos;S DIARY{' '}
              <span className="inline-block text-2xl" style={{ animation: 'reel-spin 8s linear infinite' }}>🎸</span>
            </h1>
            <div className="rock-divider mb-2" />
            <p className="text-muted-foreground">
              {photos.length > 0
                ? <>{photos.length} legendary Banglan moments <span className="opacity-60">🤘</span></>
                : <>Start the Banglan Diary</>}
            </p>
            <p className="text-xs text-muted-foreground/60 italic mt-1 font-mono">
              &ldquo;Rock and roll never forgets.&rdquo; — Bob Seger
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full font-bold text-sm hover:bg-primary/90 transition-colors shadow-[0_0_16px_oklch(0.75_0.17_68/0.3)] font-rock tracking-widest"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:block">ADD MOMENT</span>
            </button>
          )}
        </div>
      </div>

      {/* Birthday Banner */}
      <BirthdayBanner />

      {/* On This Day */}
      {!loading && authUser?.id && (
        <OnThisDay onPhotoClick={openPhoto} currentUserId={authUser?.id || ''} />
      )}

      {/* Rock divider before filters */}
      {!loading && photos.length > 0 && <div className="rock-divider mb-4" />}

      {/* Filter chips */}
      {!loading && photos.length > 0 && (
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
          {FILTERS.map(({ key, label }) => {
            const isActive = activeFilter === key
            let count = 0
            if (key === 'all')    count = photos.length
            else if (key === 'photos') count = photos.filter((p) => p.media_type !== 'video').length
            else if (key === 'videos') count = photos.filter((p) => p.media_type === 'video').length
            else if (key === 'liked')  count = photos.filter((p) => p.user_has_liked).length
            return (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-[0_0_12px_oklch(0.75_0.17_68/0.3)]'
                    : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                }`}
              >
                {label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-black/20 text-primary-foreground' : 'bg-border text-muted-foreground'
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="masonry-grid">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="masonry-grid-item rounded-xl bg-secondary animate-pulse" style={{ height: `${160 + (i % 3) * 50}px` }} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && photos.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5 shadow-[0_0_30px_oklch(0.75_0.17_68/0.2)]">
            <ImageIcon className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2 font-rock tracking-wide">
            THE DIARY AWAITS
          </h2>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Upload the first photo to start building the legendary Banglan archive.
          </p>
          {isAdmin && (
            <button
              onClick={() => setShowUpload(true)}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold hover:bg-primary/90 transition-colors font-rock tracking-widest"
            >
              <Zap className="w-4 h-4" />
              ADD FIRST MOMENT
            </button>
          )}
        </div>
      )}

      {/* Empty filter state */}
      {!loading && photos.length > 0 && filteredPhotos.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-3">
            {activeFilter === 'liked' ? '❤️' : activeFilter === 'videos' ? '🎬' : '📷'}
          </p>
          <p className="text-sm">
            {activeFilter === 'liked'
              ? 'No liked photos yet — tap the heart on any moment!'
              : activeFilter === 'videos'
              ? 'No videos uploaded yet.'
              : 'No photos yet.'}
          </p>
        </div>
      )}

      {/* Masonry grid */}
      {!loading && filteredPhotos.length > 0 && (
        <div className="masonry-grid">
          {filteredPhotos.map((photo, i) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              onClick={(p) => openPhoto(p, filteredPhotos)}
              currentUserId={authUser?.id || ''}
              userRole={isAdmin ? 'admin' : 'member'}
              index={i}
            />
          ))}
        </div>
      )}

      {/* Lightbox */}
      {selectedPhoto && (
        <PhotoLightbox
          photo={selectedPhoto}
          photos={selectedPhotos}
          onClose={() => { setSelectedPhoto(null); setSelectedPhotos([]) }}
          onNavigate={setSelectedPhoto}
          currentUserId={authUser?.id || ''}
          userRole={isAdmin ? 'admin' : 'member'}
        />
      )}

      {/* Upload modal */}
      {showUpload && isAdmin && (
        <UploadModal
          albums={albums}
          onClose={() => setShowUpload(false)}
          onUploadComplete={() => { setShowUpload(false); loadData() }}
        />
      )}
    </>
  )
}
