'use client'

import { useState, useEffect } from 'react'
import { Heart, Zap, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { format, differenceInYears, differenceInMonths, differenceInDays } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import type { Photo } from '@/types'

interface OnThisDayProps {
  onPhotoClick: (photo: Photo, photos: Photo[]) => void
  currentUserId: string
}

function timeAgoLabel(date: Date): string {
  const now = new Date()
  const years = differenceInYears(now, date)
  const months = differenceInMonths(now, date)
  const days = differenceInDays(now, date)
  if (years >= 1) return years === 1 ? '1 year ago' : `${years} years ago`
  if (months >= 1) return months === 1 ? '1 month ago' : `${months} months ago`
  if (days >= 1) return days === 1 ? 'yesterday' : `${days} days ago`
  return 'earlier today'
}

export function OnThisDay({ onPhotoClick, currentUserId }: OnThisDayProps) {
  const [memories, setMemories] = useState<Photo[]>([])
  const [index, setIndex] = useState(0)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const fetchMemories = async () => {
      const supabase = createClient()
      const now = new Date()
      const today = { month: now.getMonth() + 1, day: now.getDate() }

      const { data } = await supabase
        .from('photos')
        .select('*, uploader:profiles(*), likes(user_id), comments(count)')
        .order('created_at', { ascending: false })

      if (!data) return

      const matches = data
        .map((p: any) => ({
          ...p,
          likes_count: p.likes?.length ?? 0,
          user_has_liked: p.likes?.some((l: any) => l.user_id === currentUserId) ?? false,
          comments_count: p.comments?.[0]?.count ?? 0,
        }))
        .filter((p: Photo) => {
          const d = new Date(p.taken_at || p.created_at)
          return (
            d.getMonth() + 1 === today.month &&
            d.getDate() === today.day &&
            d.getFullYear() < now.getFullYear()
          )
        })

      if (matches.length > 0) {
        setMemories(matches)
        const first = matches[0]
        setLiked(first.user_has_liked ?? false)
        setLikeCount(first.likes_count ?? 0)
      }
      setLoaded(true)
    }
    fetchMemories()
  }, [currentUserId])

  useEffect(() => {
    if (memories[index]) {
      setLiked(memories[index].user_has_liked ?? false)
      setLikeCount(memories[index].likes_count ?? 0)
    }
  }, [index, memories])

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const photo = memories[index]
    if (!photo) return
    const supabase = createClient()
    const newLiked = !liked
    setLiked(newLiked)
    setLikeCount((c) => (newLiked ? c + 1 : c - 1))
    if (newLiked) {
      await supabase.from('likes').insert({ photo_id: photo.id, user_id: currentUserId })
    } else {
      await supabase.from('likes').delete().match({ photo_id: photo.id, user_id: currentUserId })
    }
  }

  if (!loaded || memories.length === 0 || dismissed) return null

  const photo = memories[index]
  const photoDate = new Date(photo.taken_at || photo.created_at)
  const timeLabel = timeAgoLabel(photoDate)
  const isVideo = photo.media_type === 'video'

  return (
    <div className="mb-8 animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-foreground font-rock tracking-wider">
            ON THIS DAY IN BANGLAN HISTORY
          </span>
          <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full font-mono">
            {format(photoDate, 'MMMM d')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {memories.length > 1 && (
            <span className="text-xs text-muted-foreground font-mono">
              {index + 1} / {memories.length}
            </span>
          )}
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div
        className="relative rounded-3xl overflow-hidden cursor-pointer group shadow-md hover:shadow-[0_0_40px_oklch(0.75_0.17_68/0.2)] transition-all duration-500"
        onClick={() => onPhotoClick(photo, memories)}
        style={{ maxHeight: '420px' }}
      >
        <img
          src={(photo.thumbnail_url || photo.cloudinary_url || '').replace(/[\n\r]/g, '')}
          alt={photo.caption || 'A Banglan memory'}
          className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          style={{ maxHeight: '420px', minHeight: '200px' }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        <div className="absolute top-4 left-4">
          <span className="bg-black/60 backdrop-blur-sm text-primary text-xs font-bold px-3 py-1.5 rounded-full border border-primary/30 font-mono">
            {timeLabel} · {format(photoDate, 'yyyy')}
          </span>
        </div>

        {memories.length > 1 && (
          <>
            {index > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); setIndex(i => i - 1) }}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            {index < memories.length - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); setIndex(i => i + 1) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-5">
          {(photo.memory_note || photo.caption) && (
            <p className={`text-white text-sm leading-relaxed mb-3 line-clamp-2 ${photo.memory_note ? 'italic font-normal opacity-90' : 'font-medium'}`}>
              &ldquo;{photo.memory_note || photo.caption}&rdquo;
            </p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {photo.uploader?.avatar_url ? (
                <img src={photo.uploader.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-primary/60 flex items-center justify-center text-black text-xs font-bold">
                  {photo.uploader?.full_name?.[0] ?? '?'}
                </div>
              )}
              <span className="text-white/80 text-xs">{photo.uploader?.full_name ?? 'A Banglan'}</span>
            </div>
            <button
              onClick={handleLike}
              className="flex items-center gap-1.5 text-white text-xs font-medium hover:text-primary transition-colors"
            >
              <Heart
                className={`w-4 h-4 transition-all duration-200 ${
                  liked ? 'fill-primary text-primary scale-110' : ''
                }`}
              />
              <span>{likeCount > 0 ? likeCount : ''}</span>
            </button>
          </div>
        </div>
      </div>

      {memories.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {memories.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`rounded-full transition-all duration-200 ${
                i === index
                  ? 'w-4 h-1.5 bg-primary'
                  : 'w-1.5 h-1.5 bg-border hover:bg-muted-foreground'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
