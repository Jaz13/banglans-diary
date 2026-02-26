'use client'

import { useState } from 'react'
import { Heart, MessageCircle, Calendar, Play, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { playLikeSound, playUnlikeSound } from '@/lib/sounds'
import type { Photo } from '@/types'

interface PhotoCardProps {
  photo: Photo
  onClick: (photo: Photo) => void
  onLike?: (photoId: string) => void
  currentUserId?: string
  userRole?: string
  onDelete?: (photoId: string) => void
  index?: number
}

export function PhotoCard({ photo, onClick, onLike, currentUserId, userRole, onDelete, index = 0 }: PhotoCardProps) {
  const [liked, setLiked] = useState(photo.user_has_liked ?? false)
  const [likeCount, setLikeCount] = useState(photo.likes_count ?? 0)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [heartPop, setHeartPop] = useState(false)

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    const newLiked = !liked
    setLiked(newLiked)
    setLikeCount((c) => (newLiked ? c + 1 : c - 1))
    onLike?.(photo.id)
    if (newLiked) {
      playLikeSound()
      setHeartPop(true)
      setTimeout(() => setHeartPop(false), 500)
    } else {
      playUnlikeSound()
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleting(true)
    try {
      const res = await fetch('/api/delete-photo', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId: photo.id }),
      })
      if (res.ok) {
        window.dispatchEvent(new CustomEvent('photos-updated'))
        onDelete?.(photo.id)
      }
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const isVideo = photo.media_type === 'video'
  const canDelete = currentUserId && (photo.uploaded_by === currentUserId || userRole === 'admin')
  const staggerDelay = Math.min(index, 11) * 40

  return (
    <div
      className="masonry-grid-item group cursor-pointer"
      onClick={() => onClick(photo)}
      style={{ animationDelay: `${staggerDelay}ms`, animationFillMode: 'both' }}
    >
      <div className="relative overflow-hidden rounded-2xl bg-secondary shadow-sm hover:shadow-xl transition-all duration-400 hover:-translate-y-0.5 animation-amber-glow photo-card-enter">
        <div className="relative overflow-hidden">
          {!imgLoaded && (
            <div className="absolute inset-0 bg-secondary animate-pulse" />
          )}
          <img
            src={(photo.thumbnail_url || photo.cloudinary_url || '').replace(/[\n\r]/g, '')}
            alt={photo.caption || 'Banglan moment'}
            className="w-full h-auto block transition-all duration-500 ease-out group-hover:scale-[1.04]"
            style={{ opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.4s ease, transform 0.7s ease' }}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
          />

          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 group-hover:bg-black/70 transition-all duration-300 shadow-lg border border-primary/30">
                <Play className="w-6 h-6 text-primary fill-primary ml-0.5" />
              </div>
            </div>
          )}

          {canDelete && (
            <div
              className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {confirmDelete ? (
                <div className="flex items-center gap-1 bg-black/80 backdrop-blur-sm rounded-full px-2 py-1">
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="text-xs font-semibold text-red-400 disabled:opacity-50"
                  >
                    {deleting ? '…' : 'Delete'}
                  </button>
                  <span className="text-white/40 text-xs">·</span>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="text-xs text-white/70"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(true) }}
                  className="p-1.5 rounded-full bg-black/70 backdrop-blur-sm text-white/70 hover:text-red-400 hover:bg-black/90 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {isVideo && (
            <div className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur-sm text-primary text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-primary/20">
              <Play className="w-2.5 h-2.5 fill-primary" />
              Video
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none" />

          {heartPop && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <Heart
                className="w-16 h-16 text-primary fill-primary animate-heart-burst"
                style={{ filter: 'drop-shadow(0 0 16px oklch(0.75 0.17 68 / 0.8))' }}
              />
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out">
            {photo.caption && (
              <p className="text-white text-[10px] font-medium line-clamp-1 mb-1.5 drop-shadow-sm">{photo.caption}</p>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-0.5 text-white/70 text-[10px] font-mono">
                <Calendar className="w-2.5 h-2.5" />
                <span>{format(new Date(photo.taken_at || photo.created_at), 'MMM d')}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLike}
                  className="flex items-center gap-0.5 text-white text-[10px] hover:text-primary transition-colors active:scale-90"
                >
                  <Heart className={`w-3 h-3 transition-all duration-200 ${liked ? 'fill-primary text-primary scale-110' : ''}`} />
                  <span>{likeCount}</span>
                </button>
                <div className="flex items-center gap-0.5 text-white text-[10px]">
                  <MessageCircle className="w-3 h-3" />
                  <span>{photo.comments_count ?? 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
