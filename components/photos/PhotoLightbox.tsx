'use client'

import { useEffect, useState } from 'react'
import { X, ChevronLeft, ChevronRight, Heart, Send, Download, Calendar, BookOpen, Trash2, Pencil, FolderInput, Check, Loader2, ImageIcon, Palette } from 'lucide-react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { EmojiPicker } from '@/components/ui/EmojiPicker'
import { playLikeSound, playUnlikeSound, playSoftClick, playShutterSound } from '@/lib/sounds'
import type { Photo, Comment, Album } from '@/types'

const PHOTO_FILTERS = [
  { name: 'Normal', css: 'none' },
  { name: 'B&W', css: 'grayscale(100%)' },
  { name: 'Sepia', css: 'sepia(80%) saturate(120%)' },
  { name: 'Warm', css: 'saturate(130%) hue-rotate(-10deg) brightness(105%)' },
  { name: 'Cool', css: 'saturate(110%) hue-rotate(15deg) brightness(102%)' },
  { name: 'Vivid', css: 'saturate(180%) contrast(110%)' },
  { name: 'Fade', css: 'saturate(70%) brightness(110%) contrast(90%)' },
  { name: 'Dramatic', css: 'contrast(140%) saturate(120%) brightness(95%)' },
]

interface PhotoLightboxProps {
  photo: Photo
  photos: Photo[]
  onClose: () => void
  onNavigate: (photo: Photo) => void
  currentUserId: string
  userRole?: string
}

const REACTIONS = [
  { emoji: '🥰', label: 'Love' },
  { emoji: '😂', label: 'Haha' },
  { emoji: '😮', label: 'Wow' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '🤘', label: 'Rock' },
]

type ReactionMap = Record<string, string[]>

export function PhotoLightbox({ photo, photos, onClose, onNavigate, currentUserId, userRole }: PhotoLightboxProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [liked, setLiked] = useState(photo.user_has_liked ?? false)
  const [likeCount, setLikeCount] = useState(photo.likes_count ?? 0)
  const [loading, setLoading] = useState(false)
  const [showMobileInfo, setShowMobileInfo] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [visible, setVisible] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editCaption, setEditCaption] = useState(photo.caption || '')
  const [editNote, setEditNote] = useState(photo.memory_note || '')
  const [editDate, setEditDate] = useState(
    photo.taken_at ? new Date(photo.taken_at).toISOString().slice(0, 10) : ''
  )
  const [saving, setSaving] = useState(false)
  const [reactions, setReactions] = useState<ReactionMap>({})
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showMoveAlbum, setShowMoveAlbum] = useState(false)
  const [moveAlbums, setMoveAlbums] = useState<Album[]>([])
  const [movingTo, setMovingTo] = useState<string | null>(null)
  const [moveSuccess, setMoveSuccess] = useState(false)
  const [settingCover, setSettingCover] = useState(false)
  const [coverSuccess, setCoverSuccess] = useState(false)
  const [activeFilter, setActiveFilter] = useState('none')
  const [showFilters, setShowFilters] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [showSaveHint, setShowSaveHint] = useState(false)

  const currentIndex = photos.findIndex((p) => p.id === photo.id)
  const isVideo = photo.media_type === 'video'
  const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent)

  useEffect(() => { loadComments() }, [photo.id])
  useEffect(() => { loadReactions() }, [photo.id])
  useEffect(() => {
    setLiked(photo.user_has_liked ?? false)
    setLikeCount(photo.likes_count ?? 0)
    setShowMobileInfo(false)
    setEditCaption(photo.caption || '')
    setEditNote(photo.memory_note || '')
    setEditDate(photo.taken_at ? new Date(photo.taken_at).toISOString().slice(0, 10) : '')
    setEditing(false)
    setShowEmojiPicker(false)
    setActiveFilter('none')
    setShowFilters(false)
  }, [photo.id])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { if (showEmojiPicker) { setShowEmojiPicker(false) } else { handleClose() } }
      if (!showEmojiPicker && e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(photos[currentIndex - 1])
      if (!showEmojiPicker && e.key === 'ArrowRight' && currentIndex < photos.length - 1) onNavigate(photos[currentIndex + 1])
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, photos, onNavigate, showEmojiPicker])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const t = requestAnimationFrame(() => setVisible(true))
    return () => { cancelAnimationFrame(t); document.body.style.overflow = '' }
  }, [])

  useEffect(() => { setImgLoaded(false) }, [photo.id])

  const handleClose = () => { setVisible(false); setTimeout(onClose, 220) }

  const loadComments = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('comments')
      .select('*, user:profiles(*)')
      .eq('photo_id', photo.id)
      .order('created_at', { ascending: true })
    if (data) setComments(data)
  }

  const loadReactions = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('reactions')
      .select('emoji, user_id')
      .eq('photo_id', photo.id)
    if (data) {
      const map: ReactionMap = {}
      data.forEach((r: { emoji: string; user_id: string }) => {
        if (!map[r.emoji]) map[r.emoji] = []
        map[r.emoji].push(r.user_id)
      })
      setReactions(map)
    }
  }

  const handleReact = async (emoji: string) => {
    setShowEmojiPicker(false)
    const supabase = createClient()
    const alreadyReacted = reactions[emoji]?.includes(currentUserId)
    setReactions((prev) => {
      const updated = { ...prev }
      if (alreadyReacted) {
        updated[emoji] = (updated[emoji] || []).filter((id) => id !== currentUserId)
        if (updated[emoji].length === 0) delete updated[emoji]
      } else {
        updated[emoji] = [...(updated[emoji] || []), currentUserId]
      }
      return updated
    })
    if (alreadyReacted) {
      await supabase.from('reactions').delete().match({ photo_id: photo.id, user_id: currentUserId, emoji })
    } else {
      await supabase.from('reactions').upsert({ photo_id: photo.id, user_id: currentUserId, emoji }, { onConflict: 'photo_id,user_id,emoji' })
    }
  }

  const handleLike = async () => {
    const supabase = createClient()
    const newLiked = !liked
    setLiked(newLiked)
    setLikeCount((c) => (newLiked ? c + 1 : c - 1))
    if (newLiked) { playLikeSound() } else { playUnlikeSound() }
    if (newLiked) {
      await supabase.from('likes').insert({ photo_id: photo.id, user_id: currentUserId })
    } else {
      await supabase.from('likes').delete().match({ photo_id: photo.id, user_id: currentUserId })
    }
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('comments')
      .insert({ photo_id: photo.id, user_id: currentUserId, content: newComment.trim() })
      .select('*, user:profiles(*)')
      .single()
    if (data) { setComments((prev) => [...prev, data]); playSoftClick() }
    setNewComment('')
    setLoading(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch('/api/delete-photo', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId: photo.id }),
      })
      if (res.ok) { window.dispatchEvent(new CustomEvent('photos-updated')); onClose() }
    } catch (err) { console.error('Delete failed:', err) }
    finally { setDeleting(false); setConfirmDelete(false) }
  }

  const handleSaveEdit = async () => {
    setSaving(true)
    try {
      const supabase = createClient()
      const updates: Record<string, any> = {
        caption: editCaption || null,
        memory_note: editNote || null,
      }
      if (editDate) { updates.taken_at = new Date(editDate + 'T12:00:00').toISOString() }
      await supabase.from('photos').update(updates).eq('id', photo.id)
      setEditing(false)
      window.dispatchEvent(new CustomEvent('photos-updated'))
    } finally { setSaving(false) }
  }

  const loadAlbumsForMove = async () => {
    if (moveAlbums.length > 0) { setShowMoveAlbum(true); return }
    try {
      const res = await fetch('/api/albums')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setMoveAlbums(data)
      }
    } catch {
      const supabase = createClient()
      const { data } = await supabase.from('albums').select('*').order('updated_at', { ascending: false })
      if (data) setMoveAlbums(data)
    }
    setShowMoveAlbum(true)
  }

  const handleMoveToAlbum = async (albumId: string) => {
    if (albumId === photo.album_id) return
    setMovingTo(albumId)
    try {
      const res = await fetch('/api/move-photo', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId: photo.id, albumId }),
      })
      if (res.ok) {
        setMoveSuccess(true)
        setTimeout(() => { setShowMoveAlbum(false); setMoveSuccess(false); window.dispatchEvent(new CustomEvent('photos-updated')) }, 800)
      }
    } catch (err) { console.error('Move failed:', err) }
    finally { setMovingTo(null) }
  }

  const handleSetAlbumCover = async () => {
    if (!photo.album_id) return
    setSettingCover(true)
    try {
      const coverUrl = (photo.thumbnail_url || photo.cloudinary_url || '').replace(/[\n\r]/g, '')
      const res = await fetch(`/api/albums/${photo.album_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cover_photo_url: coverUrl }),
      })
      if (res.ok) { setCoverSuccess(true); setTimeout(() => setCoverSuccess(false), 2500) }
    } catch (err) { console.error('Set cover failed:', err) }
    finally { setSettingCover(false) }
  }

  const handleDownload = async () => {
    const url = (photo.cloudinary_url || '').replace(/[\n\r]/g, '')
    if (!url) return
    setDownloading(true)
    try {
      if (isMobile && navigator.share) {
        const downloadUrl = url.includes('/upload/') ? url.replace('/upload/', '/upload/f_jpg,q_auto/') : url
        const res = await fetch(downloadUrl)
        const blob = await res.blob()
        const ext = photo.media_type === 'video' ? 'mp4' : 'jpg'
        const fileName = `banglans-diary-${photo.id.slice(0, 8)}.${ext}`
        const file = new File([blob], fileName, { type: blob.type })
        await navigator.share({ files: [file], title: photo.caption || 'Banglan moment' })
        setDownloading(false)
        return
      }
    } catch (shareErr: any) {
      if (shareErr?.name === 'AbortError') { setDownloading(false); return }
    }
    try {
      const downloadUrl = url.includes('/upload/') ? url.replace('/upload/', '/upload/fl_attachment/') : url
      const res = await fetch(downloadUrl)
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      const ext = photo.media_type === 'video' ? 'mp4' : 'jpg'
      a.download = `banglans-diary-${photo.id.slice(0, 8)}.${ext}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
      if (isIOS) { setShowSaveHint(true); setTimeout(() => setShowSaveHint(false), 5000) }
    } catch (err) {
      console.error('Download failed:', err)
      window.open(url, '_blank')
    } finally { setDownloading(false) }
  }

  const initials = (name?: string) =>
    name ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : '?'

  const ReactionsRow = ({ compact = false }: { compact?: boolean }) => {
    const activeReactions = REACTIONS.filter((r) => (reactions[r.emoji]?.length ?? 0) > 0)
    const myReaction = REACTIONS.find((r) => reactions[r.emoji]?.includes(currentUserId))
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {activeReactions.map(({ emoji }) => {
          const count = reactions[emoji]?.length ?? 0
          const iMine = reactions[emoji]?.includes(currentUserId)
          return (
            <button
              key={emoji}
              onClick={() => handleReact(emoji)}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-all duration-150 ${
                iMine
                  ? 'bg-primary/20 border border-primary/40 scale-105'
                  : compact
                  ? 'bg-white/10 border border-white/20 hover:bg-white/20'
                  : 'bg-secondary border border-border hover:border-primary/40'
              }`}
            >
              <span className="leading-none">{emoji}</span>
              <span className={`text-xs font-medium ${compact ? 'text-white/90' : 'text-foreground'}`}>{count}</span>
            </button>
          )
        })}
        <div className="relative">
          <button
            onClick={() => setShowEmojiPicker((v) => !v)}
            title="Add reaction"
            className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-150 text-base ${
              showEmojiPicker
                ? 'bg-primary text-primary-foreground'
                : compact
                ? 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white'
                : 'bg-secondary hover:bg-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {myReaction ? myReaction.emoji : '＋'}
          </button>
          {showEmojiPicker && (
            <div className="absolute bottom-10 left-0 z-50 bg-card border border-border rounded-2xl shadow-2xl p-2 flex gap-1 animate-in fade-in zoom-in-90 duration-150">
              {REACTIONS.map(({ emoji, label }) => {
                const iMine = reactions[emoji]?.includes(currentUserId)
                return (
                  <button
                    key={emoji}
                    onClick={() => handleReact(emoji)}
                    title={label}
                    className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl transition-all duration-150 hover:scale-110 ${
                      iMine ? 'bg-primary/15 ring-1 ring-primary/40' : 'hover:bg-secondary'
                    }`}
                  >
                    <span className="text-xl leading-none">{emoji}</span>
                    <span className="text-[9px] text-muted-foreground">{label}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex bg-black/97 backdrop-blur-sm transition-opacity duration-200 ease-out"
      style={{ opacity: visible ? 1 : 0 }}
      onClick={() => showEmojiPicker && setShowEmojiPicker(false)}
    >
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {currentIndex > 0 && (
        <button
          onClick={() => onNavigate(photos[currentIndex - 1])}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 text-white hover:bg-primary/30 hover:border-primary/30 border border-white/10 transition-colors hidden lg:flex"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      {currentIndex < photos.length - 1 && (
        <button
          onClick={() => onNavigate(photos[currentIndex + 1])}
          className="absolute right-[360px] top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 text-white hover:bg-primary/30 hover:border-primary/30 border border-white/10 transition-colors hidden lg:flex"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {currentIndex > 0 && (
        <button
          onClick={() => onNavigate(photos[currentIndex - 1])}
          className="lg:hidden absolute left-0 top-16 bottom-24 w-12 z-10 flex items-center justify-start pl-2"
        >
          <div className="p-2 rounded-full bg-white/10 text-white">
            <ChevronLeft className="w-5 h-5" />
          </div>
        </button>
      )}
      {currentIndex < photos.length - 1 && (
        <button
          onClick={() => onNavigate(photos[currentIndex + 1])}
          className="lg:hidden absolute right-0 top-16 bottom-24 w-12 z-10 flex items-center justify-end pr-2"
        >
          <div className="p-2 rounded-full bg-white/10 text-white">
            <ChevronRight className="w-5 h-5" />
          </div>
        </button>
      )}

      <div className="flex-1 flex items-center justify-center p-4 lg:p-8 lg:pr-0 relative">
        {isVideo ? (
          <video
            src={(photo.cloudinary_url || '').replace(/[\n\r]/g, '')}
            controls autoPlay playsInline
            className="max-w-full max-h-full rounded-xl shadow-2xl"
            style={{ maxHeight: 'calc(100vh - 120px)' }}
          >
            Your browser does not support video playback.
          </video>
        ) : (
          <>
            {!imgLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              </div>
            )}
            <img
              src={(photo.cloudinary_url || '').replace(/[\n\r]/g, '')}
              alt={photo.caption || 'Banglan moment'}
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl transition-all duration-300"
              style={{ maxHeight: 'calc(100vh - 120px)', opacity: imgLoaded ? 1 : 0, filter: activeFilter }}
              onLoad={() => setImgLoaded(true)}
            />
          </>
        )}

        {!isVideo && imgLoaded && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden lg:block">
            {showFilters ? (
              <div className="flex items-center gap-1.5 bg-black/80 backdrop-blur-md rounded-2xl px-3 py-2 border border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-200">
                {PHOTO_FILTERS.map((f) => (
                  <button
                    key={f.name}
                    onClick={() => { setActiveFilter(f.css); playShutterSound() }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                      activeFilter === f.css
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-white/80 hover:text-white hover:bg-white/15'
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
                <button
                  onClick={() => setShowFilters(false)}
                  className="ml-1 p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/15 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowFilters(true)}
                className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 text-white/80 hover:text-white hover:bg-black/80 transition-all text-xs font-medium"
              >
                <Palette className="w-3.5 h-3.5" />
                Filters
              </button>
            )}
          </div>
        )}
      </div>

      <div className="lg:hidden absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent pt-8 pb-safe">
        <div className="px-4 pb-4 space-y-3">
          {photo.caption && <p className="text-white text-sm line-clamp-2">{photo.caption}</p>}
          <ReactionsRow compact />
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${liked ? 'text-primary' : 'text-white/80 hover:text-primary'}`}
            >
              <Heart className={`w-6 h-6 transition-all duration-200 ${liked ? 'fill-current scale-110' : ''}`} />
              <span>{likeCount}</span>
            </button>
            <button onClick={() => setShowMobileInfo(true)} className="flex items-center gap-2 text-white/80 text-sm">
              <Send className="w-5 h-5" />
              <span>{comments.length} comments</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="ml-auto flex items-center gap-2 text-white/80 text-sm disabled:opacity-50"
            >
              {downloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            </button>
            {(photo.uploaded_by === currentUserId || userRole === 'admin') && (
              <>
                <button onClick={loadAlbumsForMove} className="ml-1 text-white/60 hover:text-white transition-colors">
                  <FolderInput className="w-5 h-5" />
                </button>
                {userRole === 'admin' && photo.album_id && (
                  <button
                    onClick={handleSetAlbumCover}
                    disabled={settingCover || coverSuccess}
                    className={`ml-1 transition-colors ${coverSuccess ? 'text-accent' : 'text-white/60 hover:text-white'}`}
                    title="Set as album cover"
                  >
                    {settingCover ? <Loader2 className="w-5 h-5 animate-spin" /> : coverSuccess ? <Check className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                  </button>
                )}
                {confirmDelete ? (
                  <div className="flex items-center gap-2 ml-1">
                    <button onClick={handleDelete} disabled={deleting} className="text-xs font-semibold text-red-400 disabled:opacity-50">
                      {deleting ? '…' : 'Delete'}
                    </button>
                    <button onClick={() => setConfirmDelete(false)} className="text-xs text-white/60">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(true)} className="ml-1 text-white/60 hover:text-red-400 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </>
            )}
          </div>
          {showSaveHint && (
            <div className="bg-white/15 backdrop-blur-md rounded-2xl px-4 py-2.5 text-center animate-in fade-in slide-in-from-bottom-2 duration-200">
              <p className="text-white text-xs font-medium">
                Saved! Open <strong>Files</strong> app → tap the image → share → <strong>Save Image</strong> to add to Camera Roll
              </p>
            </div>
          )}
          {!isVideo && showFilters && (
            <div className="flex gap-1.5 overflow-x-auto pb-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
              {PHOTO_FILTERS.map((f) => (
                <button
                  key={f.name}
                  onClick={() => { setActiveFilter(f.css); playShutterSound() }}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    activeFilter === f.css ? 'bg-primary text-primary-foreground' : 'bg-white/15 text-white/80'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          )}
          {!isVideo && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 text-white/60 text-xs"
            >
              <Palette className="w-3.5 h-3.5" />
              {showFilters ? 'Hide Filters' : 'Filters'}
            </button>
          )}
          {showMoveAlbum && (
            <div className="mt-2 bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-white/60 uppercase tracking-wider">Move to album</p>
                <button onClick={() => setShowMoveAlbum(false)} className="text-white/50"><X className="w-3.5 h-3.5" /></button>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {moveAlbums.map((album) => {
                  const isCurrent = album.id === photo.album_id
                  const isMoving = movingTo === album.id
                  return (
                    <button
                      key={album.id}
                      onClick={() => !isCurrent && handleMoveToAlbum(album.id)}
                      disabled={isCurrent || isMoving || moveSuccess}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left transition-all ${
                        isCurrent ? 'text-primary font-medium' : 'text-white/90 hover:bg-white/10'
                      }`}
                    >
                      <span className="flex-1 truncate">{album.title}</span>
                      {isCurrent && <span className="text-[10px] text-primary">Current</span>}
                      {isMoving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    </button>
                  )
                })}
              </div>
              {moveSuccess && <p className="text-xs text-accent font-medium mt-2 flex items-center gap-1"><Check className="w-3 h-3" /> Moved!</p>}
            </div>
          )}
        </div>
      </div>

      {showMobileInfo && (
        <div className="lg:hidden fixed inset-0 z-30 flex flex-col justify-end animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowMobileInfo(false)} />
          <div className="relative bg-card rounded-t-3xl max-h-[75vh] flex flex-col shadow-2xl border-t border-border animate-in slide-in-from-bottom-4 duration-300 ease-out">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>
            <div className="px-5 py-3 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 text-primary text-xs font-semibold flex items-center justify-center">
                    {initials(photo.uploader?.full_name)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{photo.uploader?.full_name || 'A Banglan'}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                      <Calendar className="w-3 h-3" />
                      <span>{format(new Date(photo.taken_at || photo.created_at), 'MMMM d, yyyy')}</span>
                    </div>
                  </div>
                </div>
                {(photo.uploaded_by === currentUserId || userRole === 'admin') && !editing && (
                  <button onClick={() => setEditing(true)} className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>
              {editing ? (
                <div className="mt-3 space-y-2">
                  <textarea value={editCaption} onChange={(e) => setEditCaption(e.target.value)} placeholder="Caption..." rows={2}
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                  <textarea value={editNote} onChange={(e) => setEditNote(e.target.value)} placeholder="Memory note..." rows={2}
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-muted-foreground italic placeholder:not-italic outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)}
                      className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 [color-scheme:dark]" />
                    {editDate && (
                      <button onClick={() => setEditDate('')} className="text-muted-foreground hover:text-foreground transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSaveEdit} disabled={saving}
                      className="flex-1 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                    <button onClick={() => { setEditing(false); setEditCaption(photo.caption || ''); setEditNote(photo.memory_note || ''); setEditDate(photo.taken_at ? new Date(photo.taken_at).toISOString().slice(0, 10) : '') }}
                      className="flex-1 py-2 rounded-full border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {photo.caption && <p className="text-sm text-foreground mt-2 leading-relaxed">{photo.caption}</p>}
                  {photo.memory_note && (
                    <div className="mt-3 border-l-2 border-primary/30 pl-3">
                      <div className="flex items-center gap-1 mb-1">
                        <BookOpen className="w-3 h-3 text-primary/60" />
                        <span className="text-xs text-primary/60 font-medium">Memory note</span>
                      </div>
                      <p className="text-sm text-muted-foreground italic leading-relaxed">{photo.memory_note}</p>
                    </div>
                  )}
                </>
              )}
              <div className="mt-3"><ReactionsRow /></div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {comments.length === 0 && <p className="text-center text-sm text-muted-foreground py-6">Be the first to comment 🤘</p>}
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary text-xs font-semibold flex items-center justify-center flex-shrink-0 text-foreground">
                    {initials(comment.user?.full_name)}
                  </div>
                  <div className="flex-1">
                    <div className="bg-secondary rounded-2xl rounded-tl-sm px-3 py-2">
                      <p className="text-xs font-semibold text-foreground mb-0.5">{comment.user?.full_name || 'A Banglan'}</p>
                      <p className="text-sm text-foreground">{comment.content}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 ml-3 font-mono">{format(new Date(comment.created_at), 'MMM d, h:mm a')}</p>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleComment} className="p-4 border-t border-border">
              <div className="flex gap-2 items-center">
                <EmojiPicker onSelect={(emoji) => setNewComment((v) => v + emoji)} />
                <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Drop a comment…"
                  className="flex-1 bg-secondary rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30" />
                <button type="submit" disabled={!newComment.trim() || loading}
                  className="p-2.5 rounded-full bg-primary text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="w-full max-w-xs lg:max-w-sm bg-card border-l border-border flex-col hidden lg:flex">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-primary/20 text-primary text-sm font-bold flex items-center justify-center">
              {initials(photo.uploader?.full_name)}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{photo.uploader?.full_name || 'A Banglan'}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono group/date">
                <Calendar className="w-3 h-3" />
                <span>{format(new Date(photo.taken_at || photo.created_at), 'MMMM d, yyyy')}</span>
                {(photo.uploaded_by === currentUserId || userRole === 'admin') && !editing && (
                  <button onClick={() => setEditing(true)} className="opacity-0 group-hover/date:opacity-100 transition-opacity ml-0.5" title="Edit date">
                    <Pencil className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {editing ? (
            <div className="mt-3 space-y-2">
              <textarea value={editCaption} onChange={(e) => setEditCaption(e.target.value)} placeholder="Caption..." rows={2}
                className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              <textarea value={editNote} onChange={(e) => setEditNote(e.target.value)} placeholder="Memory note..." rows={3}
                className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-muted-foreground italic placeholder:not-italic outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)}
                  className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 [color-scheme:dark]" />
                {editDate && (
                  <button onClick={() => setEditDate('')} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={handleSaveEdit} disabled={saving}
                  className="flex-1 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => { setEditing(false); setEditCaption(photo.caption || ''); setEditNote(photo.memory_note || ''); setEditDate(photo.taken_at ? new Date(photo.taken_at).toISOString().slice(0, 10) : '') }}
                  className="flex-1 py-1.5 rounded-full border border-border text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-2 group/edit relative">
              {photo.caption && <p className="text-sm text-foreground leading-relaxed">{photo.caption}</p>}
              {photo.memory_note && (
                <div className="mt-3 border-l-2 border-primary/30 pl-3">
                  <div className="flex items-center gap-1 mb-1">
                    <BookOpen className="w-3 h-3 text-primary/60" />
                    <span className="text-xs text-primary/60 font-medium">Memory note</span>
                  </div>
                  <p className="text-sm text-muted-foreground italic leading-relaxed">{photo.memory_note}</p>
                </div>
              )}
              {!photo.caption && !photo.memory_note && (
                <p className="text-xs text-muted-foreground/50 italic mt-1">No caption yet…</p>
              )}
              {(photo.uploaded_by === currentUserId || userRole === 'admin') && (
                <button onClick={() => setEditing(true)}
                  className="absolute top-0 right-0 opacity-0 group-hover/edit:opacity-100 transition-opacity p-1 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-b border-border space-y-3">
          <div className="flex items-center gap-4">
            <button onClick={handleLike}
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${liked ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
              <Heart className={`w-5 h-5 transition-all duration-200 ${liked ? 'fill-current scale-110' : ''}`} />
              <span>{likeCount} {likeCount === 1 ? 'like' : 'likes'}</span>
            </button>
            <button onClick={handleDownload} disabled={downloading}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors ml-auto disabled:opacity-50">
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>{downloading ? 'Saving…' : 'Save'}</span>
            </button>
            {(photo.uploaded_by === currentUserId || userRole === 'admin') && (
              confirmDelete ? (
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-xs text-destructive">Delete?</span>
                  <button onClick={handleDelete} disabled={deleting}
                    className="text-xs font-medium text-destructive hover:underline disabled:opacity-50">
                    {deleting ? 'Deleting…' : 'Yes'}
                  </button>
                  <button onClick={() => setConfirmDelete(false)} className="text-xs text-muted-foreground hover:underline">No</button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(true)}
                  className="ml-2 p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )
            )}
          </div>
          {(photo.uploaded_by === currentUserId || userRole === 'admin') && (
            <button onClick={loadAlbumsForMove}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-accent transition-colors">
              <FolderInput className="w-4 h-4" />
              <span>Move to Album</span>
            </button>
          )}
          {userRole === 'admin' && photo.album_id && (
            <button onClick={handleSetAlbumCover} disabled={settingCover || coverSuccess}
              className={`flex items-center gap-1.5 text-sm transition-colors ${coverSuccess ? 'text-accent font-medium' : 'text-muted-foreground hover:text-primary'}`}>
              {settingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : coverSuccess ? <Check className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
              <span>{coverSuccess ? 'Cover set!' : 'Set as Album Cover'}</span>
            </button>
          )}
          <ReactionsRow />
        </div>

        {showMoveAlbum && (
          <div className="px-5 py-3 border-b border-border animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Move to</p>
              <button onClick={() => setShowMoveAlbum(false)} className="p-1 rounded-full hover:bg-secondary text-muted-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {moveAlbums.map((album) => {
                const isCurrent = album.id === photo.album_id
                const isMoving = movingTo === album.id
                return (
                  <button key={album.id} onClick={() => !isCurrent && handleMoveToAlbum(album.id)}
                    disabled={isCurrent || isMoving || moveSuccess}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left transition-all duration-200 ${
                      isCurrent ? 'bg-primary/15 text-primary font-medium cursor-default' : 'hover:bg-secondary text-foreground'
                    }`}>
                    <span className="flex-1 truncate">{album.title}</span>
                    {isCurrent && <span className="text-xs text-primary">Current</span>}
                    {isMoving && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
                  </button>
                )
              })}
            </div>
            {moveSuccess && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-accent font-medium">
                <Check className="w-3.5 h-3.5" /> Moved successfully!
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {comments.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">Be the first to comment 🤘</p>}
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary text-sm font-semibold flex items-center justify-center flex-shrink-0 text-foreground">
                {initials(comment.user?.full_name)}
              </div>
              <div className="flex-1">
                <div className="bg-secondary rounded-2xl rounded-tl-sm px-3 py-2">
                  <p className="text-xs font-semibold text-foreground mb-0.5">{comment.user?.full_name || 'A Banglan'}</p>
                  <p className="text-sm text-foreground">{comment.content}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1 ml-3 font-mono">{format(new Date(comment.created_at), 'MMM d, h:mm a')}</p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleComment} className="p-4 border-t border-border">
          <div className="flex gap-2 items-center">
            <EmojiPicker onSelect={(emoji) => setNewComment((v) => v + emoji)} />
            <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Drop a comment…"
              className="flex-1 bg-secondary rounded-full px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30" />
            <button type="submit" disabled={!newComment.trim() || loading}
              className="p-2.5 rounded-full bg-primary text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
